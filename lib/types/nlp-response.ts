/**
 * NLP Response Types
 * 
 * 자연어 명령어 응답의 타입 정의입니다.
 * 백엔드 ResponseFormatter에서 생성하는 구조화된 응답과 일치합니다.
 */

export type NLPResponseType = 
  | 'list_pods' 
  | 'list_rollback' 
  | 'status' 
  | 'logs'
  | 'list_deployments'
  | 'list_services'
  | 'list_ingresses'
  | 'list_namespaces'
  | 'get_service'
  | 'get_deployment'
  | 'overview'
  | 'endpoint'
  | 'scale'
  | 'deploy'
  | 'deploy_github_repository'
  | 'restart'
  | 'cost_analysis'
  | 'rollback_execution'
  | 'unknown'
  | 'error'
  | 'command_error'

export interface FormattedResponse {
  type: NLPResponseType
  message: string
  summary: string
  data: {
    formatted: any
    raw?: any
  }
  metadata?: Record<string, any>
}

// Pod 관련 타입
export interface PodInfo {
  name: string
  status: string
  ready: string
  restarts: number
  age: string
  node: string
  namespace: string
}

export interface PodListMetadata {
  total: number
  namespace: string
  running: number
  pending: number
  failed: number
}

// 롤백 관련 타입
export interface RollbackVersion {
  steps_back: number
  commit: string
  message: string
  date: string
  can_rollback: boolean
  is_current?: boolean
}

export interface RollbackCurrent {
  commit: string
  message: string
  date: string
  is_rollback: boolean
  deployment_id?: number
}

export interface RollbackHistory {
  commit: string
  message: string
  date: string
  rollback_from_id?: number
}

export interface RollbackListData {
  current: RollbackCurrent
  versions: RollbackVersion[]
  history: RollbackHistory[]
}

export interface RollbackListMetadata {
  owner: string
  repo: string
  total_available: number
  total_rollbacks: number
}

// Service 관련 타입
export interface ServiceInfo {
  name: string
  namespace: string
  type: string
  cluster_ip: string
  external_ip: string
  ports: string
  age: string
}

export interface ServiceEndpoint {
  type: string
  address: string
  port: string
  protocol: string
}

export interface ServiceEndpointsData {
  service_name: string
  namespace: string
  endpoints: ServiceEndpoint[]
}

// Deployment 관련 타입
export interface DeploymentInfo {
  name: string
  namespace: string
  replicas: string
  ready: string
  up_to_date: string
  available: string
  age: string
  image: string
}

// Ingress 관련 타입
export interface IngressInfo {
  name: string
  namespace: string
  class: string
  hosts: string[]
  address: string
  ports: string | object
  age: string
}

// Namespace 관련 타입
export interface NamespaceInfo {
  name: string
  status: string
  age: string
}

// 로그 관련 타입
export interface LogsData {
  pod_name: string
  namespace: string
  lines: number
  log_lines: string[]
  total_lines: number
}

export interface LogsMetadata {
  namespace: string
  lines_requested: number
  lines_returned: number
}

// 비용 분석 관련 타입
export interface CostOptimization {
  type: string
  description: string
  potential_savings: number
}

export interface CostAnalysisData {
  current_cost: number
  optimizations: CostOptimization[]
}

export interface CostAnalysisMetadata {
  current_cost: number
  optimization_count: number
}

// 스케일링 관련 타입
export interface ScaleData {
  repository: string
  old_replicas: number
  new_replicas: number
  change: string
  status: string
  timestamp: string
  action: string
}

export interface ScaleMetadata {
  owner: string
  repo: string
  old_replicas: number
  new_replicas: number
  status: string
}

// 배포 관련 타입
export interface DeployData {
  app_name: string
  environment: string
  status?: string
  message?: string
  repository?: string
  branch?: string
  commit?: {
    sha: string
    message: string
    author: string
    url?: string
  }
  deployment_status?: string
  [key: string]: any
}

