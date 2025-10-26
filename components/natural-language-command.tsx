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
  metadata?: Record<string, any>
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
  scrollToMessageId?: number
  onScrollComplete?: () => void
}

export function NaturalLanguageCommand({ onNavigateToPipelines, scrollToMessageId, onScrollComplete }: NaturalLanguageCommandProps = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isScrollingToMessage, setIsScrollingToMessage] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 스크롤을 맨 아래로 이동하는 함수 (다중 방법 시도)
  const scrollToBottom = () => {
    console.log('🔄 스크롤 시도 중...')
    
    if (scrollAreaRef.current) {
      // ScrollArea의 viewport 요소 찾기
      const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
      
      if (viewport) {
        console.log('📏 viewport 높이:', viewport.scrollHeight, '현재 스크롤:', viewport.scrollTop)
        
        // 방법 1: scrollTop 직접 설정
        viewport.scrollTop = viewport.scrollHeight
        
        // 방법 2: scrollTo 사용
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
        
        // 방법 3: 마지막 메시지로 scrollIntoView
        const lastMessage = viewport.querySelector('[data-message]:last-child') as HTMLElement
        if (lastMessage) {
          console.log('🎯 마지막 메시지로 scrollIntoView 시도')
          lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
        
        // 방법 4: 강제 스타일 변경
        viewport.style.scrollBehavior = 'auto'
        viewport.scrollTop = viewport.scrollHeight
        viewport.style.scrollBehavior = 'smooth'
        
        // 방법 5: DOM 조작으로 강제 스크롤
        const scrollContainer = viewport.parentElement
        if (scrollContainer) {
          console.log('🔧 부모 컨테이너 조작 시도')
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
        
        // 방법 6: 전체 페이지 스크롤도 시도
        setTimeout(() => {
          console.log('🌐 전체 페이지 스크롤 시도')
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        }, 50)
        
        // 추가 확인
        setTimeout(() => {
          console.log('✅ 스크롤 후 위치:', viewport.scrollTop)
        }, 100)
      } else {
        console.log('❌ viewport를 찾을 수 없음')
      }
    } else {
      console.log('❌ scrollAreaRef가 없음')
    }
  }

  // 특정 메시지로 스크롤하는 함수 (ScrollArea 최적화)
  const scrollToMessage = (messageId: string) => {
    console.log('🎯 특정 메시지로 스크롤 시도:', messageId)
    
    if (!scrollAreaRef.current) {
      console.log('❌ scrollAreaRef가 없음')
      return
    }

    // ScrollArea의 viewport 요소 찾기
    const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
    
    if (viewport) {
      console.log('📏 viewport 찾음, 메시지 요소 검색 중...')
      
      // 특정 메시지 요소 찾기
      const messageElement = viewport.querySelector(`[data-message="${messageId}"]`)
      
      if (messageElement) {
        console.log('✅ 메시지 요소 찾음, 스크롤 시도')
        // 메시지 요소로 스크롤
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // 추가로 viewport 직접 조작도 시도
        setTimeout(() => {
          const elementRect = messageElement.getBoundingClientRect()
          const viewportRect = viewport.getBoundingClientRect()
          const scrollTop = viewport.scrollTop + (elementRect.top - viewportRect.top) - (viewportRect.height / 2)
          
          viewport.scrollTo({ top: scrollTop, behavior: 'smooth' })
          console.log('📍 viewport 직접 스크롤 완료')
        }, 100)
      } else {
        console.log('❌ 메시지 요소를 찾을 수 없음:', messageId)
        // 모든 메시지 요소 확인
        const allMessages = viewport.querySelectorAll('[data-message]')
        console.log('📋 사용 가능한 메시지 ID들:', Array.from(allMessages).map(el => el.getAttribute('data-message')))
      }
    } else {
      console.log('❌ viewport를 찾을 수 없음')
    }
  }

  // 자동 스크롤 - 새로운 메시지가 추가될 때만 맨 아래로 스크롤 (히스토리 클릭 시 완전 차단)
  useEffect(() => {
    if (messages.length > 0 && !scrollToMessageId && !isScrollingToMessage) {
      // scrollToMessageId가 없고, 히스토리 클릭 중이 아닐 때만 자동 스크롤
      // 히스토리 클릭 시에는 자동 스크롤을 완전히 비활성화
      // 새로운 메시지가 추가될 때만 자동 스크롤을 활성화
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [messages, scrollToMessageId, isScrollingToMessage])

  // 특정 메시지로 스크롤 (대시보드에서 명령어 클릭 시)
  useEffect(() => {
    if (scrollToMessageId && messages.length > 0) {
      console.log('🎯 scrollToMessageId 처리:', scrollToMessageId)
      console.log('📊 현재 메시지 수:', messages.length)
      
      // 히스토리 클릭 시 스크롤 상태 설정
      setIsScrollingToMessage(true)
      
      // 메시지가 로드된 후 특정 메시지로 스크롤
      setTimeout(() => {
        // 사용자 메시지 ID 찾기
        const userMessageId = `history-${scrollToMessageId}`
        console.log('🔍 찾는 사용자 메시지 ID:', userMessageId)
        
        // 해당 사용자 메시지 다음의 AI 응답 메시지 찾기
        const userMessageIndex = messages.findIndex(msg => msg.id === userMessageId)
        console.log('📍 사용자 메시지 인덱스:', userMessageIndex)
        
        if (userMessageIndex !== -1 && userMessageIndex + 1 < messages.length) {
          // 다음 메시지가 AI 응답인 경우 해당 메시지로 스크롤
          const aiResponseMessage = messages[userMessageIndex + 1]
          console.log('🤖 AI 응답 메시지:', aiResponseMessage.id, aiResponseMessage.role)
          
          if (aiResponseMessage.role === 'assistant') {
            console.log('✅ AI 응답으로 스크롤')
            scrollToMessage(aiResponseMessage.id)
          } else {
            // AI 응답이 없으면 사용자 메시지로 스크롤
            console.log('⚠️ AI 응답이 아님, 사용자 메시지로 스크롤')
            scrollToMessage(userMessageId)
          }
        } else {
          // AI 응답이 없으면 사용자 메시지로 스크롤
          console.log('⚠️ AI 응답 없음, 사용자 메시지로 스크롤')
          scrollToMessage(userMessageId)
        }
        
        // 스크롤 완료 후 상태 초기화 및 콜백 호출
        // 히스토리 클릭 시에는 자동 스크롤을 비활성화 상태로 유지
        setTimeout(() => {
          // 히스토리 클릭 시에는 자동 스크롤을 비활성화 상태로 유지
          // 새로운 메시지가 추가될 때만 자동 스크롤을 활성화
          if (onScrollComplete) {
            onScrollComplete()
          }
        }, 1000) // 스크롤 완료 후 콜백 호출
      }, 500) // 더 긴 지연 시간으로 DOM 업데이트 완료 대기
    }
  }, [scrollToMessageId, messages, onScrollComplete])

  // 컴포넌트 마운트 시 스크롤 초기화 (히스토리 클릭 시 완전 차단)
  useEffect(() => {
    if (!scrollToMessageId && !isScrollingToMessage) {
      console.log('🚀 컴포넌트 마운트됨, 스크롤 시작')
      
      // 여러 번 시도하여 확실하게 스크롤
      setTimeout(() => {
        console.log('⏰ 200ms 후 스크롤 시도')
        scrollToBottom()
      }, 200)
      
      setTimeout(() => {
        console.log('⏰ 500ms 후 스크롤 시도')
        scrollToBottom()
      }, 500)
      
      setTimeout(() => {
        console.log('⏰ 1000ms 후 스크롤 시도')
        scrollToBottom()
      }, 1000)
    } else {
      console.log('🚀 컴포넌트 마운트됨, 하지만 scrollToMessageId가 있거나 히스토리 클릭 중이므로 자동 스크롤 건너뜀')
    }
  }, [scrollToMessageId, isScrollingToMessage])

  // 세션 초기화 및 대화 히스토리 로드
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // DB에서 직접 명령어 히스토리 조회 (Redis 세션 조회 제거)
        console.log('🔍 DB에서 명령어 히스토리 조회 중...')
        const commandHistory = await apiClient.getConversationHistory(50, 0)
        console.log('📊 조회된 명령어 히스토리:', commandHistory)
        
        if (commandHistory && commandHistory.length > 0) {
          // command_history를 메시지로 변환
          const historyMessages: Message[] = commandHistory.map((cmd: any) => ({
            id: `history-${cmd.id}`,
            role: cmd.tool === "user_message" ? "user" : "assistant",
            content: cmd.command_text,
            timestamp: new Date(cmd.created_at),
            status: "sent" as const,
            result: cmd.result,
          }))
          
          console.log('✅ 변환된 메시지들:', historyMessages)
          setMessages(historyMessages)
          
          // 대화 히스토리 로딩 후 스크롤을 맨 아래로 이동 (히스토리 클릭 시 완전 차단)
          if (!scrollToMessageId && !isScrollingToMessage) {
            setTimeout(() => {
              console.log('📜 히스토리 로드 후 스크롤 시도')
              scrollToBottom()
            }, 100)
            
            setTimeout(() => {
              console.log('📜 히스토리 로드 후 추가 스크롤 시도')
              scrollToBottom()
            }, 300)
            
            setTimeout(() => {
              console.log('📜 히스토리 로드 후 최종 스크롤 시도')
              scrollToBottom()
            }, 600)
          } else {
            console.log('📜 히스토리 로드됨, 하지만 scrollToMessageId가 있거나 히스토리 클릭 중이므로 자동 스크롤 건너뜀')
          }
        } else {
          console.log('⚠️ 명령어 히스토리가 비어있음 - 환영 메시지 표시')
          // 명령어 히스토리가 없으면 환영 메시지 표시
          setMessages([
            {
              id: "welcome",
              role: "system",
              content: "안녕하세요! K-Le-PaaS AI 어시스턴트입니다. 🚀\n\nKubernetes 리소스 관리, 배포, 롤백을 자연어로 도와드릴게요. 💬\n\n무엇을 도와드릴까요?",
              timestamp: new Date(),
            },
          ])
        }
        
        // 새로운 대화를 위해 세션 ID 초기화
        setSessionId(null)
      } catch (error) {
        console.error("❌ 대화 히스토리 로드 실패:", error)
        console.error("🔍 에러 상세:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown'
        })
        // 에러 시 환영 메시지 표시
        setMessages([
          {
            id: "welcome",
            role: "system",
            content: "안녕하세요! K-Le-PaaS AI 어시스턴트입니다. 🚀\n\nKubernetes 리소스 관리, 배포, 롤백을 자연어로 도와드릴게요. 💬\n\n무엇을 도와드릴까요?",
            timestamp: new Date(),
          },
        ])
      }
    }

    initializeChat()
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
    
    // 새로운 메시지 추가 시 자동 스크롤 활성화
    setIsScrollingToMessage(false)

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
          <div className="bg-muted/50 px-4 py-3 rounded-lg text-sm text-muted-foreground max-w-md text-center border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span className="font-medium text-foreground">K-Le-PaaS AI</span>
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            </div>
            <div className="space-y-1">
              <p className="text-foreground">안녕하세요! 🚀</p>
              <p className="text-xs text-muted-foreground">Kubernetes 리소스 관리, 배포, 롤백을 자연어로 도와드릴게요.</p>
              <p className="text-xs text-primary">💬 무엇을 도와드릴까요?</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={message.id}
        data-message={message.id}
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
            <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br/>') }}></p>

            {/* 비용 정보 표시 (스케일링 명령 제외) */}
            {message.cost_estimate && message.pending_action?.type !== "scale" && renderCostEstimate(message.cost_estimate)}

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

            {/* 실행 결과 (AI 응답에만) */}
            {(message.result || message.metadata?.result) && message.role === "assistant" && (
              <div className="mt-4">
                <NLPResponseRenderer 
                  response={(message.result || message.metadata?.result) as NLPResponse}
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
            <span>AI Assistance</span>
          </CardTitle>
          <CardDescription>
            Kubernetes 리소스 관리, 배포, 롤백을 자연어로 실행하세요
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

          {/* 추천 명령어 - 항상 표시 */}
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
