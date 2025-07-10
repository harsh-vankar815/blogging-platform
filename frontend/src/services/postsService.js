import api from './api'

const postsService = {
  // Get all posts with pagination and filters
  getPosts: async (params = {}, options = {}) => {
    const queryParams = new URLSearchParams()
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key])
      }
    })
    
    const queryString = queryParams.toString()
    const url = queryString ? `/posts?${queryString}` : '/posts'
    
    const response = await api.get(url, options)
    console.log('Posts data from API:', response);
    return response
  },

  // Get single post by slug
  getPostBySlug: async (slug, options = {}) => {
    if (!slug || slug === 'undefined') {
      throw new Error('Invalid post slug');
    }
    const response = await api.get(`/posts/${slug}`, options)
    console.log('Post data from API (by slug):', response);
    return response
  },

  // Create new post
  createPost: async (postData, options = {}) => {
    const response = await api.post('/posts', postData, options)
    return response
  },

  // Update post
  updatePost: async (id, postData, options = {}) => {
    const response = await api.put(`/posts/${id}`, postData, options)
    return response
  },

  // Delete post
  deletePost: async (id, options = {}) => {
    const response = await api.delete(`/posts/${id}`, options)
    return response
  },

  // Like/unlike post
  likePost: async (id, options = {}) => {
    const response = await api.post(`/posts/${id}/like`, {}, options)
    return response
  },

  // Toggle save/bookmark post
  toggleSavePost: async (id, options = {}) => {
    const response = await api.post(`/posts/${id}/save`, {}, options)
    return response
  },

  // Get saved posts
  getSavedPosts: async (options = {}) => {
    const response = await api.get('/users/saved-posts', options)
    return response
  },

  // Get user's posts
  getUserPosts: async (userId, params = {}, options = {}) => {
    const queryParams = new URLSearchParams()
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key])
      }
    })
    
    const queryString = queryParams.toString()
    const url = queryString ? `/users/${userId}/posts?${queryString}` : `/users/${userId}/posts`
    
    const response = await api.get(url, options)
    return response
  },

  // Get post by ID (for editing)
  getPostById: async (id, options = {}) => {
    if (!id) {
      throw new Error('Post ID is required');
    }
    const response = await api.get(`/posts/id/${id}`, options)
    return response
  },

  // Search posts
  searchPosts: async (query, params = {}, options = {}) => {
    const searchParams = {
      search: query,
      ...params,
    }
    
    return postsService.getPosts(searchParams, options)
  },

  // Get posts by category
  getPostsByCategory: async (category, params = {}, options = {}) => {
    const categoryParams = {
      category,
      ...params,
    }
    
    return postsService.getPosts(categoryParams, options)
  },

  // Get posts by tag
  getPostsByTag: async (tag, params = {}, options = {}) => {
    const tagParams = {
      tag,
      ...params,
    }
    
    return postsService.getPosts(tagParams, options)
  },

  // Get featured posts
  getFeaturedPosts: async (limit = 5, options = {}) => {
    const response = await api.get(`/posts/featured?limit=${limit}`, options)
    return response
  },

  // Get popular posts
  getPopularPosts: async (limit = 5, options = {}) => {
    const response = await api.get(`/posts/popular?limit=${limit}`, options)
    return response
  },

  // Get recent posts
  getRecentPosts: async (limit = 5, options = {}) => {
    const response = await api.get(`/posts/recent?limit=${limit}`, options)
    return response
  },

  // Get categories
  getCategories: async (options = {}) => {
    const response = await api.get('/posts/categories', options)
    return response
  },

  // Get tags
  getTags: async (options = {}) => {
    const response = await api.get('/posts/tags', options)
    return response
  },
}

export default postsService
