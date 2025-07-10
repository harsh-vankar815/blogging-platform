const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtService = require('../services/jwtService');
const { securityLogger } = require('./security');

// Verify JWT token with enhanced security
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token using JWT service
    const decoded = jwtService.verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      securityLogger.logFailedAuth(req, 'Account deactivated');
      return res.status(401).json({
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      securityLogger.logFailedAuth(req, 'Account locked');
      return res.status(423).json({
        message: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        message: 'Password was recently changed. Please login again.',
        code: 'PASSWORD_CHANGED'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.message === 'Invalid or expired access token') {
      return res.status(401).json({
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({
      message: 'Server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Check if user's email is verified
const requireEmailVerified = (req, res, next) => {
  if (req.user && req.user.emailVerified) {
    next();
  } else {
    res.status(403).json({ 
      message: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }
};

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserField = 'author') => {
  return (req, res, next) => {
    const resourceUserId = req.resource ? req.resource[resourceUserField] : req.params.userId;
    
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId.toString()) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied - insufficient permissions' });
    }
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwtService.verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password');

        if (user && user.isActive && !user.isLocked) {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (maxAttempts = 3, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.user?.id || 'anonymous'}`;
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];

    // Clean old attempts
    const validAttempts = userAttempts.filter(time => now - time < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return res.status(429).json({
        message: 'Too many attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    validAttempts.push(now);
    attempts.set(key, validAttempts);

    next();
  };
};

// Validate refresh token
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    const tokenData = await jwtService.verifyRefreshToken(refreshToken);
    req.refreshTokenData = tokenData;
    req.user = tokenData.user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired refresh token',
      code: 'REFRESH_TOKEN_INVALID'
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEmailVerified,
  requireOwnershipOrAdmin,
  optionalAuth,
  sensitiveOperationLimit,
  validateRefreshToken
};
