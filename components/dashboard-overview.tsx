"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Server, GitBranch, AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, Github, Eye, Zap, GitPullRequest } from "lucide-react"
import { apiClient, api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { formatTimeAgo } from "@/lib/utils"
import { formatImageDisplay } from "@/lib/utils/image-formatter"
import { RecentCommands } from "@/components/recent-commands"

interface ConnectedRepository {
  id: string
  name: string
  fullName: string
  branch: string
  lastSync: string
}

interface PullRequest {
  id: string
  number: number
  title: string
  author: string
  status: string
  createdAt: string
  htmlUrl: string
}

interface DashboardData {
  clusters: number
  deployments: number
  pendingDeployments: number
  activeDeployments: number
  cpuUsage: number
  memoryUsage: number
  systemHealth: Array<{
    service: string
    status: 'healthy' | 'warning' | 'error'
  }>
  connectedRepositories: ConnectedRepository[]
  pullRequests: PullRequest[]
}

interface RepositoryWorkload {
  owner: string
  repo: string
  full_name: string
  branch: string
  latest_deployment: {
    id: number
    status: "running" | "success" | "failed"
    image: {
      tag: string
    }
    commit: {
      short_sha: string
    }
    cluster: {
      replicas: {
        desired: number
        ready: number
      }
      resources: {
        cpu: number
        memory: number
      }
    }
    timing: {
      started_at: string
      completed_at: string | null
      total_duration: number | null
    }
  } | null
  auto_deploy_enabled: boolean
}

interface DashboardOverviewProps {
  onNavigateToDeployments?: () => void
  onNavigateToChat?: (commandId: number) => void
  onNavigateToRepositories?: () => void
  onNavigateToPullRequests?: () => void
}

export function DashboardOverview({ onNavigateToDeployments, onNavigateToChat, onNavigateToRepositories, onNavigateToPullRequests }: DashboardOverviewProps) {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [repositories, setRepositories] = useState<RepositoryWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [deploymentConfigs, setDeploymentConfigs] = useState<Record<string, { replica_count: number }>>({})
  const [cpuUsage, setCpuUsage] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState(0)

  // 사용자 인증 상태 확인
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const dashboardData = await apiClient.getDashboardData() as DashboardData
        setData(dashboardData)

        // Fetch active repositories
        try {
          const repoResponse = await api.getRepositoriesLatestDeployments()
          const repos = repoResponse.repositories?.slice(0, 4) || []
          setRepositories(repos)

          // Fetch deployment configs for each repository
          const configs: Record<string, { replica_count: number }> = {}
          await Promise.all(
            repos.map(async (repo) => {
              try {
                const config = await api.getDeploymentConfig(repo.owner, repo.repo)
                configs[repo.full_name] = { replica_count: config.replica_count }
              } catch (error) {
                console.error(`Failed to fetch config for ${repo.full_name}:`, error)
                // Use default replica count if config fetch fails
                configs[repo.full_name] = { replica_count: 1 }
              }
            })
          )
          setDeploymentConfigs(configs)
        } catch (repoError) {
          console.error('Failed to fetch repositories:', repoError)
          setRepositories([])
        }

        // Fetch CPU and Memory usage metrics
        try {
          const cpuResult = await api.getNKSCpuUsage() as any
          if (cpuResult.status === 'success' && cpuResult.value) {
            setCpuUsage(cpuResult.value)
          }
        } catch (error) {
          console.error('Failed to fetch CPU metrics:', error)
        }

        try {
          const memoryResult = await api.getNKSMemoryUsage() as any
          if (memoryResult.status === 'success' && memoryResult.value) {
            setMemoryUsage(memoryResult.value)
          }
        } catch (error) {
          console.error('Failed to fetch memory metrics:', error)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Fallback to mock data if API fails
        setData({
          clusters: 3,
          deployments: 12,
          pendingDeployments: 4,
          activeDeployments: 8,
          cpuUsage: 68,
          memoryUsage: 45,
          systemHealth: [
            { service: "NCP Connection", status: "healthy" },
            { service: "Kubernetes API", status: "healthy" },
            { service: "GitHub Integration", status: "warning" },
            { service: "Monitoring", status: "healthy" }
          ],
          connectedRepositories: [],
          pullRequests: []
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 사용자 인증 상태 확인
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg">인증 상태 확인 중...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>대시보드</CardTitle>
            <CardDescription>
              대시보드를 확인하려면 먼저 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                대시보드를 확인하려면 로그인이 필요합니다.
              </p>
              <Button onClick={() => {
                // Header의 로그인 버튼과 동일하게 OAuth 로그인 모달 열기
                const event = new CustomEvent('openLoginModal')
                window.dispatchEvent(event)
              }}>
                로그인
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null
  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Repositories</CardTitle>
            <Github className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.connectedRepositories && data.connectedRepositories.length > 0 ? (
                data.connectedRepositories.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{repo.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {repo.branch} • {formatTimeAgo(repo.lastSync)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">No repositories connected</p>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  if (onNavigateToRepositories) {
                    onNavigateToRepositories()
                  } else {
                    router.push('/github')
                  }
                }}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.pullRequests && data.pullRequests.length > 0 ? (
                data.pullRequests.map((pr) => (
                  <div key={pr.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pr.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by @{pr.author} • {formatTimeAgo(pr.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">No pull requests</p>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  if (onNavigateToPullRequests) {
                    onNavigateToPullRequests()
                  } else {
                    router.push('/github')
                  }
                }}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cpuUsage.toFixed(2)}%</div>
            <Progress value={cpuUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryUsage.toFixed(2)}%</div>
            <Progress value={memoryUsage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Active Deployments & Recent Commands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Deployments</CardTitle>
              <CardDescription>Latest repository workloads</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToDeployments?.()}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {repositories.length > 0 ? (
              repositories.map((repo) => {
                const getStatusBadge = (status: string | undefined) => {
                  if (!status) {
                    return <Badge variant="outline" className="text-xs">No Deploy</Badge>
                  }

                  switch (status) {
                    case "success":
                      return (
                        <Badge className="bg-green-500 text-xs">
                          <CheckCircle className="mr-1 h-2 w-2" />
                          Running
                        </Badge>
                      )
                    case "running":
                      return (
                        <Badge className="bg-blue-500 text-xs">
                          <Clock className="mr-1 h-2 w-2" />
                          Deploying
                        </Badge>
                      )
                    case "failed":
                      return (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="mr-1 h-2 w-2" />
                          Failed
                        </Badge>
                      )
                    default:
                      return <Badge variant="outline" className="text-xs">{status}</Badge>
                  }
                }

                return (
                  <div
                    key={repo.full_name}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() => onNavigateToDeployments?.()}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Github className="h-3 w-3 shrink-0" />
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {repo.full_name}
                        </p>
                      </div>
                      {repo.latest_deployment ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
                            <span className="font-mono bg-muted px-1 rounded truncate max-w-[180px]">
                              {formatImageDisplay(repo.owner, repo.repo, repo.latest_deployment.image.tag)}
                            </span>
                            <span>•</span>
                            <span>
                              <span className="font-medium text-foreground">
                                {repo.latest_deployment.cluster.replicas.ready}/
                                {deploymentConfigs[repo.full_name]?.replica_count ?? repo.latest_deployment.cluster.replicas.desired}
                              </span> pods ready
                            </span>
                            <span>•</span>
                            <span className="truncate">{formatTimeAgo(repo.latest_deployment.timing.started_at)}</span>
                            {repo.auto_deploy_enabled && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-green-600">
                                  <Zap className="h-3 w-3" />
                                  Auto Deploy
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">No deployments</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-2 shrink-0">
                      {getStatusBadge(repo.latest_deployment?.status)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active deployments</p>
              </div>
            )}
          </CardContent>
        </Card>

        <RecentCommands onNavigateToChat={onNavigateToChat} />
      </div>
    </div>
  )
}
