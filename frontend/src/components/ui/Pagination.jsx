import { motion } from 'framer-motion'
import { HiChevronLeft, HiChevronRight, HiDotsHorizontal } from 'react-icons/hi'

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  showInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  className = ''
}) => {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages = []
    const halfVisible = Math.floor(maxVisiblePages / 2)
    
    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(totalPages, currentPage + halfVisible)
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) {
        pages.push('ellipsis-start')
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end')
      }
      pages.push(totalPages)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  // Calculate item range for current page
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  // Button component for consistency
  const PageButton = ({ page, isActive = false, disabled = false, children, ...props }) => (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={() => !disabled && handlePageChange(page)}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center min-w-[40px] h-10 px-3 text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-primary-500 text-white shadow-md'
          : disabled
          ? 'bg-secondary-100 dark:bg-secondary-700 text-secondary-400 dark:text-secondary-500 cursor-not-allowed'
          : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 hover:text-primary-600 dark:hover:text-primary-400 border border-secondary-200 dark:border-secondary-600'
        }
        ${isActive ? 'border border-primary-500' : ''}
        rounded-lg
      `}
      {...props}
    >
      {children}
    </motion.button>
  )

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 ${className}`}>
      {/* Page Info */}
      {showInfo && (
        <div className="text-sm text-secondary-600 dark:text-secondary-400">
          Showing <span className="font-medium text-secondary-900 dark:text-white">{startItem}</span> to{' '}
          <span className="font-medium text-secondary-900 dark:text-white">{endItem}</span> of{' '}
          <span className="font-medium text-secondary-900 dark:text-white">{totalItems}</span> results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center space-x-1">
        {/* First Page Button */}
        {showFirstLast && currentPage > 1 && (
          <PageButton
            page={1}
            disabled={currentPage === 1}
            className="mr-2"
            title="First page"
          >
            First
          </PageButton>
        )}

        {/* Previous Button */}
        <PageButton
          page={currentPage - 1}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <HiChevronLeft className="w-4 h-4" />
        </PageButton>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (typeof page === 'string') {
              return (
                <div
                  key={page}
                  className="inline-flex items-center justify-center min-w-[40px] h-10 px-3 text-secondary-400"
                >
                  <HiDotsHorizontal className="w-4 h-4" />
                </div>
              )
            }

            return (
              <PageButton
                key={page}
                page={page}
                isActive={page === currentPage}
                title={`Page ${page}`}
              >
                {page}
              </PageButton>
            )
          })}
        </div>

        {/* Next Button */}
        <PageButton
          page={currentPage + 1}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <HiChevronRight className="w-4 h-4" />
        </PageButton>

        {/* Last Page Button */}
        {showFirstLast && currentPage < totalPages && (
          <PageButton
            page={totalPages}
            disabled={currentPage === totalPages}
            className="ml-2"
            title="Last page"
          >
            Last
          </PageButton>
        )}
      </div>

      {/* Mobile Page Info */}
      <div className="sm:hidden text-sm text-secondary-600 dark:text-secondary-400">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  )
}

// Quick navigation component for jumping to specific pages
export const QuickPagination = ({ currentPage, totalPages, onPageChange, className = '' }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const page = parseInt(formData.get('page'))
    
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-secondary-600 dark:text-secondary-400">Go to page:</span>
      <input
        type="number"
        name="page"
        min="1"
        max={totalPages}
        defaultValue={currentPage}
        className="w-16 px-2 py-1 text-sm border border-secondary-200 dark:border-secondary-600 rounded bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <button
        type="submit"
        className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
      >
        Go
      </button>
    </form>
  )
}

export default Pagination
