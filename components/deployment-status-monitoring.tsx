"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  Scale,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Cpu,
  HardDrive,
} from "lucide-react"

interface Deployment {
  id: string
  name: string
  namespace: string
  status: "running" | "pending" | "failed" | "stopped"
  replicas: {
    desired: number
    ready: number
    available: number
  }
  image: string
  version: string
  createdAt: Date
  lastUpdated: Date
  resources: {
    cpu: number
    memory: number
  }
}

interface Pod {
  id: string
  name: string
  status: "running" | "pending" | "failed" | "terminating"
  node: string
  restarts: number
  age: string
  resources: {
    cpu: number
    memory: number
  }
}

const mockDeployments: Deployment[] = [
  {
    id: "1",
    name: "frontend-app",
    namespace: "production",
    status: "running",
    replicas: { desired: 3, ready: 3, available: 3 },
    image: "frontend-app",
    version: "v2.1.0",
    createdAt: new Date(Date.now() - 86400000),
    lastUpdated: new Date(Date.now() - 300000),
    resources: { cpu: 45, memory: 62 },
  },
  {
    id: "2",
    name: "api-service",
    namespace: "production",
    status: "pending",
    replicas: { desired: 5, ready: 3, available: 3 },
    image: "api-service",
    version: "v1.8.3",
    createdAt: new Date(Date.now() - 43200000),
    lastUpdated: new Date(Date.now() - 600000),
    resources: { cpu: 78, memory: 85 },
  },
  {
    id: "3",
    name: "database-migration",
    namespace: "staging",
    status: "failed",
    replicas: { desired: 1, ready: 0, available: 0 },
    image: "db-migrator",
    version: "v0.5.2",
    createdAt: new Date(Date.now() - 3600000),
    lastUpdated: new Date(Date.now() - 3600000),
    resources: { cpu: 0, memory: 0 },
  },
]

const mockPods: Pod[] = [
  {
    id: "1",
    name: "frontend-app-7d4b8c9f5-abc12",
    status: "running",
    node: "node-1",
    restarts: 0,
    age: "2d",
    resources: { cpu: 15, memory: 20 },
  },
  {
    id: "2",
    name: "frontend-app-7d4b8c9f5-def34",
    status: "running",
    node: "node-2",
    restarts: 1,
    age: "2d",
    resources: { cpu: 15, memory: 21 },
  },
  {
    id: "3",
    name: "api-service-9f8e7d6c5-ghi56",
    status: "pending",
    node: "node-3",
    restarts: 0,
    age: "5m",
    resources: { cpu: 0, memory: 0 },
  },
]

export function DeploymentStatusMonitoring() {
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)

  const getStatusIcon = (status: Deployment["status"]) => {
    switch (status) {
      case "running":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "stopped":
        return <Pause className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Deployment["status"]) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-100 text-green-800">Running</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "stopped":
        return <Badge variant="secondary">Stopped</Badge>
    }
  }

  const getPodStatusBadge = (status: Pod["status"]) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-100 text-green-800">Running</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "terminating":
        return <Badge variant="secondary">Terminating</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDeployments.length}</div>
            <p className="text-xs text-muted-foreground">Across all namespaces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockDeployments.filter((d) => d.status === "running").length}
            </div>
            <p className="text-xs text-muted-foreground">Healthy deployments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {mockDeployments.filter((d) => d.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockDeployments.filter((d) => d.status === "failed").length}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Deployments List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Deployments</CardTitle>
          <CardDescription>Monitor and manage your Kubernetes deployments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDeployments.map((deployment) => (
              <div key={deployment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <h3 className="font-semibold">{deployment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {deployment.namespace} • {deployment.image}:{deployment.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(deployment.status)}
                    <Button variant="outline" size="sm" onClick={() => setSelectedDeployment(deployment)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Replicas</p>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={(deployment.replicas.ready / deployment.replicas.desired) * 100}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">
                        {deployment.replicas.ready}/{deployment.replicas.desired}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">CPU Usage</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={deployment.resources.cpu} className="flex-1" />
                      <span className="text-sm text-muted-foreground">{deployment.resources.cpu}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Memory Usage</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={deployment.resources.memory} className="flex-1" />
                      <span className="text-sm text-muted-foreground">{deployment.resources.memory}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="text-sm text-muted-foreground">Updated {deployment.lastUpdated.toLocaleString()}</div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Scale className="w-4 h-4 mr-1" />
                      Scale
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Rollback
                    </Button>
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Restart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Modal/Panel */}
      {selectedDeployment && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(selectedDeployment.status)}
                <span>{selectedDeployment.name}</span>
              </CardTitle>
              <Button variant="outline" onClick={() => setSelectedDeployment(null)}>
                Close
              </Button>
            </div>
            <CardDescription>
              Detailed monitoring for {selectedDeployment.name} in {selectedDeployment.namespace}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pods" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pods">Pods</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="pods" className="space-y-4">
                <div className="space-y-3">
                  {mockPods
                    .filter((pod) => pod.name.startsWith(selectedDeployment.name))
                    .map((pod) => (
                      <div key={pod.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Server className="w-4 h-4" />
                            <span className="font-medium text-sm">{pod.name}</span>
                          </div>
                          {getPodStatusBadge(pod.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Node:</span> {pod.node}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Age:</span> {pod.age}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Restarts:</span> {pod.restarts}
                          </div>
                          <div>
                            <span className="text-muted-foreground">CPU:</span> {pod.resources.cpu}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    <div className="text-sm p-2 bg-muted rounded">
                      <span className="text-muted-foreground">2 minutes ago:</span> Scaled deployment to 3 replicas
                    </div>
                    <div className="text-sm p-2 bg-muted rounded">
                      <span className="text-muted-foreground">5 minutes ago:</span> Successfully pulled image
                    </div>
                    <div className="text-sm p-2 bg-muted rounded">
                      <span className="text-muted-foreground">10 minutes ago:</span> Created pod
                      frontend-app-7d4b8c9f5-abc12
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <ScrollArea className="h-64">
                  <div className="font-mono text-sm space-y-1 bg-muted p-3 rounded">
                    <div>2024-01-15 10:30:15 INFO Starting application...</div>
                    <div>2024-01-15 10:30:16 INFO Connected to database</div>
                    <div>2024-01-15 10:30:17 INFO Server listening on port 3000</div>
                    <div>2024-01-15 10:30:18 INFO Health check endpoint ready</div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <Cpu className="w-4 h-4 mr-2" />
                        CPU Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedDeployment.resources.cpu}%</div>
                      <Progress value={selectedDeployment.resources.cpu} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <HardDrive className="w-4 h-4 mr-2" />
                        Memory Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedDeployment.resources.memory}%</div>
                      <Progress value={selectedDeployment.resources.memory} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
