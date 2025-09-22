import { UserRole } from '@/types'

// 권한 정의
export const PERMISSIONS = {
  // 사용자 관리
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // Kubernetes 리소스 관리
  K8S_READ: 'k8s:read',
  K8S_WRITE: 'k8s:write',
  K8S_DELETE: 'k8s:delete',
  
  // 배포 관리
  DEPLOYMENT_READ: 'deployment:read',
  DEPLOYMENT_WRITE: 'deployment:write',
  DEPLOYMENT_DELETE: 'deployment:delete',
  DEPLOYMENT_DEPLOY: 'deployment:deploy',
  DEPLOYMENT_ROLLBACK: 'deployment:rollback',
  
  // 모니터링
  MONITORING_READ: 'monitoring:read',
  MONITORING_WRITE: 'monitoring:write',
  
  // 설정 관리
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  
  // MCP 서버 관리
  MCP_READ: 'mcp:read',
  MCP_WRITE: 'mcp:write',
  MCP_DELETE: 'mcp:delete',
  
  // 시스템 관리
  SYSTEM_READ: 'system:read',
  SYSTEM_WRITE: 'system:write',
  SYSTEM_DELETE: 'system:delete',
  
  // 대시보드 권한
  DASHBOARD_VIEW_CLUSTER_STATUS: 'dashboard:view_cluster_status',
  DASHBOARD_VIEW_RECENT_DEPLOYMENTS: 'dashboard:view_recent_deployments',
  DASHBOARD_VIEW_RESOURCE_USAGE: 'dashboard:view_resource_usage',
  DASHBOARD_VIEW_ALERTS: 'dashboard:view_alerts',
  DASHBOARD_VIEW_QUICK_ACTIONS: 'dashboard:view_quick_actions',
  DASHBOARD_VIEW_MCP_SERVERS: 'dashboard:view_mcp_servers'
} as const

// 역할별 권한 매핑
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: [
    // 모든 권한
    ...Object.values(PERMISSIONS)
  ],
  developer: [
    // 사용자 읽기
    PERMISSIONS.USER_READ,
    
    // Kubernetes 리소스 관리
    PERMISSIONS.K8S_READ,
    PERMISSIONS.K8S_WRITE,
    PERMISSIONS.K8S_DELETE,
    
    // 배포 관리
    PERMISSIONS.DEPLOYMENT_READ,
    PERMISSIONS.DEPLOYMENT_WRITE,
    PERMISSIONS.DEPLOYMENT_DELETE,
    PERMISSIONS.DEPLOYMENT_DEPLOY,
    PERMISSIONS.DEPLOYMENT_ROLLBACK,
    
    // 모니터링
    PERMISSIONS.MONITORING_READ,
    
    // 설정 읽기
    PERMISSIONS.SETTINGS_READ,
    
    // MCP 서버 읽기
    PERMISSIONS.MCP_READ,
    
    // 대시보드 권한
    PERMISSIONS.DASHBOARD_VIEW_CLUSTER_STATUS,
    PERMISSIONS.DASHBOARD_VIEW_RECENT_DEPLOYMENTS,
    PERMISSIONS.DASHBOARD_VIEW_RESOURCE_USAGE,
    PERMISSIONS.DASHBOARD_VIEW_ALERTS,
    PERMISSIONS.DASHBOARD_VIEW_QUICK_ACTIONS,
    PERMISSIONS.DASHBOARD_VIEW_MCP_SERVERS
  ],
  viewer: [
    // 읽기 전용 권한
    PERMISSIONS.USER_READ,
    PERMISSIONS.K8S_READ,
    PERMISSIONS.DEPLOYMENT_READ,
    PERMISSIONS.MONITORING_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.MCP_READ,
    
    // 대시보드 읽기 권한
    PERMISSIONS.DASHBOARD_VIEW_CLUSTER_STATUS,
    PERMISSIONS.DASHBOARD_VIEW_RECENT_DEPLOYMENTS,
    PERMISSIONS.DASHBOARD_VIEW_RESOURCE_USAGE,
    PERMISSIONS.DASHBOARD_VIEW_ALERTS
  ]
}

// 권한 체크 함수들
export class PermissionManager {
  /**
   * 사용자가 특정 권한을 가지고 있는지 확인
   */
  static hasPermission(userRole: UserRole, permission: string): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || []
    return rolePermissions.includes(permission)
  }

  /**
   * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
   */
  static hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission))
  }

  /**
   * 사용자가 모든 권한을 가지고 있는지 확인
   */
  static hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission))
  }

  /**
   * 사용자 역할의 모든 권한 반환
   */
  static getRolePermissions(userRole: UserRole): string[] {
    return ROLE_PERMISSIONS[userRole] || []
  }

  /**
   * 리소스별 권한 확인
   */
  static canReadResource(userRole: UserRole, resource: string): boolean {
    const permission = `${resource}:read`
    return this.hasPermission(userRole, permission)
  }

  static canWriteResource(userRole: UserRole, resource: string): boolean {
    const permission = `${resource}:write`
    return this.hasPermission(userRole, permission)
  }

  static canDeleteResource(userRole: UserRole, resource: string): boolean {
    const permission = `${resource}:delete`
    return this.hasPermission(userRole, permission)
  }

  /**
   * 특정 액션 권한 확인
   */
  static canDeploy(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.DEPLOYMENT_DEPLOY)
  }

  static canRollback(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.DEPLOYMENT_ROLLBACK)
  }

  static canManageUsers(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.USER_WRITE)
  }

  static canManageSystem(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.SYSTEM_WRITE)
  }

  static canManageMCP(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.MCP_WRITE)
  }
}

// 권한 기반 컴포넌트 래퍼
export interface PermissionGateProps {
  permission: string | string[]
  userRole: UserRole
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAll?: boolean
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  userRole,
  children,
  fallback,
  requireAll = false
}) => {
  const hasPermission = Array.isArray(permission)
    ? (requireAll 
        ? PermissionManager.hasAllPermissions(userRole, permission)
        : PermissionManager.hasAnyPermission(userRole, permission))
    : PermissionManager.hasPermission(userRole, permission)

  return hasPermission ? <>{children}</> : <>{fallback || null}</>
}

// 권한 체크 훅
export const usePermissions = (userRole: UserRole) => {
  return {
    hasPermission: (permission: string) => PermissionManager.hasPermission(userRole, permission),
    hasAnyPermission: (permissions: string[]) => PermissionManager.hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: string[]) => PermissionManager.hasAllPermissions(userRole, permissions),
    canRead: (resource: string) => PermissionManager.canReadResource(userRole, resource),
    canWrite: (resource: string) => PermissionManager.canWriteResource(userRole, resource),
    canDelete: (resource: string) => PermissionManager.canDeleteResource(userRole, resource),
    canDeploy: () => PermissionManager.canDeploy(userRole),
    canRollback: () => PermissionManager.canRollback(userRole),
    canManageUsers: () => PermissionManager.canManageUsers(userRole),
    canManageSystem: () => PermissionManager.canManageSystem(userRole),
    canManageMCP: () => PermissionManager.canManageMCP(userRole),
    getRolePermissions: () => PermissionManager.getRolePermissions(userRole)
  }
}
