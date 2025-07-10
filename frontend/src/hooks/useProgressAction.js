import { useCallback } from 'react'
import { useProgress } from '@contexts/ProgressContext'

/**
 * Hook for wrapping async actions with progress indication
 * @param {Object} options - Configuration options
 * @param {string} options.color - Progress bar color class
 * @param {string} options.speed - Animation speed ('slow', 'normal', 'fast')
 * @param {boolean} options.showSpinner - Whether to show additional spinner
 * @returns {Function} - Function to wrap async actions
 */
export const useProgressAction = (options = {}) => {
  const { startLoading, stopLoading } = useProgress()

  const executeWithProgress = useCallback(async (asyncAction) => {
    try {
      startLoading(options)
      const result = await asyncAction()
      return result
    } catch (error) {
      throw error
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading, options])

  return { executeWithProgress }
}

/**
 * Hook for manual progress control
 * @returns {Object} - Progress control functions
 */
export const useProgressControl = () => {
  const { startLoading, stopLoading, forceStopLoading, updateConfig, isLoading, loadingCount } = useProgress()

  return {
    start: startLoading,
    stop: stopLoading,
    forceStop: forceStopLoading,
    updateConfig,
    isLoading,
    loadingCount
  }
}

/**
 * Hook for form submissions with progress
 * @param {Function} onSubmit - Form submission handler
 * @param {Object} options - Progress options
 * @returns {Object} - Enhanced form handlers
 */
export const useProgressForm = (onSubmit, options = {}) => {
  const { executeWithProgress } = useProgressAction(options)
  const { isLoading } = useProgress()

  const handleSubmit = useCallback(async (data, event) => {
    if (isLoading) return // Prevent multiple submissions

    return executeWithProgress(() => onSubmit(data, event))
  }, [executeWithProgress, onSubmit, isLoading])

  return {
    handleSubmit,
    isLoading
  }
}

export default useProgressAction
