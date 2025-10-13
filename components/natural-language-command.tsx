"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Terminal, Clock, CheckCircle, AlertCircle, Lightbulb } from "lucide-react"
import { apiClient } from "@/lib/api"

interface CommandHistory {
  id: number
  command_text: string
  tool: string
  args: Record<string, any>
  result?: Record<string, any>
  status: "pending" | "success" | "error"
  error_message?: string
  user_id?: string
  created_at: string
  updated_at: string
}

const suggestedCommands = [
  "Deploy frontend app to production",
  "Scale backend service to 3 replicas",
  "Create new namespace for staging",
  "Update database configuration",
  "Rollback api-service to previous version",
  "Show cluster resource usage",
]

export function NaturalLanguageCommand() {
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<CommandHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load command history on component mount
  useEffect(() => {
    loadCommandHistory()
  }, [])

  const loadCommandHistory = async () => {
    try {
      const historyData = await apiClient.getCommandHistory(20, 0)
      setHistory(historyData)
    } catch (err) {
      console.error('Failed to load command history:', err)
      setError('Failed to load command history')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || loading) return

    setLoading(true)
    setError(null)

    try {
      // Execute command via API
      const response = await apiClient.runCommand({ text: command.trim() })
      
      // Reload history to get the latest command
      await loadCommandHistory()
      
      setCommand("")
    } catch (err: any) {
      console.error('Command execution failed:', err)
      setError(err.message || 'Command execution failed')
      
      // Reload history to show the failed command
      await loadCommandHistory()
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedCommand = (suggestedCommand: string) => {
    setCommand(suggestedCommand)
  }

  const getStatusIcon = (status: CommandHistory["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: CommandHistory["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            Processing
          </Badge>
        )
      case "success":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const formatResult = (result: Record<string, any> | undefined, errorMessage?: string) => {
    if (errorMessage) {
      return errorMessage
    }
    if (result) {
      return JSON.stringify(result, null, 2)
    }
    return "No result available"
  }

  return (
    <div className="space-y-6">
      {/* Command Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Terminal className="w-5 h-5" />
            <span>Natural Language Commands</span>
          </CardTitle>
          <CardDescription>
            Describe what you want to do in plain English, and we'll execute the appropriate Kubernetes operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g., Deploy my frontend app to production cluster..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={!command.trim() || loading}>
              {loading ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>Suggested Commands</span>
          </CardTitle>
          <CardDescription>Try these common operations to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedCommands.map((suggestedCommand, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start text-left h-auto p-3 bg-transparent"
                onClick={() => handleSuggestedCommand(suggestedCommand)}
              >
                <span className="text-sm">{suggestedCommand}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle>Command History</CardTitle>
          <CardDescription>Recent natural language commands and their results</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No commands executed yet. Try running a command above!
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className="font-medium text-sm">{item.command_text}</span>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tool: {item.tool} | Args: {JSON.stringify(item.args)}
                    </div>
                    {(item.result || item.error_message) && (
                      <div className="text-sm text-muted-foreground bg-muted p-2 rounded font-mono text-xs">
                        <pre>{formatResult(item.result, item.error_message)}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
