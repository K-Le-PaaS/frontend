import React from 'react'
import { Link } from 'react-router-dom'
import { BaseComponentProps } from '@/types'
import { cn } from '@/utils'
import { 
  Home, 
  Server, 
  GitBranch, 
  Settings, 
  BarChart3, 
  Shield,
  X
} from 'lucide-react'

interface SidebarProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: Home },
  { name: 'Kubernetes', href: '/kubernetes', icon: Server },
  { name: '배포 파이프라인', href: '/deployments', icon: GitBranch },
  { name: '모니터링', href: '/monitoring', icon: BarChart3 },
  { name: 'MCP 서버', href: '/mcp', icon: Shield },
  { name: '설정', href: '/settings', icon: Settings },
]

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPath = '/',
  onNavigate,
  className,
}) => {
  const handleNavigation = (href: string) => {
    onNavigate?.(href)
    onClose()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPath === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              K-Le-PaaS v1.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
