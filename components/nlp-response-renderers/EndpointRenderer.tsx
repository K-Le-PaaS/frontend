"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, Globe, Server, Container } from "lucide-react"
import { NLPResponse } from "@/lib/types/nlp-response"
import { copyToClipboard } from "@/lib/utils/clipboard"

interface EndpointInfo {
  type: string
  address: string
  path?: string
  protocol?: string
}

interface EndpointData {
  original_name: string
  matched_service: string
  namespace: string
  ingress_name: string
  path: string
  endpoints: EndpointInfo[]
}

interface EndpointRendererProps {
  response: NLPResponse
}

export function EndpointRenderer({ response }: EndpointRendererProps) {
  const { data, metadata } = response
  const endpointData = data.formatted as EndpointData
  const namespace = (metadata as any)?.namespace || endpointData?.namespace || "default"

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getProtocolBadge = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
      case 'https':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">HTTPS</Badge>
      case 'http':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">HTTP</Badge>
      default:
        return <Badge variant="outline">{protocol || 'HTTP'}</Badge>
    }
  }

  const getEndpointIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'ingress':
        return <Globe className="w-4 h-4 text-blue-500" />
      case 'service':
        return <Server className="w-4 h-4 text-purple-500" />
      case 'pod':
        return <Container className="w-4 h-4 text-green-500" />
      default:
        return <ExternalLink className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          서비스 엔드포인트
        </CardTitle>
        <CardDescription>
          {endpointData?.original_name}의 접속 정보를 찾았습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 서비스 정보 */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">서비스 정보</span>
            <Badge variant="outline">{namespace}</Badge>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">원본 이름:</span>
              <span className="font-mono">{endpointData?.original_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">매칭된 서비스:</span>
              <span className="font-mono text-blue-600">{endpointData?.matched_service}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Ingress:</span>
              <span className="font-mono text-purple-600">{endpointData?.ingress_name}</span>
            </div>
          </div>
        </div>

        {/* 엔드포인트 목록 */}
        {endpointData?.endpoints && endpointData.endpoints.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">접속 가능한 엔드포인트</h4>
            {endpointData.endpoints.map((endpoint, index) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getEndpointIcon(endpoint.type)}
                    <span className="text-sm font-medium">{endpoint.type}</span>
                    {endpoint.protocol && getProtocolBadge(endpoint.protocol)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(endpoint.address)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInNewTab(endpoint.address)}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-blue-600 hover:text-blue-800 cursor-pointer underline">
                      {endpoint.address}
                    </span>
                  </div>
                  {endpoint.path && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">경로:</span>
                      <span className="text-xs font-mono">{endpoint.path}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">접속 가능한 엔드포인트가 없습니다</p>
          </div>
        )}

        {/* 추가 정보 */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">접속 방법</span>
          </div>
          <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <p>• 위의 링크를 클릭하여 서비스에 직접 접속할 수 있습니다</p>
            <p>• 복사 버튼을 클릭하여 URL을 클립보드에 복사할 수 있습니다</p>
            <p>• 외부 링크 버튼을 클릭하여 새 탭에서 열 수 있습니다</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
