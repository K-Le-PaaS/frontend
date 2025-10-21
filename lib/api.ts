const API_BASE_URL = 'https://klepaas.com/api'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
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

  // OAuth2 endpoints
  async getOAuth2Url(provider: 'google' | 'github') {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_ORIGIN || 'https://klepaas.com')
    // Frontend callback route
    const redirectUri = `${origin}${basePath}/oauth2-callback`
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
  async getProjectIntegrations() {
    const ts = Date.now()
    return this.request(`/api/v1/projects/integrations?t=${ts}`)
  }

  async connectRepository(repoUrl: string, projectId: string, repoName: string) {
    return this.request('/api/v1/projects/github/connect', {
      method: 'POST',
      body: JSON.stringify({
        repo_url: repoUrl,
        project_id: projectId,
        repo_name: repoName,
      }),
    })
  }

  async getPullRequests(repository?: string) {
    const ts = Date.now()
    const params = new URLSearchParams({ t: ts.toString() })
    if (repository && repository !== "all") {
      params.append("repository", repository)
    }
    return this.request(`/api/v1/github/pull-requests?${params.toString()}`)
  }

  async getPipelines(repository?: string) {
    const ts = Date.now()
    const params = new URLSearchParams({ t: ts.toString() })
    if (repository && repository !== "all") {
      params.append("repository", repository)
    }
    return this.request(`/api/v1/github/pipelines?${params.toString()}`)
  }

  async updateWebhookConfig(integrationId: number, enabled: boolean) {
    return this.request(`/api/v1/github/webhook/${integrationId}?enabled=${enabled}`, {
      method: 'PUT',
    })
  }

  async getWebhookStatus(integrationId: number) {
    return this.request(`/api/v1/github/webhook/${integrationId}/status`)
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

  // NLP Command console
  async getCommandHistory(limit: number = 50, offset: number = 0): Promise<any[]> {
    const ts = Date.now()
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
}

export const apiClient = new ApiClient()
export default apiClient
