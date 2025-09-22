import React, { useState, useEffect, useCallback } from 'react'
import { Card, Button, SkeletonLoader } from '@/components'
import { Activity, AlertTriangle, TrendingUp, Server, RefreshCw, Settings } from 'lucide-react'
import { MonitoringService, ResourceMetrics, Alert, SystemHealth } from '@/services/monitoringService'
import { ResourceChart, AlertList } from '@/components/monitoring'
import { cn } from '@/utils'

const Monitoring: React.FC = () => {
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval] = useState(5000) // 5초

  // 실시간 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setError(null)
      
      const [resourceData, alertsData, healthData] = await Promise.all([
        MonitoringService.getResourceMetrics(),
        MonitoringService.getAlerts(),
        MonitoringService.getSystemHealth()
      ])
      
      setResourceMetrics(resourceData)
      setAlerts(alertsData)
      setSystemHealth(healthData)
    } catch (err) {
      console.error('Failed to load monitoring data:', err)
      setError('모니터링 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval)
      return () => clearInterval(interval)
    }
    return undefined
  }, [autoRefresh, refreshInterval, loadData])

  // 초기 데이터 로드
  useEffect(() => {
    loadData()
  }, [loadData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'unhealthy':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return '정상'
      case 'degraded':
        return '성능 저하'
      case 'unhealthy':
        return '비정상'
      default:
        return '알 수 없음'
    }
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getUsageBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-100'
    if (percentage >= 70) return 'bg-yellow-100'
    return 'bg-green-100'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <SkeletonLoader className="h-8 w-48 mb-2" />
            <SkeletonLoader className="h-4 w-64" />
          </div>
          <SkeletonLoader className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div className="p-6">
                <SkeletonLoader className="h-16 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">모니터링</h1>
          <p className="text-gray-600">시스템 상태 및 성능 모니터링</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && 'bg-green-100 text-green-700')}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            {autoRefresh ? '자동 새로고침' : '수동 새로고침'}
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="secondary">
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* 상태 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className={cn('p-2 rounded-lg', getUsageBgColor(systemHealth?.status === 'healthy' ? 0 : 100))}>
                <Server className={cn('h-6 w-6', getStatusColor(systemHealth?.status || 'unknown'))} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">클러스터 상태</p>
                <p className={cn('text-2xl font-bold', getStatusColor(systemHealth?.status || 'unknown'))}>
                  {getStatusText(systemHealth?.status || 'unknown')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className={cn('p-2 rounded-lg', getUsageBgColor(resourceMetrics?.cpu.percentage || 0))}>
                <TrendingUp className={cn('h-6 w-6', getUsageColor(resourceMetrics?.cpu.percentage || 0))} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">CPU 사용률</p>
                <p className={cn('text-2xl font-bold', getUsageColor(resourceMetrics?.cpu.percentage || 0))}>
                  {resourceMetrics?.cpu.percentage.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className={cn('p-2 rounded-lg', getUsageBgColor(resourceMetrics?.memory.percentage || 0))}>
                <Activity className={cn('h-6 w-6', getUsageColor(resourceMetrics?.memory.percentage || 0))} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">메모리 사용률</p>
                <p className={cn('text-2xl font-bold', getUsageColor(resourceMetrics?.memory.percentage || 0))}>
                  {resourceMetrics?.memory.percentage.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">활성 알림</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(alert => alert.status === 'firing').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 차트 및 알림 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertList alerts={alerts} />
        
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">성능 메트릭</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">CPU 사용률</span>
                  <span className="text-gray-900">{resourceMetrics?.cpu.percentage.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn('h-2 rounded-full transition-all duration-300', getUsageBgColor(resourceMetrics?.cpu.percentage || 0))}
                    style={{ width: `${Math.min(resourceMetrics?.cpu.percentage || 0, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">메모리 사용률</span>
                  <span className="text-gray-900">{resourceMetrics?.memory.percentage.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn('h-2 rounded-full transition-all duration-300', getUsageBgColor(resourceMetrics?.memory.percentage || 0))}
                    style={{ width: `${Math.min(resourceMetrics?.memory.percentage || 0, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">스토리지 사용률</span>
                  <span className="text-gray-900">{resourceMetrics?.storage.percentage.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn('h-2 rounded-full transition-all duration-300', getUsageBgColor(resourceMetrics?.storage.percentage || 0))}
                    style={{ width: `${Math.min(resourceMetrics?.storage.percentage || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 리소스 사용률 차트 */}
      <ResourceChart
        cpuData={[]} // TODO: 시계열 데이터 구현
        memoryData={[]}
        storageData={[]}
      />
    </div>
  )
}

export default Monitoring
