"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Server, ExternalLink } from "lucide-react"

interface ServiceInfo {
  name: string
  type: string
  cluster_ip: string
  external_ip: string
  ports: string
  age: string
  namespace: string
}

interface ServiceListResponse {
  type: 'list_services'
  message: string
  data: {
    namespace: string
    total_services: number
    services: ServiceInfo[]
  }
}

interface ServiceListRendererProps {
  response: ServiceListResponse
}

export function ServiceListRenderer({ response }: ServiceListRendererProps) {
  const { data, metadata } = response
  const services = data.formatted as ServiceInfo[]
  const namespace = metadata?.namespace || "default"
  const total_services = services.length

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getServiceTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clusterip':
        return <Badge variant="default">ClusterIP</Badge>
      case 'nodeport':
        return <Badge variant="secondary">NodePort</Badge>
      case 'loadbalancer':
        return <Badge variant="outline">LoadBalancer</Badge>
      case 'externalname':
        return <Badge variant="destructive">ExternalName</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getExternalIPDisplay = (externalIP: string) => {
    if (!externalIP || externalIP === '<none>' || externalIP === '') {
      return <span className="text-muted-foreground">-</span>
    }
    return (
      <div className="flex items-center gap-1">
        <span>{externalIP}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(externalIP)}
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
              <Server className="w-5 h-5" />
              Service 목록
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
          <Badge variant="default">총 {total_services}개</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {total_services === 0 ? (
          <p className="text-muted-foreground">현재 실행 중인 Service가 없습니다.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>타입</TableHead>
                <TableHead>Cluster IP</TableHead>
                <TableHead>External IP</TableHead>
                <TableHead>포트</TableHead>
                <TableHead>경과 시간</TableHead>
                <TableHead>네임스페이스</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={`${service.name}-${service.namespace}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {service.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(service.name)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getServiceTypeBadge(service.type)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {service.cluster_ip}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(service.cluster_ip)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getExternalIPDisplay(service.external_ip)}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {typeof service.ports === 'object' 
                        ? JSON.stringify(service.ports) 
                        : service.ports}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {service.age}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {service.namespace}
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
