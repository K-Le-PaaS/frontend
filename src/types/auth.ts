// 인증 관련 타입 정의
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  provider: AuthProvider
  providerId: string
  verified: boolean
  createdAt: string
  updatedAt: string
}

export type UserRole = 'owner' | 'developer' | 'viewer'

export type AuthProvider = 'google' | 'github' | 'local'

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface OAuth2LoginRequest {
  provider: AuthProvider
  code: string
  redirectUri: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export interface UserUpdateRequest {
  name?: string
  email?: string
  avatar?: string
}

// 권한 관련 타입
export interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 에러 타입
export interface AuthError {
  code: string
  message: string
  details?: Record<string, any>
}
