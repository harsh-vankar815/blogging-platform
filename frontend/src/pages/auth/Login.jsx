import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Helmet } from 'react-helmet-async'
import { HiEye, HiEyeOff, HiLockClosed, HiMail } from 'react-icons/hi'
import { FcGoogle } from 'react-icons/fc'
import { motion } from 'framer-motion'
import { login, clearError } from '@store/slices/authSlice'
import toast from 'react-hot-toast'
import { useProgressForm } from '@hooks/useProgressAction'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error } = useSelector((state) => state.auth)

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors }
  } = useForm()

  // Enhanced form submission with progress
  const { handleSubmit: handleProgressSubmit, isLoading } = useProgressForm(async (data) => {
    try {
      const result = await dispatch(login(data)).unwrap()
      toast.success('Login successful!')

      // Redirect to intended page or home page
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(error.message || 'Login failed')
    }
  }, {
    speed: 'normal',
    color: 'bg-green-500'
  })

  // Combine form validation with progress submission
  const handleSubmit = handleFormSubmit(handleProgressSubmit)

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const oauthError = urlParams.get('error')

    if (oauthError === 'oauth_failed') {
      toast.error('Google login failed. Please try again.')
    }
  }, [location])



  const handleGoogleLogin = () => {
    try {
      // Check if Google OAuth is configured
      if (!import.meta.env.VITE_ENABLE_SOCIAL_LOGIN || import.meta.env.VITE_ENABLE_SOCIAL_LOGIN !== 'true') {
        toast.error('Social login is not enabled on this server');
        return;
      }
      
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to initiate Google login');
    }
  }

  return (
    <>
      <Helmet>
        <title>Login - MERN Blog Platform</title>
        <meta name="description" content="Login to your account" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          <div>
            <div className="mx-auto h-12 w-12 gradient-primary rounded-full flex items-center justify-center">
              <HiLockClosed className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Or{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    type="email"
                    autoComplete="email"
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="Email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <HiEyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    ) : (
                      <HiEye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="text-sm">
                <Link
                  to="/admin/login"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Admin Login
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center py-3 text-base"
              >
                {isLoading ? (
                  <span className="text-white/80">Signing in...</span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            {import.meta.env.VITE_ENABLE_SOCIAL_LOGIN === 'true' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary-300 dark:border-secondary-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-secondary-50 dark:bg-secondary-900 text-secondary-500 dark:text-secondary-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full inline-flex justify-center py-3 px-4 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm bg-white dark:bg-secondary-800 text-sm font-medium text-secondary-500 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors duration-200"
                  >
                    <FcGoogle className="h-5 w-5 mr-2" />
                    Sign in with Google
                  </button>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </>
  )
}

export default Login
