import React from 'react'
import { Card } from '@/components'
import { useDashboard } from '@/contexts/DashboardContext'
import { Server, CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react'
import { cn } from '@/utils'

interface ClusterStatusWidgetProps {
  className?: string
}

export const ClusterStatusWidget: React.FC<ClusterStatusWidgetProps> = ({ className }) => {
  const { dashboardData } = useDashboard()
  
  if (!dashboardData?.clusterStatus) {
    return (
      <Card className={cn('h-full', className)}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">클러스터 상태 데이터를 불러올 수 없습니다.</div>
        </div>
      </Card>
    )
  }

  const data = dashboardData.clusterStatus
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getOverallStatus = () => {
    if (data.status === 'healthy') return 'healthy'
    if (data.status === 'warning') return 'warning'
    return 'error'
  }

  const overallStatus = getOverallStatus()

  return (
    <Card className={cn('h-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">클러스터 상태</h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon(overallStatus)}
          <span className={cn('text-sm font-medium px-2 py-1 rounded-full', getStatusColor(overallStatus))}>
            {overallStatus === 'healthy' ? '정상' : overallStatus === 'warning' ? '경고' : '오류'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">1</div>
          <div className="text-sm text-gray-500">전체</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{data.status === 'healthy' ? 1 : 0}</div>
          <div className="text-sm text-gray-500">정상</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{data.status === 'error' ? 1 : 0}</div>
          <div className="text-sm text-gray-500">오류</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">{data.clusterName}</div>
              <div className="text-sm text-gray-500">{data.nodeCount}개 노드</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(data.status)}
            <span className="text-xs text-gray-500">
              {new Date(data.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ClusterStatusWidget
