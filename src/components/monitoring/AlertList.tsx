import React from 'react'
import { Card } from '@/components'
import { Alert } from '@/services/monitoringService'
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/utils'

interface AlertListProps {
  alerts: Alert[]
  className?: string
}

export const AlertList: React.FC<AlertListProps> = ({ alerts, className }) => {
  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: Alert['status']) => {
    return status === 'firing' ? (
      <div className="w-2 h-2 bg-red-500 rounded-full" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-500" />
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  if (alerts.length === 0) {
    return (
      <Card className={className || ''}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">알림</h3>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">현재 활성 알림이 없습니다</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className || ''}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">알림</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">총 {alerts.length}개</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs text-gray-500">활성</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md',
                getSeverityColor(alert.severity)
              )}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {alert.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(alert.status)}
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {alert.source}
                    </span>
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'error' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    )}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default AlertList
