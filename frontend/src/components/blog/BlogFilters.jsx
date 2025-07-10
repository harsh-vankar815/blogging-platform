import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSearch, HiFilter, HiX, HiChevronDown } from 'react-icons/hi'
import { useDebounce } from '@hooks/useDebounce'
import postsService from '../../services/postsService'

// Import the same categories used in CategorySelect
const DEFAULT_CATEGORIES = [
  'Technology', 'Lifestyle', 'Travel', 'Food', 'Health', 
  'Business', 'Education', 'Entertainment', 'Sports', 'Other'
]

const BlogFilters = ({ 
  onFiltersChange, 
  initialFilters = {}, 
  categories = [],
  tags = [],
  className = '' 
}) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
    sortBy: 'newest',
    ...initialFilters
  })
  
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_CATEGORIES)
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 300)
  
  // Available sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'title', label: 'Title A-Z' }
  ]

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await postsService.getCategories();
        
        // If we have categories from the API with counts, use those
        if (response && response.length > 0) {
          // Extract just the category names and add any missing default categories
          const apiCategories = response.map(cat => cat.category);
          const allCategories = [...new Set([...apiCategories, ...DEFAULT_CATEGORIES])];
          setAvailableCategories(allCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const updatedFilters = { ...filters, search: debouncedSearch }
      setFilters(updatedFilters)
      onFiltersChange(updatedFilters)
    }
  }, [debouncedSearch])

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      tag: '',
      sortBy: 'newest'
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.category || filters.tag || filters.sortBy !== 'newest'

  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6 ${className}`}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className={`relative transition-all duration-200 ${searchFocused ? 'transform scale-[1.02]' : ''}`}>
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search blog posts..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-4 py-3 border border-secondary-200 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white placeholder-secondary-500 dark:placeholder-secondary-400 transition-all duration-200"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Category Filter */}
        <div className="relative">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="appearance-none bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg px-4 py-2 pr-8 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Categories</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <HiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Sort Filter */}
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="appearance-none bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg px-4 py-2 pr-8 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <HiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center px-3 py-2 text-sm text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <HiFilter className="w-4 h-4 mr-1" />
          Advanced
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <HiX className="w-4 h-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-secondary-200 dark:border-secondary-600 pt-4"
          >
            {/* Tags Filter */}
            {tags.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Filter by Tag
                </label>
                <div className="relative">
                  <select
                    value={filters.tag}
                    onChange={(e) => handleFilterChange('tag', e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg px-4 py-2 pr-8 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Tags</option>
                    {tags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  <HiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Popular Tags */}
            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 10).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleFilterChange('tag', filters.tag === tag ? '' : tag)}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        filters.tag === tag
                          ? 'bg-primary-500 text-white'
                          : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-primary-100 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-secondary-600 dark:text-secondary-400">Active filters:</span>
            
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 text-primary-500 hover:text-primary-700"
                >
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded">
                Category: {filters.category}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-1 text-primary-500 hover:text-primary-700"
                >
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.tag && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded">
                Tag: {filters.tag}
                <button
                  onClick={() => handleFilterChange('tag', '')}
                  className="ml-1 text-primary-500 hover:text-primary-700"
                >
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogFilters
