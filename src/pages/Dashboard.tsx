import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/contexts/DashboardContext'
import { PermissionGate } from '@/utils/permissions.tsx'
import {
  ClusterStatusWidget,
  RecentDeploymentsWidget,
  ResourceUsageWidget,
  AlertsWidget,
  QuickActionsWidget,
} from '@/components/dashboard'
import { Card } from '@/components'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { dashboardData, isLoading, error } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">오류가 발생했습니다</h2>
            <p className="text-red-700 mb-4">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const userRole = user?.role || 'viewer' // 기본값은 'viewer'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 섹션 */}
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-4">
              환영합니다, {user?.name || '사용자'}!
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {userRole === 'owner' && '전체 시스템 현황을 한눈에 확인하고 관리하세요.'}
              {userRole === 'developer' && '현재 진행 중인 배포 및 리소스 현황을 확인하세요.'}
              {userRole === 'viewer' && '시스템의 주요 지표를 확인하세요.'}
            </p>
          </div>
          
          {/* 사용자 역할 표시 */}
          <div className="flex justify-center">
            <span className={`badge text-sm px-4 py-2 ${
              userRole === 'owner' ? 'badge-primary' :
              userRole === 'developer' ? 'badge-success' :
              'badge-gray'
            }`}>
              {userRole === 'owner' ? '관리자' :
               userRole === 'developer' ? '개발자' :
               '뷰어'}
            </span>
          </div>
        </div>

        {/* 요약 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="elevated" className="hover-lift group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">활성 배포</h3>
                <p className="text-4xl font-bold text-primary-600 group-hover:scale-110 transition-transform duration-200">
                  {dashboardData?.summary?.activeDeployments || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">현재 운영 중인 배포</p>
              </div>
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <div className="w-8 h-8 bg-primary-600 rounded-lg"></div>
              </div>
            </div>
          </Card>
          
          <Card variant="elevated" className="hover-lift group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Kubernetes 리소스</h3>
                <p className="text-4xl font-bold text-success-600 group-hover:scale-110 transition-transform duration-200">
                  {dashboardData?.summary?.kubernetesResources || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">총 관리 리소스</p>
              </div>
              <div className="w-16 h-16 bg-success-100 rounded-2xl flex items-center justify-center group-hover:bg-success-200 transition-colors">
                <div className="w-8 h-8 bg-success-600 rounded-lg"></div>
              </div>
            </div>
          </Card>
          
          <Card variant="elevated" className="hover-lift group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">MCP 서버</h3>
                <p className="text-4xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-200">
                  {dashboardData?.summary?.mcpServers || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">연결된 멀티클라우드 서버</p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
              </div>
            </div>
          </Card>
          
          <Card variant="elevated" className="hover-lift group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">미해결 알림</h3>
                <p className="text-4xl font-bold text-error-600 group-hover:scale-110 transition-transform duration-200">
                  {dashboardData?.summary?.unresolvedAlerts || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">처리 필요한 알림</p>
              </div>
              <div className="w-16 h-16 bg-error-100 rounded-2xl flex items-center justify-center group-hover:bg-error-200 transition-colors">
                <div className="w-8 h-8 bg-error-600 rounded-lg"></div>
              </div>
            </div>
          </Card>
        </div>

        {/* 위젯 그리드 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <PermissionGate userRole={userRole} permission="dashboard:view_cluster_status">
            <div className="xl:col-span-2">
              <ClusterStatusWidget />
            </div>
          </PermissionGate>

          <PermissionGate userRole={userRole} permission="dashboard:view_quick_actions">
            <div>
              <QuickActionsWidget />
            </div>
          </PermissionGate>

          <PermissionGate userRole={userRole} permission="dashboard:view_recent_deployments">
            <div className="xl:col-span-2">
              <RecentDeploymentsWidget />
            </div>
          </PermissionGate>

          <PermissionGate userRole={userRole} permission="dashboard:view_alerts">
            <div>
              <AlertsWidget />
            </div>
          </PermissionGate>

          <PermissionGate userRole={userRole} permission="dashboard:view_resource_usage">
            <div className="xl:col-span-3">
              <ResourceUsageWidget />
            </div>
          </PermissionGate>
        </div>
      </div>
    </div>
  )
}

export default Dashboard