import { createContext, useContext, useState, useCallback } from 'react'

const ProgressContext = createContext()

export const useProgress = () => {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}

export const ProgressProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingCount, setLoadingCount] = useState(0)
  const [config, setConfig] = useState({
    color: 'bg-primary-500',
    height: 2,
    speed: 'normal',
    showSpinner: false
  })

  // Start loading - can be called multiple times
  const startLoading = useCallback((options = {}) => {
    setLoadingCount(prev => prev + 1)
    setIsLoading(true)
    
    // Update config if provided
    if (Object.keys(options).length > 0) {
      setConfig(prev => ({ ...prev, ...options }))
    }
  }, [])

  // Stop loading - only stops when all loading operations are complete
  const stopLoading = useCallback(() => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1)
      if (newCount === 0) {
        setIsLoading(false)
      }
      return newCount
    })
  }, [])

  // Force stop all loading
  const forceStopLoading = useCallback(() => {
    setLoadingCount(0)
    setIsLoading(false)
  }, [])

  // Update progress configuration
  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  const value = {
    isLoading,
    loadingCount,
    config,
    startLoading,
    stopLoading,
    forceStopLoading,
    updateConfig
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export default ProgressContext
