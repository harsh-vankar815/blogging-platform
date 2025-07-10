import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '@services/authService'
import api, { setAuthToken } from '@services/api'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false, // Will be set to true after successful token verification
  loading: false,
  error: null,
}

// Initialize token on app start
if (initialState.token) {
  setAuthToken(initialState.token)
}

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData)

      // Store both access and refresh tokens
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken)
        setAuthToken(response.accessToken)
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }

      toast.success('Registration successful!')
      return {
        user: response.user,
        token: response.accessToken || response.token
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)

      // Store both access and refresh tokens
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken)
        setAuthToken(response.accessToken)
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }

      // For admin login, verify role
      if (credentials.isAdmin && response.user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.')
      }

      toast.success('Login successful!')
      return {
        user: response.user,
        token: response.accessToken
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, dispatch }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        // Notify backend to revoke refresh token
        await api.post('/auth/logout', { refreshToken })
      }
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error)
    }

    // Clear all authentication data
    authService.logout()
    setAuthToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    toast.success('Logged out successfully')
    return null
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { getState, rejectWithValue }) => {
    try {
      // First, check if there's a token in localStorage
      const storedToken = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')

      if (!storedToken) {
        return rejectWithValue('No token found')
      }

      // Set the token in API headers
      setAuthToken(storedToken)

      try {
        // Try to get current user with stored token
        const response = await authService.getCurrentUser()
        return {
          user: response.user,
          token: storedToken
        }
      } catch (error) {
        // If token is invalid, try to refresh it
        if (error.response?.status === 401 && refreshToken) {
          try {
            const refreshResponse = await api.post('/auth/refresh', { refreshToken })

            // Update tokens
            localStorage.setItem('token', refreshResponse.accessToken)
            if (refreshResponse.refreshToken) {
              localStorage.setItem('refreshToken', refreshResponse.refreshToken)
            }
            setAuthToken(refreshResponse.accessToken)

            // Get user with new token
            const userResponse = await authService.getCurrentUser()
            return {
              user: userResponse.user,
              token: refreshResponse.accessToken
            }
          } catch (refreshError) {
            // Refresh failed, but don't clear tokens to keep user logged in
            console.error('Token refresh failed:', refreshError)
            
            // Instead of clearing tokens, return the current state
            const state = getState();
            if (state.auth.user) {
              return {
                user: state.auth.user,
                token: storedToken
              }
            }
            
            return rejectWithValue('Session expired but keeping user logged in')
          }
        }

        // Token invalid but don't clear tokens
        console.error('Token validation failed:', error)
        
        // Return current state instead of clearing tokens
        const state = getState();
        if (state.auth.user) {
          return {
            user: state.auth.user,
            token: storedToken
          }
        }
        
        return rejectWithValue('Invalid token but keeping user logged in')
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Authentication check failed'
      // Don't clear tokens on error
      return rejectWithValue(message)
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData)
      toast.success('Profile updated successfully!')
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      await authService.changePassword(passwordData)
      toast.success('Password changed successfully!')
      return null
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token found')
      }

      const response = await api.post('/auth/refresh', { refreshToken })

      // Update tokens
      setAuthToken(response.accessToken)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }

      return response
    } catch (error) {
      // Clear invalid tokens
      localStorage.removeItem('refreshToken')
      setAuthToken(null)
      const message = error.response?.data?.message || 'Token refresh failed'
      return rejectWithValue(message)
    }
  }
)

export const logoutAllDevices = createAsyncThunk(
  'auth/logoutAllDevices',
  async (_, { dispatch }) => {
    try {
      await api.post('/auth/logout-all')
      authService.logout()
      setAuthToken(null)
      localStorage.removeItem('refreshToken')
      toast.success('Logged out from all devices successfully')
      return null
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to logout from all devices'
      toast.error(message)
      throw error
    }
  }
)

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = action.payload
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
        console.log('User logged in:', action.payload.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = action.payload
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = null
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
        console.log('Auth check successful, user:', action.payload.user);
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        // Keep user logged in even if token validation fails
        // Only clear authentication if there's no token at all
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        } else {
          // Keep existing authentication state
          // This ensures user stays logged in until explicit logout
          state.error = action.payload;
        }
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.error = null
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken
      })
      .addCase(refreshToken.rejected, (state) => {
        // Don't automatically log out user when refresh fails
        // Only remove the refresh token but keep the user logged in
        localStorage.removeItem('refreshToken');
        // Keep existing authentication state
        state.error = 'Token refresh failed, but keeping user logged in';
      })

      // Logout All Devices
      .addCase(logoutAllDevices.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = null
      })
  },
})

export const { clearError, updateUser } = authSlice.actions

// Async thunks are already exported individually above, no need to re-export them

export default authSlice.reducer
