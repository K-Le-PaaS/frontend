"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Server, GitBranch, AlertTriangle, CheckCircle, Clock, Cpu, HardDrive } from "lucide-react"
import { apiClient } from "@/lib/api"

interface DashboardData {
  clusters: number
  deployments: number
  pendingDeployments: number
  activeDeployments: number
  cpuUsage: number
  memoryUsage: number
  recentDeployments: Array<{
    name: string
    version: string
    status: 'success' | 'in-progress' | 'failed'
    time: string
    message: string
  }>
  systemHealth: Array<{
    service: string
    status: 'healthy' | 'warning' | 'error'
  }>
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardData = await apiClient.getDashboardData() as DashboardData
        setData(dashboardData)
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
          recentDeployments: [
            {
              name: "frontend-app",
              version: "v2.1.0",
              status: "success",
              time: "2 minutes ago",
              message: "Deployed 2 minutes ago"
            },
            {
              name: "api-service",
              version: "v1.8.3",
              status: "in-progress",
              time: "5 minutes ago",
              message: "Deploying for 5 minutes"
            },
            {
              name: "database-migration",
              version: "",
              status: "failed",
              time: "1 hour ago",
              message: "Failed 1 hour ago"
            }
          ],
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Deployments</CardTitle>
            <CardDescription>Latest deployment activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentDeployments.map((deployment, index) => {
              const getIcon = () => {
                switch (deployment.status) {
                  case 'success':
                    return <CheckCircle className="w-4 h-4 text-green-500" />
                  case 'in-progress':
                    return <Clock className="w-4 h-4 text-yellow-500" />
                  case 'failed':
                    return <AlertTriangle className="w-4 h-4 text-red-500" />
                  default:
                    return <Clock className="w-4 h-4 text-gray-500" />
                }
              }

              const getBadgeVariant = () => {
                switch (deployment.status) {
                  case 'success':
                    return 'secondary'
                  case 'in-progress':
                    return 'outline'
                  case 'failed':
                    return 'destructive'
                  default:
                    return 'outline'
                }
              }

              const getBadgeText = () => {
                switch (deployment.status) {
                  case 'success':
                    return 'Success'
                  case 'in-progress':
                    return 'In Progress'
                  case 'failed':
                    return 'Failed'
                  default:
                    return 'Unknown'
                }
              }

              return (
                <div key={index} className="flex items-center space-x-4">
                  {getIcon()}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{deployment.name}{deployment.version ? ` ${deployment.version}` : ''}</p>
                    <p className="text-xs text-muted-foreground">{deployment.message}</p>
                  </div>
                  <Badge variant={getBadgeVariant()}>{getBadgeText()}</Badge>
                </div>
              )
            })}
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
