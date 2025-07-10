import { forwardRef } from 'react'
import LoadingSpinner from './LoadingSpinner'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-sm',
    outline: 'border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 focus:ring-secondary-500',
    ghost: 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 focus:ring-secondary-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 shadow-sm'
  }

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  }

  const widthClass = fullWidth ? 'w-full' : ''

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${widthClass}
    ${className}
  `.trim()

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          color={variant === 'outline' || variant === 'ghost' ? 'gray' : 'white'} 
          className="mr-2" 
        />
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
