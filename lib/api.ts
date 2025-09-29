const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
    console.log('API Request:', url) // 디버깅용 로그 추가
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
      console.log('Making API request to:', url, 'with config:', config)
      const response = await fetch(url, config)
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('API response data:', result)
      return result
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: { email: string; password: string; name: string }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser() {
    return this.request('/api/auth/me')
  }

  // Dashboard endpoints
  async getDashboardData() {
    return this.request('/api/v1/dashboard/overview')
  }

  async getDeployments() {
    return this.request('/api/deployments')
  }

  async getClusters() {
    return this.request('/api/clusters')
  }

  // Commands endpoints
  async executeCommand(command: string) {
    return this.request('/api/v1/commands/execute', {
      method: 'POST',
      body: JSON.stringify({ text: command }),
    })
  }

  async getCommandHistory(limit: number = 50, offset: number = 0) {
    return this.request(`/api/v1/commands/history?limit=${limit}&offset=${offset}`)
  }

  async getCommandDetail(commandId: number) {
    return this.request(`/api/v1/commands/history/${commandId}`)
  }

  async getCommandsStatus() {
    return this.request('/api/v1/commands/status')
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

  // GitHub endpoints
  async getGitHubInstallations() {
    return this.request('/api/v1/github/app/installations')
  }

  async getGitHubInstallationToken(installationId: string) {
    return this.request(`/api/v1/github/app/installations/${installationId}/token`, {
      method: 'POST',
    })
  }

  async getGitHubRepositories() {
    return this.request('/api/v1/github/repositories')
  }

  async getGitHubPullRequests() {
    return this.request('/api/v1/github/pull-requests')
  }

  async getGitHubPipelines() {
    return this.request('/api/v1/github/pipelines')
  }

  async installGitHubWorkflow(data: {
    owner: string
    repo: string
    installation_id: string
    branch?: string
    path?: string
    yaml_content?: string
    commit_message?: string
    author_name?: string
    author_email?: string
  }) {
    return this.request('/api/v1/github/workflows/install', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getGitHubAppInstallUrl() {
    return this.request('/api/v1/github/app/install-url')
  }

  async checkRepositoryInstallation(owner: string, repo: string) {
    return this.request(`/api/v1/github/repositories/check-installation?owner=${owner}&repo=${repo}`, {
      method: 'POST',
    })
  }

  async connectRepository(owner: string, repo: string, userId: string = "default", userEmail: string = "user@example.com") {
    return this.request(`/api/v1/github/repositories/connect?owner=${owner}&repo=${repo}&user_id=${userId}&user_email=${userEmail}`, {
      method: 'POST',
    })
  }

  async getConnectedRepositories(userId: string = "default") {
    return this.request(`/api/v1/github/repositories/connected?user_id=${userId}`)
  }

  async getGitHubPullRequests(userId: string = "default") {
    return this.request(`/api/v1/github/pull-requests?user_id=${userId}`)
  }

  async getGitHubPipelines(userId: string = "default") {
    return this.request(`/api/v1/github/pipelines?user_id=${userId}`)
  }

  // OAuth2 로그인
  async getOAuth2Url(provider: 'google' | 'github') {
    // 기존에 사용한 리디렉션 URI 사용
    const redirectUri = 'http://localhost:3000/auth/callback'
    return this.request(`/api/v1/auth/oauth2/url/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`)
  }

  async loginWithOAuth2(provider: 'google' | 'github', code: string, redirectUri: string) {
    return this.request('/api/v1/auth/oauth2/login', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        code,
        redirect_uri: redirectUri
      })
    })
  }

  // JWT 토큰 검증
  async verifyToken() {
    return this.request('/api/v1/auth/verify')
  }

  // 현재 사용자 정보 조회
  async getCurrentUser() {
    return this.request('/api/v1/auth/me')
  }
}

export const apiClient = new ApiClient()
export default apiClient
