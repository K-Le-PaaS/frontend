"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
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
  lastSync: Date
  branch: string
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
  repository: string
  branch: string
  commit: string
  status: "running" | "success" | "failed" | "cancelled"
  startedAt: Date
  duration?: number
  stages: {
    name: string
    status: "pending" | "running" | "success" | "failed" | "skipped"
  }[]
}

// Replace mocks with live data; keep types for UI rendering fallback
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
    startedAt: new Date(Date.now() - 900000),
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
    startedAt: new Date(Date.now() - 300000),
    stages: [
      { name: "Build", status: "success" },
      { name: "Test", status: "running" },
      { name: "Deploy", status: "pending" },
    ],
  },
]

export function GitHubIntegrationPanel() {
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [repos, setRepos] = useState<Repository[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        // Backend should return list of integrations
        const data = await apiClient.getProjectIntegrations()
        if (!mounted) return
        // Map backend rows to Repository view model
        const mapped: Repository[] = (Array.isArray(data) ? data : []).map((r: any, idx: number) => ({
          id: String(r.id ?? idx),
          name: r.repo ?? r.name ?? "",
          fullName: r.github_full_name ?? `${r.owner ?? r.github_owner}/${r.repo ?? r.github_repo}`,
          connected: true,
          lastSync: r.updated_at ? new Date(r.updated_at) : new Date(),
          branch: r.branch ?? "main",
          status: (r.auto_deploy_enabled ? "healthy" : "warning") as Repository["status"],
          autoDeployEnabled: !!r.auto_deploy_enabled,
          webhookConfigured: Boolean(r.github_webhook_secret),
        }))
        // Debug: log exact count and payload
        console.log('[GitHubIntegrationPanel] integrations.length =', mapped.length, mapped)
        setRepos(mapped)
      } catch (e: any) {
        setError(e?.message || "Failed to load integrations")
        setRepos(null)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

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

  const handleInstallGitHubApp = () => {
    const githubAppInstallUrl = "https://github.com/apps/klepaas/installations/new"
    window.open(githubAppInstallUrl, '_blank')
  }

  const handleConnectRepo = async () => {
    if (!newRepoUrl.trim()) {
      setError("Please enter a repository URL")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Extract repository name from URL
      const repoName = newRepoUrl.split('/').pop()?.replace('.git', '') || 'unknown'
      const projectId = `project-${Date.now()}` // Generate a unique project ID
      
      console.log("Connecting repository:", newRepoUrl)
      
      // Call the API to connect the repository
      console.log("API 호출 시작:", { newRepoUrl, projectId, repoName })
      const result = await apiClient.connectRepository(newRepoUrl, projectId, repoName)
      
      console.log("Repository connection result:", result)
      
      // Refresh the integrations list
      const data = await apiClient.getProjectIntegrations()
      const mapped: Repository[] = (Array.isArray(data) ? data : []).map((r: any, idx: number) => ({
        id: String(r.id ?? idx),
        name: r.repo ?? r.name ?? "",
        fullName: r.github_full_name ?? `${r.owner ?? r.github_owner}/${r.repo ?? r.github_repo}`,
        connected: true,
        lastSync: r.updated_at ? new Date(r.updated_at) : new Date(),
        branch: r.branch ?? "main",
        status: (r.auto_deploy_enabled ? "healthy" : "warning") as Repository["status"],
        autoDeployEnabled: !!r.auto_deploy_enabled,
        webhookConfigured: Boolean(r.github_webhook_secret),
      }))
      setRepos(mapped)
      setNewRepoUrl("")
      
    } catch (error: any) {
      console.error("Failed to connect repository:", error)
      
      setError(error?.message || "Failed to connect repository")
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
            <div className="text-2xl font-bold">{(repos || []).filter((r) => r.connected).length}</div>
            <p className="text-xs text-muted-foreground">
              {(repos || []).length - (repos || []).filter((r) => r.connected).length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active PRs</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPullRequests.filter((pr) => pr.status === "open").length}</div>
            <p className="text-xs text-muted-foreground">
              {mockPullRequests.filter((pr) => pr.ciStatus === "success").length} ready to merge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Pipelines</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPipelines.filter((p) => p.status === "running").length}</div>
            <p className="text-xs text-muted-foreground">
              {mockPipelines.filter((p) => p.status === "success").length} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Deployments</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(repos || []).filter((r) => r.autoDeployEnabled).length}</div>
            <p className="text-xs text-muted-foreground">Repositories with auto-deploy</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="repositories" className="w-full">
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
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://github.com/username/repository"
                    value={newRepoUrl}
                    onChange={(e) => setNewRepoUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleConnectRepo} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "Connecting..." : "Connect"}
                  </Button>
                </div>
                
                {error && error.includes("GitHub App") && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">GitHub App 설치 필요</h4>
                        <p className="text-sm text-blue-700">
                          레포지토리를 연동하려면 먼저 GitHub App을 설치해야 합니다.
                        </p>
                      </div>
                      <Button 
                        onClick={handleInstallGitHubApp}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Install GitHub App
                      </Button>
                    </div>
                  </div>
                )}
                
                {error && !error.includes("GitHub App") && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Repository List */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Repositories</CardTitle>
              <CardDescription>Manage your GitHub repository integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && <div className="text-sm text-red-500">{error}</div>}
                {loading && !repos && <div className="text-sm text-muted-foreground">Loading...</div>}
                {(repos || []).map((repo, idx) => (
                  <div key={`${repo.fullName}-${idx}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Github className="w-5 h-5" />
                        <div>
                          <h3 className="font-semibold">{repo.fullName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Branch: {repo.branch} • Last sync: {repo.lastSync.toLocaleString()}
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
              <CardTitle>Pull Requests</CardTitle>
              <CardDescription>Monitor and manage pull requests across your repositories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPullRequests.map((pr) => (
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
                      {pr.author} wants to merge {pr.branch} into {pr.targetBranch} • {pr.createdAt.toLocaleString()}
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CI/CD Pipelines</CardTitle>
              <CardDescription>Monitor build and deployment pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPipelines.map((pipeline) => (
                  <div key={pipeline.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getPipelineStatusIcon(pipeline.status)}
                        <span className="font-medium">{pipeline.repository}</span>
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

                    <div className="text-sm text-muted-foreground">Started {pipeline.startedAt.toLocaleString()}</div>
                  </div>
                ))}
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
