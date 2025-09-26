import React from 'react'
import { Card } from '@/components'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/contexts/DashboardContext'
import { usePermissions } from '@/utils/permissions'
import { 
  PlusCircle, 
  GitBranch, 
  Server, 
  BarChart3, 
  Settings, 
  Shield,
  Play,
  RefreshCw,
  Upload,
  Download
} from 'lucide-react'
import { cn } from '@/utils'

interface QuickActionsWidgetProps {
  className?: string
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ className }) => {
  const { dashboardData } = useDashboard()
  const { user } = useAuth()
  const permissions = usePermissions(user?.role ?? 'viewer')
  
  if (!dashboardData?.quickActions) {
    return (
      <Card className={cn('h-full', className)}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">빠른 작업 데이터를 불러올 수 없습니다.</div>
        </div>
      </Card>
    )
  }

  const data = dashboardData.quickActions

  const getActionIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
      'plus': PlusCircle,
      'git': GitBranch,
      'server': Server,
      'chart': BarChart3,
      'settings': Settings,
      'shield': Shield,
      'play': Play,
      'refresh': RefreshCw,
      'upload': Upload,
      'download': Download,
    }
    
    const IconComponent = iconMap[iconName] || PlusCircle
    return <IconComponent className="h-5 w-5" />
  }

  const canPerformAction = (action: { permissions: string[]; enabled: boolean }) => {
    if (!action.enabled) return false
    return action.permissions.length === 0 || permissions.hasAnyPermission(action.permissions)
  }

  return (
    <Card className={cn('h-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">빠른 작업</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.actions.map((action) => {
          const canPerform = canPerformAction(action)
          
          return (
            <button
              key={action.id}
              disabled={!canPerform}
              onClick={() => {
                if (canPerform && action.path) {
                  window.location.href = action.path
                }
              }}
              className={cn(
                'p-4 rounded-lg border-2 border-dashed transition-all duration-200 text-left',
                canPerform
                  ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
              )}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={cn(
                  'p-2 rounded-full',
                  canPerform ? 'text-blue-600 bg-blue-100' : 'text-gray-400 bg-gray-200'
                )}>
                  {getActionIcon(action.icon)}
                </div>
                <div className="text-center">
                  <div className={cn(
                    'text-sm font-medium',
                    canPerform ? 'text-gray-900' : 'text-gray-500'
                  )}>
                    {action.title}
                  </div>
                  <div className={cn(
                    'text-xs mt-1',
                    canPerform ? 'text-gray-600' : 'text-gray-400'
                  )}>
                    {action.description}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {data.actions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <PlusCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>사용 가능한 작업이 없습니다</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            역할에 따라 사용 가능한 작업이 다릅니다
          </p>
        </div>
      </div>
    </Card>
  )
}

export default QuickActionsWidget
