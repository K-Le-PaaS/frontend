"use client"

import React from "react"
import { NLPResponse } from "@/lib/types/nlp-response"

// 개별 렌더러들 import
import { PodListRenderer } from "./PodListRenderer"
import { RollbackListRenderer } from "./RollbackListRenderer"
import { StatusRenderer } from "./StatusRenderer"
import { ServiceListRenderer } from "./ServiceListRenderer"
import { DeploymentListRenderer } from "./DeploymentListRenderer"
import { IngressListRenderer } from "./IngressListRenderer"
import { NamespaceListRenderer } from "./NamespaceListRenderer"
import { LogsRenderer } from "./LogsRenderer"
import { OverviewRenderer } from "./OverviewRenderer"
import { CostAnalysisRenderer } from "./CostAnalysisRenderer"
// import { ServiceDetailRenderer } from "./ServiceDetailRenderer"
// import { DeploymentDetailRenderer } from "./DeploymentDetailRenderer"
// import { OverviewRenderer } from "./OverviewRenderer"
// import { EndpointRenderer } from "./EndpointRenderer"
// import { ScaleRenderer } from "./ScaleRenderer"
// import { DeployRenderer } from "./DeployRenderer"
// import { RestartRenderer } from "./RestartRenderer"
// import { CostAnalysisRenderer } from "./CostAnalysisRenderer"
// import { ErrorRenderer } from "./ErrorRenderer"
// import { UnknownRenderer } from "./UnknownRenderer"

interface NLPResponseRendererProps {
  response: NLPResponse
  onRollbackClick?: (version: any) => void
}

export function NLPResponseRenderer({ response, onRollbackClick }: NLPResponseRendererProps) {
  // 에러 응답 처리
  if (response.type === 'error') {
    return (
      <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <span className="font-medium">오류 발생</span>
        </div>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
          {response.summary}
        </p>
        {response.data.formatted.error && (
          <details className="mt-2">
            <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
              상세 오류 정보
            </summary>
            <pre className="text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded mt-1 overflow-x-auto">
              {response.data.formatted.error}
            </pre>
          </details>
        )}
      </div>
    )
  }

  // 알 수 없는 응답 처리
  if (response.type === 'unknown') {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <span className="font-medium">알 수 없는 응답</span>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          {response.summary}
        </p>
        <details className="mt-2">
          <summary className="text-xs text-yellow-600 dark:text-yellow-400 cursor-pointer">
            원본 데이터
          </summary>
          <pre className="text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(response.data.formatted, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  // 타입별 렌더러 분기
  switch (response.type) {
    case 'list_pods':
      return <PodListRenderer response={response} />
    
    case 'list_rollback':
      return <RollbackListRenderer response={response} onRollbackClick={onRollbackClick} />
    
    case 'status':
      return <StatusRenderer response={response} />
    
    case 'list_services':
      return <ServiceListRenderer response={response} />
    
    case 'list_deployments':
      return <DeploymentListRenderer response={response} />
    
    case 'list_ingresses':
      return <IngressListRenderer response={response} />
    
    case 'list_namespaces':
      return <NamespaceListRenderer response={response} />
    
    case 'logs':
      return <LogsRenderer response={response} />
    
    case 'overview':
      return <OverviewRenderer response={response} />
    
    case 'cost_analysis':
      return <CostAnalysisRenderer response={response} />
    
    // case 'get_service':
    //   return <ServiceDetailRenderer response={response} />
    
    // case 'get_deployment':
    //   return <DeploymentDetailRenderer response={response} />
    
    // case 'overview':
    //   return <OverviewRenderer response={response} />
    
    // case 'endpoint':
    //   return <EndpointRenderer response={response} />
    
    // case 'scale':
    //   return <ScaleRenderer response={response} />
    
    // case 'deploy':
    //   return <DeployRenderer response={response} />
    
    // case 'restart':
    //   return <RestartRenderer response={response} />
    
    // case 'cost_analysis':
    //   return <CostAnalysisRenderer response={response} />
    
    default:
      // 기본 JSON 렌더링 (임시)
      return (
        <div className="p-4 border border-gray-200 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 mb-2">
            <span className="font-medium">{response.type}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {response.summary}
          </p>
          <details>
            <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              상세 데이터
            </summary>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900/30 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(response.data.formatted, null, 2)}
            </pre>
          </details>
        </div>
      )
  }
}
