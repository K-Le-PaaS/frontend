import { apiClient } from './apiClient'

export class MCPService {
  static async getServers() {
    return apiClient.get<any[]>('/mcp/servers')
  }

  static async connectServer(serverId: string) {
    return apiClient.post<any>(`/mcp/servers/${serverId}/connect`)
  }

  static async disconnectServer(serverId: string) {
    return apiClient.post<void>(`/mcp/servers/${serverId}/disconnect`)
  }
}
