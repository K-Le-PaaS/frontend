import React from 'react'
import { BaseComponentProps } from '@/types'
import { cn } from '@/utils'

interface FooterProps extends BaseComponentProps {
  version?: string
}

const Footer: React.FC<FooterProps> = ({
  version = '1.0.0',
  className,
}) => {
  return (
    <footer className={cn('bg-gray-50 border-t border-gray-200', className)}>
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-500">
            © 2024 K-Le-PaaS. All rights reserved.
          </div>
          <div className="text-sm text-gray-500 mt-2 sm:mt-0">
            Version {version}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
