import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { HiHeart, HiOutlineHeart, HiBookmark, HiOutlineBookmark, HiShare, HiPencil, HiTrash } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import { formatDate } from '@utils/helpers';
import { DATE_FORMATS } from '@utils/constants';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { Helmet } from 'react-helmet-async';

// Services
import postsService from '@services/postsService';
import { joinPostRoom, leavePostRoom, sendPostLike, onPostLiked } from '@services/socketService';

// Components
import RealTimeComments from '@components/comments/RealTimeComments';
import GlassmorphicCard from '@components/ui/GlassmorphicCard';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import PageTransition from '@components/ui/PageTransition';
import PostContent from '@components/blog/PostContent';
import { useTheme } from '@contexts/ThemeContext';

// Store
import { deletePost } from '@store/slices/postsSlice';

/**
 * BlogPost component for displaying a single blog post with real-time features
 * @returns {JSX.Element} BlogPost component
 */
const BlogPost = () => {
  const { slug } = useParams();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasUserLiked, setHasUserLiked] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  
  // Fetch the post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        
        // Check if slug is undefined or empty
        if (!slug || slug === 'undefined') {
          setError('Post not found. Invalid post ID.');
          setIsLoading(false);
          return;
        }
        
        const data = await postsService.getPostBySlug(slug);
        
        if (!data) {
          setError('Post not found.');
          setIsLoading(false);
          return;
        }
        
        setPost(data);
        setComments(data.comments || []);
        setLikeCount(data.likes?.length || 0);
        
        // Check if the user has liked the post
        if (isAuthenticated && user) {
          setHasUserLiked(data.isLiked || false);
          
          try {
            // Check if the post is saved by the user
            const savedPosts = await postsService.getSavedPosts();
            setIsSaved(savedPosts.some(savedPost => savedPost._id === data._id));
          } catch (saveErr) {
            console.error('Error checking saved posts:', saveErr);
            // Don't set error state here, just log it
          }
          
          // Check if user is the creator of this post
          if (data.author && user) {
            // Get author ID as string
            const authorId = typeof data.author === 'object' ? data.author._id : data.author;
            const userId = user._id;
            
            // Check if the current user created this post
            const isCreator = userId === authorId;
            setIsAuthor(isCreator);
            
            console.log('Post creator check:', {
              postId: data._id,
              authorId,
              userId,
              isCreator
            });
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.message || 'Failed to load the post. Please try again later.');
        setIsLoading(false);
        
        // If the error is a 404, redirect to the blog list after a delay
        if (err.response?.status === 404) {
          setTimeout(() => {
            navigate('/blog');
          }, 3000);
        }
      }
    };
    
    fetchPost();
  }, [slug, isAuthenticated, user, navigate]);
  
  // Set up real-time updates for post likes
  useEffect(() => {
    if (post?._id) {
      // Join the post room for real-time updates
      joinPostRoom(post._id);
      
      // Listen for post like updates
      const unsubscribePostLiked = onPostLiked((data) => {
        if (data.postId === post._id) {
          setLikeCount(data.likes?.length || 0);
          
          // Check if the current user has liked the post
          if (isAuthenticated && user) {
            setHasUserLiked(data.isLiked || false);
          }
        }
      });
      
      // Clean up when the component unmounts
      return () => {
        leavePostRoom(post._id);
        unsubscribePostLiked();
      };
    }
  }, [post?._id, isAuthenticated, user]);
  
  // Handle post like
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like posts');
      return;
    }
    
    try {
      // Optimistic UI update
      setHasUserLiked(!hasUserLiked);
      setLikeCount(prev => hasUserLiked ? prev - 1 : prev + 1);
      
      // Send the like to the server via REST API
      const response = await postsService.likePost(post._id);
      
      // Update with actual server response
      setLikeCount(response.likeCount);
      setHasUserLiked(response.isLiked);
      
      // Also send via socket for real-time updates to other users
      const likeData = {
        postId: post._id,
        userId: user._id,
        likes: response.likeCount,
        isLiked: response.isLiked
      };
      sendPostLike(likeData);
    } catch (err) {
      console.error('Error liking post:', err);
      toast.error('Failed to like the post. Please try again.');
      
      // Revert optimistic update on error
      setHasUserLiked(!hasUserLiked);
      setLikeCount(prev => hasUserLiked ? prev + 1 : prev - 1);
    }
  };
  
  // Handle post save/bookmark
  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save posts');
      return;
    }
    
    try {
      await postsService.toggleSavePost(post._id);
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Post removed from bookmarks' : 'Post saved to bookmarks');
    } catch (err) {
      console.error('Error saving post:', err);
      toast.error('Failed to save the post. Please try again.');
    }
  };
  
  // Handle post share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      })
        .then(() => console.log('Shared successfully'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };
  
  // Handle post delete
  const handleDeletePost = async () => {
    if (!post?._id) return;
    
    setIsDeleting(true);
    try {
      await postsService.deletePost(post._id);
      toast.success('Post deleted successfully');
      navigate('/blog');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  if (isLoading) {
    return (
      <PageTransition>
        <Helmet>
          <title>Loading... - MERN Blog Platform</title>
          <meta name="description" content="Loading blog post" />
        </Helmet>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <SkeletonLoader variant="rectangle" height="400px" className="mb-8" />
          <SkeletonLoader variant="text" width="3/4" className="mb-4" />
          <SkeletonLoader variant="text" width="1/2" className="mb-8" />
          <div className="flex items-center space-x-4 mb-8">
            <SkeletonLoader variant="circle" width="48px" height="48px" />
            <div>
              <SkeletonLoader variant="text" width="150px" className="mb-2" />
              <SkeletonLoader variant="text" width="100px" />
            </div>
          </div>
          <div className="space-y-4 mb-8">
            <SkeletonLoader variant="text" width="full" />
            <SkeletonLoader variant="text" width="full" />
            <SkeletonLoader variant="text" width="full" />
            <SkeletonLoader variant="text" width="3/4" />
          </div>
        </div>
      </PageTransition>
    );
  }
  
  if (error) {
    return (
      <PageTransition>
        <Helmet>
          <title>Error - MERN Blog Platform</title>
          <meta name="description" content="Error loading blog post" />
        </Helmet>
        <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
          <GlassmorphicCard className="p-8">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
            <p className="text-secondary-700 dark:text-secondary-300 mb-6">{error}</p>
            <Link to="/blog">
              <motion.button
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow-md transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Blog
              </motion.button>
            </Link>
          </GlassmorphicCard>
        </div>
      </PageTransition>
    );
  }
  
  if (!post) return null;
  
  return (
    <PageTransition>
      <Helmet>
        <title>{post.title} - MERN Blog Platform</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-[400px] object-cover"
            />
          </div>
        )}
        
        {/* Post Header */}
        <GlassmorphicCard className="p-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <Link to={`/profile/${post.author.username}`}>
                <img
                  src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.firstName}+${post.author.lastName}&background=random`}
                  alt={`${post.author.firstName} ${post.author.lastName}`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary-500"
                />
              </Link>
              <div>
                <Link to={`/profile/${post.author.username}`} className="font-medium text-secondary-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                  {post.author.firstName} {post.author.lastName}
                </Link>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  Posted on {formatDate(post.createdAt, DATE_FORMATS.EXACT)} ({formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })})
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {post.category && (
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full">
                  {post.category}
                </span>
              )}
              {post.tags && post.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* Post Actions */}
          <div className="flex items-center justify-between border-t border-b border-secondary-200 dark:border-secondary-700 py-4 mb-6">
            <div className="flex items-center space-x-6">
              {/* Like button */}
              <motion.button
                onClick={handleLike}
                className="flex items-center text-secondary-700 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {hasUserLiked ? (
                  <HiHeart className="w-6 h-6 mr-2 text-red-500" />
                ) : (
                  <HiOutlineHeart className="w-6 h-6 mr-2" />
                )}
                <span>{likeCount}</span>
              </motion.button>
              
              {/* Save/Bookmark button */}
              <motion.button
                onClick={handleSave}
                className="flex items-center text-secondary-700 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSaved ? (
                  <HiBookmark className="w-6 h-6 mr-2 text-primary-500" />
                ) : (
                  <HiOutlineBookmark className="w-6 h-6 mr-2" />
                )}
                <span>Save</span>
              </motion.button>
              
              {/* Share button */}
              <motion.button
                onClick={handleShare}
                className="flex items-center text-secondary-700 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HiShare className="w-6 h-6 mr-2" />
                <span>Share</span>
              </motion.button>
            </div>
            
            {/* Edit/Delete buttons (for post creator only) */}
            {isAuthor && (
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-4 mb-2 w-full">
                <div className="text-sm text-gray-600 dark:text-gray-300 mr-auto mb-2 sm:mb-0">
                  You created this post and can edit or delete it
                </div>
                <div className="flex items-center space-x-3">
                  <Link to={`/edit-post/${post._id}`}>
                    <motion.button
                      className="flex items-center bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <HiPencil className="w-5 h-5 mr-2" />
                      <span>Edit</span>
                    </motion.button>
                  </Link>
                  <motion.button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <HiTrash className="w-5 h-5 mr-2" />
                    <span>Delete</span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
          
          {/* Post Content */}
          <PostContent content={post.content} />
        </GlassmorphicCard>
        
        {/* Comments Section */}
        <GlassmorphicCard className="p-6">
          <RealTimeComments 
            postId={post._id} 
            initialComments={comments} 
            isLoading={isLoading} 
          />
        </GlassmorphicCard>
      </article>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
              Delete Post
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              Are you sure you want to delete "{post.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageTransition>
  );
};

export default BlogPost;
