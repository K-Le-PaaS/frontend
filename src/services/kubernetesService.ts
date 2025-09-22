import { apiClient } from './apiClient'
import {
  KubernetesResource,
  KubernetesResourceList,
  KubernetesResourceResponse,
  KubernetesContext,
  KubernetesNamespace,
  KubernetesHealth,
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceKind
} from '@/types/kubernetes'

class KubernetesService {

  // 헬스체크
  async getHealth(): Promise<KubernetesHealth> {
    const response = await apiClient.get('/health')
    return response as any
  }

  // 컨텍스트 목록 조회
  async getContexts(): Promise<KubernetesContext[]> {
    return await apiClient.get<KubernetesContext[]>('/contexts')
  }

  // 네임스페이스 목록 조회
  async getNamespaces(kubeContext?: string): Promise<KubernetesNamespace[]> {
    const params = kubeContext ? { kube_context: kubeContext } : {}
    return await apiClient.get<KubernetesNamespace[]>('/namespaces', { params })
  }

  // 리소스 목록 조회
  async getResources(
    resourceType: ResourceKind,
    namespace: string = 'default',
    kubeContext?: string
  ): Promise<KubernetesResourceList> {
    const params: Record<string, string> = { namespace }
    if (kubeContext) {
      params['kube_context'] = kubeContext
    }
    
    return await apiClient.get<KubernetesResourceList>(`/resources/${resourceType}`, { params })
  }

  // 특정 리소스 조회
  async getResource(
    resourceType: ResourceKind,
    name: string,
    namespace: string = 'default',
    kubeContext?: string
  ): Promise<KubernetesResourceResponse> {
    const params: Record<string, string> = { namespace }
    if (kubeContext) {
      params['kube_context'] = kubeContext
    }
    
    return await apiClient.get<KubernetesResourceResponse>(`/resources/${resourceType}/${name}`, { params })
  }

  // 리소스 생성
  async createResource(
    resourceType: ResourceKind,
    data: CreateResourceRequest,
    namespace?: string
  ): Promise<KubernetesResourceResponse> {
    const params = namespace ? { namespace } : {}
    return await apiClient.post<KubernetesResourceResponse>(`/resources/${resourceType}`, data, { params })
  }

  // 리소스 수정
  async updateResource(
    resourceType: ResourceKind,
    name: string,
    data: UpdateResourceRequest,
    namespace?: string
  ): Promise<KubernetesResourceResponse> {
    const params = namespace ? { namespace } : {}
    return await apiClient.put<KubernetesResourceResponse>(`/resources/${resourceType}/${name}`, data, { params })
  }

  // 리소스 삭제
  async deleteResource(
    resourceType: ResourceKind,
    name: string,
    namespace: string = 'default',
    kubeContext?: string
  ): Promise<{ status: string; kind: string; name: string; namespace: string }> {
    const params: Record<string, string> = { namespace }
    if (kubeContext) {
      params['kube_context'] = kubeContext
    }
    
    return await apiClient.delete<{ status: string; kind: string; name: string; namespace: string }>(`/resources/${resourceType}/${name}`, { params })
  }

  // Deployment 관련 메서드
  async getDeployments(namespace: string = 'default', kubeContext?: string) {
    return this.getResources('Deployment', namespace, kubeContext)
  }

  async getDeployment(name: string, namespace: string = 'default', kubeContext?: string) {
    return this.getResource('Deployment', name, namespace, kubeContext)
  }

  async createDeployment(data: CreateResourceRequest, namespace?: string) {
    return this.createResource('Deployment', data, namespace)
  }

  async updateDeployment(name: string, data: UpdateResourceRequest, namespace?: string) {
    return this.updateResource('Deployment', name, data, namespace)
  }

  async deleteDeployment(name: string, namespace: string = 'default', kubeContext?: string) {
    return this.deleteResource('Deployment', name, namespace, kubeContext)
  }

  // Service 관련 메서드
  async getServices(namespace: string = 'default', kubeContext?: string) {
    return this.getResources('Service', namespace, kubeContext)
  }

  async getService(name: string, namespace: string = 'default', kubeContext?: string) {
    return this.getResource('Service', name, namespace, kubeContext)
  }

  async createService(data: CreateResourceRequest, namespace?: string) {
    return this.createResource('Service', data, namespace)
  }

  async updateService(name: string, data: UpdateResourceRequest, namespace?: string) {
    return this.updateResource('Service', name, data, namespace)
  }

