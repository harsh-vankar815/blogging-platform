import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiEye, HiHeart, HiClock, HiCalendar, HiTag, HiOutlineHeart, HiBookmark, HiOutlineBookmark, HiPencil, HiTrash } from 'react-icons/hi'
import { formatDate, formatNumber, truncateText } from '@utils/helpers'
import { DATE_FORMATS } from '@utils/constants'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { deletePost } from '@store/slices/postsSlice'

const PostCard = ({
  post,
  showAuthor = true,
  className = '',
  variant = 'default', // 'default', 'compact', 'featured'
  onLike = null,
  onSave = null,
  showActions = false
}) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isLiked, setIsLiked] = useState(post?.isLiked || false)
  const [isSaved, setIsSaved] = useState(post?.isSaved || false)
  const [likeCount, setLikeCount] = useState(post?.likes?.length || post?.likeCount || 0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAuthor, setIsAuthor] = useState(false)

  const {
    _id,
    title,
    slug,
    excerpt,
    featuredImage,
    author,
    publishedAt,
    views,
    category,
    tags = [],
    readTime,
    status
  } = post

  // Determine if current user is the author of the post
  useEffect(() => {
    // Default to false
    let authorMatch = false;
    
    // Only check if user is authenticated and both user and author exist
    if (isAuthenticated && user && author) {
      // Get user ID as string
      const userId = String(user._id);
      
      // Get author ID as string based on whether author is an object or string
      let authorId;
      if (typeof author === 'object' && author._id) {
        authorId = String(author._id);
      } else if (typeof author === 'string') {
        authorId = String(author);
      }
      
      // Check if IDs match
      if (userId && authorId && userId === authorId) {
        authorMatch = true;
      }
      
      // Force debug logging
      console.log('AUTHOR CHECK:', {
        userId,
        authorId,
        isMatch: authorMatch,
        user,
        author,
        postTitle: title
      });
    }
    
    // Set the state
    setIsAuthor(authorMatch);
  }, [isAuthenticated, user, author, title]);

  // Handle like action
  const handleLike = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Please log in to like posts')
      return
    }

    try {
      setIsLiked(!isLiked)
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1)

      if (onLike) {
        await onLike(_id)
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(isLiked)
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1)
      toast.error('Failed to like post')
    }
  }

  // Handle save action
  const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Please log in to save posts')
      return
    }

    try {
      setIsSaved(!isSaved)

      if (onSave) {
        await onSave(_id)
      }

      toast.success(isSaved ? 'Post removed from bookmarks' : 'Post saved to bookmarks')
    } catch (error) {
      // Revert optimistic update on error
      setIsSaved(isSaved)
      toast.error('Failed to save post')
    }
  }

  // Handle delete post
  const handleDeletePost = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await dispatch(deletePost(_id)).unwrap();
      toast.success('Post deleted successfully');
      navigate('/blog');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <motion.article
        className={`bg-white dark:bg-secondary-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
        whileHover={{ y: -2 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          {/* Category */}
          {category && (
            <div className="mb-2">
              <span className="inline-block px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 rounded-full">
                {category}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2 line-clamp-2">
            <Link
              to={`/blog/${slug}`}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {title}
            </Link>
          </h3>

          {/* Author and Date */}
          <div className="flex items-center justify-between text-sm text-secondary-500 dark:text-secondary-400">
            {showAuthor && author && (
              <div className="flex items-center">
                <img
                  src={author.avatar || `https://ui-avatars.com/api/?name=${author.firstName}+${author.lastName}&background=3b82f6&color=fff`}
                  alt={`${author.firstName} ${author.lastName}`}
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span className="truncate">{author.firstName} {author.lastName}</span>
              </div>
            )}

            {publishedAt && (
              <span title={formatDate(publishedAt, DATE_FORMATS.EXACT)}>{formatDate(publishedAt, DATE_FORMATS.SHORT)}</span>
            )}
          </div>
          
          {/* Author actions - Only show for the post author */}
          {isAuthor && (
            <div className="flex items-center justify-end mt-3 space-x-2">
              <Link to={`/edit-post/${_id}`} onClick={(e) => e.stopPropagation()}>
                <button 
                  className="px-2 py-1 text-xs flex items-center bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50"
                >
                  <HiPencil className="w-3 h-3 mr-1" />
                  Edit
                </button>
              </Link>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if(window.confirm(`Are you sure you want to delete "${title}"?`)) {
                    handleDeletePost(e);
                  }
                }}
                className="px-2 py-1 text-xs flex items-center bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800/50"
                disabled={isDeleting}
              >
                <HiTrash className="w-3 h-3 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </motion.article>
    )
  }

  // Default and featured variants
  const isFeatureVariant = variant === 'featured'

  return (
    <motion.article
      className={`bg-white dark:bg-secondary-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex ${isFeatureVariant ? 'flex-col' : 'flex-col md:flex-row'}`}>
        {/* Featured Image */}
        {featuredImage && (
          <div className={isFeatureVariant ? 'w-full' : 'md:w-1/3 lg:w-1/4'}>
            <Link to={`/blog/${slug}`}>
              <div className="relative overflow-hidden">
                <img
                  src={featuredImage}
                  alt={title}
                  className={`w-full object-cover hover:scale-105 transition-transform duration-300 ${
                    isFeatureVariant ? 'h-64' : 'h-48 md:h-full'
                  }`}
                />
                {status === 'draft' && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded">
                      Draft
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 p-6 ${featuredImage ? '' : 'md:p-8'}`}>
          {/* Category and Tags */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {category && (
                <span className="inline-block px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 rounded-full">
                  {category}
                </span>
              )}
              {tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <HiTag className="w-3 h-3 text-secondary-400" />
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    {tags.slice(0, 2).join(', ')}
                    {tags.length > 2 && ` +${tags.length - 2}`}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {showActions && isAuthenticated && (
                <>
                  <button
                    onClick={handleLike}
                    className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                    title={isLiked ? 'Unlike post' : 'Like post'}
                  >
                    {isLiked ? (
                      <HiHeart className="w-4 h-4 text-red-500" />
                    ) : (
                      <HiOutlineHeart className="w-4 h-4 text-secondary-400" />
                    )}
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                    title={isSaved ? 'Remove from bookmarks' : 'Save to bookmarks'}
                  >
                    {isSaved ? (
                      <HiBookmark className="w-4 h-4 text-primary-500" />
                    ) : (
                      <HiOutlineBookmark className="w-4 h-4 text-secondary-400" />
                    )}
                  </button>
                </>
              )}
              
              {/* Author actions - Only show for the post author */}
              {isAuthor && (
                <>
                  <Link to={`/edit-post/${_id}`} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="px-2 py-1 flex items-center bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50"
                      title="Edit post"
                    >
                      <HiPencil className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </Link>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if(window.confirm(`Are you sure you want to delete "${title}"?`)) {
                        handleDeletePost(e);
                      }
                    }}
                    className="px-2 py-1 flex items-center bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800/50"
                    title="Delete post"
                    disabled={isDeleting}
                  >
                    <HiTrash className="w-4 h-4 mr-1" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className={`font-bold text-secondary-900 dark:text-white mb-3 line-clamp-2 ${
            isFeatureVariant ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
          }`}>
            <Link
              to={`/blog/${slug}`}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {title}
            </Link>
          </h2>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-secondary-600 dark:text-secondary-300 mb-4 line-clamp-3">
              {truncateText(excerpt, isFeatureVariant ? 200 : 150)}
            </p>
          )}

          {/* Author Info */}
          {showAuthor && author && (
            <div className="flex items-center mb-4">
              <Link to={`/profile/${author.username}`} className="flex items-center group">
                <img
                  src={author.avatar || `https://ui-avatars.com/api/?name=${author.firstName}+${author.lastName}&background=3b82f6&color=fff`}
                  alt={`${author.firstName} ${author.lastName}`}
                  className="w-8 h-8 rounded-full mr-3"
                />
                <div>
                  <p className="text-sm font-medium text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {author.firstName} {author.lastName}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    @{author.username}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-secondary-500 dark:text-secondary-400">
            <div className="flex items-center space-x-4">
              {publishedAt && (
                <div className="flex items-center">
                  <HiCalendar className="w-4 h-4 mr-1" />
                  <span title={formatDate(publishedAt, DATE_FORMATS.EXACT)}>{formatDate(publishedAt, DATE_FORMATS.SHORT)}</span>
                </div>
              )}

              {readTime && (
                <div className="flex items-center">
                  <HiClock className="w-4 h-4 mr-1" />
                  <span>{readTime} min read</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {views !== undefined && (
                <div className="flex items-center">
                  <HiEye className="w-4 h-4 mr-1" />
                  <span>{formatNumber(views)}</span>
                </div>
              )}

              <div className="flex items-center">
                <HiHeart className="w-4 h-4 mr-1" />
                <span>{formatNumber(likeCount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default PostCard
