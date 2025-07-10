import axios from 'axios'
import toast from 'react-hot-toast'

// Progress management - will be set by App.jsx
let progressManager = null

export const setProgressManager = (manager) => {
  progressManager = manager
}

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
let authToken = null

export const setAuthToken = (token) => {
  authToken = token
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

// Initialize token from localStorage on module load
const initializeToken = () => {
  const token = localStorage.getItem('token')
  if (token) {
    setAuthToken(token)
  }
}

// Call initialization
initializeToken()

// Request interceptor to add auth token and start progress
api.interceptors.request.use(
  (config) => {
    // Start progress bar for non-silent requests
    if (!config.silent && progressManager && !config.skipProgress) {
      progressManager.start({
        speed: config.progressSpeed || 'normal',
        color: config.progressColor || 'bg-primary-500'
      })
    }

    // Get token from localStorage as fallback
    const token = authToken || localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    // Stop progress on request error
    if (progressManager && !error.config?.silent && !error.config?.skipProgress) {
      progressManager.stop()
    }
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Stop progress on successful response
    if (progressManager && !response.config.silent && !response.config.skipProgress) {
      progressManager.stop()
    }
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    const { response } = error

    if (response) {
      const { status, data } = response
      
      // Log detailed error information for debugging
      console.error(`API Error (${status}):`, {
        url: originalRequest.url,
        method: originalRequest.method,
        data: originalRequest.data,
        responseData: data,
        headers: originalRequest.headers
      })

      switch (status) {
        case 401:
          // Check if this is a token expiration and we haven't already tried to refresh
          if (!originalRequest._retry && originalRequest.url !== '/auth/me') {
            originalRequest._retry = true

            try {
              // Import tokenManager dynamically to avoid circular dependency
              const { default: tokenManager } = await import('@utils/tokenManager')
              const newToken = await tokenManager.handleTokenRefresh()

              if (newToken) {
                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                // Mark as skipProgress to avoid triggering progress again
                originalRequest.skipProgress = true
                return api(originalRequest)
              } else {
                // Token refresh failed
                setAuthToken(null)
                if (window.location.pathname !== '/login') {
                  toast.error('Session expired. Please login again.')
                  window.location.href = '/login'
                }
                return Promise.reject(error)
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect to login
              console.error('Token refresh failed:', refreshError);
              setAuthToken(null)
              
              if (window.location.pathname !== '/login' && 
                  !window.location.pathname.includes('/auth/callback')) {
                toast.error('Session expired. Please login again.')
                window.location.href = '/login'
              }
              
              return Promise.reject(error);
            }
          } else if (originalRequest.url === '/auth/me') {
            // Silent failure for auth check
            setAuthToken(null)
            return Promise.reject(error);
          } else {
            // Not a token issue or already retried
            setAuthToken(null)
            if (window.location.pathname !== '/login' && 
                !window.location.pathname.includes('/auth/callback')) {
              toast.error('Session expired. Please login again.')
              window.location.href = '/login'
            }
            return Promise.reject(error)
          }
          break
          
        case 403:
          // Forbidden
          toast.error(data.message || 'Access denied')
          break
          
        case 404:
          // Not found
          console.error('Resource not found:', data.message)
          break
          
        case 400:
          // Bad request - show validation errors in detail
          console.error('Validation error:', data)
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => {
              toast.error(err.msg || err.message)
            })
          } else {
            toast.error(data.message || 'Validation error')
          }
          break
          
        case 422:
          // Validation error
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => {
              toast.error(err.msg || err.message)
            })
          } else {
            toast.error(data.message || 'Validation error')
          }
          break
          
        case 429:
          // Rate limit
          toast.error('Too many requests. Please try again later.')
          break
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.')
          break
          
        default:
          // Other errors
          toast.error(data.message || 'An error occurred')
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request)
      toast.error('Network error. Please check your connection.')
    } else {
      // Other error
      console.error('Unexpected error:', error.message)
      toast.error('An unexpected error occurred')
    }

    // Stop progress on error
    if (progressManager && !error.config?.silent && !error.config?.skipProgress) {
      progressManager.stop()
    }

    return Promise.reject(error)
  }
)

export default api