  async deleteService(name: string, namespace: string = 'default', kubeContext?: string) {
    return this.deleteResource('Service', name, namespace, kubeContext)
  }

  // ConfigMap 관련 메서드
  async getConfigMaps(namespace: string = 'default', kubeContext?: string) {
    return this.getResources('ConfigMap', namespace, kubeContext)
  }

  async getConfigMap(name: string, namespace: string = 'default', kubeContext?: string) {
    return this.getResource('ConfigMap', name, namespace, kubeContext)
  }

  async createConfigMap(data: CreateResourceRequest, namespace?: string) {
    return this.createResource('ConfigMap', data, namespace)
  }

  async updateConfigMap(name: string, data: UpdateResourceRequest, namespace?: string) {
    return this.updateResource('ConfigMap', name, data, namespace)
  }

  async deleteConfigMap(name: string, namespace: string = 'default', kubeContext?: string) {
    return this.deleteResource('ConfigMap', name, namespace, kubeContext)
  }

  // Secret 관련 메서드
  async getSecrets(namespace: string = 'default', kubeContext?: string) {
    return this.getResources('Secret', namespace, kubeContext)
  }

  async getSecret(name: string, namespace: string = 'default', kubeContext?: string) {
    return this.getResource('Secret', name, namespace, kubeContext)
  }

  async createSecret(data: CreateResourceRequest, namespace?: string) {
    return this.createResource('Secret', data, namespace)
  }

  async updateSecret(name: string, data: UpdateResourceRequest, namespace?: string) {
    return this.updateResource('Secret', name, data, namespace)
  }

  async deleteSecret(name: string, namespace: string = 'default', kubeContext?: string) {
    return this.deleteResource('Secret', name, namespace, kubeContext)
  }

  // 유틸리티 메서드
  async refreshAllResources(namespace: string = 'default', kubeContext?: string) {
    const [deployments, services, configMaps, secrets] = await Promise.all([
      this.getDeployments(namespace, kubeContext),
      this.getServices(namespace, kubeContext),
      this.getConfigMaps(namespace, kubeContext),
      this.getSecrets(namespace, kubeContext)
    ])

    return {
      deployments,
      services,
      configMaps,
      secrets
    }
  }

  // 리소스 상태 확인
  getResourceStatus(resource: KubernetesResource): string {
    if (resource.kind === 'Deployment') {
      const status = resource.status as any
      if (status?.readyReplicas === status?.replicas && status?.replicas > 0) {
        return 'Running'
      } else if (status?.replicas === 0) {
        return 'Inactive'
      } else {
        return 'Pending'
      }
    } else if (resource.kind === 'Service') {
      return 'Active'
    } else if (resource.kind === 'ConfigMap' || resource.kind === 'Secret') {
      return 'Active'
    }
    return 'Unknown'
  }

  // 리소스 나이 계산
  getResourceAge(resource: KubernetesResource): string {
    if (!resource.metadata.creationTimestamp) {
      return 'Unknown'
    }

    const created = new Date(resource.metadata.creationTimestamp)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays}d`
    } else if (diffHours > 0) {
      return `${diffHours}h`
    } else {
      return `${diffMinutes}m`
    }
  }

  // 리소스 YAML 생성
  generateResourceYAML(resource: KubernetesResource): string {
    return `apiVersion: ${resource.apiVersion}
kind: ${resource.kind}
metadata:
  name: ${resource.metadata.name}
  namespace: ${resource.metadata.name}
${resource.metadata.labels ? `  labels:
${Object.entries(resource.metadata.labels).map(([key, value]) => `    ${key}: ${value}`).join('\n')}` : ''}
${resource.spec ? `spec:
${JSON.stringify(resource.spec, null, 2).split('\n').map(line => `  ${line}`).join('\n')}` : ''}
${resource.data ? `data:
${Object.entries(resource.data).map(([key, value]) => `  ${key}: ${value}`).join('\n')}` : ''}`
  }

  // 리소스 검증
  validateResource(data: CreateResourceRequest): string[] {
    const errors: string[] = []

    if (!data.metadata.name) {
      errors.push('Name is required')
    }

    if (!data.metadata.namespace) {
      errors.push('Namespace is required')
    }

    if (data.kind === 'Deployment' && !data.spec) {
      errors.push('Spec is required for Deployment')
    }

    if ((data.kind === 'ConfigMap' || data.kind === 'Secret') && !data.data) {
      errors.push('Data is required for ConfigMap and Secret')
    }

    return errors
  }
}

export const kubernetesService = new KubernetesService()
export default kubernetesService