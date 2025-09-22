import React from 'react'
import { ButtonProps } from '@/types'
import { cn } from '@/utils'
import { Loader2 } from 'lucide-react'

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 group relative overflow-hidden'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl hover:shadow-primary-500/25',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 focus:ring-gray-500 shadow-sm hover:shadow-md',
    danger: 'bg-gradient-to-r from-error-600 to-error-700 hover:from-error-700 hover:to-error-800 text-white focus:ring-error-500 shadow-lg hover:shadow-xl hover:shadow-error-500/25',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    outline: 'border-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 focus:ring-primary-500 shadow-sm hover:shadow-md',
    destructive: 'bg-gradient-to-r from-error-600 to-error-700 hover:from-error-700 hover:to-error-800 text-white focus:ring-error-500 shadow-lg hover:shadow-xl hover:shadow-error-500/25',
    success: 'bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white focus:ring-success-500 shadow-lg hover:shadow-xl hover:shadow-success-500/25',
    warning: 'bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800 text-white focus:ring-warning-500 shadow-lg hover:shadow-xl hover:shadow-warning-500/25',
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2 h-9',
    md: 'px-6 py-3 text-sm gap-2.5 h-11',
    lg: 'px-8 py-4 text-base gap-3 h-13',
    xl: 'px-10 py-5 text-lg gap-3.5 h-15',
  }

  const widthClasses = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClasses,
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {/* Ripple effect background */}
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      
      {/* Content */}
      <div className="relative flex items-center gap-2.5">
        {loading && (
          <Loader2 className="animate-spin h-4 w-4" />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">{icon}</span>
        )}
        <span className="relative z-10">{children}</span>
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">{icon}</span>
        )}
      </div>
    </button>
  )
}

export default Button
