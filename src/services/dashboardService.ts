import { apiClient } from './apiClient'
import { 
  DashboardData, 
  DashboardLayout, 
  DashboardWidget, 
  DashboardSettings,
  ClusterStatusData,
  RecentDeploymentsData,
  ResourceUsageData,
  AlertsData,
  QuickActionsData,
  MCPServersData,
  SystemHealthData,
  UserActivityData,
  CostAnalysisData,
  PerformanceMetricsData,
  Deployment
} from '@/types'
import { ApiResponse } from '@/types'

export class DashboardService {
  private readonly baseUrl = '/api/v1'

  /**
   * 대시보드 데이터 가져오기 (실제 API 엔드포인트 사용)
   */
  async getDashboardData(_role: string): Promise<DashboardData> {
    // 실제 존재하는 API 엔드포인트들을 조합하여 대시보드 데이터 구성
    const [deployments, k8sResources] = await Promise.all([
      apiClient.get<Deployment[]>(`${this.baseUrl}/deployments`),
      apiClient.get<any[]>(`${this.baseUrl}/k8s/resources`)
    ])

    // Mock 데이터로 대시보드 구성 (실제 API 연동 시 수정 필요)
    return {
      summary: {
        activeDeployments: deployments?.length || 0,
        kubernetesResources: k8sResources?.length || 0,
        mcpServers: 0,
        unresolvedAlerts: 0
      },
      clusterStatus: {
        clusterName: 'k-le-paas-cluster',
        status: 'healthy',
        nodeCount: 3,
        podCount: k8sResources?.length || 0,
        cpuUsage: 45,
        memoryUsage: 60,
        networkIn: 1000,
        networkOut: 800,
        lastUpdated: new Date().toISOString()
      },
      recentDeployments: {
        deployments: deployments?.map((d: any) => ({
          id: d.id,
          name: d.name,
          status: d.status as any,
          branch: d.branch,
          commit: 'abc123',
          timestamp: d.createdAt,
          author: 'system'
        })) || []
      },
      resourceUsage: {
        cpu: { used: 45, total: 100, percentage: 45 },
        memory: { used: 60, total: 100, percentage: 60 },
        storage: { used: 30, total: 100, percentage: 30 },
        network: { in: 1000, out: 800 },
        timestamp: new Date().toISOString()
      },
      alerts: { alerts: [] },
      quickActions: { actions: [] },
      mcpServers: { servers: [], totalServers: 0, connectedServers: 0 },
      settings: {
        refreshInterval: 30,
        autoRefresh: true,
        theme: 'light',
        compactMode: false,
        showGrid: true
      }
    }
  }

  /**
   * 대시보드 레이아웃 가져오기
   */
  async getDashboardLayout(role: string): Promise<DashboardLayout> {
    const response = await apiClient.get<ApiResponse<DashboardLayout>>(
      `${this.baseUrl}/layout`,
      { params: { role } }
    )
    return response.data
  }

  /**
   * 대시보드 레이아웃 저장
   */
  async saveDashboardLayout(layout: DashboardLayout): Promise<DashboardLayout> {
    const response = await apiClient.put<ApiResponse<DashboardLayout>>(
      `${this.baseUrl}/layout`,
      layout
    )
    return response.data
  }

