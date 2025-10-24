"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Send,
  Terminal,
  Bot,
  User,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"
import { NLPResponseRenderer } from "./nlp-response-renderers"
import { NLPResponse } from "@/lib/types/nlp-response"

// 메시지 타입 정의
interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  status?: "sending" | "sent" | "error"
  cost_estimate?: CostEstimate
  pending_action?: PendingAction
  result?: Record<string, any>
}

interface CostEstimate {
  current_cost?: number
  estimated_cost?: number
  savings?: number
  breakdown?: Record<string, number>
  currency?: string
  period?: string
}

interface PendingAction {
  type: string
  parsed_intent: string
  parameters: Record<string, any>
  estimated_cost?: CostEstimate
  risk_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}

const suggestedCommands = [
  "모든 pod 목록 보여줘",
  "현재 클러스터의 비용 분석해줘",
  "사용하지 않는 리소스 찾아줘",
  "nginx deployment 스케일 3개로 늘려줘",
]

interface NaturalLanguageCommandProps {
  onNavigateToPipelines?: () => void
}

export function NaturalLanguageCommand({ onNavigateToPipelines }: NaturalLanguageCommandProps = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 자동 스크롤
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // 세션 초기화 메시지
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "system",
        content: "안녕하세요! K-Le-PaaS AI 어시스턴트입니다. 클러스터 관리, 비용 분석 등을 도와드릴게요. 무엇을 도와드릴까요?",
        timestamp: new Date(),
      },
    ])
  }, [])

  const formatCurrency = (amount: number, currency: string = "KRW") => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case "CRITICAL":
      case "HIGH":
        return "text-red-600"
      case "MEDIUM":
        return "text-yellow-600"
      case "LOW":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || loading) return

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
      status: "sending",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Conversation API 호출
      const response = await apiClient.sendConversationMessage({
        command: text,
        session_id: sessionId || undefined,
        timestamp: new Date().toISOString(),
      })

      // 세션 ID 저장
      if (!sessionId && response.session_id) {
        setSessionId(response.session_id)
      }

      // 사용자 메시지 상태 업데이트
      setMessages((prev) =>
        prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: "sent" } : msg)),
      )

      // 확인이 필요한 경우
      if (response.requires_confirmation && response.pending_action) {
        const confirmMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
          pending_action: response.pending_action,
          cost_estimate: response.cost_estimate,
        }
        setMessages((prev) => [...prev, confirmMessage])
      } else {
        // 일반 응답
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.message || "작업을 완료했습니다.",
          timestamp: new Date(),
          result: response.result,
          cost_estimate: response.cost_estimate,
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (err: any) {
      console.error("Conversation API failed:", err)

      // 에러 메시지 추가
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `죄송합니다. 오류가 발생했습니다: ${err.message || "알 수 없는 오류"}`,
        timestamp: new Date(),
        status: "error",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleConfirmAction = async (confirmed: boolean, messageId: string) => {
    if (!sessionId) return

    setLoading(true)

    try {
      const response = await apiClient.confirmAction({
        session_id: sessionId,
        confirmed,
      })

      // 확인 결과 메시지 추가
      const resultMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: confirmed
          ? response.message || "작업을 실행했습니다."
          : "작업을 취소했습니다.",
        timestamp: new Date(),
        result: confirmed ? response.result : undefined,
      }

      setMessages((prev) => [...prev, resultMessage])

      // 확인 버튼이 있던 메시지에서 pending_action 제거
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, pending_action: undefined } : msg,
        ),
      )
    } catch (err: any) {
      console.error("Failed to confirm action:", err)

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `확인 처리 중 오류가 발생했습니다: ${err.message}`,
        timestamp: new Date(),
        status: "error",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const renderCostEstimate = (estimate: CostEstimate) => {
    return (
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">비용 정보</span>
        </div>
        <div className="space-y-1 text-sm">
          {estimate.current_cost !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">현재 비용:</span>
              <span className="font-medium">
                {formatCurrency(estimate.current_cost, estimate.currency)}
              </span>
            </div>
          )}
          {estimate.estimated_cost !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">예상 비용:</span>
              <span className="font-medium">
                {formatCurrency(estimate.estimated_cost, estimate.currency)}
              </span>
            </div>
          )}
          {estimate.savings !== undefined && estimate.savings > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                예상 절감액:
              </span>
              <span>{formatCurrency(estimate.savings, estimate.currency)}</span>
            </div>
          )}
          {estimate.period && (
            <div className="text-xs text-muted-foreground pt-1 border-t mt-1">
              기간: {estimate.period}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user"
    const isSystem = message.role === "system"

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <div className="bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground max-w-md text-center">
            {message.content}
          </div>
        </div>
      )
    }

    return (
      <div
        key={message.id}
        className={cn("flex gap-3 mb-4", isUser ? "justify-end" : "justify-start")}
      >
        {!isUser && (
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start", "max-w-[70%]")}>
          <div
            className={cn(
              "px-4 py-2 rounded-lg",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

            {message.cost_estimate && renderCostEstimate(message.cost_estimate)}

            {/* 확인이 필요한 작업 */}
            {message.pending_action && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">작업 확인 필요</span>
                  <Badge
                    variant={
                      message.pending_action.risk_level === "HIGH" ||
                      message.pending_action.risk_level === "CRITICAL"
                        ? "destructive"
                        : "default"
                    }
                    className="ml-auto"
                  >
                    {message.pending_action.risk_level}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleConfirmAction(true, message.id)}
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    확인
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfirmAction(false, message.id)}
                    disabled={loading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    취소
                  </Button>
                </div>
              </div>
            )}

            {/* 실행 결과 */}
            {message.result && (
              <div className="mt-4">
                <NLPResponseRenderer 
                  response={message.result as NLPResponse}
                  onRollbackClick={(version) => {
                    // 롤백 버튼 클릭 시 커밋 해시 기반 자연어 명령 자동 입력
                    const rollbackCommand = `${version.commit}로 롤백해줘`
                    setInput(rollbackCommand)
                    inputRef.current?.focus()
                  }}
                  onNavigateToPipelines={onNavigateToPipelines}
                />
              </div>
            )}
          </div>

          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {isUser && (
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-muted">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center space-x-2">
            <Terminal className="w-5 h-5" />
            <span>AI 어시스턴트</span>
          </CardTitle>
          <CardDescription>
            자연어로 클러스터를 관리하고 비용을 분석하세요
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* 메시지 영역 */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => renderMessage(message))}
              {loading && (
                <div className="flex gap-3 mb-4">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted px-4 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 추천 명령어 */}
          {messages.length === 1 && (
            <div className="p-4 border-t bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">추천 명령어:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedCommands.map((cmd, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(cmd)}
                    disabled={loading}
                  >
                    {cmd}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 입력 영역 */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="메시지를 입력하세요..."
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
