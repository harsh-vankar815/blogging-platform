import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { HiPaperAirplane } from 'react-icons/hi';
import toast from 'react-hot-toast';

// Components
import CommentItem from './CommentItem';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import SkeletonLoader from '../ui/SkeletonLoader';

// Services
import commentsService from '@services/commentsService';
import {
  initializeSocket,
  joinPostRoom,
  leavePostRoom,
  onCommentAdded,
  onCommentLiked,
  onCommentDisliked,
  onCommentUpdated,
  onCommentDeleted,
  onCommentApproved
} from '@services/socketService';
import tokenManager from '@utils/tokenManager';

/**
 * RealTimeComments component for displaying and managing comments with real-time updates
 */
const RealTimeComments = ({ postId, initialComments = [], isLoading = false }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [comments, setComments] = useState(initialComments);
  const [replyingTo, setReplyingTo] = useState(null);
  const commentEndRef = useRef(null);
  const socket = useRef(null);

  // Form for adding comments
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  // Initialize socket connection
  useEffect(() => {
    socket.current = initializeSocket();
    
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Load comments from localStorage when the component mounts
  useEffect(() => {
    if (postId) {
      try {
        // Try to load comments from localStorage first
        const storedComments = localStorage.getItem(`comments_${postId}`);
        if (storedComments) {
          const parsedComments = JSON.parse(storedComments);
          console.log('Loaded comments from localStorage:', parsedComments.length);
          
          // If we have stored comments and no initial comments, use the stored ones
          if (parsedComments.length > 0 && initialComments.length === 0) {
            setComments(parsedComments);
          } else {
            // Otherwise use the initial comments passed as props
            setComments(initialComments);
            // And update localStorage with these comments
            localStorage.setItem(`comments_${postId}`, JSON.stringify(initialComments));
          }
        } else {
          // No stored comments, use the initial comments
          setComments(initialComments);
          // And store them for future use
          localStorage.setItem(`comments_${postId}`, JSON.stringify(initialComments));
        }
      } catch (err) {
        console.error('Error loading comments from localStorage:', err);
        // Fall back to initial comments
        setComments(initialComments);
      }
    }
  }, [postId, initialComments]);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    if (postId && comments.length > 0) {
      try {
        localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
        console.log('Saved comments to localStorage:', comments.length);
      } catch (err) {
        console.error('Error saving comments to localStorage:', err);
      }
    }
  }, [postId, comments]);

  // Join the post room when the component mounts
  useEffect(() => {
    if (postId) {
      console.log(`Joining post room: post:${postId}`);
      joinPostRoom(postId);
      
      // Set up listeners for real-time updates
      const unsubscribeCommentAdded = onCommentAdded((data) => {
        if (data.postId === postId) {
          // If this is a reply to a comment, we don't add it to the top-level comments
          if (!data.comment.parentComment) {
            setComments((prevComments) => [data.comment, ...prevComments]);
            // Scroll to the new comment
            setTimeout(() => {
              commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      });

      const unsubscribeCommentLiked = onCommentLiked((data) => {
        if (data.postId === postId || data.post === postId) {
          console.log('Received comment like update:', data);
          const commentId = data.commentId || data._id;
          
          // Store the updated likes in the comment
          updateCommentInState(commentId, { 
            likes: data.likes || [],
            dislikes: data.dislikes || [] // Include dislikes in case they were updated too
          });
          
          // Save to localStorage for persistence
          try {
            const storedComments = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]');
            const updatedStoredComments = storedComments.map(comment => {
              if (comment._id === commentId) {
                return { 
                  ...comment, 
                  likes: data.likes || comment.likes || [],
                  dislikes: data.dislikes || comment.dislikes || []
                };
              }
              return comment;
            });
            localStorage.setItem(`comments_${postId}`, JSON.stringify(updatedStoredComments));
          } catch (err) {
            console.error('Error saving comment likes to localStorage:', err);
          }
        }
      });

      const unsubscribeCommentDisliked = onCommentDisliked((data) => {
        if (data.postId === postId || data.post === postId) {
          console.log('Received comment dislike update:', data);
          const commentId = data.commentId || data._id;
          
          // Store the updated dislikes in the comment
          updateCommentInState(commentId, { 
            likes: data.likes || [], // Include likes in case they were updated too
            dislikes: data.dislikes || []
          });
          
          // Save to localStorage for persistence
          try {
            const storedComments = JSON.parse(localStorage.getItem(`comments_${postId}`) || '[]');
            const updatedStoredComments = storedComments.map(comment => {
              if (comment._id === commentId) {
                return { 
                  ...comment, 
                  likes: data.likes || comment.likes || [],
                  dislikes: data.dislikes || comment.dislikes || []
                };
              }
              return comment;
            });
            localStorage.setItem(`comments_${postId}`, JSON.stringify(updatedStoredComments));
          } catch (err) {
            console.error('Error saving comment dislikes to localStorage:', err);
          }
        }
      });

      const unsubscribeCommentUpdated = onCommentUpdated((data) => {
        if (data.postId === postId || data.post === postId) {
          const commentId = data.commentId || data._id;
          
          // Handle different types of updates
          if (data.type === 'LIKE' || data.type === 'DISLIKE') {
            // Handle like/dislike updates
            updateCommentInState(commentId, { 
              likes: data.likes || [],
              dislikes: data.dislikes || []
            });
          } else if (data.content) {
            // Handle content updates
            updateCommentInState(commentId, { 
              content: data.content,
              isEdited: true,
              editedAt: new Date().toISOString()
            });
          } else {
            // Handle other updates
            const updates = {};
            if (data.likes) updates.likes = data.likes;
            if (data.dislikes) updates.dislikes = data.dislikes;
            if (Object.keys(updates).length > 0) {
              updateCommentInState(commentId, updates);
            }
          }
        }
      });

      const unsubscribeCommentDeleted = onCommentDeleted((data) => {
        if (data.postId === postId) {
          removeCommentFromState(data.commentId);
        }
      });

      const unsubscribeCommentApproved = onCommentApproved((data) => {
        if (data.postId === postId) {
          updateCommentInState(data.commentId, { 
            isApproved: true,
            needsModeration: false
          });
        }
      });

      // Clean up when the component unmounts
      return () => {
        console.log(`Leaving post room: post:${postId}`);
        leavePostRoom(postId);
        unsubscribeCommentAdded();
        unsubscribeCommentLiked();
        unsubscribeCommentDisliked();
        unsubscribeCommentUpdated();
        unsubscribeCommentDeleted();
        unsubscribeCommentApproved();
      };
    }
  }, [postId]);

  // Update comment in state
  const updateCommentInState = (commentId, updates) => {
    setComments((prevComments) => 
      prevComments.map((comment) => {
        if (comment._id === commentId) {
          // Create a new comment object with the updates
          const updatedComment = { ...comment };
          
          // Handle likes and dislikes separately to ensure they're always arrays
          if (updates.likes !== undefined) {
            updatedComment.likes = updates.likes || [];
          }
          
          if (updates.dislikes !== undefined) {
            updatedComment.dislikes = updates.dislikes || [];
          }
          
          // Handle other updates
          Object.keys(updates).forEach(key => {
            if (key !== 'likes' && key !== 'dislikes') {
              updatedComment[key] = updates[key];
            }
          });
          
          // If likes or dislikes are updated, log the changes
          if (updates.likes !== undefined || updates.dislikes !== undefined) {
            console.log('Updated comment reactions:', {
              commentId,
              likes: updatedComment.likes?.length || 0,
              dislikes: updatedComment.dislikes?.length || 0
            });
          }
          
          return updatedComment;
        }
        return comment;
      })
    );
  };

  // Remove comment from state
  const removeCommentFromState = (commentId) => {
    setComments((prevComments) => 
      prevComments.filter((comment) => comment._id !== commentId)
    );
  };

  // Handle comment submission
  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }
    
    try {
      // Check authentication status before submitting
      const authStatus = tokenManager.checkAuthStatus();
      console.log('Auth status before comment submission:', authStatus);
      
      if (!authStatus.isAuthenticated || !authStatus.hasToken) {
        toast.error('Authentication issue detected. Please log in again.');
        return;
      }
      
      // Create a clean comment data object
      const commentData = {
        content: data.content,
        post: postId,
      };
      
      // Only add parentComment if it exists and has a valid _id
      if (replyingTo && replyingTo._id) {
        commentData.parentComment = replyingTo._id;
      }

      console.log('Submitting comment with data:', commentData);
      
      const response = await commentsService.createComment(commentData);
      
      // If it's a reply, we don't add it to the top-level comments
      if (!replyingTo) {
        setComments((prevComments) => [response.comment, ...prevComments]);
      }
      
      // Reset form and reply state
      reset();
      setReplyingTo(null);
      
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error submitting comment:', error);
      console.error('Error details:', error.response?.data);
      
      // Show more specific error message if available
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data?.errors && error.response?.data?.errors[0]?.msg) || 
                          'Failed to submit comment. Please try again.';
      
      toast.error(errorMessage);
    }
  };

  // Handle comment update
  const handleCommentUpdate = (commentId, content) => {
    updateCommentInState(commentId, { 
      content,
      isEdited: true,
      editedAt: new Date().toISOString()
    });
  };

  // Handle comment delete
  const handleCommentDelete = (commentId) => {
    removeCommentFromState(commentId);
  };

  // Animation variants
  const commentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-secondary-900 dark:text-white">
        Comments ({comments.length})
      </h2>

      {/* Comment form */}
      {isAuthenticated ? (
        <GlassmorphicCard className="p-4 mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {replyingTo && (
              <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-2 rounded-lg">
                <span className="text-sm text-secondary-600 dark:text-secondary-300">
                  Replying to {replyingTo.author.firstName} {replyingTo.author.lastName}
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
                >
                  Cancel
                </button>
              </div>
            )}

            <div>
              <textarea
                {...register('content', {
                  required: 'Comment cannot be empty',
                  maxLength: {
                    value: 1000,
                    message: 'Comment cannot exceed 1000 characters'
                  }
                })}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
                rows={3}
              />
              
              {errors.content && (
                <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <span>Post Comment</span>
                <HiPaperAirplane className="w-4 h-4 transform rotate-90" />
              </button>
            </div>
          </form>
        </GlassmorphicCard>
      ) : (
        <GlassmorphicCard className="p-4 mb-6 text-center">
          <p className="text-secondary-600 dark:text-secondary-400">
            Please <a href="/login" className="text-primary-600 dark:text-primary-400 hover:underline">log in</a> to join the conversation
          </p>
        </GlassmorphicCard>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loading state
          <div className="space-y-4">
            <SkeletonLoader height="120px" className="rounded-lg" />
            <SkeletonLoader height="120px" className="rounded-lg" />
            <SkeletonLoader height="120px" className="rounded-lg" />
          </div>
        ) : comments.length === 0 ? (
          // Empty state
          <GlassmorphicCard className="p-6 text-center">
            <p className="text-secondary-600 dark:text-secondary-400">
              No comments yet. Be the first to share your thoughts!
            </p>
          </GlassmorphicCard>
        ) : (
          // Comments list
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment._id}
                variants={commentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <CommentItem
                  comment={comment}
                  onReply={(comment) => setReplyingTo(comment)}
                  onDelete={handleCommentDelete}
                  onUpdate={handleCommentUpdate}
                  postId={postId}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={commentEndRef} />
      </div>
    </div>
  );
};

export default RealTimeComments;