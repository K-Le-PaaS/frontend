"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"
import { CostAnalysisResponse } from "@/lib/types/nlp-response"
import { copyToClipboard } from "@/lib/utils/clipboard"
import { 
  NodeSpecSelectionRenderer, 
  ScalingSpecSelectionRenderer, 
  ScalingCountInputRenderer, 
  ScalingTypeSelectionRenderer,
  ScaleUpCountInputRenderer,
  ScaleOutSpecSelectionRenderer,
  ScaleOutCountInputRenderer,
  NetworkCostInputRenderer 
} from "./InteractiveCostRenderer"

interface CostAnalysisRendererProps {
  response: CostAnalysisResponse
  onCommandSubmit?: (command: string, args: any) => void
}

export function CostAnalysisRenderer({ response, onCommandSubmit }: CostAnalysisRendererProps) {
  const { data } = response

  console.log("CostAnalysisRenderer - response:", response)
  console.log("CostAnalysisRenderer - data:", data)
  console.log("CostAnalysisRenderer - data.interactive:", data.interactive)
  console.log("CostAnalysisRenderer - data.formatted?.interactive:", data.formatted?.interactive)

  // 인터랙티브 UI가 필요한 경우
  if (data.interactive || data.formatted?.interactive) {
    console.log("CostAnalysisRenderer - Interactive UI 분기")
    const handleTypeSelect = (type: string) => {
      if (onCommandSubmit) {
        if (type === "scale_up") {
          // 스케일업 선택 시 노드 스펙 선택으로 바로 이동
          onCommandSubmit("scale_up", {
            intent: "scale_up"
          })
        } else if (type === "scale_out") {
          // 스케일아웃 선택 시 개수 입력으로 바로 이동
          onCommandSubmit("scale_out", {
            intent: "scale_out"
          })
        }
      }
    }

    const handleScaleUpCountSubmit = (targetCount: number) => {
      if (onCommandSubmit) {
        onCommandSubmit("calculate_scale_up", {
          intent: "calculate_scale_up",
          target_node_count: targetCount,
          node_spec: "c4-g3" // 기본 스케일업 스펙
        })
      }
    }

    const handleScaleOutSpecSelect = (spec: string) => {
      if (onCommandSubmit) {
        onCommandSubmit("scale_out", {
          intent: "scale_out",
          node_spec: spec
        })
      }
    }

    const handleScaleOutCountSubmit = (targetCount: number) => {
      if (onCommandSubmit && data.formatted.node_spec) {
        onCommandSubmit("calculate_scale_out", {
          intent: "calculate_scale_out",
          node_spec: data.formatted.node_spec,
          target_node_count: targetCount
        })
      }
    }

    const handleSpecSelect = (spec: string) => {
      if (onCommandSubmit) {
        if (data.formatted.type === "node_spec_selection") {
          onCommandSubmit("calculate_current_cost", {
            intent: "calculate_current_cost",
            node_spec: spec,
            node_count: 1
          })
        } else if (data.formatted.type === "scaling_spec_selection") {
          onCommandSubmit("scaling_cost", {
            intent: "scaling_cost",
            node_spec: spec,
            current_node_count: data.formatted.current_count || 1
          })
        }
      }
    }

    const handleNetworkSubmit = (publicIpCount: number, trafficGb: number) => {
      if (onCommandSubmit) {
        onCommandSubmit("calculate_network_cost", {
          intent: "calculate_network_cost",
          public_ip_count: publicIpCount,
          traffic_gb: trafficGb
        })
      }
    }

    const handleScalingCountSubmit = (targetCount: number) => {
      if (onCommandSubmit && data.formatted?.node_spec) {
        onCommandSubmit("calculate_scaling_cost", {
          intent: "calculate_scaling_cost",
          node_spec: data.formatted.node_spec,
          target_node_count: targetCount,
          current_node_count: data.formatted.current_count || 1
        })
      }
    }

    const responseType = data.type || data.formatted?.type
    console.log("CostAnalysisRenderer - responseType:", responseType)

    switch (responseType) {
      case "node_spec_selection":
        return <NodeSpecSelectionRenderer response={response} onSpecSelect={handleSpecSelect} />
      case "scaling_type_selection":
        return <ScalingTypeSelectionRenderer response={response} onTypeSelect={handleTypeSelect} />
      case "scale_up_count_input":
        return <ScaleUpCountInputRenderer response={response} onCountSubmit={handleScaleUpCountSubmit} />
      case "scale_out_spec_selection":
        return <ScaleOutSpecSelectionRenderer 
          response={response} 
          onSpecSelect={handleScaleOutSpecSelect}
          available_specs={data.available_specs || data.formatted?.available_specs || []}
        />
      case "scale_out_count_input":
        return <ScaleOutCountInputRenderer response={response} onCountSubmit={handleScaleOutCountSubmit} />
      case "scale_up_spec_selection":
        return <NodeSpecSelectionRenderer
          response={response}
          onSpecSelect={(spec) => {
            if (onCommandSubmit) {
              onCommandSubmit("calculate_scale_up", {
                intent: "calculate_scale_up",
                node_spec: spec,
                target_node_count: 1
              })
            }
          }}
        />
      case "scaling_spec_selection":
        return <ScalingSpecSelectionRenderer 
          response={response} 
          onSpecSelect={handleSpecSelect}
          available_specs={data.available_specs || data.formatted?.available_specs || []}
        />
      case "scaling_count_input":
        return <ScalingCountInputRenderer response={response} onCountSubmit={handleScalingCountSubmit} />
      case "network_cost_input":
        return <NetworkCostInputRenderer response={response} onNetworkSubmit={handleNetworkSubmit} />
      default:
        // 알 수 없는 interactive 타입
        return (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">
              알 수 없는 인터랙티브 타입: {responseType}
            </p>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )
    }
  }

  // 기존 비용 분석 결과 렌더링
  const formatted = data.formatted || {}
  
  // 분석 타입에 따라 다른 비용 표시
  let monthly_cost = 0
  let additional_cost = 0
  let target_cost = 0
  let analysis_type = formatted.analysis_type || "unknown"
  
  if (analysis_type === "scaling_cost") {
    // 스케일링 비용의 경우 추가 비용을 주요 표시
    additional_cost = formatted.additional_cost || 0
    monthly_cost = formatted.current_cost || 0
    target_cost = formatted.target_cost || 0
  } else if (analysis_type === "current_cost") {
    // 현재 노드 비용
    monthly_cost = formatted.current_cost || 0
  } else if (analysis_type === "network_cost") {
    // 네트워크 비용
    monthly_cost = formatted.current_cost || 0
  } else {
    // 기본 비용 분석
    monthly_cost = formatted.current_cost || 0
  }
  
  const currency = "₩"
  const optimization_suggestions = formatted.optimizations?.length || 0
  
  // 비용 세부 내역 계산
  let cost_breakdown = {
    compute: monthly_cost * 0.6,
    storage: monthly_cost * 0.2,
    network: monthly_cost * 0.2
  }
  
  // 스케일링 비용의 경우 실제 비용 구조 사용
  if (analysis_type === "scaling_cost" && formatted.costs) {
    cost_breakdown = {
      compute: (formatted.costs.current_monthly || 0) * 0.6,
      storage: (formatted.costs.current_monthly || 0) * 0.2,
      network: (formatted.costs.current_monthly || 0) * 0.2
    }
  }


  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'KRW' || currency === '₩') {
      return `₩${amount.toLocaleString()}`
    }
    return `${currency}${amount.toLocaleString()}`
  }

  const getCostStatus = (cost: number) => {
    if (cost === 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">무료</Badge>
    } else if (cost < 100) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">저비용</Badge>
    } else if (cost < 1000) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">중간비용</Badge>
    } else {
      return <Badge variant="destructive">고비용</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              비용 분석
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
        {/* 총 비용 */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              {analysis_type === "scaling_cost" ? "추가 월 비용" : "월 예상 비용"}
            </h3>
            {getCostStatus(analysis_type === "scaling_cost" ? additional_cost : monthly_cost)}
          </div>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(analysis_type === "scaling_cost" ? additional_cost : monthly_cost, currency)}
          </div>
          
          {/* 스케일링 비용의 경우 상세 정보 표시 */}
          {analysis_type === "scaling_cost" && (
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>현재 월 비용:</span>
                <span className="font-medium">{formatCurrency(monthly_cost, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>목표 월 비용:</span>
                <span className="font-medium">{formatCurrency(target_cost, currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">추가 비용:</span>
                <span className="font-bold text-primary">{formatCurrency(additional_cost, currency)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 비용 세부 내역 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">비용 세부 내역</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium">컴퓨팅</span>
              </div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(cost_breakdown.compute, currency)}
              </div>
              {analysis_type === "scaling_cost" && (
                <div className="text-xs text-blue-500 mt-1">
                  노드 비용 포함
                </div>
              )}
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium">스토리지</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(cost_breakdown.storage, currency)}
              </div>
              {analysis_type === "scaling_cost" && (
                <div className="text-xs text-green-500 mt-1">
                  디스크 비용 포함
                </div>
              )}
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="font-medium">네트워크</span>
              </div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(cost_breakdown.network, currency)}
              </div>
              {analysis_type === "scaling_cost" && (
                <div className="text-xs text-purple-500 mt-1">
                  트래픽 비용 포함
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 최적화 제안 */}
        {optimization_suggestions > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">최적화 제안</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {optimization_suggestions}개의 비용 최적화 제안이 있습니다.
            </p>
          </div>
        )}

        {optimization_suggestions === 0 && monthly_cost > 0 && (
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">최적화 완료</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              현재 비용이 최적화되어 있습니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
