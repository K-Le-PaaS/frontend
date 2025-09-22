import React from 'react'
import { Link } from 'react-router-dom'
import { BaseComponentProps } from '@/types'
import { cn } from '@/utils'
import { useAuth } from '@/contexts/AuthContext'
import Button from '../ui/Button'
import { Menu, Bell, User, LogOut } from 'lucide-react'

interface HeaderProps extends BaseComponentProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onMenuClick?: () => void
  onNotificationClick?: () => void
  onProfileClick?: () => void
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onNotificationClick,
  onProfileClick,
  className,
}) => {
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  return (
    <header className={cn('bg-white shadow-sm border-b border-gray-200', className)}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick || (() => {})}
              className="mr-4"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="text-xl font-semibold text-gray-900">
              K-Le-PaaS
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNotificationClick || (() => {})}
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onProfileClick || (() => {})}
                    className="p-1"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <User className="h-8 w-8 rounded-full bg-gray-200 p-1" />
                    )}
                  </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="p-1"
                      >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Link to="/login">
                <Button
                  variant="primary"
                  size="sm"
                >
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
