import { motion } from 'framer-motion'
import {
  HiExclamationCircle,
  HiArrowPath,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiFaceFrown
} from 'react-icons/hi2'
import { Link } from 'react-router-dom'

// Error state component
export const BlogErrorState = ({ 
  title = "Something went wrong",
  message = "We couldn't load the blog posts. Please try again.",
  onRetry,
  showRetry = true,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <HiExclamationCircle className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
        {message}
      </p>
      
      {showRetry && onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <HiArrowPath className="w-4 h-4 mr-2" />
          Try Again
        </motion.button>
      )}
    </motion.div>
  )
}

// Empty state when no posts are found
export const BlogEmptyState = ({ 
  title = "No blog posts found",
  message = "There are no blog posts to display at the moment.",
  showCreateButton = false,
  showSearchSuggestion = false,
  onClearFilters,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mb-6">
        <HiFaceFrown className="w-8 h-8 text-secondary-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {showSearchSuggestion && onClearFilters && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
          >
            <HiMagnifyingGlass className="w-4 h-4 mr-2" />
            Clear Filters
          </motion.button>
        )}
        
        {showCreateButton && (
          <Link to="/create-post">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <HiPencilSquare className="w-4 h-4 mr-2" />
              Write Your First Post
            </motion.button>
          </Link>
        )}
      </div>
    </motion.div>
  )
}

// Empty search results state
export const BlogSearchEmptyState = ({ 
  searchQuery = '',
  onClearSearch,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mb-6">
        <HiMagnifyingGlass className="w-8 h-8 text-secondary-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
        No results found
      </h3>
      
      <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
        {searchQuery ? (
          <>
            We couldn't find any posts matching <span className="font-medium">"{searchQuery}"</span>.
            Try adjusting your search terms or filters.
          </>
        ) : (
          "We couldn't find any posts matching your current filters. Try adjusting your search criteria."
        )}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {onClearSearch && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearSearch}
            className="inline-flex items-center px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
          >
            <HiMagnifyingGlass className="w-4 h-4 mr-2" />
            Clear Search
          </motion.button>
        )}
        
        <Link to="/blog">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            View All Posts
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}

// Loading state with progress indicator
export const BlogLoadingState = ({ 
  message = "Loading blog posts...",
  showProgress = false,
  progress = 0,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {/* Animated loading spinner */}
      <div className="relative w-12 h-12 mb-6">
        <div className="absolute inset-0 border-4 border-secondary-200 dark:border-secondary-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <p className="text-secondary-600 dark:text-secondary-400 mb-4">
        {message}
      </p>
      
      {showProgress && (
        <div className="w-64 bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
          <motion.div
            className="bg-primary-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </motion.div>
  )
}

// Network error state
export const BlogNetworkErrorState = ({ 
  onRetry,
  className = ''
}) => {
  return (
    <BlogErrorState
      title="Connection Problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      className={className}
    />
  )
}

// Maintenance state
export const BlogMaintenanceState = ({ 
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6">
        <HiExclamationCircle className="w-8 h-8 text-yellow-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
        Under Maintenance
      </h3>
      
      <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
        We're currently performing maintenance to improve your experience. Please check back soon.
      </p>
    </motion.div>
  )
}

// Export all state components
export default {
  BlogErrorState,
  BlogEmptyState,
  BlogSearchEmptyState,
  BlogLoadingState,
  BlogNetworkErrorState,
  BlogMaintenanceState
}
