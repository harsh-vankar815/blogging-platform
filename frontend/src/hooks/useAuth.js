import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useCallback } from 'react'
import {
  login,
  register,
  logout,
  checkAuth,
  refreshToken,
  logoutAllDevices,
  updateProfile,
  changePassword
} from '@store/slices/authSlice'
import tokenManager from '@utils/tokenManager'

export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    user,
    token,
    isAuthenticated,
    loading,
    error
  } = useSelector((state) => state.auth)

  // Initialize token manager on mount
  useEffect(() => {
    tokenManager.setupTokenRefresh()
  }, [])

  const loginUser = async (credentials, redirectTo) => {
    try {
      const result = await dispatch(login(credentials)).unwrap()
      const from = location.state?.from?.pathname || redirectTo || '/dashboard'
      navigate(from, { replace: true })
      return result
    } catch (error) {
      throw error
    }
  }

  const registerUser = async (userData, redirectTo) => {
    try {
      const result = await dispatch(register(userData)).unwrap()
      const from = redirectTo || '/dashboard'
      navigate(from, { replace: true })
      return result
    } catch (error) {
      throw error
    }
  }

  const logoutUser = useCallback(async (redirectTo = '/') => {
    try {
      await dispatch(logout()).unwrap()
      tokenManager.clearTokens()
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // Even if logout fails on backend, clear local state
      tokenManager.clearTokens()
      navigate(redirectTo, { replace: true })
    }
  }, [dispatch, navigate])

  const logoutAllDevicesUser = useCallback(async (redirectTo = '/') => {
    try {
      await dispatch(logoutAllDevices()).unwrap()
      tokenManager.clearTokens()
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // Even if logout fails on backend, clear local state
      tokenManager.clearTokens()
      navigate(redirectTo, { replace: true })
    }
  }, [dispatch, navigate])

  const checkAuthentication = useCallback(() => {
    dispatch(checkAuth())
  }, [dispatch])

  const refreshUserToken = useCallback(async () => {
    try {
      return await dispatch(refreshToken()).unwrap()
    } catch (error) {
      throw error
    }
  }, [dispatch])



  const updateUserProfile = useCallback(async (profileData) => {
    try {
      return await dispatch(updateProfile(profileData)).unwrap()
    } catch (error) {
      throw error
    }
  }, [dispatch])

  const changeUserPassword = useCallback(async (passwordData) => {
    try {
      return await dispatch(changePassword(passwordData)).unwrap()
    } catch (error) {
      throw error
    }
  }, [dispatch])

  // Computed properties
  const isAdmin = user?.role === 'admin'
  const isUser = user?.role === 'user'
  const isGoogleUser = user?.provider === 'google'
  const hasPassword = isGoogleUser ? !!user?.password : true

  // Permission checks
  const canAccessAdminPanel = isAdmin
  const canCreatePosts = isAuthenticated
  const canComment = isAuthenticated
  const canLike = isAuthenticated

  return {
    // State
    user,
    token,
    isAuthenticated,
    loading,
    error,

    // User properties
    isAdmin,
    isUser,
    isGoogleUser,
    hasPassword,

    // Permissions
    canAccessAdminPanel,
    canCreatePosts,
    canComment,
    canLike,

    // Actions
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    logoutAllDevices: logoutAllDevicesUser,
    checkAuth: checkAuthentication,
    refreshToken: refreshUserToken,
    updateProfile: updateUserProfile,
    changePassword: changeUserPassword,
  }
}
