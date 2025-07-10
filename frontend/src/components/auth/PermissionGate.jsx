import { useAuth } from '@hooks/useAuth'
import { usePermissions } from '@hooks/usePermissions'
import { HiLockClosed } from 'react-icons/hi'

const PermissionGate = ({ 
  children, 
  permission,
  fallback = null,
  showMessage = true,
  customMessage = null
}) => {
  const auth = useAuth()
  const permissions = usePermissions()

  // Check permissions
  const hasPermission = () => {
    switch (permission) {
      case 'authenticated':
        return auth.isAuthenticated
      case 'admin':
        return permissions.isAdmin
      case 'createPost':
        return permissions.canCreatePost
      case 'comment':
        return permissions.canCreateComment
      case 'emailVerified':
        return auth.isEmailVerified
      default:
        return true
    }
  }

  if (hasPermission()) {
    return children
  }

  // If fallback is provided, use it
  if (fallback) {
    return fallback
  }

  // If showMessage is false, return null
  if (!showMessage) {
    return null
  }

  // Show appropriate message based on permission type
  const getPermissionMessage = () => {
    if (customMessage) {
      return customMessage
    }

    switch (permission) {
      case 'authenticated':
        return {
          icon: HiLockClosed,
          title: 'Login Required',
          message: 'Please login to access this feature.',
          action: 'Login',
          actionLink: '/login'
        }
      case 'admin':
        return {
          icon: HiLockClosed,
          title: 'Admin Access Required',
          message: 'This feature is only available to administrators.',
          action: null,
          actionLink: null
        }
      case 'createPost':
        return {
          icon: HiLockClosed,
          title: 'Login Required',
          message: 'Please login to create posts.',
          action: 'Login',
          actionLink: '/login'
        }
      case 'comment':
        return {
          icon: HiLockClosed,
          title: 'Login Required',
          message: 'Please login to comment on posts.',
          action: 'Login',
          actionLink: '/login'
        }
      case 'emailVerified':
        return {
          icon: HiLockClosed,
          title: 'Email Verification Required',
          message: 'Please verify your email to access this feature.',
          action: null,
          actionLink: null
        }
      default:
        return {
          icon: HiLockClosed,
          title: 'Access Denied',
          message: 'You do not have permission to access this feature.',
          action: null,
          actionLink: null
        }
    }
  }

  const permissionInfo = getPermissionMessage()
  const Icon = permissionInfo.icon

  return (
    <div className="text-center py-8 px-4">
      <div className="mx-auto h-12 w-12 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-secondary-400" />
      </div>
      <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
        {permissionInfo.title}
      </h3>
      <p className="text-secondary-600 dark:text-secondary-400 mb-4">
        {permissionInfo.message}
      </p>
      {permissionInfo.action && permissionInfo.actionLink && (
        <a
          href={permissionInfo.actionLink}
          className="btn-primary inline-flex items-center px-4 py-2"
        >
          {permissionInfo.action}
        </a>
      )}
    </div>
  )
}

// Convenience components for common permissions
export const RequireAuth = ({ children, fallback, showMessage = true }) => (
  <PermissionGate 
    permission="authenticated" 
    fallback={fallback} 
    showMessage={showMessage}
  >
    {children}
  </PermissionGate>
)

export const RequireAdmin = ({ children, fallback, showMessage = true }) => (
  <PermissionGate 
    permission="admin" 
    fallback={fallback} 
    showMessage={showMessage}
  >
    {children}
  </PermissionGate>
)

export const RequireCreatePostsPermission = ({ children, fallback, showMessage = true }) => (
  <PermissionGate 
    permission="createPost" 
    fallback={fallback} 
    showMessage={showMessage}
  >
    {children}
  </PermissionGate>
)

export default PermissionGate
