import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { AuthState, User, LoginCredentials, OAuth2LoginRequest, UserUpdateRequest, PasswordChangeRequest } from '@/types'
import { AuthService } from '@/services/authService'
import { storage } from '@/utils'

// 액션 타입 정의
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_UPDATE_USER'; payload: User }
  | { type: 'AUTH_CLEAR_ERROR' }

// 초기 상태
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

// 리듀서
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        error: null
      }
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

// 컨텍스트 타입 정의
interface AuthContextType extends AuthState {
  // 인증 관련 함수들
  login: (credentials: LoginCredentials) => Promise<void>
  oauth2Login: (request: OAuth2LoginRequest) => Promise<void>
  logout: () => Promise<void>
  register: (credentials: LoginCredentials & { name: string }) => Promise<void>
  
  // 사용자 관리 함수들
  updateUser: (data: UserUpdateRequest) => Promise<void>
  changePassword: (data: PasswordChangeRequest) => Promise<void>
  
  // 유틸리티 함수들
  clearError: () => void
  refreshAuth: () => Promise<void>
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider 컴포넌트
interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const authService = new AuthService()

  // 토큰 저장/로드 함수들
  const saveTokens = (token: string, refreshToken: string) => {
    storage.set('auth_token', token)
    storage.set('refresh_token', refreshToken)
  }

  const loadTokens = () => {
    const token = storage.get('auth_token')
    const refreshToken = storage.get('refresh_token')
    return { token, refreshToken }
  }

  const clearTokens = () => {
    storage.remove('auth_token')
    storage.remove('refresh_token')
  }

  // 앱 시작 시 토큰 확인 및 사용자 정보 로드
  useEffect(() => {
    let isMounted = true // 무한 루프 방지
    
    const initializeAuth = async () => {
      try {
        const { token, refreshToken } = loadTokens()
        
        if (!isMounted) return // 컴포넌트가 언마운트되었으면 중단
        
        if (token && refreshToken) {
          // 토큰이 있으면 사용자 정보 가져오기
          const user = await authService.getCurrentUser()
          
          if (!isMounted) return // 다시 한번 확인
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token: token as string, refreshToken: refreshToken as string }
          })
        } else {
          if (!isMounted) return
          dispatch({ type: 'AUTH_LOGOUT' })
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Auth initialization failed:', error)
        clearTokens()
        dispatch({ type: 'AUTH_LOGOUT' })
      }
    }

    initializeAuth()
    
    // cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  // 로그인 함수
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await authService.login(credentials)
      saveTokens(response.token, response.refreshToken)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken
        }
      })
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || '로그인에 실패했습니다.'
      })
      throw error
    }
  }, [])

  // OAuth2 로그인 함수
  const oauth2Login = useCallback(async (request: OAuth2LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await authService.oauth2Login(request)
      
      // 응답이 유효한지 확인
      if (!response) {
        throw new Error('서버로부터 응답을 받지 못했습니다.')
      }
      
      // 백엔드 응답 구조에 맞게 처리
      const token = response.access_token || response.token
      const refreshToken = response.refresh_token || response.refreshToken || token // refreshToken이 없으면 token 사용
      
      if (!token) {
        console.error('OAuth2 응답 구조:', response)
        throw new Error('토큰을 받지 못했습니다.')
      }
      
      saveTokens(token, refreshToken)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: token,
          refreshToken: refreshToken
        }
      })
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || error.message || 'OAuth2 로그인에 실패했습니다.'
      })
      throw error
    }
  }, [])

  // 로그아웃 함수
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearTokens()
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }

  // 회원가입 함수
  const register = async (credentials: LoginCredentials & { name: string }) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await authService.register(credentials)
      saveTokens(response.token, response.refreshToken)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken
        }
      })
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || '회원가입에 실패했습니다.'
      })
      throw error
    }
  }

  // 사용자 정보 업데이트 함수
  const updateUser = async (data: UserUpdateRequest) => {
    try {
      if (!state.user) throw new Error('사용자 정보가 없습니다.')
      
      const updatedUser = await authService.updateUser(state.user.id, data)
      dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser })
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || '사용자 정보 업데이트에 실패했습니다.'
      })
      throw error
    }
  }

  // 비밀번호 변경 함수
  const changePassword = async (data: PasswordChangeRequest) => {
    try {
      await authService.changePassword(data)
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || '비밀번호 변경에 실패했습니다.'
      })
      throw error
    }
  }

  // 에러 클리어 함수
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }, [])

  // 인증 정보 새로고침 함수
  const refreshAuth = async () => {
    try {
      const { refreshToken } = loadTokens()
      if (!refreshToken) throw new Error('Refresh token not found')

      const response = await authService.refreshToken({ refreshToken: refreshToken as string })
      saveTokens(response.token, response.refreshToken)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken
        }
      })
    } catch (error) {
      console.error('Token refresh failed:', error)
      clearTokens()
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }

  const value: AuthContextType = useMemo(() => ({
    ...state,
    login,
    oauth2Login,
    logout,
    register,
    updateUser,
    changePassword,
    clearError,
    refreshAuth
  }), [state, login, oauth2Login, logout, register, updateUser, changePassword, clearError, refreshAuth])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
