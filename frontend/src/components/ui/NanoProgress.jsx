import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NanoProgress = ({ 
  isVisible = false, 
  color = 'bg-primary-500',
  height = 2,
  speed = 'normal', // 'slow', 'normal', 'fast'
  showSpinner = false,
  className = ''
}) => {
  const [progress, setProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)

  // Speed configurations
  const speedConfig = {
    slow: { interval: 200, increment: () => Math.random() * 2 + 0.5 },
    normal: { interval: 100, increment: () => Math.random() * 3 + 1 },
    fast: { interval: 50, increment: () => Math.random() * 4 + 2 }
  }

  const currentSpeed = speedConfig[speed] || speedConfig.normal

  // Realistic trickle animation
  const startProgress = () => {
    setProgress(0)
    setIsAnimating(true)
    
    const animate = () => {
      setProgress(prev => {
        // Slow down as we approach 100%
        const remaining = 100 - prev
        const slowdownFactor = remaining < 20 ? 0.3 : remaining < 50 ? 0.6 : 1
        const increment = currentSpeed.increment() * slowdownFactor
        
        // Never quite reach 100% during trickle
        const newProgress = Math.min(prev + increment, 85)
        
        return newProgress
      })
    }

    // Start the animation
    animate()
    intervalRef.current = setInterval(animate, currentSpeed.interval)
  }

  const completeProgress = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Quickly complete to 100%
    setProgress(100)
    
    // Hide after completion animation
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false)
      setProgress(0)
    }, 300)
  }

  const resetProgress = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setProgress(0)
    setIsAnimating(false)
  }

  useEffect(() => {
    if (isVisible && !isAnimating) {
      startProgress()
    } else if (!isVisible && isAnimating) {
      completeProgress()
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isVisible])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <AnimatePresence>
      {(isVisible || isAnimating) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-0 left-0 right-0 z-50 ${className}`}
        >
          {/* Progress Bar */}
          <div 
            className="relative bg-transparent overflow-hidden"
            style={{ height: `${height}px` }}
          >
            <motion.div
              className={`h-full ${color} shadow-lg`}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1] // Custom easing for smooth animation
              }}
            />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute top-0 right-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: progress > 0 ? ['-100%', '100%'] : '-100%'
              }}
              transition={{
                duration: 1.5,
                repeat: progress > 0 && progress < 100 ? Infinity : 0,
                ease: 'linear'
              }}
            />
          </div>

          {/* Optional spinner for additional feedback */}
          {showSpinner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 z-10"
            >
              <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NanoProgress
