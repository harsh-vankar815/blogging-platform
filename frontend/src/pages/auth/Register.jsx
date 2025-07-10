import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Helmet } from 'react-helmet-async'
import { HiEye, HiEyeOff, HiLockClosed, HiMail, HiUser } from 'react-icons/hi'
import { FcGoogle } from 'react-icons/fc'
import { motion } from 'framer-motion'
import { register as registerUser, clearError } from '@store/slices/authSlice'
import toast from 'react-hot-toast'
import { useProgressForm } from '@hooks/useProgressAction'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)

  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  // Enhanced form submission with progress
  const { handleSubmit: handleProgressSubmit, isLoading } = useProgressForm(async (data) => {
    try {
      await dispatch(registerUser(data)).unwrap()
      toast.success('Account created successfully!')
      navigate('/')
    } catch (error) {
      toast.error(error.message || 'Registration failed')
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

  const handleGoogleSignup = () => {
    try {
      // Check if Google OAuth is configured
      if (!import.meta.env.VITE_ENABLE_SOCIAL_LOGIN || import.meta.env.VITE_ENABLE_SOCIAL_LOGIN !== 'true') {
        toast.error('Social login is not enabled on this server');
        return;
      }
      
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    } catch (error) {
      console.error('Google signup error:', error);
      toast.error('Failed to initiate Google signup');
    }
  }

  return (
    <>
      <Helmet>
        <title>Sign Up - MERN Blog Platform</title>
        <meta name="description" content="Create your account" />
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
              <HiUser className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="sr-only">
                    First Name
                  </label>
                  <input
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      },
                      maxLength: {
                        value: 50,
                        message: 'First name cannot exceed 50 characters'
                      }
                    })}
                    type="text"
                    autoComplete="given-name"
                    className={`input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="sr-only">
                    Last Name
                  </label>
                  <input
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      },
                      maxLength: {
                        value: 50,
                        message: 'Last name cannot exceed 50 characters'
                      }
                    })}
                    type="text"
                    autoComplete="family-name"
                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiUser className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters'
                      },
                      maxLength: {
                        value: 30,
                        message: 'Username cannot exceed 30 characters'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Username can only contain letters, numbers, and underscores'
                      }
                    })}
                    type="text"
                    autoComplete="username"
                    className={`input pl-10 ${errors.username ? 'input-error' : ''}`}
                    placeholder="Username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
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

              {/* Password */}
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
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value =>
                        value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <HiEyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    ) : (
                      <HiEye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center py-3 text-base"
              >
                {isLoading ? (
                  <span className="text-white/80">Creating account...</span>
                ) : (
                  'Create account'
                )}
              </button>
              <div className="mt-2 text-center">
                <Link
                  to="/admin/register"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Register as Admin
                </Link>
              </div>
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
                    onClick={handleGoogleSignup}
                    className="w-full inline-flex justify-center py-3 px-4 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-sm bg-white dark:bg-secondary-800 text-sm font-medium text-secondary-500 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors duration-200"
                  >
                    <FcGoogle className="h-5 w-5 mr-2" />
                    Sign up with Google
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  )
}

export default Register
