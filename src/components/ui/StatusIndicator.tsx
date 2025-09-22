import React from 'react'
import { cn } from '@/utils'
import { CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'pending'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200'
        }
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200'
        }
      case 'info':
        return {
          icon: AlertCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200'
        }
      case 'loading':
        return {
          icon: Loader2,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200'
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200'
        }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'h-3 w-3',
          text: 'text-xs'
        }
      case 'md':
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'h-4 w-4',
          text: 'text-sm'
        }
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'h-5 w-5',
          text: 'text-base'
        }
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'h-4 w-4',
          text: 'text-sm'
        }
    }
  }

  const config = getStatusConfig()
  const sizeClasses = getSizeClasses()
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        config.bgColor,
        config.borderColor,
        sizeClasses.container,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            config.color,
            sizeClasses.icon,
            status === 'loading' && 'animate-spin'
          )}
        />
      )}
      {label && (
        <span className={cn(config.color, sizeClasses.text)}>
          {label}
        </span>
      )}
    </div>
  )
}

// Kubernetes 리소스 상태용 특화 컴포넌트
export const K8sStatusIndicator: React.FC<{
  status: string
  readyReplicas?: number
  totalReplicas?: number
  size?: 'sm' | 'md' | 'lg'
}> = ({ status, readyReplicas, totalReplicas, size = 'md' }) => {
  const getK8sStatus = () => {
    if (status === 'Running' || status === 'Available') {
      return 'success'
    } else if (status === 'Pending' || status === 'ContainerCreating') {
      return 'loading'
    } else if (status === 'Failed' || status === 'CrashLoopBackOff') {
      return 'error'
    } else if (status === 'Warning') {
      return 'warning'
    } else {
      return 'info'
    }
  }

  const getK8sLabel = () => {
    if (readyReplicas !== undefined && totalReplicas !== undefined) {
      return `${readyReplicas}/${totalReplicas} ready`
    }
    return status
  }

  return (
    <StatusIndicator
      status={getK8sStatus()}
      label={getK8sLabel()}
      size={size}
    />
  )
}

export default StatusIndicator


