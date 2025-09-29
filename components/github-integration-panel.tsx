"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Github,
  GitBranch,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Settings,
  ExternalLink,
  Play,
  AlertTriangle,
  Zap,
} from "lucide-react"

interface Repository {
  id: string
  name: string
  fullName: string
  connected: boolean
  lastSync?: string | Date | null
  branch?: string
  status: "healthy" | "warning" | "error"
  autoDeployEnabled: boolean
  webhookConfigured: boolean
}

interface PullRequest {
  id: string
  number: number
  title: string
  author: string
  status: "open" | "merged" | "closed"
  branch: string
  targetBranch: string
  createdAt: Date
  ciStatus: "pending" | "success" | "failure"
  deploymentStatus: "pending" | "deployed" | "failed" | null
}

interface Pipeline {
  id: string
  repository?: string
  branch: string
  commit: string
  status: "success" | "failed" | "running" | "pending" | "cancelled"
  startedAt: string
  duration: number
  stages: Array<{
    name: string
    status: string
  }>
}

interface RepositoryData {
  repository: {
    id: string
    name: string
    fullName: string
    branch: string
    status: string
    lastSync: string | null
  }
  pullRequests?: PullRequest[]
  pipelines?: Pipeline[]
  prCount?: number
  pipelineCount?: number
}


const mockRepositories: Repository[] = [
  {
    id: "1",
    name: "frontend-app",
    fullName: "company/frontend-app",
    connected: true,
    lastSync: new Date(Date.now() - 300000),
    branch: "main",
    status: "healthy",
    autoDeployEnabled: true,
    webhookConfigured: true,
  },
  {
    id: "2",
    name: "api-service",
    fullName: "company/api-service",
    connected: true,
    lastSync: new Date(Date.now() - 600000),
    branch: "main",
    status: "warning",
    autoDeployEnabled: false,
    webhookConfigured: true,
  },
  {
    id: "3",
    name: "database-scripts",
    fullName: "company/database-scripts",
    connected: false,
    lastSync: new Date(Date.now() - 86400000),
    branch: "main",
    status: "error",
    autoDeployEnabled: false,
    webhookConfigured: false,
  },
]

const mockPullRequests: PullRequest[] = [
  {
    id: "1",
    number: 42,
    title: "Add new authentication flow",
    author: "john.doe",
    status: "open",
    branch: "feature/auth-flow",
    targetBranch: "main",
    createdAt: new Date(Date.now() - 3600000),
    ciStatus: "success",
    deploymentStatus: "pending",
  },
  {
    id: "2",
    number: 41,
    title: "Fix memory leak in user service",
    author: "jane.smith",
    status: "merged",
    branch: "bugfix/memory-leak",
    targetBranch: "main",
    createdAt: new Date(Date.now() - 7200000),
    ciStatus: "success",
    deploymentStatus: "deployed",
  },
  {
    id: "3",
    number: 40,
    title: "Update API documentation",
    author: "bob.wilson",
    status: "open",
    branch: "docs/api-update",
    targetBranch: "main",
    createdAt: new Date(Date.now() - 10800000),
    ciStatus: "failure",
    deploymentStatus: null,
  },
]

const mockPipelines: Pipeline[] = [
  {
    id: "1",
    repository: "frontend-app",
    branch: "main",
    commit: "abc123f",
    status: "success",
    startedAt: new Date(Date.now() - 900000).toISOString(),
    duration: 420,
    stages: [
      { name: "Build", status: "success" },
      { name: "Test", status: "success" },
      { name: "Deploy", status: "success" },
    ],
  },
  {
    id: "2",
    repository: "api-service",
    branch: "feature/auth-flow",
    commit: "def456g",
    status: "running",
    startedAt: new Date(Date.now() - 300000).toISOString(),
    duration: 0,
    stages: [
      { name: "Build", status: "success" },
      { name: "Test", status: "running" },
      { name: "Deploy", status: "pending" },
    ],
  },
]

