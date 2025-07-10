import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Helmet } from 'react-helmet-async'
import { HiMail, HiArrowLeft, HiUser, HiLockClosed } from 'react-icons/hi'
import { motion } from 'framer-motion'
import api from '@services/api'
import toast from 'react-hot-toast'
import { useProgressForm } from '@hooks/useProgressAction'

const ForgotPassword = () => {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const newPassword = watch('newPassword')

  // Enhanced form submission with progress
  const { handleSubmit: handleProgressSubmit, isLoading } = useProgressForm(async (data) => {
    try {
      await api.post('/auth/forgot-password', {
        email: data.email,
        username: data.username,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      })
      toast.success('Password reset successfully! You can now login with your new password.')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password'
      toast.error(message)
    }
  }, {
    speed: 'normal',
    color: 'bg-blue-500'
  })

  // Combine form validation with progress submission
  const handleSubmit = handleFormSubmit(handleProgressSubmit)



  return (
    <>
      <Helmet>
        <title>Forgot Password - MERN Blog Platform</title>
        <meta name="description" content="Reset your password" />
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
              <HiMail className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900 dark:text-white">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Enter your email, username, and new password to reset your account password.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

            {/* Username Field */}
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
                      message: 'Username must be at least 3 characters long'
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

            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="sr-only">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiLockClosed className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters long'
                    }
                  })}
                  type="password"
                  autoComplete="new-password"
                  className={`input pl-10 ${errors.newPassword ? 'input-error' : ''}`}
                  placeholder="New password"
                />
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
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
                      value === newPassword || 'Passwords do not match'
                  })}
                  type="password"
                  autoComplete="new-password"
                  className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm new password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
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
                  'Reset Password'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <HiArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  )
}

export default ForgotPassword
