// Kubernetes 리소스 타입 정의

export interface KubernetesResource {
  apiVersion: string
  kind: string
  metadata: {
    name: string
    namespace: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    creationTimestamp?: string
    uid?: string
  }
  spec?: Record<string, any>
  data?: Record<string, string>
  status?: Record<string, any>
}

export interface KubernetesResourceList {
  resources: KubernetesResource[]
  total: number
  resource_type: string
  namespace: string
}

export interface KubernetesResourceResponse {
  resource: KubernetesResource
  resource_type: string
  name: string
  namespace: string
}

export interface KubernetesContext {
  name: string
  current: boolean
}

export interface KubernetesNamespace {
  metadata: {
    name: string
    creationTimestamp?: string
    uid?: string
  }
  status?: {
    phase: string
  }
}

export interface KubernetesHealth {
  status: 'healthy' | 'unhealthy'
  message: string
}

// Deployment 관련 타입
export interface Deployment extends KubernetesResource {
  kind: 'Deployment'
  spec: {
    replicas: number
    selector: {
      matchLabels: Record<string, string>
    }
    template: {
      metadata: {
        labels: Record<string, string>
      }
      spec: {
        containers: Array<{
          name: string
          image: string
          ports?: Array<{
            containerPort: number
            protocol?: string
          }>
          env?: Array<{
            name: string
            value?: string
            valueFrom?: {
              configMapKeyRef?: {
                name: string
                key: string
              }
              secretKeyRef?: {
                name: string
                key: string
              }
            }
          }>
          resources?: {
            requests?: {
              memory: string
              cpu: string
            }
            limits?: {
              memory: string
              cpu: string
            }
          }
        }>
      }
    }
  }
  status?: {
    replicas: number
    readyReplicas: number
    availableReplicas: number
    conditions?: Array<{
      type: string
      status: string
      lastTransitionTime: string
      reason?: string
      message?: string
    }>
  }
}

// Service 관련 타입
export interface Service extends KubernetesResource {
  kind: 'Service'
  spec: {
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName'
    ports: Array<{
      port: number
      targetPort: number | string
      protocol?: string
      nodePort?: number
    }>
    selector: Record<string, string>
  }
  status?: {
    loadBalancer?: {
      ingress?: Array<{
        ip?: string
        hostname?: string
      }>
    }
  }
}

// ConfigMap 관련 타입
export interface ConfigMap extends KubernetesResource {
  kind: 'ConfigMap'
  data: Record<string, string>
}

// Secret 관련 타입
export interface Secret extends KubernetesResource {
  kind: 'Secret'
  type: string
  data: Record<string, string>
}

// 리소스 생성/수정 요청 타입
export interface CreateResourceRequest {
  apiVersion: string
  kind: string
  metadata: {
    name: string
    namespace?: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
  }
  spec?: Record<string, any>
  data?: Record<string, string>
  kube_context?: string
}

export interface UpdateResourceRequest extends CreateResourceRequest {}

// 리소스 상태 타입
export type ResourceStatus = 
  | 'Running'
  | 'Pending'
  | 'Failed'
  | 'Succeeded'
  | 'Unknown'
  | 'Active'
  | 'Inactive'

// 리소스 종류 타입
export type ResourceKind = 
  | 'Deployment'
  | 'Service'
  | 'ConfigMap'
  | 'Secret'
  | 'Namespace'

// 리소스 필터 타입
export interface ResourceFilter {
  namespace?: string
  labelSelector?: Record<string, string>
  fieldSelector?: Record<string, string>
  search?: string
}

// 리소스 정렬 타입
export interface ResourceSort {
  field: 'name' | 'namespace' | 'creationTimestamp'
  direction: 'asc' | 'desc'
}

// 리소스 액션 타입
export type ResourceAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'scale'
  | 'restart'

// 리소스 이벤트 타입
export interface ResourceEvent {
  type: 'created' | 'updated' | 'deleted' | 'scaled' | 'restarted'
  resource: KubernetesResource
  timestamp: string
  user?: string
}

// 리소스 메트릭 타입
export interface ResourceMetrics {
  cpu: {
    usage: number
    limit: number
    request: number
  }
  memory: {
    usage: number
    limit: number
    request: number
  }
  pods: {
    running: number
    pending: number
    failed: number
    total: number
  }
}

// 리소스 상세 정보 타입
export interface ResourceDetails {
  resource: KubernetesResource
  events: ResourceEvent[]
  metrics?: ResourceMetrics
  logs?: string[]
  yaml?: string
}

// 리소스 생성 폼 타입
export interface ResourceFormData {
  name: string
  namespace: string
  labels: Record<string, string>
  annotations: Record<string, string>
  kube_context?: string
}

// Deployment 폼 데이터 타입
export interface DeploymentFormData extends ResourceFormData {
  replicas: number
  image: string
  ports: Array<{
    containerPort: number
    protocol: string
  }>
  env: Array<{
    name: string
    value: string
    type: 'value' | 'configmap' | 'secret'
    source?: string
  }>
  resources: {
    requests: {
      memory: string
      cpu: string
    }
    limits: {
      memory: string
      cpu: string
    }
  }
}

// Service 폼 데이터 타입
export interface ServiceFormData extends ResourceFormData {
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName'
  ports: Array<{
    port: number
    targetPort: number | string
    protocol: string
    nodePort?: number
  }>
  selector: Record<string, string>
}

// ConfigMap 폼 데이터 타입
export interface ConfigMapFormData extends ResourceFormData {
  data: Array<{
    key: string
    value: string
  }>
}

// Secret 폼 데이터 타입
export interface SecretFormData extends ResourceFormData {
  type: string
  data: Array<{
    key: string
    value: string
  }>
}

// 리소스 테이블 컬럼 타입
export interface ResourceTableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, resource: KubernetesResource) => React.ReactNode
}

// 리소스 테이블 행 타입
export interface ResourceTableRow {
  id: string
  resource: KubernetesResource
  status: ResourceStatus
  age: string
  [key: string]: any
}

// 리소스 테이블 타입
export interface ResourceTable {
  columns: ResourceTableColumn[]
  rows: ResourceTableRow[]
  total: number
  loading: boolean
  error?: string
}

// 리소스 모달 타입
export interface ResourceModal {
  open: boolean
  mode: 'create' | 'edit' | 'view'
  resource?: KubernetesResource
  resourceType?: ResourceKind
}

// 리소스 컨텍스트 타입
export interface KubernetesContext {
  resources: Record<ResourceKind, ResourceTable>
  contexts: KubernetesContext[]
  namespaces: KubernetesNamespace[]
  currentContext?: string
  currentNamespace: string
  loading: boolean
  error?: string
  refresh: () => Promise<void>
  createResource: (data: CreateResourceRequest) => Promise<void>
  updateResource: (data: UpdateResourceRequest) => Promise<void>
  deleteResource: (kind: ResourceKind, name: string, namespace: string) => Promise<void>
  getResource: (kind: ResourceKind, name: string, namespace: string) => Promise<KubernetesResource>
  setCurrentContext: (context: string) => void
  setCurrentNamespace: (namespace: string) => void
}


