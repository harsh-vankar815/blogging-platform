import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Helmet } from 'react-helmet-async'
import { HiLockClosed, HiEye, HiEyeOff, HiCheckCircle } from 'react-icons/hi'
import { motion } from 'framer-motion'
import api from '@services/api'
import toast from 'react-hot-toast'
import { useProgressForm } from '@hooks/useProgressAction'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [token, navigate])

  // Enhanced form submission with progress
  const { handleSubmit, isLoading } = useProgressForm(async (data) => {
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
        confirmPassword: data.confirmPassword
      })
      setIsSuccess(true)
      toast.success('Password reset successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password'
      toast.error(message)

      if (error.response?.data?.code === 'INVALID_TOKEN') {
        setTimeout(() => navigate('/forgot-password'), 2000)
      }
    }
  }, {
    speed: 'normal',
    color: 'bg-green-500'
  })

  if (isSuccess) {
    return (
      <>
        <Helmet>
          <title>Password Reset Successful - MERN Blog Platform</title>
          <meta name="description" content="Your password has been reset successfully" />
        </Helmet>

        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <HiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-secondary-900 dark:text-white">
                Password reset successful
              </h2>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="btn-primary inline-flex items-center px-6 py-3"
                >
                  Continue to login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Reset Password - MERN Blog Platform</title>
        <meta name="description" content="Create a new password for your account" />
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
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Enter your new password below.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="sr-only">
                  New Password
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
                    placeholder="New password"
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
                  Confirm New Password
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
                    placeholder="Confirm new password"
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
                  <span className="text-white/80">Resetting password...</span>
                ) : (
                  'Reset password'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Back to login
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  )
}

export default ResetPassword
