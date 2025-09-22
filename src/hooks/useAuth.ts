import { useState, useEffect, useCallback } from 'react'
import { User, AuthState } from '@/types'
import { storage } from '@/utils'

const AUTH_STORAGE_KEY = 'k-le-paas-auth'

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedAuth = storage.get<AuthState>(AUTH_STORAGE_KEY)
    if (savedAuth?.user && savedAuth?.token) {
      setAuthState({
        ...savedAuth,
        isLoading: false,
      })
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Save auth state to localStorage
  useEffect(() => {
    if (authState.user && authState.token) {
      storage.set(AUTH_STORAGE_KEY, authState)
    } else {
      storage.remove(AUTH_STORAGE_KEY)
    }
  }, [authState])

  const login = useCallback((user: User, token: string) => {
    setAuthState({
      user,
      token,
      refreshToken: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
  }, [])

  const logout = useCallback(() => {
    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  }, [])

  const updateUser = useCallback((user: User) => {
    setAuthState(prev => ({
      ...prev,
      user,
    }))
  }, [])

  const hasRole = useCallback((role: string) => {
    return authState.user?.role === role
  }, [authState.user?.role])

  const hasAnyRole = useCallback((roles: string[]) => {
    return authState.user ? roles.includes(authState.user.role) : false
  }, [authState.user])

  return {
    ...authState,
    login,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
  }
}
