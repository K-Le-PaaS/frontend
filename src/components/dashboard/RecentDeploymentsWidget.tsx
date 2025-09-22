import React from 'react'
import { Card, Button } from '@/components'
import { useDashboard } from '@/contexts/DashboardContext'
import { GitBranch, CheckCircle, XCircle, Clock, Play, RefreshCw } from 'lucide-react'
import { cn } from '@/utils'

interface RecentDeploymentsWidgetProps {
  className?: string
}

export const RecentDeploymentsWidget: React.FC<RecentDeploymentsWidgetProps> = ({ className }) => {
  const { dashboardData } = useDashboard()
  
  if (!dashboardData?.recentDeployments) {
    return (
      <Card className={cn('h-full', className)}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">배포 데이터를 불러올 수 없습니다.</div>
        </div>
      </Card>
    )
  }

  const data = dashboardData.recentDeployments
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'running':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '성공'
      case 'failed':
        return '실패'
      case 'pending':
        return '대기중'
      case 'running':
        return '실행중'
      default:
        return '알 수 없음'
    }
  }


  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '방금 전'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
    return date.toLocaleDateString()
  }

  return (
    <Card className={cn('h-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">최근 배포</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            성공률 {((data.deployments.filter(d => d.status === 'running').length / data.deployments.length) * 100).toFixed(1)}%
          </span>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {data.deployments.map((deployment) => (
          <div
            key={deployment.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <GitBranch className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {deployment.name}
                </div>
                <div className="text-sm text-gray-500">
                  {deployment.branch} • {deployment.author} • {formatTimestamp(deployment.timestamp)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {getStatusIcon(deployment.status)}
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full', getStatusColor(deployment.status))}>
                  {getStatusText(deployment.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.deployments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>최근 배포가 없습니다</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500">
          <span>총 {data.deployments.length}개 배포</span>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            전체 보기
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default RecentDeploymentsWidget
