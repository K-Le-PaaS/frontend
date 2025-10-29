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

  type DetailNode = {
    instance: string
    cpu: { utilization_pct?: number; load_avg_per_core?: number; iowait_pct?: number }
    memory: { usage_pct?: number; swap_used_bytes?: number }
    disk: { root_usage_pct?: number; io_saturation?: number; readonly?: boolean }
    network: { rx_bps?: number; tx_bps?: number; rx_errs_ps?: number; rx_drops_ps?: number }
    alerts?: { severity: 'critical' | 'warning' | 'info'; reasons: string[] }
  }

  const [details, setDetails] = useState<DetailNode[]>([])
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsCluster, setDetailsCluster] = useState<string>('nks-cluster')

  // 효율적인 개별 메트릭 폴링
  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        // 에러 상태만 초기화 (로딩 상태는 건드리지 않음)
        setNksError(null)
        setDetailsError(null)
        
        // 병렬로 필요한 메트릭만 가져오기
        const [cpuData, memoryData, diskData, networkData, detailsResp] = await Promise.all([
          apiClient.getNKSCpuUsage(),
          apiClient.getNKSMemoryUsage(),
          apiClient.getNKSDiskUsage(),
          apiClient.getNKSNetworkTraffic(),
          apiClient.getMonitoringDetails(),
        ]) as [any, any, any, any, any]

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

        // 상세 지표 저장
        if (detailsResp && Array.isArray(detailsResp.nodes)) {
          setDetails(detailsResp.nodes as DetailNode[])
          if (detailsResp.cluster) {
            setDetailsCluster(detailsResp.cluster as string)
          }
        }
        
        // 초기 로딩 완료
        if (isInitialLoad) {
          setNksLoading(false)
          setIsInitialLoad(false)
        }
        
      } catch (error) {
        console.error('Failed to fetch NKS monitoring data:', error)
        setNksError('NKS 모니터링 데이터를 가져오는데 실패했습니다.')
        setDetailsError('상세 모니터링 데이터를 가져오는데 실패했습니다.')
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

      <Tabs defaultValue="nodes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nodes">Cluster Nodes</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {nksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4 text-lg">상세 지표 로딩 중...</span>
            </div>
          ) : detailsError ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg">{detailsError}</p>
            </div>
          ) : details.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">상세 모니터링 데이터를 수집 중입니다...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header card (separate box) */}
            <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Node Details</CardTitle>
                  <CardDescription>클러스터 노드별 상세 지표</CardDescription>
              </CardHeader>
            </Card>

              {/* Per-node cards (separate box per cluster/node) */}
              {details.map((node) => {
                const rows: Array<{resource: string; label: string; value: string; alert?: string; severity?: string}> = []
                rows.push({ resource: 'CPU', label: 'Utilization', value: `${(node.cpu.utilization_pct ?? 0).toFixed(2)}%`, alert: (node.cpu.utilization_pct ?? 0) > 80 ? 'High' : 'Normal', severity: (node.cpu.utilization_pct ?? 0) > 80 ? 'warning' : 'info' })
                rows.push({ resource: 'CPU', label: 'Load Avg/Core', value: `${(node.cpu.load_avg_per_core ?? 0).toFixed(2)}`, alert: (node.cpu.load_avg_per_core ?? 0) > 1 ? 'Saturated' : 'OK', severity: (node.cpu.load_avg_per_core ?? 0) > 1 ? 'warning' : 'info' })
                rows.push({ resource: 'CPU', label: 'I/O Wait', value: `${(node.cpu.iowait_pct ?? 0).toFixed(2)}%`, alert: (node.cpu.iowait_pct ?? 0) > 5 ? 'High' : 'OK', severity: (node.cpu.iowait_pct ?? 0) > 5 ? 'warning' : 'info' })

                rows.push({ resource: 'Memory', label: 'Usage', value: `${(node.memory.usage_pct ?? 0).toFixed(2)}%`, alert: (node.memory.usage_pct ?? 0) > 80 ? 'High' : 'OK', severity: (node.memory.usage_pct ?? 0) > 80 ? 'warning' : 'info' })
                rows.push({ resource: 'Memory', label: 'Swap Used', value: `${Math.max(0, Math.round((node.memory.swap_used_bytes ?? 0)))} B`, alert: (node.memory.swap_used_bytes ?? 0) > 0 ? 'In Use' : 'OK', severity: (node.memory.swap_used_bytes ?? 0) > 0 ? 'warning' : 'info' })

                rows.push({ resource: 'Disk', label: 'Root Usage', value: `${(node.disk.root_usage_pct ?? 0).toFixed(2)}%`, alert: (node.disk.root_usage_pct ?? 0) > 85 ? 'High' : 'OK', severity: (node.disk.root_usage_pct ?? 0) > 85 ? 'warning' : 'info' })
                rows.push({ resource: 'Disk', label: 'IO Saturation', value: `${(node.disk.io_saturation ?? 0).toFixed(2)}`, alert: (node.disk.io_saturation ?? 0) > 0.8 ? 'High' : 'OK', severity: (node.disk.io_saturation ?? 0) > 0.8 ? 'warning' : 'info' })
                rows.push({ resource: 'Disk', label: 'Readonly', value: node.disk.readonly ? 'Yes' : 'No', alert: node.disk.readonly ? 'Readonly' : 'OK', severity: node.disk.readonly ? 'critical' : 'info' })

                rows.push({ resource: 'Network', label: 'RX Throughput', value: `${Math.round(node.network.rx_bps ?? 0)} B/s`, alert: '—', severity: 'info' })
                rows.push({ resource: 'Network', label: 'TX Throughput', value: `${Math.round(node.network.tx_bps ?? 0)} B/s`, alert: '—', severity: 'info' })
                rows.push({ resource: 'Network', label: 'RX Errors', value: `${(node.network.rx_errs_ps ?? 0).toFixed(2)}/s`, alert: (node.network.rx_errs_ps ?? 0) > 0 ? 'Errors' : 'OK', severity: (node.network.rx_errs_ps ?? 0) > 0 ? 'warning' : 'info' })
                rows.push({ resource: 'Network', label: 'RX Drops', value: `${(node.network.rx_drops_ps ?? 0).toFixed(2)}/s`, alert: (node.network.rx_drops_ps ?? 0) > 0 ? 'Drops' : 'OK', severity: (node.network.rx_drops_ps ?? 0) > 0 ? 'warning' : 'info' })

                return (
                  <Card key={`block-${node.instance}`} className="border shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">{detailsCluster}</CardTitle>
                      <CardDescription className="text-xs">{node.instance}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left border-b">
                              <th className="py-2 pr-4">Detail</th>
                              <th className="py-2 pr-4">Alert</th>
                              <th className="py-2">Resource</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, idx) => (
                              <tr key={`${node.instance}-${r.resource}-${r.label}-${idx}`} className="border-b">
                                <td className="py-2 pr-4"><span className="font-medium">{r.label}</span> <span className="text-muted-foreground ml-2">{r.value}</span></td>
                                <td className="py-2 pr-4">
                                  {r.alert && r.alert !== '—' ? (
                                    <Badge className={r.severity === 'critical' ? 'bg-red-100 text-red-800' : r.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                                      {r.alert}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="py-2">{r.resource}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
