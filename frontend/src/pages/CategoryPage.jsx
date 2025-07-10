import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { HiChevronRight, HiFilter } from 'react-icons/hi'
import { motion } from 'framer-motion'

import postsService from '@services/postsService'
import PostCard from '@components/ui/PostCard'
import SkeletonLoader from '@components/ui/SkeletonLoader'
import Pagination from '@components/ui/Pagination'
import BlogFilters from '@components/blog/BlogFilters'
import GlassmorphicCard from '@components/ui/GlassmorphicCard'
import PageTransition from '@components/ui/PageTransition'
import { BlogEmptyState, BlogErrorState } from '@components/blog/BlogStates'

const CategoryPage = () => {
  const { category } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0
  })
  const [filters, setFilters] = useState({
    sortBy: 'newest',
    page: 1
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = {
          ...filters,
          category
        }
        
        const response = await postsService.getPosts(params)
        setPosts(response.posts)
        setPagination(response.pagination)
      } catch (err) {
        console.error('Error fetching posts by category:', err)
        setError('Failed to load posts. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPosts()
  }, [category, filters])

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }))
  }

  const toggleFilters = () => {
    setShowFilters(prev => !prev)
  }

  return (
    <PageTransition>
      <Helmet>
        <title>{category} Posts - MERN Blog Platform</title>
        <meta name="description" content={`Browse all posts in the ${category} category`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
            <li>
              <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">
                Home
              </Link>
            </li>
            <li className="mx-2">
              <HiChevronRight className="w-4 h-4" />
            </li>
            <li>
              <Link to="/blog" className="hover:text-primary-600 dark:hover:text-primary-400">
                Blog
              </Link>
            </li>
            <li className="mx-2">
              <HiChevronRight className="w-4 h-4" />
            </li>
            <li className="text-secondary-900 dark:text-white font-medium">
              {category}
            </li>
          </ol>
        </nav>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            {category} Posts
          </h1>
          
          <button 
            onClick={toggleFilters}
            className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <HiFilter className="w-5 h-5 mr-1" />
            <span>Filter</span>
          </button>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <GlassmorphicCard className="mb-8 p-4">
            <BlogFilters 
              filters={filters} 
              onFilterChange={handleFilterChange} 
            />
          </GlassmorphicCard>
        )}
        
        {/* Posts grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <SkeletonLoader key={index} height="400px" className="rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <BlogErrorState message={error} />
        ) : posts.length === 0 ? (
          <BlogEmptyState message={`No posts found in the ${category} category.`} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}

export default CategoryPage 