import { createSlice } from '@reduxjs/toolkit'

// Initial state
const initialState = {
  theme: 'light', // 'light' | 'dark'
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchModalOpen: false,
  loading: {
    global: false,
    posts: false,
    comments: false,
    auth: false,
  },
  modals: {
    deletePost: {
      open: false,
      postId: null,
    },
    deleteComment: {
      open: false,
      commentId: null,
    },
    editComment: {
      open: false,
      commentId: null,
      content: '',
    },
  },
  notifications: [],
  toast: {
    show: false,
    message: '',
    type: 'info', // 'success' | 'error' | 'warning' | 'info'
  },
}

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload
      // Apply theme to document
      if (typeof document !== 'undefined') {
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      // Apply theme to document
      if (typeof document !== 'undefined') {
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },
    
    // Sidebar
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    
    // Mobile Menu
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },
    
    // Search Modal
    setSearchModalOpen: (state, action) => {
      state.searchModalOpen = action.payload
    },
    toggleSearchModal: (state) => {
      state.searchModalOpen = !state.searchModalOpen
    },
    
    // Loading states
    setLoading: (state, action) => {
      const { key, value } = action.payload
      state.loading[key] = value
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload
    },
    
    // Modals
    openModal: (state, action) => {
      const { modalName, data = {} } = action.payload
      if (state.modals[modalName]) {
        state.modals[modalName] = {
          ...state.modals[modalName],
          open: true,
          ...data,
        }
      }
    },
    closeModal: (state, action) => {
      const modalName = action.payload
      if (state.modals[modalName]) {
        state.modals[modalName] = {
          ...initialState.modals[modalName],
          open: false,
        }
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName] = {
          ...initialState.modals[modalName],
          open: false,
        }
      })
    },
    
    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      state.notifications.unshift(notification)
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
    },
    removeNotification: (state, action) => {
      const id = action.payload
      state.notifications = state.notifications.filter(notification => notification.id !== id)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    markNotificationAsRead: (state, action) => {
      const id = action.payload
      const notification = state.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true
      })
    },
    
    // Toast
    showToast: (state, action) => {
      state.toast = {
        show: true,
        ...action.payload,
      }
    },
    hideToast: (state) => {
      state.toast = {
        ...state.toast,
        show: false,
      }
    },
    
    // Reset UI state
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme, // Preserve theme
      }
    },
  },
})

export const {
  setTheme,
  toggleTheme,
  setSidebarOpen,
  toggleSidebar,
  setMobileMenuOpen,
  toggleMobileMenu,
  setSearchModalOpen,
  toggleSearchModal,
  setLoading,
  setGlobalLoading,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  showToast,
  hideToast,
  resetUI,
} = uiSlice.actions

export default uiSlice.reducer
