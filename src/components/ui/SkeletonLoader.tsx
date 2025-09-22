import React from 'react'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular' | 'table' | 'card'
  width?: string | number
  height?: string | number
  lines?: number
  animated?: boolean
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animated = true
}) => {
  const baseClasses = `bg-gray-200 ${animated ? 'animate-pulse' : ''}`
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded'
      case 'rectangular':
        return 'rounded-md'
      case 'circular':
        return 'rounded-full'
      case 'table':
        return 'h-12 rounded'
      case 'card':
        return 'h-32 rounded-lg'
      default:
        return 'rounded-md'
    }
  }

  const style = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '16px' : variant === 'circular' ? '40px' : '200px')
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  )
}

// 테이블용 스켈레톤
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLoader
            key={colIndex}
            variant="text"
            width={colIndex === 0 ? '20%' : colIndex === columns - 1 ? '15%' : '25%'}
            height="20px"
          />
        ))}
      </div>
    ))}
  </div>
)

// 카드용 스켈레톤
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <SkeletonLoader variant="text" width="60%" height="20px" />
          <SkeletonLoader variant="circular" width="32px" height="32px" />
        </div>
        <SkeletonLoader variant="text" width="100%" height="24px" className="mb-2" />
        <SkeletonLoader variant="text" width="80%" height="16px" />
      </div>
    ))}
  </div>
)

export default SkeletonLoader


