import { apiClient } from './apiClient'
import { Deployment } from '@/types'

export class DeploymentService {

  static async getDeployments() {
    // 실제 백엔드 API에 맞게 수정
    return apiClient.get<Deployment[]>(`/deployments`)
  }

  static async getDeployment(id: string) {
    return apiClient.get<Deployment>(`/deployments/${id}`)
  }

  static async createDeployment(deployment: Omit<Deployment, 'id' | 'createdAt' | 'updatedAt'>) {
    return apiClient.post<Deployment>('/deploy', deployment)
  }

  static async updateDeployment(id: string, deployment: Partial<Deployment>) {
    return apiClient.put<Deployment>(`/deployments/${id}`, deployment)
  }

  static async deleteDeployment(id: string) {
    return apiClient.delete<void>(`/deployments/${id}`)
  }

  static async deployApplication(id: string) {
    return apiClient.post<Deployment>(`/deployments/${id}/deploy`)
  }

  static async rollbackDeployment(id: string, version: string) {
    return apiClient.post<Deployment>(`/deployments/rollback`, { 
      app_name: id, 
      environment: 'production',
      target_image: version 
    })
  }

  static async getDeploymentStatus(appName: string, environment: string) {
    return apiClient.get<any>(`/deployments/${appName}/status?env=${environment}`)
  }

  static async getDeploymentVersions(appName: string, environment: string) {
    return apiClient.get<any>(`/deployments/${appName}/versions?env=${environment}`)
  }
}
