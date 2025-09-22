import { apiClient } from './apiClient'
import { 
  AuthResponse, 
  LoginCredentials, 
  OAuth2LoginRequest, 
  RefreshTokenRequest, 
  PasswordChangeRequest, 
  UserUpdateRequest,
  User,
  ApiResponse 
} from '@/types'

export class AuthService {
  private readonly baseUrl = '/auth'

  /**
   * 이메일/비밀번호로 로그인
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${this.baseUrl}/login`,
      credentials
    )
    return response.data
  }

  /**
   * OAuth2 로그인 (Google, GitHub)
   */
  async oauth2Login(request: OAuth2LoginRequest): Promise<any> {
    const response = await apiClient.post(
      `${this.baseUrl}/oauth2/login`,
      {
        provider: request.provider,
        code: request.code,
        redirect_uri: request.redirectUri
      }
    )
    // apiClient가 이미 response.data를 반환하므로 그대로 반환
    return response
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/logout`)
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${this.baseUrl}/refresh`,
      request
    )
    return response.data
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      `${this.baseUrl}/me`
    )
    return response.data
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(userId: string, data: UserUpdateRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      `${this.baseUrl}/users/${userId}`,
      data
    )
    return response.data
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(data: PasswordChangeRequest): Promise<void> {
    await apiClient.put(`${this.baseUrl}/change-password`, data)
  }

  /**
   * OAuth2 인증 URL 가져오기
   */
  async getOAuth2Url(provider: 'google' | 'github', redirectUri: string): Promise<string> {
    const response = await apiClient.get<{ auth_url: string }>(
      `${this.baseUrl}/oauth2/url/${provider}`,
      {
        params: { redirect_uri: redirectUri }
      }
    )
    return response.auth_url
  }

  /**
   * 회원가입
   */
  async register(credentials: LoginCredentials & { name: string }): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${this.baseUrl}/register`,
      credentials
    )
    return response.data
  }

  /**
   * 이메일 인증
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/verify-email`, { token })
  }

  /**
   * 비밀번호 재설정 요청
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/forgot-password`, { email })
  }

  /**
   * 비밀번호 재설정
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/reset-password`, { 
      token, 
      newPassword 
    })
  }
}
