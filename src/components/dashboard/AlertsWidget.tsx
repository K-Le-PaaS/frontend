import React from 'react'
import { Card, Button } from '@/components'
import { useDashboard } from '@/contexts/DashboardContext'
import { Bell, AlertTriangle, AlertCircle, Info, XCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/utils'

interface AlertsWidgetProps {
  className?: string
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({ className }) => {
  const { dashboardData } = useDashboard()
  
  if (!dashboardData?.alerts) {
    return (
      <Card className={cn('h-full', className)}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">알림 데이터를 불러올 수 없습니다.</div>
        </div>
      </Card>
    )
  }

  const data = dashboardData.alerts
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '심각'
      case 'error':
        return '오류'
      case 'warning':
        return '경고'
      case 'info':
        return '정보'
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

  const getUnreadCount = () => {
    return data.alerts.filter(alert => alert.status === 'firing').length
  }

  return (
    <Card className={cn('h-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">알림</h3>
          {getUnreadCount() > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {getUnreadCount()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {data.alerts.filter(alert => alert.severity === 'critical' && alert.status === 'firing').length}개 심각
          </span>
          <Button variant="ghost" size="sm">
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {data.alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'p-3 rounded-lg border-l-4',
              getSeverityColor(alert.severity),
              alert.status === 'firing' && 'ring-1 ring-red-200'
            )}
          >
            <div className="flex items-start space-x-3">
              {getSeverityIcon(alert.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {alert.title}
                  </h4>
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    alert.severity === 'critical' ? 'text-red-800 bg-red-200' :
                    alert.severity === 'error' ? 'text-red-800 bg-red-200' :
                    alert.severity === 'warning' ? 'text-yellow-800 bg-yellow-200' :
                    'text-blue-800 bg-blue-200'
                  )}>
                    {getSeverityText(alert.severity)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {alert.message}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{alert.source}</span>
                  <span>{formatTimestamp(alert.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.alerts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>알림이 없습니다</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            총 {data.alerts.length}개 알림
          </span>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            전체 보기
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default AlertsWidget
