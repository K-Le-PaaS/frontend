"use client"

import { useEffect, useRef, useState } from "react"

interface WebSocketMessage {
  type: string
  deployment_id?: string
  user_id?: string
  stage?: string
  status?: string
  data?: any
  timestamp?: string
}

interface UseDeploymentWebSocketProps {
  deploymentId?: number
  userId?: string
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
}

export function useDeploymentWebSocket({
  deploymentId,
  userId,
  onMessage,
  onError,
  onClose
}: UseDeploymentWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected")
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setConnectionStatus("connecting")
      
      // Determine WebSocket URL based on available parameters
      let wsUrl = ""
      if (deploymentId) {
        wsUrl = `ws://localhost:8000/api/v1/ws/deployments`
      } else if (userId) {
        wsUrl = `ws://localhost:8000/api/v1/ws/user/${userId}`
      } else {
        console.error("Either deploymentId or userId must be provided")
        setConnectionStatus("error")
        return
      }

      console.log("Connecting to WebSocket:", wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)
        setConnectionStatus("connected")
        reconnectAttempts.current = 0
        
        // 연결 후 즉시 ping 메시지 전송
        try {
          ws.send(JSON.stringify({ type: "ping" }))
        } catch (error) {
          console.error("Failed to send ping:", error)
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log("WebSocket message received:", message)
          
          if (onMessage) {
            onMessage(message)
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setConnectionStatus("error")
        if (onError) {
          onError(error)
        }
      }

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus("disconnected")
        
        if (onClose) {
          onClose(event)
        }

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error)
      setConnectionStatus("error")
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User initiated disconnect")
      wsRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus("disconnected")
  }

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket is not connected. Cannot send message.")
    }
  }

  // Auto-connect when component mounts or dependencies change
  useEffect(() => {
    if (deploymentId || userId) {
      connect()
    }

    return () => {
      // 연결 해제하지 않고 유지 (전역 연결)
      // disconnect()
    }
  }, [deploymentId, userId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage
  }
}
