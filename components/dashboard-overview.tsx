"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Server, GitBranch, AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, Github, Eye, Zap } from "lucide-react"
import { apiClient, api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { formatTimeAgo } from "@/lib/utils"

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
}

export function DashboardOverview({ onNavigateToDeployments }: DashboardOverviewProps) {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [repositories, setRepositories] = useState<RepositoryWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [deploymentConfigs, setDeploymentConfigs] = useState<Record<string, { replica_count: number }>>({})

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
          ]
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
            <CardTitle className="text-sm font-medium">Active Clusters</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.clusters}</div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployments</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.deployments}</div>
            <p className="text-xs text-muted-foreground">{`${data.pendingDeployments} pending, ${data.activeDeployments} active`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.cpuUsage}%</div>
            <Progress value={data.cpuUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.memoryUsage}%</div>
            <Progress value={data.memoryUsage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Active Deployments & System Health */}
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
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onNavigateToDeployments?.()}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Github className="h-3 w-3 shrink-0" />
                        <p className="text-sm font-medium truncate">{repo.full_name}</p>
                      </div>
                      {repo.latest_deployment ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">
                            {repo.latest_deployment.image.tag}
                          </span>
                          <span>•</span>
                          <span>
                            {repo.latest_deployment.cluster.replicas.ready}/
                            {deploymentConfigs[repo.full_name]?.replica_count ?? repo.latest_deployment.cluster.replicas.desired} replicas
                          </span>
                          <span>•</span>
                          <span>{formatTimeAgo(repo.latest_deployment.timing.started_at)}</span>
                          {repo.auto_deploy_enabled && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Auto
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No deployments</p>
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

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.systemHealth.map((health, index) => {
              const getBadgeStyle = () => {
                switch (health.status) {
                  case 'healthy':
                    return 'bg-green-100 text-green-800'
                  case 'warning':
                    return 'bg-yellow-100 text-yellow-800'
                  case 'error':
                    return 'bg-red-100 text-red-800'
                  default:
                    return 'bg-gray-100 text-gray-800'
                }
              }

              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{health.service}</span>
                  <Badge className={getBadgeStyle()}>
                    {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                  </Badge>
                </div>
              )
            })}

            <Button className="w-full mt-4 bg-transparent" variant="outline">
              View Detailed Health Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
