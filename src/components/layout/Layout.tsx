import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BaseComponentProps } from '@/types'
import { cn } from '@/utils'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

interface LayoutProps extends BaseComponentProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleNotificationClick = () => {
    // TODO: Implement notification handling
    console.log('Notification clicked')
  }

  const handleProfileClick = () => {
    // TODO: Implement profile handling
    console.log('Profile clicked')
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <Header
        onMenuClick={handleMenuClick}
        onNotificationClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
      />
      
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          currentPath={location.pathname}
        />
        
        <main className="flex-1 lg:ml-64">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}

export default Layout
