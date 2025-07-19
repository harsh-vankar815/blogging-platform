const express = require('express');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const jwtService = require('../services/jwtService');
const emailService = require('../services/emailService');
const {
  resetRateLimits,
  authLimiter,
  passwordResetLimiter
} = require('../middleware/rateLimiting');
const {
  authenticateToken,
  validateRefreshToken,
  sensitiveOperationLimit
} = require('../middleware/auth');

const router = express.Router();

// Helper function to get device info
const getDeviceInfo = (req) => ({
  userAgent: req.get('User-Agent'),
  ip: req.ip || req.connection.remoteAddress
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and cannot exceed 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      provider: 'local'
    });

    // Auto-verify email for simplicity
    user.emailVerified = true;
    await user.save();

    // Generate tokens
    const deviceInfo = getDeviceInfo(req);
    const tokens = await jwtService.generateTokenPair(user, deviceInfo);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      ...tokens,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email (include password for verification)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        message: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // For Google OAuth users, password login is not allowed
    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({
        message: 'Please login with Google',
        code: 'OAUTH_ONLY'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(400).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const deviceInfo = getDeviceInfo(req);
    const tokens = await jwtService.generateTokenPair(user, deviceInfo);

    res.json({
      message: 'Login successful',
      ...tokens,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      code: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/auth/admin/login
// @desc    Login admin user
// @access  Public
router.post('/admin/login', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email (include password for verification)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required.',
        code: 'ADMIN_REQUIRED'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        message: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(400).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const deviceInfo = getDeviceInfo(req);
    const tokens = await jwtService.generateTokenPair(user, deviceInfo);

    res.json({
      message: 'Admin login successful',
      ...tokens,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// @route   POST /api/auth/admin/register
// @desc    Register a new admin user
// @access  Public
router.post('/admin/register', authLimiter, [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and cannot exceed 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create new admin user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      provider: 'local',
      role: 'admin' // Set role as admin
    });

    // Auto-verify email for admin
    user.emailVerified = true;
    await user.save();

    // Generate tokens
    const deviceInfo = getDeviceInfo(req);
    const tokens = await jwtService.generateTokenPair(user, deviceInfo);

    res.status(201).json({
      message: 'Admin user registered successfully',
      ...tokens,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Server error during admin registration' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        bio: req.user.bio,
        avatar: req.user.avatar,
        role: req.user.role,
        socialLinks: req.user.socialLinks,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token using refresh token
// @access  Public
router.post('/refresh', validateRefreshToken, async (req, res) => {
  try {
    const deviceInfo = getDeviceInfo(req);
    const tokens = await jwtService.refreshAccessToken(req.body.refreshToken, deviceInfo);

    res.json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      message: 'Failed to refresh token',
      code: 'REFRESH_FAILED'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (revoke refresh token)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await jwtService.revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices (revoke all refresh tokens)
// @access  Private
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    await jwtService.revokeAllUserTokens(req.user._id);
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Reset password directly (simplified - no email required)
// @access  Public
router.post('/forgot-password', passwordResetLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], sensitiveOperationLimit(3, 15 * 60 * 1000), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, username, newPassword } = req.body;

    // Find user by email and username for verification
    const user = await User.findOne({
      email: email.toLowerCase(),
      username: username
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email and username combination',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        message: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if user has too many recent reset attempts
    const recentResets = await PasswordReset.countDocuments({
      user: user._id,
      createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    if (recentResets >= 3) {
      return res.status(429).json({
        message: 'Too many password reset attempts. Please try again later.',
        code: 'TOO_MANY_ATTEMPTS'
      });
    }

    // Update password directly
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Log the password reset
    const passwordReset = new PasswordReset({
      user: user._id,
      token: 'direct-reset',
      hashedToken: 'direct-reset',
      isUsed: true,
      usedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    await passwordReset.save();

    res.json({
      message: 'Password reset successfully. You can now login with your new password.',
      success: true
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Server error during password reset',
      code: 'SERVER_ERROR'
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', passwordResetLimiter, [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
], sensitiveOperationLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Find valid reset token
    const passwordReset = await PasswordReset.findValidToken(token);

    if (!passwordReset) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    const user = passwordReset.user;

    if (!user.isActive) {
      return res.status(400).json({
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Update password
    user.password = password;
    user.passwordChangedAt = new Date();

    // Reset login attempts if account was locked
    if (user.isLocked) {
      await user.resetLoginAttempts();
    }

    await user.save();

    // Mark reset token as used
    await passwordReset.markAsUsed();

    // Revoke all existing refresh tokens for security
    await jwtService.revokeAllUserTokens(user._id);

    // Send confirmation email
    try {
      await emailService.sendPasswordChangeNotification(user);
    } catch (emailError) {
      console.error('Failed to send password change notification:', emailError);
    }

    res.json({
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Server error during password reset',
      code: 'SERVER_ERROR'
    });
  }
});



// Google OAuth routes (only if Google OAuth is configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // @route   GET /api/auth/google
  // @desc    Google OAuth login
  // @access  Public
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  // @route   GET /api/auth/google/callback
  // @desc    Google OAuth callback
  // @access  Public
  router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
      try {
        const user = req.user;
        const deviceInfo = getDeviceInfo(req);
        const tokens = await jwtService.generateTokenPair(user, deviceInfo);

        // Redirect to frontend with tokens
        const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?` +
          `accessToken=${tokens.accessToken}&` +
          `refreshToken=${tokens.refreshToken}&` +
          `user=${encodeURIComponent(JSON.stringify({
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
            provider: user.provider
          }))}`;

        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }
    }
  );
} else {
  // Provide fallback routes when Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(501).json({
      message: 'Google OAuth is not configured on this server',
      code: 'OAUTH_NOT_CONFIGURED'
    });
  });

  router.get('/google/callback', (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_not_configured`);
  });
}

// Development only - Reset rate limits
if (process.env.NODE_ENV === 'development') {
  router.post('/dev/reset-rate-limits', async (req, res) => {
    try {
      await resetRateLimits();
      res.json({
        message: 'Rate limits reset successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to reset rate limits:', error);
      res.status(500).json({
        message: 'Failed to reset rate limits',
        error: error.message
      });
    }
  });
}

module.exports = router;
