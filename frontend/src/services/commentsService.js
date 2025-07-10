import api from './api'

const commentsService = {
  // Get comments for a post
  getComments: async (postId, params = {}, options = {}) => {
    const queryParams = new URLSearchParams()
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key])
      }
    })
    
    const queryString = queryParams.toString()
    const url = queryString ? `/comments/post/${postId}?${queryString}` : `/comments/post/${postId}`
    
    const response = await api.get(url, options)
    return response
  },

  // Get replies for a comment
  getReplies: async (commentId, options = {}) => {
    const response = await api.get(`/comments/${commentId}/replies`, options)
    return response
  },

  // Create a new comment
  createComment: async (commentData, options = {}) => {
    // Make sure authentication headers are included
    const token = localStorage.getItem('token');
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
    
    // Validate comment data
    if (!commentData.content || !commentData.post) {
      throw new Error('Comment content and post ID are required');
    }
    
    // Ensure content is a string and trim it
    commentData.content = String(commentData.content).trim();
    
    // Fix parentComment validation issue - remove it if null or undefined
    const cleanedCommentData = { ...commentData };
    if (cleanedCommentData.parentComment === null || cleanedCommentData.parentComment === undefined) {
      delete cleanedCommentData.parentComment;
    }
    
    // Log the data being sent for debugging
    console.log('Sending comment data:', cleanedCommentData);
    console.log('Auth headers:', authOptions.headers);
    
    try {
      const response = await api.post('/comments', cleanedCommentData, authOptions);
      return response;
    } catch (error) {
      console.error('Comment submission error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update a comment
  updateComment: async (id, content, options = {}) => {
    const response = await api.put(`/comments/${id}`, { content }, options)
    return response
  },

  // Delete a comment
  deleteComment: async (id, options = {}) => {
    const response = await api.delete(`/comments/${id}`, options)
    return response
  },

  /**
   * Like a comment
   * @param {string} commentId - The ID of the comment to like
   * @returns {Promise<Object>} The updated comment with likes and dislikes
   */
  likeComment: async (commentId) => {
    try {
      const response = await api.post(`/comments/${commentId}/like`);
      console.log('Like comment response:', response.data);
      return response;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  },

  /**
   * Dislike a comment
   * @param {string} commentId - The ID of the comment to dislike
   * @returns {Promise<Object>} The updated comment with likes and dislikes
   */
  dislikeComment: async (commentId) => {
    try {
      const response = await api.post(`/comments/${commentId}/dislike`);
      console.log('Dislike comment response:', response.data);
      return response;
    } catch (error) {
      console.error('Error disliking comment:', error);
      throw error;
    }
  },

  // Report a comment
  reportComment: async (id, reason, options = {}) => {
    const response = await api.post(`/comments/${id}/report`, { reason }, options)
    return response
  },

  // Moderate a comment (admin only)
  moderateComment: async (id, action, options = {}) => {
    const response = await api.post(`/comments/${id}/moderate`, { action }, options)
    return response
  },

  // Get comments needing moderation (admin only)
  getModerationQueue: async (params = {}, options = {}) => {
    const queryParams = new URLSearchParams()
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key])
      }
    })
    
    const queryString = queryParams.toString()
    const url = queryString ? `/comments/moderation?${queryString}` : '/comments/moderation'
    
    const response = await api.get(url, options)
    return response
  },

  // Get comment by ID
  getCommentById: async (id) => {
    const response = await api.get(`/comments/${id}`)
    return response
  },
}

export default commentsService
