import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

// Layout components
import Layout from '@components/layout/Layout'
import ProtectedRoute from '@components/auth/ProtectedRoute'
import RoleGuard from '@components/auth/RoleGuard'

// Progress components
import { ProgressProvider, useProgress } from '@contexts/ProgressContext'
import NanoProgress from '@components/ui/NanoProgress'
import { setProgressManager } from '@services/api'

// Socket service
import { initializeSocket } from '@services/socketService'

// Admin components
import AdminDashboard from './pages/AdminDashboard'
import AdminUserManagement from './pages/AdminUserManagement'
import AdminPostManagement from './pages/AdminPostManagement'
import AdminCommentModeration from './pages/AdminCommentModeration'


// Pages
import Home from '@pages/Home'
import BlogList from '@pages/BlogList'
import BlogPost from '@pages/BlogPost'
import Login from '@pages/auth/Login'
import Register from '@pages/auth/Register'
import AdminLogin from './pages/auth/AdminLogin'
import AdminRegister from './pages/auth/AdminRegister'
import ForgotPassword from '@pages/auth/ForgotPassword'
import ResetPassword from '@pages/auth/ResetPassword'
import OAuthCallback from '@pages/auth/OAuthCallback'
import Profile from '@pages/Profile'
import CreatePost from '@pages/CreatePost'
import EditPost from '@pages/EditPost'
import PreviewPost from '@pages/PreviewPost'
import NotFound from '@pages/NotFound'
import About from '@pages/About'
import Contact from '@pages/Contact'
import CategoryPage from '@pages/CategoryPage'
import TestHtml from '@pages/TestHtml'

// Store actions
import { checkAuth } from '@store/slices/authSlice'
import { ThemeProvider } from './contexts/ThemeContext'
import { AnimatePresence } from 'framer-motion'

// App content component that uses progress context
function AppContent() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const progress = useProgress()

  useEffect(() => {
    // Set up progress manager for API calls
    setProgressManager({
      start: progress.startLoading,
      stop: progress.stopLoading,
      forceStop: progress.forceStopLoading
    })
  }, [progress])

  useEffect(() => {
    // Initialize socket connection
    const socket = initializeSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      // Only check auth if there's a token in localStorage
      const token = localStorage.getItem('token')
      if (token) {
        try {
          await dispatch(checkAuth()).unwrap()
        } catch (error) {
          console.error('Authentication initialization failed:', error)
          // Don't clear tokens on error to keep user logged in
          // localStorage.removeItem('token')
          // localStorage.removeItem('refreshToken')
        }
      }
    }

    initializeAuth()
  }, [dispatch])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NanoProgress isVisible={true} speed="fast" />
        <div className="text-secondary-600 dark:text-secondary-400">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900 transition-colors duration-200">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<Home />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="category/:category" element={<CategoryPage />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="preview" element={<PreviewPost />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="test-html" element={<TestHtml />} />
          
          {/* Auth routes (redirect if already authenticated) */}
          <Route
            path="login"
            element={
              <ProtectedRoute requireAuth={false} redirectTo={`/profile/${user?.username || ''}`}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="register"
            element={
              <ProtectedRoute requireAuth={false} redirectTo={`/profile/${user?.username || ''}`}>
                <Register />
              </ProtectedRoute>
            }
          />
          {/* Admin Auth routes */}
          <Route
            path="admin/login"
            element={
              <ProtectedRoute requireAuth={false} redirectTo="/admin">
                <AdminLogin />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/register"
            element={
              <ProtectedRoute requireAuth={false} redirectTo="/admin">
                <AdminRegister />
              </ProtectedRoute>
            }
          />
          <Route
            path="forgot-password"
            element={
              <ProtectedRoute requireAuth={false} redirectTo={`/profile/${user?.username || ''}`}>
                <ForgotPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="reset-password/:token"
            element={
              <ProtectedRoute requireAuth={false} redirectTo={`/profile/${user?.username || ''}`}>
                <ResetPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="auth/callback"
            element={<OAuthCallback />}
          />
          
          {/* Protected routes (require authentication) */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requireAuth={true}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute requireAuth={true}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-post"
            element={
              <ProtectedRoute requireAuth={true}>
                <CreatePost />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit-post/:id"
            element={
              <ProtectedRoute requireAuth={true}>
                <EditPost />
              </ProtectedRoute>
            }
          />
          
          {/* Admin routes */}
          <Route
            path="admin"
            element={
              <RoleGuard allowedRoles={['admin']} redirectTo="/">
                <AdminDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="admin/users"
            element={
              <RoleGuard allowedRoles={['admin']} redirectTo="/">
                <AdminUserManagement />
              </RoleGuard>
            }
          />
          <Route
            path="admin/posts"
            element={
              <RoleGuard allowedRoles={['admin']} redirectTo="/">
                <AdminPostManagement />
              </RoleGuard>
            }
          />
          <Route
            path="admin/comments"
            element={
              <RoleGuard allowedRoles={['admin']} redirectTo="/">
                <AdminCommentModeration />
              </RoleGuard>
            }
          />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
        </Routes>
      </AnimatePresence>
    </div>
  )
}

// Progress bar component that uses context
function GlobalProgressBar() {
  const { isLoading, config } = useProgress()

  return (
    <NanoProgress
      isVisible={isLoading}
      color={config.color}
      height={config.height}
      speed={config.speed}
      showSpinner={config.showSpinner}
    />
  )
}

// Main App component with progress provider
function App() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <GlobalProgressBar />
        <AppContent />
      </ProgressProvider>
    </ThemeProvider>
  )
}

export default App
