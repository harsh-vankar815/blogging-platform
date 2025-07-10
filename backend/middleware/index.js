const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');

// Import all middleware modules
const { 
  securityHeaders, 
  corsOptions, 
  sanitizeInput, 
  requestLogger, 
  ipFilter, 
  requestSizeLimit, 
  suspiciousActivityDetector,
  securityErrorHandler 
} = require('./security');

const { 
  generalLimiter, 
  authLimiter, 
  passwordResetLimiter, 
  contentCreationLimiter, 
  commentLimiter, 
  uploadLimiter, 
  searchLimiter, 
  adminLimiter, 
  apiLimiter 
} = require('./rateLimiting');

const {
  authenticateToken,
  requireAdmin,
  requireEmailVerified,
  requireOwnershipOrAdmin,
  optionalAuth,
  sensitiveOperationLimit,
  validateRefreshToken
} = require('./auth');

const { 
  requirePermission, 
  requireAnyPermission, 
  requireAllPermissions, 
  requireRole, 
  requireResourceOwnership, 
  PERMISSIONS 
} = require('./permissions');

// Import middleware files
const auth = require('./auth');
const permissions = require('./permissions');
const security = require('./security');
const rateLimiting = require('./rateLimiting');

// Basic middleware setup
const setupBasicMiddleware = (app) => {
  // Security middleware
  app.use(helmet());
  app.use(hpp());
  app.use(mongoSanitize());
  
  // CORS setup
  app.use(cors(corsOptions));
  
  // Compression
  app.use(compression());
  
  // Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Input sanitization
  app.use(sanitizeInput);
};

// Rate limiting setup
const setupRateLimiting = (app) => {
  // Apply general rate limiting to non-auth routes to avoid double counting
  app.use('/api/posts', rateLimiting.generalLimiter);
  app.use('/api/users', rateLimiting.generalLimiter);
  app.use('/api/comments', rateLimiting.generalLimiter);
  app.use('/api/admin', rateLimiting.generalLimiter);

  // Auth routes have their own specific rate limiting applied in the route files
  // Note: Specific endpoint rate limiting is handled in individual routes
};

// Error handling setup
const setupErrorHandling = (app) => {
  // Security error handler
  app.use(securityErrorHandler);
  
  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: err.stack })
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl
    });
  });
};

// Export all middleware
module.exports = {
  setupBasicMiddleware,
  setupRateLimiting,
  setupErrorHandling,
  
  ...auth,
  ...permissions,
  ...security,
  ...rateLimiting,
  
  // Route-specific middleware collections
  routeMiddleware: {
    createPost: [
      auth.authenticateToken
    ],
    updatePost: [
      auth.authenticateToken,
      permissions.requireOwnershipOrAdmin
    ],
    deletePost: [
      auth.authenticateToken,
      (req, res, next) => {
        // Allow admin to delete any post
        if (req.user && req.user.role === 'admin') {
          return next();
        }
        
        // For non-admin users, check ownership
        return permissions.requireOwnershipOrAdmin()(req, res, next);
      }
    ],
    adminOnly: [
      auth.authenticateToken,
      permissions.requireAdmin
    ]
  }
};
