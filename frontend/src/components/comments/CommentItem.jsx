import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  HiHeart, 
  HiOutlineHeart, 
  HiThumbDown, 
  HiOutlineThumbDown, 
  HiReply, 
  HiDotsVertical, 
  HiTrash, 
  HiPencil, 
  HiFlag, 
  HiPaperAirplane 
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Services
import commentsService from '@services/commentsService';
import { sendCommentLike, sendCommentDislike, sendCommentReport } from '@services/socketService';

/**
 * CommentItem component to display a single comment with replies
 */
const CommentItem = ({ 
  comment, 
  onReply, 
  onDelete,
  onUpdate,
  postId,
  level = 0,
  replyingTo,
  setReplyingTo
}) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Form for editing
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { content: comment.content }
  });
  
  // Form for reporting
  const { register: registerReport, handleSubmit: handleSubmitReport, reset: resetReport } = useForm();

  // Calculate if this user has liked/disliked this comment
  const hasLiked = isAuthenticated && user && comment.likes?.some(like => 
    (like.user === user._id) || (like.user && like.user._id === user._id) || (like.user && like.user === user._id)
  );
  
  const hasDisliked = isAuthenticated && user && comment.dislikes?.some(dislike => 
    (dislike.user === user._id) || (dislike.user && dislike.user._id === user._id) || (dislike.user && dislike.user === user._id)
  );

  // Check if user can modify (edit/delete) this comment
  const canModify = isAuthenticated && user && comment.author._id === user._id;
  const isAdmin = isAuthenticated && user?.role === 'admin';

  // Handle loading replies
  const loadReplies = async () => {
    if (comment.replyCount === 0) return;
    
    setLoadingReplies(true);
    try {
      const response = await commentsService.getReplies(comment._id);
      setReplies(response.replies || []);
      setShowReplies(true);
    } catch (error) {
      console.error('Error loading replies:', error);
      toast.error('Failed to load replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  // Toggle replies visibility
  const toggleReplies = () => {
    if (!showReplies && comment.replyCount > 0) {
      loadReplies();
    } else {
      setShowReplies(!showReplies);
    }
  };

  // Handle comment like
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like comments');
      return;
    }

    try {
      // Store original state for rollback
      const originalLikes = [...(comment.likes || [])];

      // Optimistic update
      const isLiked = comment.likes?.some(like => 
        (like.user === user._id) || (like.user && like.user._id === user._id) || (like.user && like.user === user._id)
      );

      if (isLiked) {
        comment.likes = comment.likes.filter(like => 
          !(like.user === user._id || (like.user && like.user._id === user._id) || (like.user && like.user === user._id))
        );
      } else {
        if (!comment.likes) comment.likes = [];
        comment.likes.push({ user: user._id, createdAt: new Date() });
      }

      // Force re-render
      setForceUpdate(prev => prev + 1);

      // API call
      const response = await commentsService.likeComment(comment._id);
      
      // Handle response based on its structure
      if (response.data) {
        if (response.data.data) {
          // If response has data.data structure
          comment.likes = response.data.data.likes || [];
          comment.dislikes = response.data.data.dislikes || [];
        } else if (response.data.likes) {
          // If response has direct data structure
          comment.likes = response.data.likes || [];
          comment.dislikes = response.data.dislikes || [];
        }
        setForceUpdate(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error(error.message || 'Failed to like comment');
      
      // Rollback on error
      comment.likes = originalLikes;
      setForceUpdate(prev => prev + 1);
    }
  };

  // Handle comment dislike
  const handleDislike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to dislike comments');
      return;
    }

    try {
      // Store original state for rollback
      const originalDislikes = [...(comment.dislikes || [])];

      // Optimistic update
      const isDisliked = comment.dislikes?.some(dislike => 
        (dislike.user === user._id) || (dislike.user && dislike.user._id === user._id) || (dislike.user && dislike.user === user._id)
      );

      if (isDisliked) {
        comment.dislikes = comment.dislikes.filter(dislike => 
          !(dislike.user === user._id || (dislike.user && dislike.user._id === user._id) || (dislike.user && dislike.user === user._id))
        );
      } else {
        if (!comment.dislikes) comment.dislikes = [];
        comment.dislikes.push({ user: user._id, createdAt: new Date() });
      }

      // Force re-render
      setForceUpdate(prev => prev + 1);

      // API call
      const response = await commentsService.dislikeComment(comment._id);
      
      // Handle response based on its structure
      if (response.data) {
        if (response.data.data) {
          // If response has data.data structure
          comment.likes = response.data.data.likes || [];
          comment.dislikes = response.data.data.dislikes || [];
        } else if (response.data.likes) {
          // If response has direct data structure
          comment.likes = response.data.likes || [];
          comment.dislikes = response.data.dislikes || [];
        }
        setForceUpdate(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error disliking comment:', error);
      toast.error(error.message || 'Failed to dislike comment');
      
      // Rollback on error
      comment.dislikes = originalDislikes;
      setForceUpdate(prev => prev + 1);
    }
  };

  // Handle reply
  const handleReply = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to reply');
      return;
    }
    
    setReplyingTo(comment);
    onReply(comment);
  };

  // Handle edit submit
  const onEditSubmit = async (data) => {
    try {
      await commentsService.updateComment(comment._id, data.content);
      onUpdate(comment._id, data.content);
      setIsEditing(false);
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  // Handle report submit
  const onReportSubmit = async (data) => {
    try {
      await commentsService.reportComment(comment._id, data.reason);
      setReportDialogOpen(false);
      resetReport();
      toast.success('Comment reported for moderation');
      
      sendCommentReport({
        postId,
        commentId: comment._id,
        userId: user._id,
        reason: data.reason
      });
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error('Failed to report comment');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await commentsService.deleteComment(comment._id);
      onDelete(comment._id);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setIsEditing(false);
    reset({ content: comment.content });
  };

  return (
    <div className={`mb-3 ${level > 0 ? 'ml-6' : ''}`}>
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-100 dark:border-secondary-700 p-4">
        {/* Comment header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <img 
              src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.firstName}+${comment.author.lastName}&background=3b82f6&color=fff`}
              alt={comment.author.firstName}
              className="w-8 h-8 rounded-full mr-2"
            />
            <div>
              <span className="font-medium text-secondary-900 dark:text-white">
                {comment.author.firstName} {comment.author.lastName}
              </span>
              <div className="text-xs text-secondary-500 dark:text-secondary-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.isEdited && (
                  <span className="ml-2 italic">• edited</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Comment actions menu */}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 rounded-full"
            >
              <HiDotsVertical className="w-5 h-5" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-secondary-800 rounded-md shadow-lg z-10 border border-secondary-200 dark:border-secondary-700">
                <ul className="py-1">
                  {canModify && (
                    <>
                      <li>
                        <button 
                          onClick={() => {
                            setIsEditing(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                        >
                          <HiPencil className="mr-2" /> Edit Comment
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => {
                            handleDelete();
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                        >
                          <HiTrash className="mr-2" /> Delete Comment
                        </button>
                      </li>
                    </>
                  )}
                  
                  {(isAdmin || !canModify) && (
                    <li>
                      <button 
                        onClick={() => {
                          setReportDialogOpen(true);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center"
                      >
                        <HiFlag className="mr-2" /> Report Comment
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Comment content */}
        {isEditing ? (
          <form onSubmit={handleSubmit(onEditSubmit)} className="mt-2">
            <textarea
              {...register('content', {
                required: 'Comment cannot be empty',
                maxLength: {
                  value: 1000,
                  message: 'Comment cannot exceed 1000 characters'
                }
              })}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
              rows={3}
            />
            
            {errors.content && (
              <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>
            )}
            
            <div className="mt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-3 py-1 text-sm text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="text-secondary-800 dark:text-secondary-200 text-sm whitespace-pre-wrap">
            {comment.content}
          </div>
        )}
        
        {/* Comment actions */}
        <div className="mt-3 flex items-center text-xs text-secondary-500 dark:text-secondary-400 space-x-4">
          <div className="flex items-center">
            <button 
              onClick={handleLike}
              className={`mr-1 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors ${hasLiked ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10' : ''}`}
              title={hasLiked ? "Unlike" : "Like"}
              aria-label={hasLiked ? "Unlike comment" : "Like comment"}
            >
              {hasLiked ? (
                <HiHeart className="w-4 h-4" />
              ) : (
                <HiOutlineHeart className="w-4 h-4" />
              )}
            </button>
            <span className={hasLiked ? 'text-red-500 dark:text-red-400' : ''}>{comment.likes?.length || 0}</span>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handleDislike}
              className={`mr-1 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors ${hasDisliked ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10' : ''}`}
              title={hasDisliked ? "Remove dislike" : "Dislike"}
              aria-label={hasDisliked ? "Remove dislike from comment" : "Dislike comment"}
            >
              {hasDisliked ? (
                <HiThumbDown className="w-4 h-4" />
              ) : (
                <HiOutlineThumbDown className="w-4 h-4" />
              )}
            </button>
            <span className={hasDisliked ? 'text-blue-500 dark:text-blue-400' : ''}>{comment.dislikes?.length || 0}</span>
          </div>
          
          <button 
            onClick={handleReply}
            className="flex items-center hover:text-primary-600 dark:hover:text-primary-400"
          >
            <HiReply className="w-4 h-4 mr-1" />
            Reply
          </button>
          
          {comment.replyCount > 0 && (
            <button 
              onClick={toggleReplies}
              className="flex items-center hover:text-primary-600 dark:hover:text-primary-400"
            >
              {showReplies ? 'Hide replies' : `Show replies (${comment.replyCount})`}
            </button>
          )}
        </div>
      </div>
      
      {/* Reply form when replying to this comment */}
      {replyingTo && replyingTo._id === comment._id && (
        <div className="ml-6 mt-3">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-100 dark:border-secondary-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-secondary-500 dark:text-secondary-400">
                Replying to {comment.author.firstName} {comment.author.lastName}
              </span>
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-xs text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Nested replies */}
      {showReplies && (
        <div className="mt-3 ml-6">
          {loadingReplies ? (
            <div className="py-3 text-center text-secondary-500 dark:text-secondary-400">
              Loading replies...
            </div>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                onUpdate={onUpdate}
                postId={postId}
                level={level + 1}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
              />
            ))
          )}
        </div>
      )}
      
      {/* Report dialog */}
      {reportDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-md w-full p-5">
            <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-3">
              Report Comment
            </h3>
            
            <form onSubmit={handleSubmitReport}>
              <textarea
                {...registerReport('reason', {
                  required: 'Reason is required',
                  maxLength: {
                    value: 500,
                    message: 'Reason cannot exceed 500 characters'
                  }
                })}
                placeholder="Please explain why this comment should be reviewed by moderators"
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
                rows={4}
              />
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setReportDialogOpen(false)}
                  className="px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentItem; 