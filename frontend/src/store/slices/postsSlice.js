import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import postsService from '@services/postsService'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  posts: [],
  currentPost: null,
  userPosts: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    category: '',
    tag: '',
    search: '',
  },
}

// Async thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const options = { silent: false };
      const response = await postsService.getPosts(params, options)
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch posts'
      return rejectWithValue(message)
    }
  }
)

export const fetchPostBySlug = createAsyncThunk(
  'posts/fetchPostBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await postsService.getPostBySlug(slug)
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch post'
      return rejectWithValue(message)
    }
  }
)

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await postsService.createPost(postData)
      toast.success('Post created successfully!')
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create post'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ id, postData }, { rejectWithValue }) => {
    try {
      const response = await postsService.updatePost(id, postData)
      toast.success('Post updated successfully!')
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update post'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id, { rejectWithValue }) => {
    try {
      await postsService.deletePost(id)
      toast.success('Post deleted successfully!')
      return id
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete post'
      toast.error(message)
      return rejectWithValue(message)
    }
  }
)

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (id, { rejectWithValue }) => {
    try {
      const response = await postsService.likePost(id);
      return { id, likeCount: response.likeCount, isLiked: response.isLiked };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to like post';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
)

export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await postsService.getUserPosts(userId, params)
      return response
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch user posts'
      return rejectWithValue(message)
    }
  }
)

// Posts slice
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentPost: (state) => {
      state.currentPost = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        tag: '',
        search: '',
      }
    },
    updatePostInList: (state, action) => {
      const { id, updates } = action.payload
      const postIndex = state.posts.findIndex(post => post._id === id)
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updates }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload.posts
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Post by Slug
      .addCase(fetchPostBySlug.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPostBySlug.fulfilled, (state, action) => {
        state.loading = false
        state.currentPost = action.payload
        state.error = null
      })
      .addCase(fetchPostBySlug.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.currentPost = null
      })
      
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false
        state.posts.unshift(action.payload.post)
        state.error = null
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update Post
      .addCase(updatePost.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false
        const updatedPost = action.payload.post
        
        // Update in posts list
        const postIndex = state.posts.findIndex(post => post._id === updatedPost._id)
        if (postIndex !== -1) {
          state.posts[postIndex] = updatedPost
        }
        
        // Update current post if it's the same
        if (state.currentPost && state.currentPost._id === updatedPost._id) {
          state.currentPost = updatedPost
        }
        
        state.error = null
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Delete Post
      .addCase(deletePost.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false
        const deletedId = action.payload
        state.posts = state.posts.filter(post => post._id !== deletedId)
        state.userPosts = state.userPosts.filter(post => post._id !== deletedId)
        
        if (state.currentPost && state.currentPost._id === deletedId) {
          state.currentPost = null
        }
        
        state.error = null
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Like Post
      .addCase(likePost.fulfilled, (state, action) => {
        const { id, likeCount, isLiked } = action.payload;
        
        // Update in posts list
        const postIndex = state.posts.findIndex(post => post._id === id);
        if (postIndex !== -1) {
          state.posts[postIndex].likeCount = likeCount;
          state.posts[postIndex].isLiked = isLiked;
        }
        
        // Update current post if it's the same
        if (state.currentPost && state.currentPost._id === id) {
          state.currentPost.likeCount = likeCount;
          state.currentPost.isLiked = isLiked;
        }
      })
      
      // Fetch User Posts
      .addCase(fetchUserPosts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.loading = false
        state.userPosts = action.payload.posts
        state.error = null
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const {
  clearError,
  clearCurrentPost,
  setFilters,
  clearFilters,
  updatePostInList,
} = postsSlice.actions

export default postsSlice.reducer
