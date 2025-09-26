import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'owner' | 'developer' | 'viewer'
  requiredPermissions?: string[]
  requireAll?: boolean
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireAll = false,
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // 개발 모드에서는 인증 우회 (임시)
  const isDevelopment = true // 임시로 비활성화
  
  if (isDevelopment) {
    return <>{children}</>
  }

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // 인증되지 않은 경우
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // 역할 체크
  if (requiredRole && user.role !== requiredRole) {
    // 역할이 부족한 경우 대시보드로 리다이렉트
    return <Navigate to="/dashboard" replace />
  }

  // 권한 체크
  if (requiredPermissions.length > 0) {
    const userPermissions = getUserPermissions(user.role)
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(permission => userPermissions.includes(permission))
      : requiredPermissions.some(permission => userPermissions.includes(permission))

    if (!hasRequiredPermissions) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

// 사용자 역할에 따른 권한 반환 (임시 구현)
const getUserPermissions = (role: string): string[] => {
  const permissions: Record<string, string[]> = {
    owner: ['*'], // 모든 권한
    developer: [
      'k8s:read', 'k8s:write', 'k8s:delete',
      'deployment:read', 'deployment:write', 'deployment:delete', 'deployment:deploy', 'deployment:rollback',
      'monitoring:read',
      'settings:read',
      'mcp:read'
    ],
    viewer: [
      'k8s:read',
      'deployment:read',
      'monitoring:read',
      'settings:read',
      'mcp:read'
    ]
  }
  
  return permissions[role] || []
}

export default ProtectedRoute
