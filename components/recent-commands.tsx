"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, AlertCircle, Terminal, Eye } from "lucide-react"
import { formatTimeAgo } from "@/lib/utils"
import { CommandDetailDialog } from "./command-detail-dialog"


interface CommandHistory {
  id: number
  command_text: string
  tool: string
  args: Record<string, any>
  result: Record<string, any> | null
  status: "pending" | "processing" | "completed" | "error" | "failed"
  error_message: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

interface RecentCommandsProps {
  onNavigateToChat?: (commandId: number) => void
}

export function RecentCommands({ onNavigateToChat }: RecentCommandsProps = {}) {
  const [commands, setCommands] = useState<CommandHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCommand, setSelectedCommand] = useState<CommandHistory | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    fetchRecentCommands()
  }, [])

  const fetchRecentCommands = async () => {
    try {
      // API 클라이언트를 사용하여 user_id가 자동으로 추가되도록 수정
      const { apiClient } = await import("@/lib/api")
      // 더 많은 데이터를 조회한 후 프론트엔드에서 필터링
      const allData = await apiClient.getCommandHistory(50, 0)
      console.log('📊 Recent Commands 조회된 전체 데이터:', allData)
      
      // 프론트엔드에서 유저 메시지만 필터링하고 5개로 제한
      const userMessages = allData.filter(cmd => cmd.tool === "user_message").slice(0, 5)
      console.log('📊 필터링된 유저 메시지 (5개):', userMessages)
      setCommands(userMessages)
    } catch (error) {
      console.error("Failed to fetch command history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 text-xs">
            <CheckCircle className="mr-1 h-3 w-3" />
            Success
          </Badge>
        )
      case "processing":
      case "pending":
        return (
          <Badge className="bg-blue-500 text-xs">
            <Clock className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case "error":
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            <AlertCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
    }
  }

  const handleCommandClick = (command: CommandHistory) => {
    if (onNavigateToChat) {
      // 대화창으로 이동
      onNavigateToChat(command.id)
    } else {
      // 기존 동작: 상세 다이얼로그 표시
      setSelectedCommand(command)
      setDetailOpen(true)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Recent Commands
            </CardTitle>
            <CardDescription>Latest natural language command executions</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToChat?.(0)}
          >
            Start Chat
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Recent Commands
            </CardTitle>
            <CardDescription>Latest natural language command executions</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToChat?.(0)}
          >
            Start Chat
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {commands.length > 0 ? (
            commands.map((command) => (
              <div
                key={command.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleCommandClick(command)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Terminal className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-medium truncate">{command.command_text}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{command.tool}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(command.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {getStatusBadge(command.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCommandClick(command)
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No command history</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCommand && (
        <CommandDetailDialog
          command={selectedCommand}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </>
  )
}
