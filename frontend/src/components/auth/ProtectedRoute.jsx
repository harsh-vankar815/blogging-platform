import { useSelector, useDispatch } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { checkAuth, refreshToken } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'
import NanoProgress from '../ui/NanoProgress'

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user, token } = useSelector((state) => state.auth)
  const location = useLocation()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      // If we have a token but no user, try to get user info
      if (token && !user) {
        try {
          await dispatch(checkAuth()).unwrap()
        } catch (error) {
          // If checkAuth fails, try to refresh token
          try {
            await dispatch(refreshToken()).unwrap()
            await dispatch(checkAuth()).unwrap()
          } catch (refreshError) {
            // Both failed, user needs to login again
            console.error('Authentication failed:', refreshError)
          }
        }
      }
      setIsInitialized(true)
    }

    initializeAuth()
  }, [dispatch, token, user])

  // Show loading while initializing or during auth operations
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center">
          <NanoProgress
            isVisible={true}
            speed="fast"
            color="bg-primary-600"
            height={3}
          />
          <p className="text-secondary-600 dark:text-secondary-400 mt-4">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect authenticated users away from auth pages
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }



  // Check admin requirement
  if (requireAuth && requireAdmin && user && user.role !== 'admin') {
    toast.error('Admin access required')
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
