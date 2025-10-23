"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Shield,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

interface ClusterNode {
  id: string
  name: string
  status: "ready" | "not-ready" | "unknown"
  cpu: number
  memory: number
  pods: number
  maxPods: number
  version: string
  uptime: string
}

interface Alert {
  id: string
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  timestamp: Date
  resolved: boolean
  source: string
}

// NKS 모니터링 데이터 타입
interface NKSMonitoringData {
  status: string
  cluster: string
  timestamp: string
  metrics: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    network_traffic: {
      inbound_mbps: number
      outbound_mbps: number
    }
    node_status: {
      total_nodes: number
      healthy_nodes: number
      nodes: Array<{
        instance: string
        status: string
      }>
    }
  }
  overall_status: string
  message: string
}

// NKS 실제 데이터를 기반으로 한 클러스터 노드 정보
const getNKSClusterNodes = (nksData: NKSMonitoringData | null): ClusterNode[] => {
  if (!nksData || !nksData.metrics) {
    return []
  }

  // 실제 노드들만 반환 (시뮬레이션 노드 제거)
  return nksData.metrics.node_status.nodes.map((node, index) => ({
    id: `${index + 1}`,
    name: `NKS-Node-${index + 1}`,
    status: node.status === "healthy" ? "ready" as const : "not-ready" as const,
    cpu: nksData.metrics.cpu_usage || 0,
    memory: nksData.metrics.memory_usage || 0,
    pods: 8, // NKS 클러스터에서 실행 중인 파드 수 (실제 API 연동 필요)
    maxPods: 110,
    version: "v1.28.2", // NKS 버전
    uptime: "15d 4h", // NKS 노드 업타임 (실제 API 연동 필요)
  }))
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    severity: "critical",
    title: "High Memory Usage",
    description: "Node k8s-worker-01 memory usage is above 85%",
    timestamp: new Date(Date.now() - 300000),
    resolved: false,
    source: "Prometheus",
  },
  {
    id: "2",
    severity: "warning",
    title: "Pod Restart Loop",
    description: "Pod api-service-xyz has restarted 5 times in the last hour",
    timestamp: new Date(Date.now() - 600000),
    resolved: false,
    source: "Kubernetes",
  },
  {
    id: "3",
    severity: "info",
    title: "Deployment Completed",
    description: "Successfully deployed frontend-app v2.1.0",
    timestamp: new Date(Date.now() - 900000),
    resolved: true,
    source: "CI/CD",
  },
]

// NKS 실제 데이터를 기반으로 한 리소스 분포 (동적으로 업데이트됨)
const getResourceDistribution = (nksData: NKSMonitoringData | null) => {
  if (!nksData || !nksData.metrics) {
    return [
      { name: "CPU", value: 0, color: "#8884d8" },
      { name: "Memory", value: 0, color: "#82ca9d" },
      { name: "Storage", value: 0, color: "#ffc658" },
      { name: "Network", value: 0, color: "#ff7300" },
    ]
  }

  return [
    { name: "CPU", value: nksData.metrics.cpu_usage || 0, color: "#3b82f6" },
    { name: "Memory", value: nksData.metrics.memory_usage || 0, color: "#10b981" },
    { name: "Storage", value: nksData.metrics.disk_usage || 0, color: "#f97316" },
    { name: "Network", value: ((nksData.metrics.network_traffic?.inbound_mbps || 0) + (nksData.metrics.network_traffic?.outbound_mbps || 0)) * 10, color: "#8b5cf6" },
  ]
}

