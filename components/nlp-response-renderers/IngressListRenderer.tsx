"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Globe, ExternalLink } from "lucide-react"

interface IngressInfo {
  name: string
  class: string
  hosts: string
  address: string
  ports: string
  age: string
  namespace: string
}

interface IngressListResponse {
  type: 'list_ingresses'
  message: string
  data: {
    namespace: string
    total_ingresses: number
    ingresses: IngressInfo[]
  }
}

interface IngressListRendererProps {
  response: IngressListResponse
}

export function IngressListRenderer({ response }: IngressListRendererProps) {
  const { data, metadata } = response
  const ingresses = data.formatted as IngressInfo[]
  const namespace = metadata?.namespace || "default"
  const total_ingresses = ingresses.length

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getIngressClassBadge = (ingressClass: string) => {
    switch (ingressClass.toLowerCase()) {
      case 'nginx':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Nginx</Badge>
      case 'traefik':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Traefik</Badge>
      case 'istio':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Istio</Badge>
      default:
        return <Badge variant="outline">{ingressClass}</Badge>
    }
  }

  const getAddressDisplay = (address: string) => {
    if (!address || address === '<none>' || address === '') {
      return <span className="text-muted-foreground">-</span>
    }
    return (
      <div className="flex items-center gap-1">
        <span>{address}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(address)}
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Ingress 목록
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
        
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline">네임스페이스: {namespace}</Badge>
          <Badge variant="default">총 {total_ingresses}개</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {total_ingresses === 0 ? (
          <p className="text-muted-foreground">현재 실행 중인 Ingress가 없습니다.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>클래스</TableHead>
                <TableHead>호스트</TableHead>
                <TableHead>주소</TableHead>
                <TableHead>포트</TableHead>
                <TableHead>경과 시간</TableHead>
                <TableHead>네임스페이스</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingresses.map((ingress, index) => (
                <TableRow key={`${ingress.name}-${ingress.namespace}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {ingress.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(ingress.name)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getIngressClassBadge(ingress.class)}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {Array.isArray(ingress.hosts) 
                        ? ingress.hosts.join(', ') 
                        : ingress.hosts}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getAddressDisplay(ingress.address)}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {typeof ingress.ports === 'object' 
                        ? JSON.stringify(ingress.ports) 
                        : ingress.ports}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {ingress.age}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {ingress.namespace}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
