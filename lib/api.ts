import { config } from './config'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = config.api.baseUrl) {
    this.baseURL = baseURL
  }

  // Get current user ID from localStorage
  private getCurrentUserId(): string | null {
    try {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        // provider_id를 우선 사용하고, 없으면 id 사용
        return user.provider_id || user.id
      }
    } catch (error) {
      console.error('Failed to get current user ID:', error)
    }
    return null
  }

  // Add user_id to query parameters
  private addUserFilter(url: string): string {
    const userId = this.getCurrentUserId()
    if (!userId) return url
    
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}user_id=${encodeURIComponent(userId)}`
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Add user_id filter to GET requests
    const url = options.method === 'GET' || !options.method 
      ? this.addUserFilter(`${this.baseURL}${endpoint}`)
      : `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options.headers,
      },
      cache: 'no-store',
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      }
    }

    // Add user_id to POST/PUT/DELETE requests body
    if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method) && options.body) {
      try {
        const body = JSON.parse(options.body as string)
        const userId = this.getCurrentUserId()
        if (userId) {
          body.user_id = userId
          config.body = JSON.stringify(body)
        }
      } catch (error) {
        // If body is not JSON, skip user_id addition
        console.warn('Could not add user_id to request body:', error)
      }
    }

    try {
      console.log('Making API request to:', url)
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP error! status: ${response.status}, response:`, errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      console.error('Request URL:', url)
      console.error('Request config:', config)
      throw error
    }
  }

  // Auth endpoints
  async loginWithOAuth2(provider: 'google' | 'github', code: string, redirectUri: string) {
    return this.request('/api/v1/auth/oauth2/login', {
      method: 'POST',
      body: JSON.stringify({ provider, code, redirect_uri: redirectUri }),
    })
  }
  async login(credentials: { email: string; password: string }) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async adminLogin(credentials: { username: string; password: string }) {
    return this.request('/api/v1/auth/oauth2/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: { email: string; password: string; name: string }) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    return this.request('/api/v1/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser() {
    return this.request('/api/v1/auth/me')
  }

  // Dashboard endpoints
  async getDashboardData() {
    // user_id는 request 메서드에서 자동으로 추가됨
    return this.request('/api/v1/dashboard/overview')
  }

  async getDeployments() {
    return this.request('/api/v1/deployments')
  }

  async getClusters() {
    return this.request('/api/v1/clusters')
  }

  // MCP endpoints
  async sendMCPCommand(command: string) {
    return this.request('/mcp/execute', {
      method: 'POST',
      body: JSON.stringify({ command }),
    })
  }

  async getMCPStatus() {
    return this.request('/mcp/status')
  }

  // NKS 모니터링 엔드포인트
  async getNKSOverview() {
    return this.request('/api/v1/monitoring/nks/overview')
  }

  async getNKSCpuUsage() {
    return this.request('/api/v1/monitoring/nks/cpu-usage')
  }

  async getNKSMemoryUsage() {
    return this.request('/api/v1/monitoring/nks/memory-usage')
  }

  async getNKSDiskUsage() {
    return this.request('/api/v1/monitoring/nks/disk-usage')
  }

  async getNKSNetworkTraffic() {
    return this.request('/api/v1/monitoring/nks/network-traffic')
  }

  async getNKSPodInfo() {
    return this.request('/api/v1/monitoring/nks/pod-info')
  }

  // OAuth2 endpoints
  async getOAuth2Url(provider: 'google' | 'github') {
    // 브라우저에서 현재 origin 가져오기
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const redirectUri = `${origin}${config.app.basePath}/oauth2-callback`
    const endpoint = `/api/v1/auth/oauth2/url/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`
    return this.request(endpoint)
  }

  // Slack OAuth endpoints
  async getSlackAuthUrl(redirectUri?: string) {
    const endpoint = redirectUri
      ? `/api/v1/slack/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}`
      : `/api/v1/slack/auth/url`
    return this.request(endpoint)
  }

  async getSlackStatus() {
    return this.request('/api/v1/slack/status')
  }

  async verifyToken() {
    // 간단한 ping 엔드포인트가 없으므로 사용자 정보 조회를 토큰 검증으로 사용
    try {
      return await this.request('/api/v1/auth/me')
    } catch (error) {
      console.error('Token verification failed:', error)
      // 토큰이 유효하지 않으면 로컬 스토리지에서 제거
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      throw error
    }
  }

  // Project integrations
  async getProjectIntegrations(): Promise<{
    repositories?: any[]
    items?: any[]
  }> {
    const ts = Date.now()
    // user_id는 request 메서드에서 자동으로 추가됨
    return this.request(`/api/v1/github/repositories/connected?t=${ts}`)
  }

  async connectRepository(owner: string, repo: string) {
    const userId = this.getCurrentUserId()
    return this.request('/api/v1/projects/github/connect', {
      method: 'POST',
      body: JSON.stringify({
        owner: owner,
        repo: repo,
        user_id: userId, // 명시적으로 user_id 추가
      }),
    })
  }

  async getPullRequests(repository?: string) {
    const ts = Date.now()
    const params = new URLSearchParams({ t: ts.toString() })
    if (repository && repository !== "all") {
      params.append("repository", repository)
    }
    
    // user_id는 request 메서드에서 자동으로 추가됨
    return this.request(`/api/v1/github/pull-requests?${params.toString()}`)
  }

  async getPipelines(repository?: string) {
    const ts = Date.now()
    const params = new URLSearchParams({ t: ts.toString() })
    if (repository && repository !== "all") {
      params.append("repository", repository)
    }
    
    // user_id는 request 메서드에서 자동으로 추가됨
    return this.request(`/api/v1/github/pipelines?${params.toString()}`)
  }

  async updateWebhookConfig(integrationId: number, enabled: boolean) {
    const userId = this.getCurrentUserId()
    const url = userId 
      ? `/api/v1/github/webhook/${integrationId}?enabled=${enabled}&user_id=${encodeURIComponent(userId)}`
      : `/api/v1/github/webhook/${integrationId}?enabled=${enabled}`
    return this.request(url, {
      method: 'PUT',
    })
  }

  async getWebhookStatus(integrationId: number) {
    const userId = this.getCurrentUserId()
    const url = userId 
      ? `/api/v1/github/webhook/${integrationId}/status?user_id=${encodeURIComponent(userId)}`
      : `/api/v1/github/webhook/${integrationId}/status`
    return this.request(url)
  }

  async triggerDeploy(owner: string, repo: string, branch: string = "main") {
    const userId = this.getCurrentUserId()
    return this.request('/api/v1/github/manual-deploy', {
      method: 'POST',
      body: JSON.stringify({
        github_owner: owner,
        github_repo: repo,
        branch: branch,
        user_id: userId, // 명시적으로 user_id 추가
      }),
    })
  }

  // Deployment Histories endpoints
  async getDeploymentHistories(repository?: string, status?: string, limit: number = 20, offset: number = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      t: Date.now().toString(),
    })
    if (repository) params.append('repository', repository)
    if (status) params.append('status', status)
    
    // user_id는 request 메서드에서 자동으로 추가됨
    return this.request(`/api/v1/deployment-histories?${params.toString()}`)
  }

  async getDeploymentHistory(deploymentId: number) {
    return this.request(`/api/v1/deployment-histories/${deploymentId}`)
  }

  async getRepositoryDeploymentHistories(owner: string, repo: string, status?: string, limit: number = 20, offset: number = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (status) params.append('status', status)
    
    return this.request(`/api/v1/deployment-histories/repository/${owner}/${repo}?${params.toString()}`)
  }

  async getDeploymentStats(repository?: string, days: number = 30) {
    const params = new URLSearchParams({
      days: days.toString(),
    })
    if (repository) params.append('repository', repository)
    
    return this.request(`/api/v1/deployment-histories/stats/summary?${params.toString()}`)
  }

  async getWebSocketStatus() {
    return this.request('/api/v1/deployment-histories/websocket/status')
  }

  async getRepositoriesLatestDeployments(): Promise<{ repositories: any[] }> {
    const ts = Date.now()
    // user_id는 request 메서드에서 자동으로 추가됨
    return this.request(`/api/v1/deployment-histories/repositories/latest?t=${ts}`)
  }

  // Deployment logs/pods (UI 전용 public API)
  async getDeploymentPods(namespace: string, app: string): Promise<any> {
    return this.request(`/api/v1/deployments/${namespace}/${app}/pods`)
  }

  async getDeploymentLogs(
    namespace: string,
    app: string,
    params: { pod?: string; lines?: number; previous?: boolean } = {}
  ): Promise<any> {
    const qs = new URLSearchParams()
    if (params.pod) qs.append('pod', params.pod)
    if (typeof params.lines === 'number') qs.append('lines', String(params.lines))
    if (typeof params.previous === 'boolean') qs.append('previous', String(params.previous))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return this.request(`/api/v1/deployments/${namespace}/${app}/logs${suffix}`)
  }

  // NLP Command console
  async getCommandHistory(limit: number = 50, offset: number = 0): Promise<any[]> {
    const ts = Date.now()
    // user_id는 request 메서드에서 자동으로 추가됨
    return this.request<any[]>(`/api/v1/nlp/history?limit=${limit}&offset=${offset}&t=${ts}`)
  }


  async runCommand(payload: { text: string; context?: any }) {
    // Backend expects { command: string, timestamp: string, context?: any }
    return this.request('/api/v1/nlp/process', {
      method: 'POST',
      body: JSON.stringify({
        command: payload.text,
        timestamp: new Date().toISOString(),
        context: payload.context,
      }),
    })
  }

  async getCommandSuggestions(context?: string) {
    const params = context ? `?context=${encodeURIComponent(context)}` : ''
    return this.request(`/api/v1/nlp/suggestions${params}`)
  }

  // Cost Optimization endpoints
  async sendConversationMessage(payload: {
    command: string
    session_id?: string
    timestamp: string
    context?: any
  }): Promise<any> {
    return this.request<any>('/api/v1/nlp/conversation', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async confirmAction(payload: {
    session_id: string
    confirmed: boolean
    user_response?: string
  }): Promise<any> {
    return this.request<any>('/api/v1/nlp/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // Conversation history endpoints
  async getConversationHistory(limit: number = 50, offset: number = 0): Promise<any[]> {
    const ts = Date.now()
    // user_id는 request 메서드에서 자동으로 추가됨
    return this.request<any[]>(`/api/v1/nlp/conversation-history?limit=${limit}&offset=${offset}&t=${ts}`)
  }

  async listConversations(): Promise<any> {
    return this.request<any>('/api/v1/nlp/conversations')
  }

  async deleteConversation(sessionId: string): Promise<any> {
    return this.request<any>(`/api/v1/nlp/conversation/${sessionId}`, {
      method: 'DELETE',
    })
  }

  // Rollback endpoints
  async getRollbackList(owner: string, repo: string): Promise<RollbackListResponse> {
    const userId = this.getCurrentUserId()
    const userIdParam = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
    return this.request<RollbackListResponse>(`/api/v1/deployments/${owner}/${repo}/rollback/list${userIdParam}`)
  }

  async rollbackToCommit(owner: string, repo: string, commitSha: string): Promise<any> {
    const userId = this.getCurrentUserId()
    return this.request('/api/v1/rollback/commit', {
      method: 'POST',
      body: JSON.stringify({
        owner,
        repo,
        target_commit_sha: commitSha,
        user_id: userId || 'api_user',
      }),
    })
  }

  async rollbackToPrevious(owner: string, repo: string, stepsBack: number = 1): Promise<any> {
    const userId = this.getCurrentUserId()
    return this.request('/api/v1/rollback/previous', {
      method: 'POST',
      body: JSON.stringify({
        owner,
        repo,
        steps_back: stepsBack,
        user_id: userId || 'api_user',
      }),
    })
  }

  // Scale endpoints
  async scaleDeployment(owner: string, repo: string, replicas: number): Promise<any> {
    const userId = this.getCurrentUserId()
    return this.request(`/api/v1/deployments/${owner}/${repo}/scale`, {
      method: 'POST',
      body: JSON.stringify({
        replicas,
        user_id: userId || 'api_user',
      }),
    })
  }

  // Restart endpoint (trigger redeploy with same image)
  async restartDeployment(owner: string, repo: string): Promise<any> {
    const userId = this.getCurrentUserId()
    return this.request(`/api/v1/deployments/${owner}/${repo}/restart`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId || 'api_user',
      }),
    })
  }

  // Deployment Config endpoints
  async getDeploymentConfig(owner: string, repo: string): Promise<DeploymentConfigResponse> {
    const userId = this.getCurrentUserId()
    const userIdParam = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
    return this.request<DeploymentConfigResponse>(`/api/v1/deployments/${owner}/${repo}/config${userIdParam}`)
  }

  async updateDeploymentConfig(owner: string, repo: string, replicaCount: number): Promise<any> {
    const userId = this.getCurrentUserId()
    return this.request(`/api/v1/deployments/${owner}/${repo}/config`, {
      method: 'PUT',
      body: JSON.stringify({
        replica_count: replicaCount,
        user_id: userId || 'api_user',
      }),
    })
  }

  async getScalingHistory(owner: string, repo: string, limit: number = 20): Promise<ScalingHistoryResponse> {
    const userId = this.getCurrentUserId()
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    if (userId) params.append('user_id', userId)
    return this.request<ScalingHistoryResponse>(`/api/v1/deployments/${owner}/${repo}/scaling-history?${params.toString()}`)
  }
}

// Type definitions for Rollback and Scale
export interface RollbackCandidate {
  steps_back: number
  commit_sha: string
  commit_sha_short: string
  commit_message: string
  deployed_at: string | null
  is_current: boolean
}

export interface RollbackListResponse {
  owner: string
  repo: string
  current_state: {
    commit_sha: string
    commit_sha_short: string
    commit_message: string
    deployed_at: string | null
    is_rollback: boolean
    deployment_id: number
  } | null
  available_versions: RollbackCandidate[]
  total_available: number
  rollback_history: Array<{
    commit_sha_short: string
    commit_message: string
    rolled_back_at: string | null
    rollback_from_id: number | null
  }>
  total_rollbacks: number
}

// Type definitions for Deployment Config
export interface DeploymentConfigResponse {
  owner: string
  repo: string
  replica_count: number
  is_default: boolean
  last_scaled_at: string | null
  last_scaled_by: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ScalingHistoryResponse {
  owner: string
  repo: string
  current_replicas: number
  history: Array<{
    deployment_id: number
    replica_count: number
    deployed_at: string | null
    commit_sha_short: string | null
    commit_message: string | null
    status: string
  }>
  total_count: number
}

export const apiClient = new ApiClient()
export const api = apiClient
export default apiClient