  /**
   * 위젯 데이터 가져오기
   */
  async getWidgetData(widgetType: string, config?: Record<string, any>): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.baseUrl}/widgets/${widgetType}`,
      { params: config }
    )
    return response.data
  }

  /**
   * 클러스터 상태 데이터
   */
  async getClusterStatus(): Promise<ClusterStatusData> {
    const response = await apiClient.get<ApiResponse<ClusterStatusData>>(
      `${this.baseUrl}/widgets/cluster-status`
    )
    return response.data
  }

  /**
   * 최근 배포 데이터
   */
  async getRecentDeployments(limit: number = 10): Promise<RecentDeploymentsData> {
    const response = await apiClient.get<ApiResponse<RecentDeploymentsData>>(
      `${this.baseUrl}/widgets/recent-deployments`,
      { params: { limit } }
    )
    return response.data
  }

  /**
   * 리소스 사용량 데이터
   */
  async getResourceUsage(): Promise<ResourceUsageData> {
    const response = await apiClient.get<ApiResponse<ResourceUsageData>>(
      `${this.baseUrl}/widgets/resource-usage`
    )
    return response.data
  }

  /**
   * 알림 데이터
   */
  async getAlerts(limit: number = 20): Promise<AlertsData> {
    const response = await apiClient.get<ApiResponse<AlertsData>>(
      `${this.baseUrl}/widgets/alerts`,
      { params: { limit } }
    )
    return response.data
  }

  /**
   * 빠른 작업 데이터
   */
  async getQuickActions(role: string): Promise<QuickActionsData> {
    const response = await apiClient.get<ApiResponse<QuickActionsData>>(
      `${this.baseUrl}/widgets/quick-actions`,
      { params: { role } }
    )
    return response.data
  }

  /**
   * MCP 서버 데이터
   */
  async getMCPServers(): Promise<MCPServersData> {
    const response = await apiClient.get<ApiResponse<MCPServersData>>(
      `${this.baseUrl}/widgets/mcp-servers`
    )
    return response.data
  }

  /**
   * 시스템 상태 데이터
   */
  async getSystemHealth(): Promise<SystemHealthData> {
    const response = await apiClient.get<ApiResponse<SystemHealthData>>(
      `${this.baseUrl}/widgets/system-health`
    )
    return response.data
  }

  /**
   * 사용자 활동 데이터
   */
  async getUserActivity(limit: number = 10): Promise<UserActivityData> {
    const response = await apiClient.get<ApiResponse<UserActivityData>>(
      `${this.baseUrl}/widgets/user-activity`,
      { params: { limit } }
    )
    return response.data
  }

  /**
   * 비용 분석 데이터
   */
  async getCostAnalysis(): Promise<CostAnalysisData> {
    const response = await apiClient.get<ApiResponse<CostAnalysisData>>(
      `${this.baseUrl}/widgets/cost-analysis`
    )
    return response.data
  }

  /**
   * 성능 메트릭 데이터
   */
  async getPerformanceMetrics(): Promise<PerformanceMetricsData> {
    const response = await apiClient.get<ApiResponse<PerformanceMetricsData>>(
      `${this.baseUrl}/widgets/performance-metrics`
    )
    return response.data
  }

  /**
   * 대시보드 설정 가져오기
   */
  async getDashboardSettings(): Promise<DashboardSettings> {
    const response = await apiClient.get<ApiResponse<DashboardSettings>>(
      `${this.baseUrl}/settings`
    )
    return response.data
  }

  /**
   * 대시보드 설정 저장
   */
  async saveDashboardSettings(settings: DashboardSettings): Promise<DashboardSettings> {
    const response = await apiClient.put<ApiResponse<DashboardSettings>>(
      `${this.baseUrl}/settings`,
      settings
    )
    return response.data
  }

  /**
   * 위젯 추가
   */
  async addWidget(widget: Omit<DashboardWidget, 'id'>): Promise<DashboardWidget> {
    const response = await apiClient.post<ApiResponse<DashboardWidget>>(
      `${this.baseUrl}/widgets`,
      widget
    )
    return response.data
  }

  /**
   * 위젯 업데이트
   */
  async updateWidget(widgetId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget> {
    const response = await apiClient.put<ApiResponse<DashboardWidget>>(
      `${this.baseUrl}/widgets/${widgetId}`,
      updates
    )
    return response.data
  }

  /**
   * 위젯 삭제
   */
  async deleteWidget(widgetId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/widgets/${widgetId}`)
  }

  /**
   * 위젯 순서 변경
   */
  async reorderWidgets(widgetIds: string[]): Promise<void> {
    await apiClient.put(`${this.baseUrl}/widgets/reorder`, { widgetIds })
  }
}
