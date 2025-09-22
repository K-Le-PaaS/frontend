import React from 'react'
import { BaseComponentProps } from '@/types'
import { cn } from '@/utils'

interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  glow?: boolean
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = true,
  glow = false,
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-300'
  
  const variantClasses = {
    default: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-soft',
    outlined: 'bg-white border-2 border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-strong border border-gray-100',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-soft',
    gradient: 'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm border border-white/30 shadow-medium',
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }

  const hoverClasses = hover ? 'hover:shadow-medium hover:scale-[1.02] hover:-translate-y-1' : ''
  const glowClasses = glow ? 'hover:shadow-glow' : ''

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        glowClasses,
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
