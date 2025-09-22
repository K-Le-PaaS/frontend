// 대시보드 관련 타입 정의
export interface DashboardWidget {
  id: string
  title: string
  type: WidgetType
  size: WidgetSize
  position: { x: number; y: number }
  config: Record<string, any>
  permissions?: string[]
}

export type WidgetType = 
  | 'cluster-status'
  | 'recent-deployments'
  | 'resource-usage'
  | 'alerts'
  | 'quick-actions'
  | 'mcp-servers'
  | 'system-health'
  | 'user-activity'
  | 'cost-analysis'
  | 'performance-metrics'

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface DashboardLayout {
  id: string
  name: string
  role: string
  widgets: DashboardWidget[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// 클러스터 상태 위젯
export interface ClusterStatusData {
  clusterName: string
  status: 'healthy' | 'warning' | 'error'
  nodeCount: number
  podCount: number
  cpuUsage: number
  memoryUsage: number
  networkIn: number
  networkOut: number
  lastUpdated: string
}

// 최근 배포 위젯
export interface RecentDeploymentsData {
  deployments: Array<{
    id: string
    name: string
    status: 'success' | 'failed' | 'pending' | 'running'
    branch: string
    commit: string
    timestamp: string
    author: string
  }>
}

// 리소스 사용량 위젯
export interface ResourceUsageData {
  cpu: {
    used: number
    total: number
    percentage: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  storage: {
    used: number
    total: number
    percentage: number
  }
  network: {
    in: number
    out: number
  }
  timestamp: string
}

// 알림 위젯
export interface AlertsData {
  alerts: Array<{
    id: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    title: string
    message: string
    timestamp: string
    status: 'firing' | 'resolved'
    source: string
  }>
}

// 빠른 작업 위젯
export interface QuickActionsData {
  actions: Array<{
    id: string
    title: string
    description: string
    icon: string
    path: string
    permissions: string[]
    enabled: boolean
  }>
}

// MCP 서버 위젯
export interface MCPServersData {
  servers: Array<{
    id: string
    name: string
    status: 'connected' | 'disconnected' | 'error'
    url: string
    lastConnected: string
    capabilities: string[]
  }>
  totalServers: number
  connectedServers: number
}

// 시스템 상태 위젯
export interface SystemHealthData {
  overall: 'healthy' | 'warning' | 'error'
  components: Array<{
    name: string
    status: 'healthy' | 'warning' | 'error'
    uptime: number
    lastCheck: string
  }>
  uptime: number
  lastIncident?: {
    title: string
    timestamp: string
    resolved: boolean
  }
}

// 사용자 활동 위젯
export interface UserActivityData {
  recentUsers: Array<{
    id: string
    name: string
    email: string
    lastActivity: string
    action: string
  }>
  activeUsers: number
  totalUsers: number
  newUsersToday: number
}

// 비용 분석 위젯
export interface CostAnalysisData {
  currentMonth: {
    total: number
    breakdown: Array<{
      service: string
      cost: number
      percentage: number
    }>
  }
  previousMonth: {
    total: number
    change: number
  }
  forecast: {
    nextMonth: number
    trend: 'up' | 'down' | 'stable'
  }
}

// 성능 메트릭 위젯
export interface PerformanceMetricsData {
  responseTime: {
    average: number
    p95: number
    p99: number
  }
  throughput: {
    requestsPerSecond: number
    totalRequests: number
  }
  errorRate: {
    percentage: number
    totalErrors: number
  }
  availability: {
    percentage: number
    downtime: number
  }
  timestamp: string
}

// 대시보드 설정
export interface DashboardSettings {
  refreshInterval: number
  autoRefresh: boolean
  theme: 'light' | 'dark'
  compactMode: boolean
  showGrid: boolean
}

// 대시보드 요약 정보
export interface DashboardSummary {
  activeDeployments: number
  kubernetesResources: number
  mcpServers: number
  unresolvedAlerts: number
}

// 대시보드 메인 데이터 구조 (실제 사용 패턴에 맞게 단순화)
export interface DashboardData {
  summary: DashboardSummary
  clusterStatus: ClusterStatusData
  recentDeployments: RecentDeploymentsData
  resourceUsage: ResourceUsageData
  alerts: AlertsData
  quickActions: QuickActionsData
  mcpServers: MCPServersData
  systemHealth?: SystemHealthData
  userActivity?: UserActivityData
  costAnalysis?: CostAnalysisData
  performanceMetrics?: PerformanceMetricsData
  settings: DashboardSettings
}