export interface DeployMetadata {
  app_name: string
  environment: string
}

// 재시작 관련 타입
export interface RestartData {
  name: string
  namespace: string
  [key: string]: any
}

export interface RestartMetadata {
  name: string
  namespace: string
}

// 상태 관련 타입
export interface StatusData {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
  node: string
}

export interface StatusMetadata {
  namespace: string
  is_healthy: boolean
}

// 엔드포인트 관련 타입
export interface EndpointData {
  service_name: string
  namespace: string
  endpoints: ServiceEndpoint[]
}

export interface EndpointMetadata {
  namespace: string
  total_endpoints: number
}

// 통합 대시보드 관련 타입
export interface OverviewData {
  namespace: string
  deployments: any[]
  pods: any[]
  services: any[]
}

export interface OverviewMetadata {
  namespace: string
  deployment_count: number
  pod_count: number
  service_count: number
}

// 에러 관련 타입
export interface ErrorData {
  error: string
  command: string
  error_message?: string
}

export interface ErrorMetadata {
  command: string
  has_error: boolean
}

// 명령어 에러 관련 타입
export interface CommandErrorData {
  error_type: string
  error_message: string
  solutions?: Array<{
    title: string
    description?: string
    example?: string
  }>
  supported_commands?: Array<{
    category: string
    name: string
    example: string
  }>
  technical_details?: string
  [key: string]: any
}

export interface CommandErrorMetadata {
  error_type: string
  timestamp: string
  command?: string
  [key: string]: any
}

// 알 수 없는 명령어 관련 타입
export interface UnknownData {
  [key: string]: any
}

export interface UnknownMetadata {
  command: string
}

// 타입별 응답 데이터 유니온 타입
export type ResponseData = 
  | PodInfo[]
  | RollbackListData
  | StatusData
  | LogsData
  | ServiceInfo[]
  | DeploymentInfo[]
  | IngressInfo[]
  | NamespaceInfo[]
  | ServiceEndpointsData
  | OverviewData
  | ScaleData
  | DeployData
  | RestartData
  | EndpointData
  | CostAnalysisData
  | RollbackExecutionData
  | ErrorData
  | CommandErrorData
  | UnknownData

// 타입별 메타데이터 유니온 타입
export type ResponseMetadata = 
  | PodListMetadata
  | RollbackListMetadata
  | StatusMetadata
  | LogsMetadata
  | EndpointMetadata
  | OverviewMetadata
  | ScaleMetadata
  | DeployMetadata
  | RestartMetadata
  | CostAnalysisMetadata
  | RollbackExecutionMetadata
  | ErrorMetadata
  | CommandErrorMetadata
  | UnknownMetadata
  | Record<string, any>

// 타입별 응답 인터페이스
export interface PodListResponse extends FormattedResponse {
  type: 'list_pods'
  data: {
    formatted: PodInfo[]
    raw?: any
  }
  metadata: PodListMetadata
}

export interface RollbackListResponse extends FormattedResponse {
  type: 'list_rollback'
  data: {
    formatted: RollbackListData
    raw?: any
  }
  metadata: RollbackListMetadata
}

export interface StatusResponse extends FormattedResponse {
  type: 'status'
  data: {
    formatted: StatusData
    raw?: any
  }
  metadata: StatusMetadata
}

export interface LogsResponse extends FormattedResponse {
  type: 'logs'
  data: {
    formatted: LogsData
    raw?: any
  }
  metadata: LogsMetadata
}

export interface ServiceListResponse extends FormattedResponse {
  type: 'list_services'
  data: {
    formatted: ServiceInfo[]
    raw?: any
  }
  metadata: Record<string, any>
}

export interface DeploymentListResponse extends FormattedResponse {
  type: 'list_deployments'
  data: {
    formatted: DeploymentInfo[]
    raw?: any
  }
  metadata: Record<string, any>
}

