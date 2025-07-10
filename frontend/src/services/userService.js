import api from './api'

const userService = {
  // Get user profile by username
  getUserProfile: async (username) => {
    const response = await api.get(`/users/profile/${username}`)
    return response
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData)
    return response
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/users/change-password', passwordData)
    return response
  },

  // Get user's posts
  getUserPosts: async (userId, params = {}) => {
    const queryParams = new URLSearchParams()
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key])
      }
    })
    
    const queryString = queryParams.toString()
    const url = queryString ? `/users/${userId}/posts?${queryString}` : `/users/${userId}/posts`
    
    const response = await api.get(url)
    return response
  },

  // Deactivate account
  deactivateAccount: async () => {
    const response = await api.delete('/users/account')
    return response
  },

  // Upload avatar
  uploadAvatar: async (formData) => {
    try {
      // Use axios directly with proper multipart/form-data handling
      const response = await api({
        method: 'post',
        url: '/users/avatar',
        data: formData,
        headers: {
          // Important: Let the browser set the Content-Type header with boundary
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      throw error;
    }
  },

  // Update avatar
  updateAvatar: async (formData) => {
    try {
      // Use axios directly with proper multipart/form-data handling
      const response = await api({
        method: 'post',
        url: '/users/avatar',
        data: formData,
        headers: {
          // Important: Let the browser set the Content-Type header with boundary
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('Error in updateAvatar:', error);
      throw error;
    }
  },

  // Get saved posts
  getSavedPosts: async () => {
    const response = await api.get('/users/saved-posts')
    return response
  },

  // Search users
  searchUsers: async (query, params = {}) => {
    const queryParams = new URLSearchParams({
      q: query,
      ...params,
    })
    
    const response = await api.get(`/users/search?${queryParams.toString()}`)
    return response
  },

  // Follow/unfollow user (if implementing social features)
  followUser: async (userId) => {
    const response = await api.post(`/users/${userId}/follow`)
    return response
  },

  unfollowUser: async (userId) => {
    const response = await api.delete(`/users/${userId}/follow`)
    return response
  },

  // Get user's followers
  getFollowers: async (userId, params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/users/${userId}/followers?${queryParams.toString()}`)
    return response
  },

  // Get user's following
  getFollowing: async (userId, params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/users/${userId}/following?${queryParams.toString()}`)
    return response
  },
}

export default userService
