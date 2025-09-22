import React from 'react'
import { cn } from '@/utils'
import { AlertCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
  error: string | Error
  type?: 'error' | 'warning' | 'info'
  title?: string
  onRetry?: (() => void) | undefined
  retryText?: string
  className?: string
  showIcon?: boolean
  dismissible?: boolean
  onDismiss?: () => void
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  type = 'error',
  title,
  onRetry,
  retryText = '다시 시도',
  className,
  showIcon = true,
  dismissible = false,
  onDismiss
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          title: title || '오류가 발생했습니다'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          title: title || '경고'
        }
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          title: title || '정보'
        }
      default:
        return {
          icon: AlertCircle,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          title: title || '알림'
        }
    }
  }

  const config = getErrorConfig()
  const Icon = config.icon
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start">
        {showIcon && (
          <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5 mr-3', config.iconColor)} />
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className={cn('text-sm font-medium', config.textColor)}>
            {config.title}
          </h3>
          <p className={cn('mt-1 text-sm', config.textColor)}>
            {errorMessage}
          </p>
          
          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  type === 'error' && 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500',
                  type === 'warning' && 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500',
                  type === 'info' && 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                )}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryText}
              </button>
            </div>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'ml-3 flex-shrink-0 rounded-md p-1.5 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              type === 'error' && 'text-red-500 hover:bg-red-100 focus:ring-red-500',
              type === 'warning' && 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500',
              type === 'info' && 'text-blue-500 hover:bg-blue-100 focus:ring-blue-500'
            )}
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 특화된 에러 메시지 컴포넌트들
export const K8sErrorMessage: React.FC<{
  error: string | Error
  onRetry?: () => void
  className?: string
}> = ({ error, onRetry, className }) => (
  <ErrorMessage
    error={error}
    type="error"
    title="Kubernetes 작업 실패"
    onRetry={onRetry}
    retryText="다시 시도"
    className={className || ''}
  />
)

export const NetworkErrorMessage: React.FC<{
  error: string | Error
  onRetry?: () => void
  className?: string
}> = ({ error, onRetry, className }) => (
  <ErrorMessage
    error={error}
    type="error"
    title="네트워크 연결 오류"
    onRetry={onRetry}
    retryText="연결 재시도"
    className={className || ''}
  />
)

export const ValidationErrorMessage: React.FC<{
  error: string | Error
  className?: string
}> = ({ error, className }) => (
  <ErrorMessage
    error={error}
    type="warning"
    title="입력 값 오류"
    className={className || ''}
  />
)

export default ErrorMessage
