import { store } from '@store/index'
import { refreshToken, logout } from '@store/slices/authSlice'
import { setAuthToken } from '@services/api'

class TokenManager {
  constructor() {
    this.isRefreshing = false
    this.failedQueue = []
    this.refreshPromise = null
    this.debug = true // Enable debug logging
  }

  // Debug logger
  log(...args) {
    if (this.debug) {
      console.log('[TokenManager]', ...args)
    }
  }

  // Process failed requests queue
  processQueue(error, token = null) {
    this.log(`Processing queue with ${this.failedQueue.length} requests, error: ${error ? 'yes' : 'no'}`)
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token)
      }
    })
    
    this.failedQueue = []
  }

  // Handle token refresh
  async handleTokenRefresh() {
    this.log('Token refresh requested')
    
    if (this.isRefreshing) {
      // If already refreshing, return the existing promise
      this.log('Already refreshing, returning existing promise')
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.log('Starting token refresh process')
    
    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const result = await store.dispatch(refreshToken()).unwrap()
        const newToken = result.accessToken
        
        this.log('Token refreshed successfully')
        setAuthToken(newToken)
        this.processQueue(null, newToken)
        resolve(newToken)
      } catch (error) {
        this.log('Token refresh failed:', error)
        this.processQueue(error, null)
        
        // Clear tokens and reject on refresh failure
        this.clearTokens()
        store.dispatch(logout())
        reject(error)
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })

    return this.refreshPromise
  }

  // Add failed request to queue
  addToQueue(resolve, reject) {
    this.log('Adding request to queue')
    this.failedQueue.push({ resolve, reject })
  }

  // Check if token is expired or about to expire
  isTokenExpired(token) {
    if (!token) {
      this.log('No token provided, considered expired')
      return true
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      const timeLeft = payload.exp - currentTime
      
      // Consider token expired if it expires in the next 5 minutes
      const isExpired = payload.exp < (currentTime + 300)
      this.log(`Token expiration check: expires in ${Math.round(timeLeft)}s, considered ${isExpired ? 'expired' : 'valid'}`)
      return isExpired
    } catch (error) {
      this.log('Error parsing token:', error)
      return true
    }
  }

  // Get valid token (refresh if needed)
  async getValidToken() {
    const state = store.getState()
    const currentToken = state.auth.token
    
    if (!currentToken) {
      this.log('No token available in state')
      throw new Error('No token available')
    }

    if (!this.isTokenExpired(currentToken)) {
      this.log('Current token is still valid')
      return currentToken
    }

    // Token is expired, refresh it
    this.log('Current token is expired, refreshing')
    return this.handleTokenRefresh()
  }

  // Setup automatic token refresh
  setupTokenRefresh() {
    this.log('Setting up automatic token refresh')
    // Check token every 5 minutes
    setInterval(() => {
      const state = store.getState()
      const { isAuthenticated, token } = state.auth
      
      this.log('Checking token status:', { isAuthenticated, hasToken: !!token })
      if (isAuthenticated && token && this.isTokenExpired(token)) {
        this.log('Token needs refresh during scheduled check')
        this.handleTokenRefresh().catch((error) => {
          this.log('Scheduled token refresh failed:', error)
          // Refresh failed, user will be logged out
        })
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  // Clear all tokens and reset state
  clearTokens() {
    this.log('Clearing all tokens and state')
    localStorage.removeItem('refreshToken')
    setAuthToken(null)
    this.isRefreshing = false
    this.failedQueue = []
    this.refreshPromise = null
  }

  // Check current authentication status
  checkAuthStatus() {
    const state = store.getState()
    const { isAuthenticated, token, user } = state.auth
    const refreshTokenExists = !!localStorage.getItem('refreshToken')
    
    this.log('Auth status check:', { 
      isAuthenticated, 
      hasToken: !!token, 
      hasRefreshToken: refreshTokenExists,
      user: user ? { id: user._id, role: user.role } : null
    })
    
    return {
      isAuthenticated,
      hasToken: !!token,
      hasRefreshToken: refreshTokenExists,
      tokenExpired: token ? this.isTokenExpired(token) : true,
      user: user ? { id: user._id, role: user.role } : null
    }
  }
}

export default new TokenManager()
