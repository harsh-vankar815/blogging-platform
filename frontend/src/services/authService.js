import api, { setAuthToken } from './api'

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return handleAuthResponse(response)
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    })
    return handleAuthResponse(response)
  },

  // Admin login
  adminLogin: async (credentials) => {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    })

    if (response.user?.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.')
    }

    return handleAuthResponse(response)
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setAuthToken(null)
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response
  },

  // Refresh token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post('/auth/refresh', { refreshToken })
    return handleAuthResponse(response)
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData)
    return response
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/users/change-password', passwordData)
    return response
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('token')
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token')
    return !!token
  },
}

// Helper function to handle auth response
const handleAuthResponse = (response) => {
  if (response.accessToken) {
    localStorage.setItem('token', response.accessToken)
    setAuthToken(response.accessToken)
  }
  if (response.refreshToken) {
    localStorage.setItem('refreshToken', response.refreshToken)
  }
  return response
}

export default authService
