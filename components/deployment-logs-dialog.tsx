"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  RefreshCw,
  Copy,
  Download,
  Terminal,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface Pod {
  name: string
  phase: string
  ready: boolean
  restarts: number
  startTime: string | null
}

interface LogsData {
  podName: string
  logs: string
  lines: number
  podStatus?: string
  warning?: string
}

interface DeploymentLogsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  namespace: string
  appName: string
}

export function DeploymentLogsDialog({
  open,
  onOpenChange,
  namespace,
  appName,
}: DeploymentLogsDialogProps) {
  const [pods, setPods] = useState<Pod[]>([])
  const [selectedPod, setSelectedPod] = useState<string>("")
  const [logsData, setLogsData] = useState<LogsData | null>(null)
  const [lines, setLines] = useState(200)
  const [previous, setPrevious] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch pods when dialog opens
  useEffect(() => {
    if (open) {
      fetchPods()
    }
  }, [open, namespace, appName])

  // Fetch logs when pod selection or settings change
  useEffect(() => {
    if (open && selectedPod) {
      fetchLogs()
    }
  }, [open, selectedPod, lines, previous])

  const fetchPods = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/deployments/${namespace}/${appName}/pods`)
      if (response.data.status === "success") {
        setPods(response.data.pods)
        // Select first pod (API returns representative pod first)
        if (response.data.pods.length > 0) {
          setSelectedPod(response.data.pods[0].name)
        }
      } else {
        setError("Pod 목록을 가져올 수 없습니다.")
      }
    } catch (err) {
      setError("Pod 목록 조회 실패")
      console.error("Failed to fetch pods:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    if (!selectedPod) return

    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/deployments/${namespace}/${appName}/logs`, {
        params: {
          pod: selectedPod,
          lines,
          previous,
        },
      })
      if (response.data.status === "success") {
        setLogsData(response.data)
      } else {
        setError("로그를 가져올 수 없습니다.")
      }
    } catch (err) {
      setError("로그 조회 실패")
      console.error("Failed to fetch logs:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchLogs()
  }

  const handleCopyLogs = () => {
    if (logsData?.logs) {
      navigator.clipboard.writeText(logsData.logs)
      toast.success("로그가 클립보드에 복사되었습니다")
    }
  }

  const handleDownloadLogs = () => {
    if (logsData?.logs) {
      const blob = new Blob([logsData.logs], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${appName}-${selectedPod}-logs.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("로그가 다운로드되었습니다")
    }
  }

  const handleCopySternCommand = () => {
    const command = `stern deploy/${appName} -n ${namespace} --tail ${lines} -F -o raw`
    navigator.clipboard.writeText(command)
    toast.success("stern 명령어가 클립보드에 복사되었습니다")
  }

  const getPodStatusBadge = (pod: Pod) => {
    if (pod.ready) {
      return (
        <Badge variant="default" className="bg-green-500 text-xs">
          <CheckCircle className="mr-1 h-2 w-2" />
          Ready
        </Badge>
      )
    }
    if (pod.phase === "Running") {
      return (
        <Badge variant="secondary" className="text-xs">
          <Clock className="mr-1 h-2 w-2" />
          Running
        </Badge>
      )
    }
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle className="mr-1 h-2 w-2" />
        {pod.phase}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            {appName} 로그
          </DialogTitle>
          <DialogDescription>
            네임스페이스: {namespace} • Pod별 로그 확인
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Label htmlFor="pod-select" className="text-sm font-medium">
                Pod:
              </Label>
              <Select value={selectedPod} onValueChange={setSelectedPod}>
                <SelectTrigger id="pod-select" className="w-48">
                  <SelectValue placeholder="Pod 선택" />
                </SelectTrigger>
                <SelectContent>
                  {pods.map((pod) => (
                    <SelectItem key={pod.name} value={pod.name}>
                      <div className="flex items-center gap-2">
                        <span>{pod.name}</span>
                        {getPodStatusBadge(pod)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="lines-select" className="text-sm font-medium">
                줄 수:
              </Label>
              <Select value={lines.toString()} onValueChange={(v) => setLines(Number(v))}>
                <SelectTrigger id="lines-select" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="previous-toggle"
                checked={previous}
                onCheckedChange={setPrevious}
              />
              <Label htmlFor="previous-toggle" className="text-sm">
                이전 로그
              </Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLogs}>
              <Copy className="mr-2 h-4 w-4" />
              로그 복사
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
              <Download className="mr-2 h-4 w-4" />
              다운로드
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopySternCommand}>
              <Terminal className="mr-2 h-4 w-4" />
              stern 복사
            </Button>
          </div>

          {/* Logs Display */}
          <div className="flex-1 min-h-0">
            {error ? (
              <div className="flex items-center justify-center h-32 text-red-500">
                <AlertCircle className="mr-2 h-4 w-4" />
                {error}
              </div>
            ) : logsData ? (
              <div className="h-full border rounded-lg">
                <div className="p-3 bg-muted/50 border-b flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{logsData.podName}</span>
                    {logsData.podStatus && (
                      <Badge variant="outline" className="text-xs">
                        {logsData.podStatus}
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      {logsData.lines}줄
                    </span>
                  </div>
                  {logsData.warning && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">{logsData.warning}</span>
                    </div>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
                    {logsData.logs}
                  </pre>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                {loading ? "로그를 불러오는 중..." : "Pod를 선택하세요"}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