export function RealTimeMonitoringDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [nksData, setNksData] = useState<NKSMonitoringData | null>(null)
  const [nksLoading, setNksLoading] = useState(true)
  const [nksError, setNksError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // 효율적인 개별 메트릭 폴링
  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        // 에러 상태만 초기화 (로딩 상태는 건드리지 않음)
        setNksError(null)
        
        // 병렬로 필요한 메트릭만 가져오기
        const [cpuData, memoryData, diskData, networkData] = await Promise.all([
          apiClient.getNKSCpuUsage(),
          apiClient.getNKSMemoryUsage(),
          apiClient.getNKSDiskUsage(),
          apiClient.getNKSNetworkTraffic()
        ]) as [any, any, any, any]

        // NKS 데이터 상태 업데이트 (간소화된 형태)
        setNksData({
          status: 'success',
          cluster: 'nks-cluster',
          timestamp: new Date().toISOString(),
          metrics: {
            cpu_usage: cpuData.value,
            memory_usage: memoryData.value,
            disk_usage: diskData.value,
            network_traffic: {
              inbound_mbps: networkData.inbound_mbps,
              outbound_mbps: networkData.outbound_mbps
            },
            node_status: {
              total_nodes: 1,
              healthy_nodes: 1,
              nodes: [
                {
                  instance: "nks-cluster-node",
                  status: "healthy"
                }
              ]
            }
          },
          overall_status: 'healthy',
          message: 'NKS monitoring data retrieved successfully'
        })
        
        // 초기 로딩 완료
        if (isInitialLoad) {
          setNksLoading(false)
          setIsInitialLoad(false)
        }
        
      } catch (error) {
        console.error('Failed to fetch NKS monitoring data:', error)
        setNksError('NKS 모니터링 데이터를 가져오는데 실패했습니다.')
        // 에러 발생 시에도 초기 로딩은 완료로 처리
        if (isInitialLoad) {
          setNksLoading(false)
          setIsInitialLoad(false)
        }
      }
    }

    // 즉시 데이터 가져오기
    fetchMetricsData()
    
    // 10초마다 메트릭 업데이트 (효율성을 위해 간격 증가)
    const nksInterval = setInterval(fetchMetricsData, 10000)
    
    return () => clearInterval(nksInterval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getNodeStatusIcon = (status: ClusterNode["status"]) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "not-ready":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "unknown":
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getNodeStatusBadge = (status: ClusterNode["status"]) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case "not-ready":
        return <Badge variant="destructive">Not Ready</Badge>
      case "unknown":
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getAlertIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "info":
        return <CheckCircle className="w-4 h-4 text-blue-500" />
    }
  }

  const getAlertBadge = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "info":
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-time Monitoring</h2>
          <p className="text-muted-foreground">Last updated: {currentTime.toLocaleString()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Current Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(nksData?.metrics.cpu_usage || 0).toFixed(2)}%</div>
            <Progress value={nksData?.metrics.cpu_usage || 0} className="mt-2" />
            <div className="flex items-center mt-1">
              {(nksData?.metrics.cpu_usage || 0) > 80 ? (
                <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-500 mr-1" />
              )}
              <span className="text-xs text-muted-foreground">{(nksData?.metrics.cpu_usage || 0) > 80 ? "High" : "Normal"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(nksData?.metrics.memory_usage || 0).toFixed(2)}%</div>
            <Progress value={nksData?.metrics.memory_usage || 0} className="mt-2" />
            <div className="flex items-center mt-1">
              {(nksData?.metrics.memory_usage || 0) > 80 ? (
                <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-500 mr-1" />
              )}
              <span className="text-xs text-muted-foreground">{(nksData?.metrics.memory_usage || 0) > 80 ? "High" : "Normal"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(nksData?.metrics.disk_usage || 0).toFixed(2)}%</div>
            <Progress value={nksData?.metrics.disk_usage || 0} className="mt-2" />
            <div className="flex items-center mt-1">
              <Shield className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-muted-foreground">Healthy</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(nksData?.metrics.network_traffic?.inbound_mbps || 0).toFixed(2)} MB/s</div>
            <Progress value={Math.min((nksData?.metrics.network_traffic?.inbound_mbps || 0) * 10, 100)} className="mt-2" />
            <div className="flex items-center mt-1">
              <Globe className="w-3 h-3 text-blue-500 mr-1" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="nodes">Cluster Nodes</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {/* 실시간 메트릭 차트들 */}
          {nksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4 text-lg">모니터링 데이터 로딩 중...</span>
            </div>
          ) : nksError ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg">{nksError}</p>
            </div>
          ) : !nksData ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">모니터링 데이터를 수집 중입니다...</p>
            </div>
          ) : (
            <div className="space-y-6">
            {/* 차트 영역 - 간단한 진행률 바 차트 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU 사용률 차트 */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Cpu className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">CPU Usage</span>
                      <p className="text-sm text-muted-foreground font-normal">클러스터 CPU 사용률</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {(nksData?.metrics?.cpu_usage || 0).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">현재 사용률</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm font-bold text-blue-600">{(nksData?.metrics?.cpu_usage || 0).toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(nksData?.metrics?.cpu_usage || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 메모리 사용률 차트 */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">Memory Usage</span>
                      <p className="text-sm text-muted-foreground font-normal">클러스터 메모리 사용률</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {(nksData?.metrics?.memory_usage || 0).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">현재 사용률</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm font-bold text-green-600">{(nksData?.metrics?.memory_usage || 0).toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(nksData?.metrics?.memory_usage || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 디스크 사용률 차트 */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <HardDrive className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">Disk Usage</span>
                      <p className="text-sm text-muted-foreground font-normal">클러스터 디스크 사용률</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {(nksData?.metrics?.disk_usage || 0).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">현재 사용률</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm font-bold text-orange-600">{(nksData?.metrics?.disk_usage || 0).toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-orange-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(nksData?.metrics?.disk_usage || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 네트워크 트래픽 차트 */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Network className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">Network Traffic</span>
                      <p className="text-sm text-muted-foreground font-normal">클러스터 네트워크 트래픽</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {(nksData?.metrics?.network_traffic?.inbound_mbps || 0).toFixed(2)} MB/s
                    </div>
                    <div className="text-xs text-muted-foreground">현재 인바운드</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network Traffic</span>
                    <span className="text-sm font-bold text-purple-600">{(nksData?.metrics?.network_traffic?.inbound_mbps || 0).toFixed(2)} MB/s</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((nksData?.metrics?.network_traffic?.inbound_mbps || 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 MB/s</span>
                    <span>5 MB/s</span>
                    <span>10 MB/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          {/* 클러스터 노드 카드들 */}
          {nksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4 text-lg">NKS 클러스터 노드 정보 로딩 중...</span>
            </div>
          ) : nksError ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg">{nksError}</p>
            </div>
          ) : getNKSClusterNodes(nksData).length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">NKS 노드 정보를 불러오는 중입니다...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 클러스터 전체 상태 카드 - 간단한 UI */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="text-xl font-semibold">Cluster Overview</h3>
                        <p className="text-sm text-muted-foreground">
                          {nksData?.cluster || 'nks-cluster'} • {nksData?.metrics?.node_status?.total_nodes || 0} nodes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={nksData?.overall_status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {nksData?.overall_status === 'healthy' ? 'Healthy' : 'Degraded'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Last updated: {new Date().toLocaleString()}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* 개별 노드 카드들 */}
              {getNKSClusterNodes(nksData).map((node) => (
                <Card key={node.id} className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getNodeStatusIcon(node.status)}
                        <div>
                          <h3 className="text-xl font-semibold">{node.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {node.version} • Uptime: {node.uptime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getNodeStatusBadge(node.status)}
                        <Button variant="outline" size="sm">
                          <Activity className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* 4개 메트릭 표시 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* CPU Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">CPU Usage</span>
                          <Cpu className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{node.cpu}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${node.cpu}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Memory Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Memory Usage</span>
                          <Database className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{node.memory}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${node.memory}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Disk Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Disk Usage</span>
                          <HardDrive className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{(nksData?.metrics?.disk_usage || 0).toFixed(2)}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${nksData?.metrics?.disk_usage || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Network Traffic */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Network Traffic</span>
                          <Network className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-bold">
                          {(nksData?.metrics?.network_traffic?.inbound_mbps || 0).toFixed(2)} MB/s
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((nksData?.metrics?.network_traffic?.inbound_mbps || 0) * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Monitor and manage system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <div key={alert.id} className={`border rounded-lg p-4 ${alert.resolved ? "opacity-60" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getAlertIcon(alert.severity)}
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getAlertBadge(alert.severity)}
                          {alert.resolved && <Badge variant="outline">Resolved</Badge>}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Source: {alert.source}</span>
                        <span>{alert.timestamp.toLocaleString()}</span>
                      </div>

                      {!alert.resolved && (
                        <div className="flex space-x-2 mt-3">
                          <Button variant="outline" size="sm">
                            Acknowledge
                          </Button>
                          <Button variant="outline" size="sm">
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Cluster Resource Distribution</span>
                </CardTitle>
                <CardDescription>클러스터 실제 리소스 사용률</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getResourceDistribution(nksData)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${(value as number).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getResourceDistribution(nksData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Usage']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Cluster Resource Usage</span>
                </CardTitle>
                <CardDescription>클러스터 실시간 리소스 사용량</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <Cpu className="w-4 h-4 mr-2" />
                      CPU Usage
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{nksData?.metrics?.cpu_usage?.toFixed(1) || '0.0'}%</span>
                      <Progress value={nksData?.metrics?.cpu_usage || 0} className="w-20" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      Memory Usage
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{nksData?.metrics?.memory_usage?.toFixed(1) || '0.0'}%</span>
                      <Progress value={nksData?.metrics?.memory_usage || 0} className="w-20" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <HardDrive className="w-4 h-4 mr-2" />
                      Disk Usage
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{nksData?.metrics?.disk_usage?.toFixed(1) || '0.0'}%</span>
                      <Progress value={nksData?.metrics?.disk_usage || 0} className="w-20" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <Network className="w-4 h-4 mr-2" />
                      Network Traffic
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {((nksData?.metrics?.network_traffic?.inbound_mbps || 0) + (nksData?.metrics?.network_traffic?.outbound_mbps || 0)).toFixed(2)} MB/s
                      </span>
                      <Progress value={Math.min(((nksData?.metrics?.network_traffic?.inbound_mbps || 0) + (nksData?.metrics?.network_traffic?.outbound_mbps || 0)) * 10, 100)} className="w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
