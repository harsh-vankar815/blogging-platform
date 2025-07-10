import api from './api';

/**
 * Service for handling blog post operations
 */
const postService = {
  /**
   * Get a single post by slug
   * @param {string} slug - The post slug
   * @returns {Promise<Object>} The post data
   */
  getPostBySlug: async (slug) => {
    if (!slug) {
      throw new Error('Post slug is required');
    }
    const response = await api.get(`/posts/${slug}`);
    return response;
  },

  /**
   * Get posts with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Posts with pagination
   */
  getPosts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/posts?${queryString}` : '/posts';
    
    const response = await api.get(url);
    return response;
  },

  /**
   * Like a post
   * @param {string} postId - The post ID
   * @returns {Promise<Object>} Updated post like data
   */
  likePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response;
  },

  /**
   * Save/bookmark a post
   * @param {string} postId - The post ID
   * @returns {Promise<Object>} Result of the save operation
   */
  toggleSavePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/save`);
    return response;
  },

  /**
   * Get user's saved posts
   * @returns {Promise<Array>} List of saved posts
   */
  getSavedPosts: async () => {
    const response = await api.get('/users/saved-posts');
    return response;
  },

  /**
   * Get related posts
   * @param {string} postId - The post ID
   * @param {number} limit - Number of related posts to get
   * @returns {Promise<Array>} List of related posts
   */
  getRelatedPosts: async (postId, limit = 3) => {
    const response = await api.get(`/posts/${postId}/related?limit=${limit}`);
    return response;
  },

  /**
   * Get post comments
   * @param {string} postId - The post ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Comments with pagination
   */
  getComments: async (postId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/posts/${postId}/comments?${queryParams.toString()}`);
    return response;
  },

  /**
   * Add a comment to a post
   * @param {string} postId - The post ID
   * @param {string} content - The comment content
   * @returns {Promise<Object>} The created comment
   */
  addComment: async (postId, content) => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response;
  },

  /**
   * Get a post by its ID
   * @param {string} id - Post ID
   * @returns {Promise<Object>} - Post data
   */
  getPostById: async (id) => {
    const response = await api.get(`/posts/id/${id}`);
    return response.data;
  },

  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @returns {Promise<Object>} - Created post data
   */
  createPost: async (postData) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  /**
   * Update an existing post
   * @param {string} id - Post ID
   * @param {Object} postData - Updated post data
   * @returns {Promise<Object>} - Updated post data
   */
  updatePost: async (id, postData) => {
    const response = await api.put(`/posts/${id}`, postData);
    return response.data;
  },

  /**
   * Delete a post
   * @param {string} id - Post ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deletePost: async (id) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  /**
   * Upload a featured image for a post
   * @param {FormData} formData - Form data containing the image
   * @returns {Promise<Object>} - Upload result with image URL
   */
  uploadFeaturedImage: async (formData) => {
    const response = await api.post('/posts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get all categories
   * @returns {Promise<Array>} - List of categories
   */
  getCategories: async () => {
    const response = await api.get('/posts/categories');
    return response.data;
  },

  /**
   * Get all tags
   * @returns {Promise<Array>} - List of tags
   */
  getTags: async () => {
    const response = await api.get('/posts/tags');
    return response.data;
  },

  /**
   * Search posts by query
   * @param {string} query - Search query
   * @returns {Promise<Array>} - List of matching posts
   */
  searchPosts: async (query) => {
    const response = await api.get('/posts/search', {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Get trending posts
   * @param {number} limit - Number of trending posts to retrieve
   * @returns {Promise<Array>} - List of trending posts
   */
  getTrendingPosts: async (limit = 5) => {
    const response = await api.get('/posts/trending', {
      params: { limit }
    });
    return response.data;
  }
};

export default postService;