"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  RefreshCw,
  Github,
  Activity,
  ExternalLink,
} from "lucide-react"
import { api } from "@/lib/api"

interface RepositoryWorkload {
  owner: string
  repo: string
  full_name: string
  branch: string
  latest_deployment: {
    id: number
    status: "running" | "success" | "failed"
    image: {
      name: string
      tag: string
      url: string
    }
    commit: {
      sha: string
      short_sha: string
      message: string
      author: string
      url: string
    }
    cluster: {
      namespace: string
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
      completed_at: string
      total_duration: number
    }
  } | null
  auto_deploy_enabled: boolean
}

export function DeploymentStatusMonitoring() {
  const [repositories, setRepositories] = useState<RepositoryWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRepo, setSelectedRepo] = useState<RepositoryWorkload | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const response = await api.getRepositoriesLatestDeployments()
      setRepositories(response.repositories)
    } catch (error) {
      console.error("Failed to fetch repositories:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepositories()
    // Poll every 30 seconds
    const interval = setInterval(fetchRepositories, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return <Badge variant="outline">No Deployments</Badge>
    }

    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Running
          </Badge>
        )
      case "running":
        return (
          <Badge className="bg-blue-500">
            <Clock className="mr-1 h-3 w-3" />
            Deploying
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const handleViewDetails = (repo: RepositoryWorkload) => {
    setSelectedRepo(repo)
    setDetailsOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deployments</h2>
          <p className="text-muted-foreground">
            Kubernetes workload operations by repository
          </p>
        </div>
        <Button onClick={fetchRepositories} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && repositories.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : repositories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No repositories connected</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {repositories.map((repo) => (
            <Card key={repo.full_name} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      {repo.full_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <GitBranch className="h-3 w-3" />
                      {repo.branch}
                    </CardDescription>
                  </div>
                  {getStatusBadge(repo.latest_deployment?.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {repo.latest_deployment ? (
                  <>
                    {/* Domain URL - Prominent Section */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent border-l-4 border-blue-500 rounded-md group">
                      <a
                        href={`https://${repo.repo}.klepaas.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <Server className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate group-hover:underline">
                          https://{repo.repo}.klepaas.com
                        </span>
                        <ExternalLink className="h-3 w-3 text-blue-600 dark:text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(`https://${repo.repo}.klepaas.com`)
                        }}
                      >
                        Copy
                      </Button>
                    </div>

                    {/* Image Info */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Image</p>
                      <p className="font-mono text-sm truncate">
                        {repo.latest_deployment.image.name}:{repo.latest_deployment.image.tag}
                      </p>
                    </div>

                    {/* Deployment Info */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Server className="h-3 w-3" />
                            Replicas
                          </div>
                          <p className="text-sm font-semibold">
                            {repo.latest_deployment.cluster.replicas.ready}/
                            {repo.latest_deployment.cluster.replicas.desired}
                            <span className="text-xs text-muted-foreground ml-2">
                              {repo.latest_deployment.cluster.replicas.ready ===
                              repo.latest_deployment.cluster.replicas.desired
                                ? "• All Ready"
                                : "• Scaling"}
                            </span>
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <GitBranch className="h-3 w-3" />
                            Last Commit
                          </div>
                          <p className="text-sm font-medium truncate">
                            {repo.latest_deployment.commit.message || "Initial deployment"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Github className="h-3 w-3" />
                            Author
                          </div>
                          <p className="text-sm font-medium">
                            {repo.latest_deployment.commit.author || "System"} •{" "}
                            {formatTime(repo.latest_deployment.timing.started_at)}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Clock className="h-3 w-3" />
                            Build Time
                          </div>
                          <p className="text-sm font-medium">
                            {repo.latest_deployment.timing.total_duration
                              ? `${repo.latest_deployment.timing.total_duration}s`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="default" variant="outline" className="flex-1">
                        <Scale className="mr-2 h-4 w-4" />
                        Scale
                      </Button>
                      <Button size="default" variant="outline" className="flex-1">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Rollback
                      </Button>
                      <Button size="default" variant="outline" className="flex-1">
                        <Play className="mr-2 h-4 w-4" />
                        Restart
                      </Button>
                      <Button
                        size="default"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewDetails(repo)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No deployments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              {selectedRepo?.full_name}
            </DialogTitle>
            <DialogDescription>
              Deployment configuration and status
            </DialogDescription>
          </DialogHeader>

          {selectedRepo?.latest_deployment && (
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="status">Quick Status</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Deployment Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="mt-1">
                          {getStatusBadge(selectedRepo.latest_deployment.status)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Namespace</p>
                        <p className="mt-1 font-medium">
                          {selectedRepo.latest_deployment.cluster.namespace}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Replicas</p>
                        <p className="mt-1 font-medium">
                          {selectedRepo.latest_deployment.cluster.replicas.ready} /{" "}
                          {selectedRepo.latest_deployment.cluster.replicas.desired}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="mt-1 font-medium">
                          {selectedRepo.latest_deployment.timing.total_duration}s
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Resources</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>CPU Usage</span>
                            <span className="font-medium">
                              {selectedRepo.latest_deployment.cluster.resources.cpu}%
                            </span>
                          </div>
                          <Progress
                            value={selectedRepo.latest_deployment.cluster.resources.cpu}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Memory Usage</span>
                            <span className="font-medium">
                              {selectedRepo.latest_deployment.cluster.resources.memory}%
                            </span>
                          </div>
                          <Progress
                            value={selectedRepo.latest_deployment.cluster.resources.memory}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1">
                        <Activity className="mr-2 h-4 w-4" />
                        View Monitoring
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Github className="mr-2 h-4 w-4" />
                        View CI/CD History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Image Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Image</p>
                      <p className="mt-1 font-mono text-sm">
                        {selectedRepo.latest_deployment.image.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tag</p>
                      <p className="mt-1 font-mono text-sm">
                        {selectedRepo.latest_deployment.image.tag}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Image URL</p>
                      <a
                        href={selectedRepo.latest_deployment.image.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 font-mono text-sm text-blue-500 hover:underline flex items-center gap-1"
                      >
                        {selectedRepo.latest_deployment.image.url || "N/A"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Commit Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Commit SHA</p>
                      <p className="mt-1 font-mono text-sm">
                        {selectedRepo.latest_deployment.commit.sha}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Message</p>
                      <p className="mt-1 text-sm">
                        {selectedRepo.latest_deployment.commit.message}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Author</p>
                      <p className="mt-1 text-sm">
                        {selectedRepo.latest_deployment.commit.author}
                      </p>
                    </div>
                    <div>
                      <a
                        href={selectedRepo.latest_deployment.commit.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                      >
                        View on GitHub
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cluster Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Namespace</p>
                      <p className="mt-1 font-mono text-sm">
                        {selectedRepo.latest_deployment.cluster.namespace}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Auto Deploy</p>
                      <Badge variant={selectedRepo.auto_deploy_enabled ? "default" : "outline"}>
                        {selectedRepo.auto_deploy_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {!selectedRepo?.latest_deployment && (
            <div className="text-center py-8 text-muted-foreground">
              No deployment information available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
