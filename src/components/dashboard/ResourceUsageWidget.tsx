import React from 'react'
import { Card } from '@/components'
import { useDashboard } from '@/contexts/DashboardContext'
import { Cpu, HardDrive, Wifi, Activity } from 'lucide-react'
import { cn } from '@/utils'

interface ResourceUsageWidgetProps {
  className?: string
}

export const ResourceUsageWidget: React.FC<ResourceUsageWidgetProps> = ({ className }) => {
  const { dashboardData } = useDashboard()
  
  if (!dashboardData?.resourceUsage) {
    return (
      <Card className={cn('h-full', className)}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">리소스 사용량 데이터를 불러올 수 없습니다.</div>
        </div>
      </Card>
    )
  }

  const data = dashboardData.resourceUsage
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatNetworkSpeed = (bytes: number) => {
    return formatBytes(bytes) + '/s'
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

  const ResourceBar = ({ 
    label, 
    used, 
    total, 
    percentage, 
    icon: Icon, 
    format = formatBytes 
  }: {
    label: string
    used: number
    total: number
    percentage: number
    icon: React.ComponentType<any>
    format?: (value: number) => string
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className={cn('text-sm font-medium', getUsageColor(percentage))}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            getUsageBgColor(percentage)
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{format(used)}</span>
        <span>{format(total)}</span>
      </div>
    </div>
  )

  return (
    <Card className={cn('h-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">리소스 사용량</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="space-y-6">
        <ResourceBar
          label="CPU"
          used={data.cpu.used}
          total={data.cpu.total}
          percentage={data.cpu.percentage}
          icon={Cpu}
          format={(value) => `${value.toFixed(1)}%`}
        />

        <ResourceBar
          label="메모리"
          used={data.memory.used}
          total={data.memory.total}
          percentage={data.memory.percentage}
          icon={HardDrive}
        />

        <ResourceBar
          label="스토리지"
          used={data.storage.used}
          total={data.storage.total}
          percentage={data.storage.percentage}
          icon={HardDrive}
        />

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">네트워크</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">
                {formatNetworkSpeed(data.network.in)}
              </div>
              <div className="text-xs text-blue-500">인바운드</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                {formatNetworkSpeed(data.network.out)}
              </div>
              <div className="text-xs text-green-500">아웃바운드</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">전체 상태</span>
          <span className={cn(
            'font-medium',
            data.cpu.percentage >= 90 || data.memory.percentage >= 90 || data.storage.percentage >= 90
              ? 'text-red-600'
              : data.cpu.percentage >= 70 || data.memory.percentage >= 70 || data.storage.percentage >= 70
              ? 'text-yellow-600'
              : 'text-green-600'
          )}>
            {data.cpu.percentage >= 90 || data.memory.percentage >= 90 || data.storage.percentage >= 90
              ? '위험'
              : data.cpu.percentage >= 70 || data.memory.percentage >= 70 || data.storage.percentage >= 70
              ? '주의'
              : '정상'}
          </span>
        </div>
      </div>
    </Card>
  )
}

export default ResourceUsageWidget
