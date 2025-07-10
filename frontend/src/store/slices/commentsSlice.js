import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import commentsService from '@services/commentsService'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  comments: [],
  replies: {},
  moderationQueue: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalComments: 0,
    hasNext: false,
    hasPrev: false,
  },
}

// Async thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async ({ postId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await commentsService.getComments(postId, params)
      return { postId, ...response }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch comments'
      return rejectWithValue(message)
    }
  }
)

export const fetchReplies = createAsyncThunk(
  'comments/fetchReplies',
  async (commentId, { rejectWithValue }) => {
    try {
      const response = await commentsService.getReplies(commentId)
      return { commentId, replies: response.replies }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch replies'
      return rejectWithValue(message)
    }
  }
)

export const createComment = createAsyncThunk(
  'comments/createComment',
  async (commentData, { rejectWithValue }) => {
    try {
      const response = await commentsService.createComment(commentData)
      toast.success('Comment posted successfully!')
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to post comment'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const response = await commentsService.updateComment(id, { content })
      toast.success('Comment updated successfully!')
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update comment'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (id, { rejectWithValue }) => {
    try {
      await commentsService.deleteComment(id)
      toast.success('Comment deleted successfully!')
      return id
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete comment'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const likeComment = createAsyncThunk(
  'comments/likeComment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await commentsService.likeComment(id)
      return { id, ...response }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to like comment'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const dislikeComment = createAsyncThunk(
  'comments/dislikeComment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await commentsService.dislikeComment(id)
      return { id, ...response }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to dislike comment'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const reportComment = createAsyncThunk(
  'comments/reportComment',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await commentsService.reportComment(id, reason)
      toast.success('Comment reported for moderation')
      return { id, ...response }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to report comment'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const fetchModerationQueue = createAsyncThunk(
  'comments/fetchModerationQueue',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await commentsService.getModerationQueue(params);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch moderation queue';
      return rejectWithValue(message);
    }
  }
);

export const moderateComment = createAsyncThunk(
  'comments/moderateComment',
  async ({ id, action }, { rejectWithValue }) => {
    try {
      const response = await commentsService.moderateComment(id, action);
      toast.success(`Comment ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      return { id, action, ...response };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to moderate comment';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Comments slice
const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearComments: (state) => {
      state.comments = []
      state.replies = {}
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalComments: 0,
        hasNext: false,
        hasPrev: false,
      }
    },
    updateCommentInList: (state, action) => {
      const { id, updates } = action.payload
      const commentIndex = state.comments.findIndex(comment => comment._id === id)
      if (commentIndex !== -1) {
        state.comments[commentIndex] = { ...state.comments[commentIndex], ...updates }
      }
      
      // Also check in replies
      Object.keys(state.replies).forEach(parentId => {
        const replyIndex = state.replies[parentId].findIndex(reply => reply._id === id)
        if (replyIndex !== -1) {
          state.replies[parentId][replyIndex] = { ...state.replies[parentId][replyIndex], ...updates }
        }
      })
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Comments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false
        state.comments = action.payload.comments
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Replies
      .addCase(fetchReplies.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReplies.fulfilled, (state, action) => {
        state.loading = false
        const { commentId, replies } = action.payload
        state.replies[commentId] = replies
        state.error = null
      })
      .addCase(fetchReplies.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Create Comment
      .addCase(createComment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.loading = false
        const newComment = action.payload.comment
        
        if (newComment.parentComment) {
          // It's a reply
          const parentId = newComment.parentComment
          if (!state.replies[parentId]) {
            state.replies[parentId] = []
          }
          state.replies[parentId].push(newComment)
          
          // Update reply count for parent comment
          const parentIndex = state.comments.findIndex(comment => comment._id === parentId)
          if (parentIndex !== -1) {
            state.comments[parentIndex].replyCount = (state.comments[parentIndex].replyCount || 0) + 1
          }
        } else {
          // It's a top-level comment
          state.comments.unshift(newComment)
          state.pagination.totalComments += 1
        }
        
        state.error = null
      })
      .addCase(createComment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update Comment
      .addCase(updateComment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.loading = false
        const updatedComment = action.payload.comment
        
        // Update in comments list
        const commentIndex = state.comments.findIndex(comment => comment._id === updatedComment._id)
        if (commentIndex !== -1) {
          state.comments[commentIndex] = updatedComment
        }
        
        // Update in replies
        Object.keys(state.replies).forEach(parentId => {
          const replyIndex = state.replies[parentId].findIndex(reply => reply._id === updatedComment._id)
          if (replyIndex !== -1) {
            state.replies[parentId][replyIndex] = updatedComment
          }
        })
        
        state.error = null
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Delete Comment
      .addCase(deleteComment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.loading = false
        const deletedId = action.payload
        
        // Remove from comments list
        const commentIndex = state.comments.findIndex(comment => comment._id === deletedId)
        if (commentIndex !== -1) {
          state.comments.splice(commentIndex, 1)
          state.pagination.totalComments -= 1
        }
        
        // Remove from replies and update parent reply count
        Object.keys(state.replies).forEach(parentId => {
          const replyIndex = state.replies[parentId].findIndex(reply => reply._id === deletedId)
          if (replyIndex !== -1) {
            state.replies[parentId].splice(replyIndex, 1)
            
            // Update parent comment reply count
            const parentIndex = state.comments.findIndex(comment => comment._id === parentId)
            if (parentIndex !== -1) {
              state.comments[parentIndex].replyCount = Math.max(0, (state.comments[parentIndex].replyCount || 1) - 1)
            }
          }
        })
        
        // Remove replies of deleted comment
        delete state.replies[deletedId]
        
        state.error = null
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Like Comment
      .addCase(likeComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(likeComment.fulfilled, (state, action) => {
        state.loading = false;
        const { id, likes, dislikes } = action.payload;
        
        // Update in comments list
        const commentIndex = state.comments.findIndex(comment => comment._id === id);
        if (commentIndex !== -1) {
          state.comments[commentIndex].likes = likes || state.comments[commentIndex].likes;
          state.comments[commentIndex].dislikes = dislikes || state.comments[commentIndex].dislikes;
        }
        
        // Update in replies
        Object.keys(state.replies).forEach(parentId => {
          const replyIndex = state.replies[parentId].findIndex(reply => reply._id === id);
          if (replyIndex !== -1) {
            state.replies[parentId][replyIndex].likes = likes || state.replies[parentId][replyIndex].likes;
            state.replies[parentId][replyIndex].dislikes = dislikes || state.replies[parentId][replyIndex].dislikes;
          }
        });
        
        state.error = null;
      })
      .addCase(likeComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Dislike Comment
      .addCase(dislikeComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dislikeComment.fulfilled, (state, action) => {
        state.loading = false;
        const { id, likes, dislikes } = action.payload;
        
        // Update in comments list
        const commentIndex = state.comments.findIndex(comment => comment._id === id);
        if (commentIndex !== -1) {
          state.comments[commentIndex].likes = likes || state.comments[commentIndex].likes;
          state.comments[commentIndex].dislikes = dislikes || state.comments[commentIndex].dislikes;
        }
        
        // Update in replies
        Object.keys(state.replies).forEach(parentId => {
          const replyIndex = state.replies[parentId].findIndex(reply => reply._id === id);
          if (replyIndex !== -1) {
            state.replies[parentId][replyIndex].likes = likes || state.replies[parentId][replyIndex].likes;
            state.replies[parentId][replyIndex].dislikes = dislikes || state.replies[parentId][replyIndex].dislikes;
          }
        });
        
        state.error = null;
      })
      .addCase(dislikeComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Report Comment
      .addCase(reportComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reportComment.fulfilled, (state, action) => {
        state.loading = false;
        const { id } = action.payload;
        
        // Update in comments list
        const commentIndex = state.comments.findIndex(comment => comment._id === id);
        if (commentIndex !== -1) {
          state.comments[commentIndex].needsModeration = true;
        }
        
        // Update in replies
        Object.keys(state.replies).forEach(parentId => {
          const replyIndex = state.replies[parentId].findIndex(reply => reply._id === id);
          if (replyIndex !== -1) {
            state.replies[parentId][replyIndex].needsModeration = true;
          }
        });
        
        state.error = null;
      })
      .addCase(reportComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Moderation Queue
      .addCase(fetchModerationQueue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModerationQueue.fulfilled, (state, action) => {
        state.loading = false;
        state.moderationQueue = action.payload.comments || [];
        state.error = null;
      })
      .addCase(fetchModerationQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Moderate Comment
      .addCase(moderateComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(moderateComment.fulfilled, (state, action) => {
        state.loading = false;
        const { id, action: moderationAction } = action.payload;
        
        // Remove from moderation queue
        state.moderationQueue = state.moderationQueue.filter(comment => comment._id !== id);
        
        if (moderationAction === 'approve') {
          // Update in comments list
          const commentIndex = state.comments.findIndex(comment => comment._id === id);
          if (commentIndex !== -1) {
            state.comments[commentIndex].needsModeration = false;
            state.comments[commentIndex].isApproved = true;
          }
          
          // Update in replies
          Object.keys(state.replies).forEach(parentId => {
            const replyIndex = state.replies[parentId].findIndex(reply => reply._id === id);
            if (replyIndex !== -1) {
              state.replies[parentId][replyIndex].needsModeration = false;
              state.replies[parentId][replyIndex].isApproved = true;
            }
          });
        } else {
          // If rejected, remove from lists
          state.comments = state.comments.filter(comment => comment._id !== id);
          
          Object.keys(state.replies).forEach(parentId => {
            state.replies[parentId] = state.replies[parentId].filter(reply => reply._id !== id);
          });
        }
        
        state.error = null;
      })
      .addCase(moderateComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
})

export const {
  clearError,
  clearComments,
  updateCommentInList,
} = commentsSlice.actions

export default commentsSlice.reducer
