import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { usePermissions } from '@hooks/usePermissions'
import { motion } from 'framer-motion'
import NanoProgress from '@components/ui/NanoProgress'
import { HiLockClosed, HiShieldExclamation, HiExclamationTriangle } from 'react-icons/hi'

const RouteGuard = ({
  children,
  requireAuth = true,
  requiredPermissions = [],
  requiredRoles = [],
  allowedRoles = [],
  fallbackPath = '/login',
  showFallback = true,
  customFallback = null
}) => {
  const { user, isAuthenticated, loading } = useAuth()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const location = useLocation()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Add a small delay to ensure auth state is properly initialized
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Show loading while auth is being initialized
  if (loading || !isInitialized) {
    return <LoadingScreen />
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Redirect authenticated users away from auth pages
  if (!requireAuth && isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }



  // Check role requirements
  if (requireAuth && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user?.role)) {
      if (!showFallback) return null
      return customFallback || <InsufficientRole requiredRoles={requiredRoles} userRole={user?.role} />
    }
  }

  // Check allowed roles (alternative to required roles)
  if (requireAuth && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.role)) {
      if (!showFallback) return null
      return customFallback || <InsufficientRole requiredRoles={allowedRoles} userRole={user?.role} />
    }
  }

  // Check permission requirements
  if (requireAuth && requiredPermissions.length > 0) {
    const hasRequiredPermissions = Array.isArray(requiredPermissions[0])
      ? hasAnyPermission(requiredPermissions.flat()) // Array of permission arrays (OR logic)
      : requiredPermissions.every(permission => hasPermission(permission)) // Array of permissions (AND logic)

    if (!hasRequiredPermissions) {
      if (!showFallback) return null
      return customFallback || <InsufficientPermissions requiredPermissions={requiredPermissions} />
    }
  }

  return children
}

// Loading screen component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <NanoProgress
        isVisible={true}
        speed="fast"
        color="bg-primary-600"
        height={3}
      />
      <p className="text-secondary-600 dark:text-secondary-400 mt-4">
        Verifying access...
      </p>
    </motion.div>
  </div>
)



// Insufficient role component
const InsufficientRole = ({ requiredRoles, userRole }) => (
  <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full text-center"
    >
      <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-6">
        <HiShieldExclamation className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
        Access Denied
      </h2>
      <p className="text-secondary-600 dark:text-secondary-400 mb-4">
        You don't have the required role to access this page.
      </p>
      <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg p-4 mb-6">
        <div className="text-sm">
          <p className="text-secondary-700 dark:text-secondary-300">
            <span className="font-medium">Your role:</span> {userRole || 'None'}
          </p>
          <p className="text-secondary-700 dark:text-secondary-300">
            <span className="font-medium">Required roles:</span> {requiredRoles.join(', ')}
          </p>
        </div>
      </div>
      <a
        href="/dashboard"
        className="btn-outline w-full inline-flex justify-center py-3"
      >
        Go to Dashboard
      </a>
    </motion.div>
  </div>
)

// Insufficient permissions component
const InsufficientPermissions = ({ requiredPermissions }) => (
  <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full text-center"
    >
      <div className="mx-auto h-16 w-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-6">
        <HiExclamationTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
      </div>
      <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
        Insufficient Permissions
      </h2>
      <p className="text-secondary-600 dark:text-secondary-400 mb-4">
        You don't have the required permissions to access this page.
      </p>
      <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg p-4 mb-6">
        <div className="text-sm">
          <p className="text-secondary-700 dark:text-secondary-300">
            <span className="font-medium">Required permissions:</span>
          </p>
          <ul className="mt-2 text-left">
            {requiredPermissions.map((permission, index) => (
              <li key={index} className="text-secondary-600 dark:text-secondary-400">
                • {permission}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <a
        href="/dashboard"
        className="btn-outline w-full inline-flex justify-center py-3"
      >
        Go to Dashboard
      </a>
    </motion.div>
  </div>
)

// Convenience components for common use cases
export const AdminRoute = ({ children, ...props }) => (
  <RouteGuard requiredRoles={['admin']} {...props}>
    {children}
  </RouteGuard>
)

export const ModeratorRoute = ({ children, ...props }) => (
  <RouteGuard allowedRoles={['admin', 'moderator']} {...props}>
    {children}
  </RouteGuard>
)

export const AuthorRoute = ({ children, ...props }) => (
  <RouteGuard allowedRoles={['admin', 'moderator', 'author']} {...props}>
    {children}
  </RouteGuard>
)



export default RouteGuard
