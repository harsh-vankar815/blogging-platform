import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { HiViewGrid, HiViewList, HiTrendingUp, HiClock, HiEye } from 'react-icons/hi'
import toast from 'react-hot-toast'

// Redux actions
import { fetchPosts, likePost, setFilters, clearFilters } from '../store/slices/postsSlice'

// Components
import PostCard from '../components/ui/PostCard'
import BlogFilters from '../components/blog/BlogFilters'
import Pagination from '../components/ui/Pagination'
import PageTransition from '../components/ui/PageTransition'
import {
  BlogListSkeleton,
  BlogGridSkeleton,
  BlogFiltersSkeleton,
  FeaturedPostSkeleton
} from '../components/blog/BlogSkeleton'
import {
  BlogErrorState,
  BlogEmptyState,
  BlogSearchEmptyState
} from '../components/blog/BlogStates'

// Services
import postsService from '../services/postsService'

// Utils
import { useProgressAction } from '../hooks/useProgressAction'

const BlogList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { executeWithProgress } = useProgressAction()

  // Redux state
  const {
    posts,
    loading,
    error,
    pagination,
    filters
  } = useSelector((state) => state.posts)
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Local state
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [featuredPosts, setFeaturedPosts] = useState([])
  const [popularPosts, setPopularPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [showFeatured, setShowFeatured] = useState(true)

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      tag: searchParams.get('tag') || '',
      sortBy: searchParams.get('sort') || 'newest',
      page: parseInt(searchParams.get('page')) || 1
    }

    dispatch(setFilters(urlFilters))
  }, [searchParams, dispatch])

  // Fetch posts when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Don't use executeWithProgress here as the API already has progress tracking
        await dispatch(fetchPosts({
          page: filters.page || 1,
          limit: 10,
          search: filters.search,
          category: filters.category,
          tag: filters.tag,
          sortBy: filters.sortBy
        })).unwrap()
      } catch (error) {
        console.error('Error fetching posts:', error)
      }
    }

    fetchData()
  }, [dispatch, filters])

  // Fetch additional data on component mount
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        setLoadingFeatured(true)

        // Add silent flag to prevent progress indicator conflicts
        const options = { silent: true };

        // Fetch featured posts, categories, and tags in parallel
        const [featuredResponse, categoriesResponse, tagsResponse] = await Promise.all([
          postsService.getFeaturedPosts(3, options),
          postsService.getCategories?.(options) || Promise.resolve([]),
          postsService.getTags?.(options) || Promise.resolve([])
        ])

        setFeaturedPosts(featuredResponse?.posts || [])
        // Extract category names from API response objects
        setCategories(categoriesResponse?.map(cat => cat.category) || [])
        // Extract tag names from API response objects
        setTags(tagsResponse?.map(tag => tag.tag) || [])
      } catch (error) {
        console.error('Error fetching additional data:', error)
      } finally {
        setLoadingFeatured(false)
      }
    }

    fetchAdditionalData()
  }, [])

  // Update URL when filters change
  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams()

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '' && key !== 'page') {
        params.set(key === 'sortBy' ? 'sort' : key, value)
      }
    })

    if (newFilters.page && newFilters.page > 1) {
      params.set('page', newFilters.page)
    }

    setSearchParams(params)
  }, [setSearchParams])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    const updatedFilters = { ...newFilters, page: 1 } // Reset to first page
    dispatch(setFilters(updatedFilters))
    updateURL(updatedFilters)
  }, [dispatch, updateURL])

  // Handle page changes
  const handlePageChange = useCallback((page) => {
    const updatedFilters = { ...filters, page }
    dispatch(setFilters(updatedFilters))
    updateURL(updatedFilters)

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, dispatch, updateURL])

  // Handle post like
  const handlePostLike = useCallback(async (postId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like posts')
      return
    }

    try {
      await dispatch(likePost(postId)).unwrap()
    } catch (error) {
      console.error('Error liking post:', error)
      throw error
    }
  }, [dispatch, isAuthenticated])

  // Handle post save
  const handlePostSave = useCallback(async (postId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to save posts')
      return
    }

    try {
      await postsService.toggleSavePost(postId)
    } catch (error) {
      console.error('Error saving post:', error)
      throw error
    }
  }, [isAuthenticated])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters())
    setSearchParams({})
  }, [dispatch, setSearchParams])

  // Check if we have active filters
  const hasActiveFilters = filters.search || filters.category || filters.tag || filters.sortBy !== 'newest'
  const hasSearchQuery = filters.search && filters.search.trim().length > 0

  return (
    <PageTransition>
      <Helmet>
        <title>
          {hasSearchQuery
            ? `Search: ${filters.search} - Blog Posts`
            : filters.category
            ? `${filters.category} - Blog Posts`
            : 'Blog Posts - MERN Blog Platform'
          }
        </title>
        <meta
          name="description"
          content={
            hasSearchQuery
              ? `Search results for "${filters.search}" on our blog platform`
              : filters.category
              ? `Explore ${filters.category} blog posts on our platform`
              : "Explore all blog posts on our platform. Discover articles on technology, lifestyle, travel, and more."
          }
        />
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 dark:text-white mb-2">
                {hasSearchQuery
                  ? `Search Results for "${filters.search}"`
                  : filters.category
                  ? `${filters.category} Posts`
                  : 'Blog Posts'
                }
              </h1>
              <p className="text-secondary-600 dark:text-secondary-300">
                {hasSearchQuery
                  ? `Found ${pagination.totalPosts} results`
                  : filters.category
                  ? `Discover the latest ${filters.category.toLowerCase()} articles`
                  : 'Discover the latest articles from our community'
                }
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 mt-4 lg:mt-0">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">View:</span>
              <div className="flex bg-secondary-100 dark:bg-secondary-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-secondary-600 text-primary-600 shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                  }`}
                  title="List view"
                >
                  <HiViewList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-secondary-600 text-primary-600 shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                  }`}
                  title="Grid view"
                >
                  <HiViewGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {!loading && posts.length > 0 && (
            <div className="flex flex-wrap items-center gap-6 text-sm text-secondary-600 dark:text-secondary-400">
              <div className="flex items-center">
                <HiTrendingUp className="w-4 h-4 mr-1" />
                <span>{pagination.totalPosts} total posts</span>
              </div>
              <div className="flex items-center">
                <HiClock className="w-4 h-4 mr-1" />
                <span>Updated daily</span>
              </div>
              <div className="flex items-center">
                <HiEye className="w-4 h-4 mr-1" />
                <span>Fresh content</span>
              </div>
            </div>
          )}
        </div>

        {/* Featured Posts Section */}
        {showFeatured && !hasActiveFilters && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                Featured Posts
              </h2>
              <button
                onClick={() => setShowFeatured(false)}
                className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition-colors"
              >
                Hide Featured
              </button>
            </div>

            {loadingFeatured ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <FeaturedPostSkeleton key={index} />
                ))}
              </div>
            ) : featuredPosts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {featuredPosts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <PostCard
                      post={post}
                      variant="featured"
                      showActions={true}
                      onLike={handlePostLike}
                      onSave={handlePostSave}
                    />
                  </motion.div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Filters */}
        {loading && !posts.length ? (
          <BlogFiltersSkeleton className="mb-8" />
        ) : (
          <BlogFilters
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
            categories={categories}
            tags={tags}
            className="mb-8"
          />
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Loading State */}
          {loading && !posts.length && (
            <>
              {viewMode === 'list' ? (
                <BlogListSkeleton count={6} />
              ) : (
                <BlogGridSkeleton count={9} />
              )}
            </>
          )}

          {/* Error State */}
          {error && !loading && (
            <BlogErrorState
              title="Failed to load posts"
              message={error}
              onRetry={() => dispatch(fetchPosts(filters))}
            />
          )}

          {/* Empty States */}
          {!loading && !error && posts.length === 0 && (
            <>
              {hasSearchQuery ? (
                <BlogSearchEmptyState
                  searchQuery={filters.search}
                  onClearSearch={handleClearFilters}
                />
              ) : hasActiveFilters ? (
                <BlogEmptyState
                  title="No posts match your filters"
                  message="Try adjusting your search criteria or clear the filters to see all posts."
                  showSearchSuggestion={true}
                  onClearFilters={handleClearFilters}
                />
              ) : (
                <BlogEmptyState
                  title="No blog posts yet"
                  message="Be the first to share your thoughts with the community!"
                  showCreateButton={isAuthenticated}
                />
              )}
            </>
          )}

          {/* Posts List/Grid */}
          {!loading && !error && posts.length > 0 && (
            <AnimatePresence mode="wait">
              {viewMode === 'list' ? (
                <motion.div
                  key="list-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {posts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                                          <PostCard
                      post={post}
                      variant="default"
                      showActions={true}
                      onLike={handlePostLike}
                      onSave={handlePostSave}
                    />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="grid-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {posts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                                          <PostCard
                      post={post}
                      variant="compact"
                      showActions={true}
                      onLike={handlePostLike}
                      onSave={handlePostSave}
                    />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Pagination */}
          {!loading && !error && posts.length > 0 && pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center pt-8"
            >
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalPosts}
                itemsPerPage={10}
                onPageChange={handlePageChange}
                showInfo={true}
                showFirstLast={true}
                maxVisiblePages={5}
              />
            </motion.div>
          )}

          {/* Loading More Indicator */}
          {loading && posts.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2 text-secondary-600 dark:text-secondary-400">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading more posts...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

export default BlogList
