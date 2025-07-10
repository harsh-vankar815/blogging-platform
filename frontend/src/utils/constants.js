// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  POSTS: {
    LIST: '/posts',
    CREATE: '/posts',
    UPDATE: (id) => `/posts/${id}`,
    DELETE: (id) => `/posts/${id}`,
    BY_SLUG: (slug) => `/posts/${slug}`,
    LIKE: (id) => `/posts/${id}/like`,
    USER_POSTS: (userId) => `/users/${userId}/posts`,
  },
  COMMENTS: {
    BY_POST: (postId) => `/comments/post/${postId}`,
    REPLIES: (commentId) => `/comments/${commentId}/replies`,
    CREATE: '/comments',
    UPDATE: (id) => `/comments/${id}`,
    DELETE: (id) => `/comments/${id}`,
    LIKE: (id) => `/comments/${id}/like`,
  },
  USERS: {
    PROFILE: (username) => `/users/profile/${username}`,
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    POSTS: (userId) => `/users/${userId}/posts`,
  },
}

// Post categories
export const POST_CATEGORIES = [
  'Technology',
  'Lifestyle',
  'Travel',
  'Food',
  'Health',
  'Business',
  'Education',
  'Entertainment',
  'Sports',
  'Other',
]

// Post statuses
export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
}

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
}

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
}

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
  USER_PREFERENCES: 'userPreferences',
}

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}

// Validation rules
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  POST_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  POST_EXCERPT: {
    MAX_LENGTH: 500,
  },
  COMMENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1000,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
}

// Social media platforms
export const SOCIAL_PLATFORMS = {
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  GITHUB: 'github',
  WEBSITE: 'website',
}

// Date formats
export const DATE_FORMATS = {
  FULL: 'MMMM d, yyyy',
  SHORT: 'MMM d, yyyy',
  RELATIVE: 'relative',
  DATETIME: 'MMM d, yyyy h:mm a',
  EXACT: 'MMMM d, yyyy h:mm:ss a',
}

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
}

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  LOGOUT: 'Logged out successfully',
  REGISTER: 'Registration successful!',
  POST_CREATED: 'Post created successfully!',
  POST_UPDATED: 'Post updated successfully!',
  POST_DELETED: 'Post deleted successfully!',
  COMMENT_CREATED: 'Comment posted successfully!',
  COMMENT_UPDATED: 'Comment updated successfully!',
  COMMENT_DELETED: 'Comment deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
}

// Feature flags
export const FEATURES = {
  COMMENTS: import.meta.env.VITE_ENABLE_COMMENTS === 'true',
  SOCIAL_LOGIN: import.meta.env.VITE_ENABLE_SOCIAL_LOGIN === 'true',
  DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
  NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
}

// App configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'MERN Blog Platform',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'A modern blogging platform',
  URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  API_URL: import.meta.env.VITE_API_URL || '/api',
}