export function GitHubIntegrationPanel() {
  const { user } = useAuth()
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [pullRequests, setPullRequests] = useState<RepositoryData[]>([])
  const [pipelines, setPipelines] = useState<RepositoryData[]>([])
  const [activeTab, setActiveTab] = useState("repositories")
  const [selectedRepoForPR, setSelectedRepoForPR] = useState<string>("")
  const [selectedRepoForPipeline, setSelectedRepoForPipeline] = useState<string>("")
  const [stats, setStats] = useState({
    connectedRepos: 0,
    activePRs: 0,
    runningPipelines: 0,
    autoDeployments: 0
  })

  // 컴포넌트 마운트 시 및 사용자 변경 시 데이터 로드
  useEffect(() => {
    console.log('User changed, reloading GitHub data. User:', user)
    loadGitHubData()
  }, [user])

  // 사용자가 로그아웃하면 선택된 리포지토리도 초기화
  useEffect(() => {
    if (!user) {
      console.log('User logged out, clearing selected repositories')
      setSelectedRepoForPR("")
      setSelectedRepoForPipeline("")
    }
  }, [user])

  // 선택된 리포지토리의 PR 데이터 가져오기
  const getSelectedRepoPRs = () => {
    if (!selectedRepoForPR) return []
    const repoData = pullRequests.find(repo => repo.repository.fullName === selectedRepoForPR)
    return repoData?.pullRequests || []
  }

  // 사용자 고유 ID 계산: id → provider_id → email 순으로 사용
  const getEffectiveUserId = () => {
    // @ts-ignore - 런타임 방어용으로 유연하게 처리
    const providerId = (user as any)?.provider_id || (user as any)?.providerId
    return user?.id || providerId || user?.email || ""
  }

  // 선택된 리포지토리의 파이프라인 데이터 가져오기
  const getSelectedRepoPipelines = () => {
    if (!selectedRepoForPipeline) return []
    const repoData = pipelines.find(repo => repo.repository.fullName === selectedRepoForPipeline)
    return repoData?.pipelines || []
  }

  const loadGitHubData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading GitHub data...')
      
      // 실제 사용자 ID 사용 (로그인하지 않은 경우 기본값)
      const userId = getEffectiveUserId() || "default"
      console.log('Current user:', user)
      console.log('Using userId:', userId)
      
      // 사용자가 로그아웃된 경우 데이터 초기화
      if (!user) {
        console.log('User not logged in, clearing all data')
        setRepositories([])
        setPullRequests([])
        setPipelines([])
        setSelectedRepoForPR("")
        setSelectedRepoForPipeline("")
        setStats({
          connectedRepos: 0,
          activePRs: 0,
          runningPipelines: 0,
          autoDeployments: 0
        })
        return
      }
      
      // 실제 사용자 ID가 있는 경우에만 API 호출
      if (!userId) {
        console.log('User ID not available, skipping API calls')
        return
      }
      
      // 실제 GitHub API 호출
      type ReposResponse = { repositories: Repository[] }
      type GroupedPRsResponse = { repositories: RepositoryData[] }
      type GroupedPipelinesResponse = { repositories: RepositoryData[] }

      const [reposData, prsData, pipelinesData] = await Promise.all([
        apiClient.getConnectedRepositories(userId), // 연동된 리포지토리 목록
        apiClient.getGitHubPullRequests(userId),
        apiClient.getGitHubPipelines(userId)
      ]) as [ReposResponse, GroupedPRsResponse, GroupedPipelinesResponse]
      
      console.log('GitHub API responses:', { reposData, prsData, pipelinesData })
      
                  const repos = (reposData?.repositories ?? []) as Repository[]
                  const prRepos = (prsData?.repositories ?? []) as RepositoryData[]
                  const pipelineRepos = (pipelinesData?.repositories ?? []) as RepositoryData[]
                  
                  console.log('Processed data:', { repos, prRepos, pipelineRepos })
                  
      // 데이터 변환 및 설정
      setRepositories(repos)
      setPullRequests(prRepos)
      setPipelines(pipelineRepos)
      
      // 첫 번째 리포지토리 자동 선택
      if (repos.length > 0) {
        const firstRepo = repos[0]
        setSelectedRepoForPR(firstRepo.fullName)
        setSelectedRepoForPipeline(firstRepo.fullName)
      }
      
      // 통계 계산
      const totalPRs = prRepos.reduce((sum, repo) => sum + (repo.prCount || 0), 0)
      const totalPipelines = pipelineRepos.reduce((sum, repo) => sum + (repo.pipelineCount || 0), 0)
      const runningPipelines = pipelineRepos.reduce((sum, repo) => 
        sum + (repo.pipelines?.filter(p => p.status === "running").length || 0), 0
      )
      
      setStats({
        connectedRepos: repos.length,
        activePRs: totalPRs,
        runningPipelines: runningPipelines,
        autoDeployments: repos.filter(repo => repo.autoDeployEnabled).length
      })
      
      console.log('Stats updated:', {
        connectedRepos: repos.length,
        activePRs: totalPRs,
        runningPipelines: runningPipelines,
        autoDeployments: repos.filter(repo => repo.autoDeployEnabled).length
      })
    } catch (err: any) {
      console.error('Failed to load GitHub data:', err)
      setError(err.message || 'Failed to load GitHub data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: Repository["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const formatDateTime = (value: string | Date | null | undefined) => {
    if (!value) return "-";
    const dt = value instanceof Date ? value : new Date(value)
    if (isNaN(dt.getTime())) return "-"
    return dt.toLocaleString()
  }

  const getStatusBadge = (status: Repository["status"]) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const getPRStatusBadge = (status: PullRequest["status"]) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>
      case "merged":
        return <Badge className="bg-purple-100 text-purple-800">Merged</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
    }
  }

  const getCIStatusIcon = (status: PullRequest["ciStatus"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failure":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
    }
  }

  const getPipelineStatusIcon = (status: Pipeline["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "running":
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const handleConnectRepo = async () => {
    console.log('handleConnectRepo called with URL:', newRepoUrl)
    console.log('Current user state:', user)
    console.log('User ID:', user?.id)
    console.log('User email:', user?.email)
    
    if (!newRepoUrl.trim()) {
      console.log('URL is empty, returning')
      return
    }
    
    console.log('Starting repository connection process...')
    setLoading(true)
    setError(null)
    try {
      // GitHub URL에서 owner/repo 추출
      const urlMatch = newRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!urlMatch) {
        throw new Error('Invalid GitHub repository URL')
      }
      
      const [, owner, repo] = urlMatch
      
      // 1. 먼저 GitHub App이 설치되어 있는지 확인
      type InstallationCheck = { installed: boolean; repository?: string; installation_id?: string | number }
      const installationCheck = await apiClient.checkRepositoryInstallation(owner, repo) as InstallationCheck
      
                  if (installationCheck.installed === true) {
                    // 2. 설치되어 있으면 리포지토리 연동 및 워크플로우 설치 시도
                    try {
                      // 로그인하지 않은 경우 연결 불가
                      const effectiveUserId = getEffectiveUserId()
                      if (!user || !effectiveUserId) {
                        console.log('User not logged in or missing ID:', { user, userId: effectiveUserId })
                        setError("리포지토리 연결을 위해서는 로그인이 필요합니다.")
                        return
                      }
                      
                      // 실제 사용자 정보 사용
                      const userId = effectiveUserId
                      const userEmail = user.email || "user@example.com"
                      
                      // 먼저 리포지토리 연동
                      await apiClient.connectRepository(owner, repo, userId, userEmail)
          
          // 워크플로우 자동 설치는 하지 않음 (사용자가 명시적으로 실행)
          setError("리포지토리가 성공적으로 연동되었습니다. 워크플로우 설치는 Settings에서 실행하세요.")
          
          // 데이터 새로고침
          await loadGitHubData()
        } catch (workflowError: any) {
          setError(`연동 또는 워크플로우 설치 실패: ${workflowError.message}`)
        }
      } else {
        // 3. 설치되어 있지 않으면 설치 링크로 이동
        type InstallUrlResponse = { install_url: string }
        const installUrlData = await apiClient.getGitHubAppInstallUrl() as InstallUrlResponse
        const installUrl = installUrlData.install_url
        
        // 새 탭에서 GitHub App 설치 페이지 열기
        window.open(installUrl, '_blank')
        setError(`GitHub App이 설치되지 않았습니다. 새 탭에서 GitHub App 설치 페이지가 열렸습니다. 설치 후 이 페이지를 새로고침해주세요.`)
      }
      
      setNewRepoUrl("")
    } catch (err: any) {
      console.error('Failed to connect repository:', err)
      setError(err.message || 'Failed to connect repository')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Repos</CardTitle>
            <Github className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedRepos}</div>
            <p className="text-xs text-muted-foreground">
              {repositories.filter(repo => repo.status === "healthy").length} healthy, {repositories.filter(repo => repo.status !== "healthy").length} with issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active PRs</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePRs}</div>
            <p className="text-xs text-muted-foreground">
              {pullRequests.reduce((sum, repo) => sum + ((repo.pullRequests?.filter(p => p.ciStatus === "success").length) || 0), 0)} CI successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Pipelines</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.runningPipelines}</div>
            <p className="text-xs text-muted-foreground">
              {pipelines.reduce((sum, repo) => sum + ((repo.pipelines?.filter(pl => pl.status === "success").length) || 0), 0)} completed recently
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Deployments</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.autoDeployments}</div>
            <p className="text-xs text-muted-foreground">Repositories with auto-deploy</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="pullrequests">Pull Requests</TabsTrigger>
          <TabsTrigger value="pipelines">CI/CD Pipelines</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="space-y-4">
          {/* Add New Repository */}
          <Card>
            <CardHeader>
              <CardTitle>Connect New Repository</CardTitle>
              <CardDescription>Add a GitHub repository to enable automated deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="https://github.com/username/repository"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleConnectRepo} 
                  disabled={loading || !user}
                  title={!user ? "로그인이 필요합니다" : ""}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Connecting..." : "Connect"}
                </Button>
              </div>
              {error && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                  {error.includes("설치 페이지") && (
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>설치 방법:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>새 탭에서 열린 GitHub 페이지에서 "Install" 버튼 클릭</li>
                        <li>설치할 리포지토리 선택 (All repositories 또는 특정 리포지토리)</li>
                        <li>"Install" 버튼을 다시 클릭하여 설치 완료</li>
                        <li>이 페이지로 돌아와서 새로고침 후 다시 시도</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repository List */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Repositories</CardTitle>
              <CardDescription>Manage your GitHub repository integrations</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <div className="space-y-4">
                  {repositories.map((repo) => (
                  <div key={repo.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Github className="w-5 h-5" />
                        <div>
                          <h3 className="font-semibold">{repo.fullName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Branch: {repo.branch ?? "-"} • Last sync: {formatDateTime(repo.lastSync)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(repo.status)}
                        {getStatusBadge(repo.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto Deploy</span>
                        <Switch checked={repo.autoDeployEnabled} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Webhooks</span>
                        <Badge variant={repo.webhookConfigured ? "default" : "secondary"}>
                          {repo.webhookConfigured ? "Configured" : "Not Set"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Connection</span>
                        <Badge variant={repo.connected ? "default" : "destructive"}>
                          {repo.connected ? "Connected" : "Disconnected"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View on GitHub
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Trigger Deploy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pullrequests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pull Requests</CardTitle>
                  <CardDescription>Monitor and manage pull requests for selected repository</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Repository:</label>
                  <select
                    value={selectedRepoForPR}
                    onChange={(e) => setSelectedRepoForPR(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.fullName}>
                        {repo.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <div className="space-y-4">
                  {getSelectedRepoPRs().length > 0 ? (
                    getSelectedRepoPRs().map((pr) => (
                      <div key={pr.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <GitPullRequest className="w-4 h-4" />
                            <span className="font-medium">#{pr.number}</span>
                            <span>{pr.title}</span>
                          </div>
                          {getPRStatusBadge(pr.status)}
                        </div>

                        <div className="text-sm text-muted-foreground mb-3">
                          {pr.author} wants to merge {pr.branch} into {pr.targetBranch} • {new Date(pr.createdAt).toLocaleString()}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              {getCIStatusIcon(pr.ciStatus)}
                              <span className="text-sm">CI: {pr.ciStatus}</span>
                            </div>
                            {pr.deploymentStatus && (
                              <div className="flex items-center space-x-1">
                                <GitBranch className="w-4 h-4" />
                                <span className="text-sm">Deploy: {pr.deploymentStatus}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View PR
                            </Button>
                            {pr.status === "open" && pr.ciStatus === "success" && <Button size="sm">Deploy Preview</Button>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {selectedRepoForPR ? "No pull requests found for this repository" : "Please select a repository"}
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CI/CD Pipelines</CardTitle>
                  <CardDescription>Monitor build and deployment pipelines for selected repository</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Repository:</label>
                  <select
                    value={selectedRepoForPipeline}
                    onChange={(e) => setSelectedRepoForPipeline(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.fullName}>
                        {repo.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <div className="space-y-4">
                  {getSelectedRepoPipelines().length > 0 ? (
                    getSelectedRepoPipelines().map((pipeline) => (
                      <div key={pipeline.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getPipelineStatusIcon(pipeline.status)}
                            <Badge variant="outline">{pipeline.branch}</Badge>
                            <span className="text-sm text-muted-foreground">#{pipeline.commit}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {pipeline.duration ? `${pipeline.duration}s` : "Running..."}
                          </div>
                        </div>

                        <div className="flex space-x-4 mb-3">
                          {pipeline.stages.map((stage, index) => (
                            <div key={index} className="flex items-center space-x-1">
                              {stage.status === "success" && <CheckCircle className="w-3 h-3 text-green-500" />}
                              {stage.status === "running" && <Clock className="w-3 h-3 text-blue-500 animate-pulse" />}
                              {stage.status === "failed" && <XCircle className="w-3 h-3 text-red-500" />}
                              {stage.status === "pending" && <Clock className="w-3 h-3 text-gray-400" />}
                              <span className="text-sm">{stage.name}</span>
                            </div>
                          ))}
                        </div>

                        <div className="text-sm text-muted-foreground">Started {formatDateTime(pipeline.startedAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {selectedRepoForPipeline ? "No pipelines found for this repository" : "Please select a repository"}
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration Settings</CardTitle>
              <CardDescription>Configure your GitHub integration preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-deploy on merge</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically deploy when PRs are merged to main branch
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">AI Code Review</h4>
                    <p className="text-sm text-muted-foreground">Enable AI-powered code review comments</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Blog Posts</h4>
                    <p className="text-sm text-muted-foreground">Generate blog posts for major releases</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Slack Notifications</h4>
                    <p className="text-sm text-muted-foreground">Send deployment notifications to Slack</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full bg-transparent">
                  <Github className="w-4 h-4 mr-2" />
                  Reconnect GitHub Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
