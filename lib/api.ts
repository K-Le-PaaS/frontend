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
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
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
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000')
    // Frontend callback route
    const redirectUri = `${origin}${basePath}/oauth2-callback`
    const endpoint = `/api/v1/auth/oauth2/url/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`
    return this.request(endpoint)
  }

  async verifyToken() {
    // 간단한 ping 엔드포인트가 없으므로 사용자 정보 조회를 토큰 검증으로 사용
    return this.request('/api/v1/auth/me')
  }

  // Project integrations
  async getProjectIntegrations() {
    const ts = Date.now()
    return this.request(`/api/v1/projects/integrations?t=${ts}`)
  }

  // Command console (guarded: avoid runtime 'is not a function')
  async getCommandHistory(limit: number = 50, offset: number = 0) {
    const ts = Date.now()
    // Backend route may vary; keep stable default and allow proxy rewrite
    return this.request(`/api/v1/commands/history?limit=${limit}&offset=${offset}&t=${ts}`)
  }

  async runCommand(payload: { text: string; context?: any }) {
    // Backend expects { text: string, ... }
    return this.request('/api/v1/commands/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient
