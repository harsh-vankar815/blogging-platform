const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticateToken, requireOwnershipOrAdmin, requireAdmin } = require('../middleware/auth');
const { uploadAvatar, deleteImage, getPublicIdFromUrl } = require('../services/cloudinaryService');

const router = express.Router();

// @route   POST /api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar if it exists
    if (user.avatar) {
      const publicId = getPublicIdFromUrl(user.avatar);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    // Update user with new avatar URL
    user.avatar = req.file.path;
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error while uploading avatar' });
  }
});

// @route   GET /api/users/profile/:username
// @desc    Get user profile by username
// @access  Public
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's published posts
    const posts = await Post.find({
      author: user._id,
      status: 'published'
    })
    .select('title slug excerpt featuredImage publishedAt views likes category readTime')
    .sort({ publishedAt: -1 })
    .limit(10);

    // Get user stats
    const totalPosts = await Post.countDocuments({ 
      author: user._id, 
      status: 'published' 
    });

    const totalViews = await Post.aggregate([
      { $match: { author: user._id, status: 'published' } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    res.json({
      user: {
        ...user.toJSON(),
        stats: {
          totalPosts,
          totalViews: totalViews[0]?.totalViews || 0
        }
      },
      recentPosts: posts
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  authenticateToken,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter URL must be valid'),
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid'),
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be valid'),
  body('socialLinks.website')
    .optional()
    .isURL()
    .withMessage('Website URL must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'bio', 'socialLinks'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
});

// @route   GET /api/users/:userId/posts
// @desc    Get user's posts (with different access levels)
// @access  Public/Private
router.get('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if requesting user is the owner or admin
    const isOwner = req.user && req.user._id.toString() === userId;
    const isAdmin = req.user && req.user.role === 'admin';

    let filter = { author: userId };

    // If not owner or admin, only show published posts
    if (!isOwner && !isAdmin) {
      filter.status = 'published';
    }

    const posts = await Post.find(filter)
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error while fetching user posts' });
  }
});

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Server error while deactivating account' });
  }
});

// @route   GET /api/users/saved-posts
// @desc    Get user's saved/bookmarked posts
// @access  Private
router.get('/saved-posts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get saved posts with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find posts that match the saved post IDs
    const savedPosts = await Post.find({
      _id: { $in: user.savedPosts },
      status: 'published'
    })
      .populate('author', 'username firstName lastName avatar')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content');

    const total = user.savedPosts.length;

    res.json(savedPosts);
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ message: 'Server error while fetching saved posts' });
  }
});

// ADMIN ROUTES

// @route   GET /api/users/admin/all
// @desc    Get all users (admin only)
// @access  Private (Admin only)
router.get('/admin/all', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   PUT /api/users/admin/:userId/toggle-ban
// @desc    Ban or unban a user (admin only)
// @access  Private (Admin only)
router.put('/admin/:userId/toggle-ban', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot ban yourself or other admins
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot ban yourself' });
    }

    if (user.role === 'admin' && req.user.role === 'admin') {
      return res.status(403).json({ message: 'You cannot ban another admin' });
    }

    // Toggle isActive status
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: user.isActive ? 'User unbanned successfully' : 'User banned successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle ban user error:', error);
    res.status(500).json({ message: 'Server error while toggling user ban status' });
  }
});

// @route   PUT /api/users/admin/:userId/role
// @desc    Update user role (admin only)
// @access  Private (Admin only)
router.put('/admin/:userId/role', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot change your own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role} successfully`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error while updating user role' });
  }
});

// @route   GET /api/users/admin/stats
// @desc    Get user statistics (admin only)
// @access  Private (Admin only)
router.get('/admin/stats', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const recentUsers = await User.find()
      .select('username firstName lastName avatar createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user stats' });
  }
});

module.exports = router;
