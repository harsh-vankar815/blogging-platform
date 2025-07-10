import { motion } from 'framer-motion'

// Individual blog card skeleton
const BlogCardSkeleton = ({ variant = 'default', className = '' }) => {
  const isCompact = variant === 'compact'
  const isFeatured = variant === 'featured'

  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden animate-pulse ${className}`}>
      <div className={`flex ${isFeatured ? 'flex-col' : 'flex-col md:flex-row'}`}>
        {/* Image skeleton */}
        <div className={`bg-secondary-200 dark:bg-secondary-700 ${
          isCompact 
            ? 'h-32' 
            : isFeatured 
            ? 'h-64 w-full' 
            : 'h-48 md:h-full md:w-1/3 lg:w-1/4'
        }`} />
        
        {/* Content skeleton */}
        <div className={`flex-1 p-6 ${isCompact ? 'p-4' : ''}`}>
          {/* Category skeleton */}
          <div className="mb-3">
            <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded-full w-20" />
          </div>
          
          {/* Title skeleton */}
          <div className="mb-3">
            <div className={`h-6 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 ${
              isFeatured ? 'w-4/5' : 'w-3/4'
            }`} />
            {!isCompact && (
              <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2" />
            )}
          </div>
          
          {/* Excerpt skeleton (not for compact) */}
          {!isCompact && (
            <div className="mb-4">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-full" />
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-5/6" />
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
            </div>
          )}
          
          {/* Author skeleton */}
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full mr-3" />
            <div>
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-1 w-24" />
              <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-16" />
            </div>
          </div>
          
          {/* Meta info skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20" />
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-16" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-12" />
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Blog list skeleton with multiple cards
const BlogListSkeleton = ({ count = 6, variant = 'default', className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <BlogCardSkeleton variant={variant} />
        </motion.div>
      ))}
    </div>
  )
}

// Grid skeleton for compact cards
const BlogGridSkeleton = ({ count = 9, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <BlogCardSkeleton variant="compact" />
        </motion.div>
      ))}
    </div>
  )
}

// Filters skeleton
const BlogFiltersSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6 animate-pulse ${className}`}>
      {/* Search bar skeleton */}
      <div className="mb-4">
        <div className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded-lg w-full" />
      </div>
      
      {/* Filter buttons skeleton */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded-lg w-32" />
        <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded-lg w-28" />
        <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded-lg w-24" />
        <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded-lg w-20" />
      </div>
    </div>
  )
}

// Featured post skeleton
const FeaturedPostSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden animate-pulse ${className}`}>
      {/* Large featured image */}
      <div className="h-80 bg-secondary-200 dark:bg-secondary-700" />
      
      {/* Content */}
      <div className="p-8">
        {/* Category */}
        <div className="mb-4">
          <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded-full w-24" />
        </div>
        
        {/* Title */}
        <div className="mb-4">
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded mb-3 w-5/6" />
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
        </div>
        
        {/* Excerpt */}
        <div className="mb-6">
          <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-full" />
          <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-11/12" />
          <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-4/5" />
        </div>
        
        {/* Author and meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-secondary-200 dark:bg-secondary-700 rounded-full mr-4" />
            <div>
              <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded mb-1 w-28" />
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20" />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-16" />
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Pagination skeleton
const PaginationSkeleton = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Page info skeleton */}
      <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-48 animate-pulse" />
      
      {/* Pagination buttons skeleton */}
      <div className="flex items-center space-x-1">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="w-10 h-10 bg-secondary-200 dark:bg-secondary-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}

// Export all skeleton components
export {
  BlogCardSkeleton,
  BlogListSkeleton,
  BlogGridSkeleton,
  BlogFiltersSkeleton,
  FeaturedPostSkeleton,
  PaginationSkeleton
}

export default BlogListSkeleton
