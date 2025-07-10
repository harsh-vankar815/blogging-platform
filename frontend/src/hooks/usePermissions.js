import { useMemo } from 'react'
import { useAuth } from './useAuth'
import {
  isAdmin,
  isOwner,
  canCreatePost,
  canEditPost,
  canDeletePost,
  canModerateContent,
  canCreateComment,
  canEditComment,
  canDeleteComment,
  canAccessAdminDashboard,
  canManageUsers,
  canAccessAnalytics,
  getAccessibleRoutes,
  getFeatureFlags
} from '@utils/permissions'

export const usePermissions = () => {
  const { user, isAuthenticated, isEmailVerified } = useAuth()

  const permissions = useMemo(() => {
    if (!user) {
      return {
        // Role checks
        isAdmin: false,
        isOwner: () => false,
        
        // Post permissions
        canCreatePost: false,
        canEditPost: () => false,
        canDeletePost: () => false,
        canModerateContent: false,
        
        // Comment permissions
        canCreateComment: false,
        canEditComment: () => false,
        canDeleteComment: () => false,
        
        // Admin permissions
        canAccessAdminDashboard: false,
        canManageUsers: false,
        canAccessAnalytics: false,
        
        // Route and feature access
        accessibleRoutes: [],
        featureFlags: {}
      }
    }

    return {
      // Role checks
      isAdmin: isAdmin(user),
      isOwner: (resource) => isOwner(user, resource),
      
      // Post permissions
      canCreatePost: canCreatePost(user),
      canEditPost: (post) => canEditPost(user, post),
      canDeletePost: (post) => canDeletePost(user, post),
      canModerateContent: canModerateContent(user),
      
      // Comment permissions
      canCreateComment: canCreateComment(user),
      canEditComment: (comment) => canEditComment(user, comment),
      canDeleteComment: (comment) => canDeleteComment(user, comment),
      
      // Admin permissions
      canAccessAdminDashboard: canAccessAdminDashboard(user),
      canManageUsers: canManageUsers(user),
      canAccessAnalytics: canAccessAnalytics(user),
      
      // Route and feature access
      accessibleRoutes: getAccessibleRoutes(user),
      featureFlags: getFeatureFlags(user)
    }
  }, [user])

  return permissions
}

// Convenience hooks for specific permissions
export const usePostPermissions = () => {
  const { user } = useAuth()
  
  return useMemo(() => ({
    canCreate: canCreatePost(user),
    canEdit: (post) => canEditPost(user, post),
    canDelete: (post) => canDeletePost(user, post),
    canModerate: canModerateContent(user),
  }), [user])
}

export const useCommentPermissions = () => {
  const { user } = useAuth()
  
  return useMemo(() => ({
    canCreate: canCreateComment(user),
    canEdit: (comment) => canEditComment(user, comment),
    canDelete: (comment) => canDeleteComment(user, comment),
    canModerate: canModerateContent(user),
  }), [user])
}

export const useAdminPermissions = () => {
  const { user } = useAuth()
  
  return useMemo(() => ({
    canAccessDashboard: canAccessAdminDashboard(user),
    canManageUsers: canManageUsers(user),
    canAccessAnalytics: canAccessAnalytics(user),
    isAdmin: isAdmin(user)
  }), [user])
}

// Hook for checking if user can access a specific route
export const useRouteAccess = (route) => {
  const { accessibleRoutes } = usePermissions()
  
  return useMemo(() => {
    return accessibleRoutes.includes(route)
  }, [accessibleRoutes, route])
}

// Hook for getting feature flags
export const useFeatureFlags = () => {
  const { featureFlags } = usePermissions()
  return featureFlags
}

export default usePermissions
