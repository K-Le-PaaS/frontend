"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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

interface MetricData {
  timestamp: string
  cpu: number
  memory: number
  network: number
  disk: number
}

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

const generateMetricData = (): MetricData[] => {
  const data: MetricData[] = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000)
    data.push({
      timestamp: timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cpu: Math.floor(Math.random() * 40) + 30 + Math.sin(i * 0.1) * 10,
      memory: Math.floor(Math.random() * 30) + 40 + Math.cos(i * 0.15) * 15,
      network: Math.floor(Math.random() * 50) + 20,
      disk: Math.floor(Math.random() * 20) + 60,
    })
  }
  return data
}

const mockNodes: ClusterNode[] = [
  {
    id: "1",
    name: "k8s-master-01",
    status: "ready",
    cpu: 45,
    memory: 62,
    pods: 12,
    maxPods: 110,
    version: "v1.28.2",
    uptime: "15d 4h",
  },
  {
    id: "2",
    name: "k8s-worker-01",
    status: "ready",
    cpu: 78,
    memory: 85,
    pods: 28,
    maxPods: 110,
    version: "v1.28.2",
    uptime: "15d 4h",
  },
  {
    id: "3",
    name: "k8s-worker-02",
    status: "not-ready",
    cpu: 0,
    memory: 0,
    pods: 0,
    maxPods: 110,
    version: "v1.28.2",
    uptime: "0d 0h",
  },
]

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

const resourceDistribution = [
  { name: "CPU", value: 68, color: "#8884d8" },
  { name: "Memory", value: 45, color: "#82ca9d" },
  { name: "Storage", value: 32, color: "#ffc658" },
  { name: "Network", value: 23, color: "#ff7300" },
]

export function RealTimeMonitoringDashboard() {
  const [metricData, setMetricData] = useState<MetricData[]>(generateMetricData())
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      // Simulate real-time data updates
      setMetricData((prev) => {
        const newData = [...prev.slice(1)]
        const lastPoint = prev[prev.length - 1]
        newData.push({
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          cpu: Math.max(0, Math.min(100, lastPoint.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(0, Math.min(100, lastPoint.memory + (Math.random() - 0.5) * 8)),
          network: Math.max(0, Math.min(100, lastPoint.network + (Math.random() - 0.5) * 15)),
          disk: Math.max(0, Math.min(100, lastPoint.disk + (Math.random() - 0.5) * 5)),
        })
        return newData
      })
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

  const currentMetrics = metricData[metricData.length - 1] || { cpu: 0, memory: 0, network: 0, disk: 0 }

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
            <div className="text-2xl font-bold">{Math.round(currentMetrics.cpu)}%</div>
            <Progress value={currentMetrics.cpu} className="mt-2" />
            <div className="flex items-center mt-1">
              {currentMetrics.cpu > 80 ? (
                <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-500 mr-1" />
              )}
              <span className="text-xs text-muted-foreground">{currentMetrics.cpu > 80 ? "High" : "Normal"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(currentMetrics.memory)}%</div>
            <Progress value={currentMetrics.memory} className="mt-2" />
            <div className="flex items-center mt-1">
              {currentMetrics.memory > 80 ? (
                <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-500 mr-1" />
              )}
              <span className="text-xs text-muted-foreground">{currentMetrics.memory > 80 ? "High" : "Normal"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(currentMetrics.network)}%</div>
            <Progress value={currentMetrics.network} className="mt-2" />
            <div className="flex items-center mt-1">
              <Globe className="w-3 h-3 text-blue-500 mr-1" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(currentMetrics.disk)}%</div>
            <Progress value={currentMetrics.disk} className="mt-2" />
            <div className="flex items-center mt-1">
              <Shield className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-muted-foreground">Healthy</span>
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
          {/* Real-time Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
                <CardDescription>Real-time system resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" strokeWidth={2} name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network & Disk I/O</CardTitle>
                <CardDescription>Real-time I/O performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="network"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                      name="Network %"
                    />
                    <Area type="monotone" dataKey="disk" stackId="1" stroke="#ff7300" fill="#ff7300" name="Disk %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Last 30 minutes average performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metricData.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cpu" fill="#8884d8" name="CPU %" />
                  <Bar dataKey="memory" fill="#82ca9d" name="Memory %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cluster Nodes</CardTitle>
              <CardDescription>Monitor the health and status of your Kubernetes nodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockNodes.map((node) => (
                  <div key={node.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getNodeStatusIcon(node.status)}
                        <div>
                          <h3 className="font-semibold">{node.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {node.version} • Uptime: {node.uptime}
                          </p>
                        </div>
                      </div>
                      {getNodeStatusBadge(node.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">CPU Usage</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={node.cpu} className="flex-1" />
                          <span className="text-sm text-muted-foreground">{node.cpu}%</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Memory Usage</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={node.memory} className="flex-1" />
                          <span className="text-sm text-muted-foreground">{node.memory}%</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Pod Capacity</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={(node.pods / node.maxPods) * 100} className="flex-1" />
                          <span className="text-sm text-muted-foreground">
                            {node.pods}/{node.maxPods}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <Button variant="outline" size="sm">
                          <Activity className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <CardTitle>Resource Distribution</CardTitle>
                <CardDescription>Current cluster resource allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={resourceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resourceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Trends</CardTitle>
                <CardDescription>Resource usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Cores</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">12/16 used</span>
                      <Progress value={75} className="w-20" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">28/64 GB</span>
                      <Progress value={44} className="w-20" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">320/1000 GB</span>
                      <Progress value={32} className="w-20" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pods</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">40/330 pods</span>
                      <Progress value={12} className="w-20" />
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
