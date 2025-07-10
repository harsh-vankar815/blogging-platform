const rateLimit = require('express-rate-limit');

// Handle rate-limit-mongo gracefully
let MongoStore;
try {
  MongoStore = require('rate-limit-mongo');
} catch (error) {
  console.warn('rate-limit-mongo package not available, using memory store for rate limiting');
  MongoStore = null;
}

// Create MongoDB store for rate limiting (optional, falls back to memory)
const createMongoStore = () => {
  if (!MongoStore || !process.env.MONGODB_URI) {
    return undefined; // Use memory store
  }

  try {
    return new MongoStore({
      uri: process.env.MONGODB_URI,
      collectionName: 'rate_limits',
      expireTimeMs: 15 * 60 * 1000, // 15 minutes
    });
  } catch (error) {
    console.warn('Failed to create MongoDB store for rate limiting, using memory store');
    return undefined;
  }
};

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000, // More lenient in development
  message: {
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for development if needed
    return process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true';
  }
});

// Environment-aware rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // More lenient in development
  message: {
    message: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests to prevent brute force
  skip: (req) => {
    // Skip rate limiting for development if needed
    return process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH_RATE_LIMIT === 'true';
  }
});

// Very strict rate limiting for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    message: 'Too many password reset attempts, please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
});

// Rate limiting for content creation
const contentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each user to 50 content creations per hour
  message: {
    message: 'Too many content creation requests, please try again later.',
    code: 'CONTENT_CREATION_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Rate limiting for comments
const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each user to 20 comments per 10 minutes
  message: {
    message: 'Too many comments, please slow down.',
    code: 'COMMENT_RATE_LIMIT_EXCEEDED',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each user to 100 uploads per hour
  message: {
    message: 'Too many upload requests, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Rate limiting for search requests
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    message: 'Too many search requests, please slow down.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
});

// Admin operations rate limiting
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit admin operations
  message: {
    message: 'Too many admin operations, please slow down.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Dynamic rate limiter based on user role
const createRoleBasedLimiter = (limits) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      const userRole = req.user?.role || 'anonymous';
      return limits[userRole] || limits.default || 100;
    },
    message: {
      message: 'Rate limit exceeded for your user role.',
      code: 'ROLE_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createMongoStore(),
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    }
  });
};

// Specific role-based limiters
const apiLimiter = createRoleBasedLimiter({
  admin: 10000,
  moderator: 5000,
  author: 2000,
  user: 1000,
  default: 100
});

// Custom rate limiting middleware for specific endpoints
const createCustomLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      message: options.message || 'Rate limit exceeded.',
      code: options.code || 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.floor((options.windowMs || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createMongoStore(),
    keyGenerator: options.keyGenerator || ((req) => req.user?.id || req.ip),
    skip: options.skip,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false
  });
};

// Utility function to reset rate limits (for development/testing)
const resetRateLimits = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.collection('rate_limits').deleteMany({});
        console.log('Rate limit data cleared');
      }
    } catch (error) {
      console.warn('Failed to clear rate limit data:', error.message);
    }
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  contentCreationLimiter,
  commentLimiter,
  uploadLimiter,
  searchLimiter,
  adminLimiter,
  apiLimiter,
  createRoleBasedLimiter,
  createCustomLimiter,
  resetRateLimits
};
