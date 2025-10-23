"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Server, Activity, CheckCircle, AlertTriangle } from "lucide-react"
import { OverviewResponse } from "@/lib/types/nlp-response"

interface OverviewRendererProps {
  response: OverviewResponse
}

export function OverviewRenderer({ response }: OverviewRendererProps) {
  const { data } = response
  const formatted = data.formatted || {}
  const cluster_info = {
    name: "K-Le-PaaS Cluster",
    version: "1.28.0",
    nodes: 3
  }
  const resources = {
    pods: formatted.pods?.length || 0,
    services: formatted.services?.length || 0,
    deployments: formatted.deployments?.length || 0,
    namespaces: 1
  }
  const health_status = "healthy"

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getHealthStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Healthy
            </Badge>
          </div>
        )
      case 'warning':
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Warning
            </Badge>
          </div>
        )
      case 'error':
      case 'critical':
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <Badge variant="destructive">
              Error
            </Badge>
          </div>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              클러스터 개요
            </CardTitle>
            <CardDescription>
              {response.message}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
          >
            <Copy className="w-4 h-4 mr-2" />
            복사
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 클러스터 정보 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">클러스터 정보</h3>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">클러스터 이름</span>
                <p className="font-medium">{cluster_info.name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">버전</span>
                <p className="font-medium">{cluster_info.version}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">노드 수</span>
                <p className="font-medium">{cluster_info.nodes}개</p>
              </div>
            </div>
          </div>
        </div>

        {/* 리소스 현황 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">리소스 현황</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Pods</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {resources.pods}
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-green-600" />
                <span className="font-medium">Services</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {resources.services}
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Deployments</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {resources.deployments}
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-orange-600" />
                <span className="font-medium">Namespaces</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {resources.namespaces}
              </div>
            </div>
          </div>
        </div>

        {/* 건강 상태 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">클러스터 건강 상태</h3>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">현재 상태</span>
              {getHealthStatusBadge(health_status)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