export interface IngressListResponse extends FormattedResponse {
  type: 'list_ingresses'
  data: {
    formatted: IngressInfo[]
    raw?: any
  }
  metadata: Record<string, any>
}

export interface NamespaceListResponse extends FormattedResponse {
  type: 'list_namespaces'
  data: {
    formatted: NamespaceInfo[]
    raw?: any
  }
  metadata: Record<string, any>
}

export interface ServiceDetailResponse extends FormattedResponse {
  type: 'get_service'
  data: {
    formatted: any
    raw?: any
  }
  metadata: Record<string, any>
}

export interface DeploymentDetailResponse extends FormattedResponse {
  type: 'get_deployment'
  data: {
    formatted: any
    raw?: any
  }
  metadata: Record<string, any>
}

export interface OverviewResponse extends FormattedResponse {
  type: 'overview'
  data: {
    formatted: OverviewData
    raw?: any
  }
  metadata: OverviewMetadata
}

export interface EndpointResponse extends FormattedResponse {
  type: 'endpoint'
  data: {
    formatted: EndpointData
    raw?: any
  }
  metadata: EndpointMetadata
}

export interface ScaleResponse extends FormattedResponse {
  type: 'scale'
  data: {
    formatted: ScaleData
    raw?: any
  }
  metadata: ScaleMetadata
}

export interface DeployResponse extends FormattedResponse {
  type: 'deploy'
  data: {
    formatted: DeployData
    raw?: any
  }
  metadata: DeployMetadata
}

export interface DeployGitHubRepositoryResponse extends FormattedResponse {
  type: 'deploy_github_repository'
  data: {
    formatted: DeployData
    raw?: any
  }
  metadata: DeployMetadata
}

export interface RestartResponse extends FormattedResponse {
  type: 'restart'
  data: {
    formatted: RestartData
    raw?: any
  }
  metadata: RestartMetadata
}

export interface CostAnalysisResponse extends FormattedResponse {
  type: 'cost_analysis'
  data: {
    formatted: CostAnalysisData
    raw?: any
  }
  metadata: CostAnalysisMetadata
}

// 롤백 실행 관련 타입
export interface RollbackExecutionData {
  action_type: string
  action_description: string
  project: string
  target_commit: string
  status: string
  timestamp: string
  details: {
    owner: string
    repo: string
    target_commit_full: string
    action: string
    status: string
  }
}

export interface RollbackExecutionMetadata {
  owner: string
  repo: string
  action_type: string
  target_commit: string
  status: string
}

export interface RollbackExecutionResponse extends FormattedResponse {
  type: 'rollback_execution'
  data: {
    formatted: RollbackExecutionData
    raw?: any
  }
  metadata: RollbackExecutionMetadata
}

export interface ErrorResponse extends FormattedResponse {
  type: 'error'
  data: {
    formatted: ErrorData
    raw?: any
  }
  metadata: ErrorMetadata
}

export interface CommandErrorResponse extends FormattedResponse {
  type: 'command_error'
  data: {
    formatted: CommandErrorData
    raw?: any
  }
  metadata: CommandErrorMetadata
}

export interface UnknownResponse extends FormattedResponse {
  type: 'unknown'
  data: {
    formatted: UnknownData
    raw?: any
  }
  metadata: UnknownMetadata
}

// 모든 응답 타입의 유니온
export type NLPResponse = 
  | PodListResponse
  | RollbackListResponse
  | StatusResponse
  | LogsResponse
  | ServiceListResponse
  | DeploymentListResponse
  | IngressListResponse
  | NamespaceListResponse
  | ServiceDetailResponse
  | DeploymentDetailResponse
  | OverviewResponse
  | EndpointResponse
  | ScaleResponse
  | DeployResponse
  | DeployGitHubRepositoryResponse
  | RestartResponse
  | CostAnalysisResponse
  | RollbackExecutionResponse
  | ErrorResponse
  | CommandErrorResponse
  | UnknownResponse
