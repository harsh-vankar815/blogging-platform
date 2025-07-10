import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiXCircle, HiEye, HiOutlineExclamationCircle } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Services
import commentsService from '@services/commentsService';

// Components
import GlassmorphicCard from '../ui/GlassmorphicCard';
import SkeletonLoader from '../ui/SkeletonLoader';
import Pagination from '../ui/Pagination';

/**
 * CommentModeration component for admins to review reported comments
 */
const CommentModeration = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalComments: 0
  });
  const [viewingComment, setViewingComment] = useState(null);
  
  // Check if user is admin
  const isAdmin = isAuthenticated && user?.role === 'admin';
  
  // Fetch reported comments
  useEffect(() => {
    if (!isAdmin) {
      setError('Admin access required');
      setLoading(false);
      return;
    }
    
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await commentsService.getModerationQueue({ 
          page: pagination.currentPage
        });
        
        setComments(response.comments || []);
        setPagination(response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalComments: 0
        });
      } catch (error) {
        console.error('Error fetching reported comments:', error);
        setError('Failed to load reported comments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [isAdmin, pagination.currentPage]);
  
  // Handle page change
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  // Handle comment approval
  const handleApprove = async (commentId) => {
    try {
      await commentsService.moderateComment(commentId, 'approve');
      
      // Remove from list
      setComments(comments.filter(comment => comment._id !== commentId));
      
      // Update total count
      setPagination(prev => ({
        ...prev,
        totalComments: prev.totalComments - 1
      }));
      
      toast.success('Comment approved');
    } catch (error) {
      console.error('Error approving comment:', error);
      toast.error('Failed to approve comment');
    }
  };
  
  // Handle comment rejection
  const handleReject = async (commentId) => {
    try {
      await commentsService.moderateComment(commentId, 'reject');
      
      // Remove from list
      setComments(comments.filter(comment => comment._id !== commentId));
      
      // Update total count
      setPagination(prev => ({
        ...prev,
        totalComments: prev.totalComments - 1
      }));
      
      toast.success('Comment rejected');
    } catch (error) {
      console.error('Error rejecting comment:', error);
      toast.error('Failed to reject comment');
    }
  };
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.2 } }
  };
  
  if (!isAdmin) {
    return (
      <GlassmorphicCard className="p-6 text-center">
        <HiOutlineExclamationCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-secondary-600 dark:text-secondary-400">
          You need administrator privileges to access the comment moderation panel.
        </p>
      </GlassmorphicCard>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Comment Moderation
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Review and moderate reported comments
        </p>
      </div>
      
      {loading ? (
        // Loading state
        <div className="space-y-4">
          <SkeletonLoader height="120px" className="rounded-lg" />
          <SkeletonLoader height="120px" className="rounded-lg" />
          <SkeletonLoader height="120px" className="rounded-lg" />
        </div>
      ) : error ? (
        // Error state
        <GlassmorphicCard className="p-6 text-center">
          <HiOutlineExclamationCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            {error}
          </p>
        </GlassmorphicCard>
      ) : comments.length === 0 ? (
        // Empty state
        <GlassmorphicCard className="p-6 text-center">
          <p className="text-secondary-600 dark:text-secondary-400">
            No comments reported for moderation at this time.
          </p>
        </GlassmorphicCard>
      ) : (
        // Comments list
        <div>
          <div className="grid gap-4">
            <AnimatePresence>
              {comments.map(comment => (
                <motion.div
                  key={comment._id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <GlassmorphicCard className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Comment info */}
                      <div className="flex-1">
                        <div className="flex items-start mb-2">
                          <img 
                            src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.firstName}+${comment.author.lastName}&background=3b82f6&color=fff`}
                            alt={comment.author.firstName}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <div className="font-medium text-secondary-900 dark:text-white">
                              {comment.author.firstName} {comment.author.lastName}
                            </div>
                            <div className="text-xs text-secondary-500 dark:text-secondary-400">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              {" • "}
                              <span className="text-primary-600 dark:text-primary-400">
                                {comment.post.title}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-secondary-50 dark:bg-secondary-700/30 p-3 rounded-md mb-3 text-sm text-secondary-800 dark:text-secondary-200">
                          {comment.content}
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm">
                          <div className="font-medium text-red-800 dark:text-red-300 mb-1">
                            Reported Reason:
                          </div>
                          <div className="text-red-700 dark:text-red-200">
                            {comment.moderationReason}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex md:flex-col gap-2 md:w-24">
                        <button
                          onClick={() => handleApprove(comment._id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 rounded-md transition-colors"
                        >
                          <HiCheckCircle className="w-5 h-5" />
                          <span>Approve</span>
                        </button>
                        
                        <button
                          onClick={() => handleReject(comment._id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded-md transition-colors"
                        >
                          <HiXCircle className="w-5 h-5" />
                          <span>Reject</span>
                        </button>
                        
                        <button
                          onClick={() => setViewingComment(comment)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-800 dark:bg-secondary-700/30 dark:hover:bg-secondary-700/50 dark:text-secondary-300 rounded-md transition-colors"
                        >
                          <HiEye className="w-5 h-5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </GlassmorphicCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Comment view modal */}
      {viewingComment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full m-4 p-6"
          >
            <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
              Comment Details
            </h3>
            
            <div className="mb-4">
              <div className="flex items-start mb-3">
                <img 
                  src={viewingComment.author.avatar || `https://ui-avatars.com/api/?name=${viewingComment.author.firstName}+${viewingComment.author.lastName}&background=3b82f6&color=fff`}
                  alt={viewingComment.author.firstName}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <div className="font-medium text-secondary-900 dark:text-white">
                    {viewingComment.author.firstName} {viewingComment.author.lastName}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">
                    Posted {formatDistanceToNow(new Date(viewingComment.createdAt), { addSuffix: true })}
                    {viewingComment.isEdited && " • Edited"}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Post:
                </div>
                <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-md text-sm text-primary-800 dark:text-primary-300">
                  {viewingComment.post.title}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Comment Content:
                </div>
                <div className="bg-secondary-50 dark:bg-secondary-700/30 p-3 rounded-md text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap">
                  {viewingComment.content}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  Reported Reason:
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-700 dark:text-red-200">
                  {viewingComment.moderationReason}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setViewingComment(null)}
                className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-800 dark:bg-secondary-700 dark:hover:bg-secondary-600 dark:text-white rounded-md transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApprove(viewingComment._id);
                  setViewingComment(null);
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  handleReject(viewingComment._id);
                  setViewingComment(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CommentModeration; 