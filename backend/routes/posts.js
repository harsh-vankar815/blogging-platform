const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const {
  authenticateToken,
  optionalAuth,
  requireOwnershipOrAdmin,
  routeMiddleware,
  requireAdmin
} = require('../middleware');
const { uploadPostImage } = require('../services/cloudinaryService');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all published posts with pagination and filtering
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('tag').optional().isString().withMessage('Tag must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sortBy').optional().isIn(['newest', 'oldest', 'popular', 'views', 'title']).withMessage('Invalid sort option')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'newest';

    // Build filter query
    const filter = { status: 'published' };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Build sort query
    let sortQuery = {};
    switch (sortBy) {
      case 'oldest':
        sortQuery = { publishedAt: 1 };
        break;
      case 'popular':
        // Use aggregation for popular posts (by likes)
        const popularPosts = await Post.aggregate([
          { $match: filter },
          {
            $addFields: {
              likeCount: { $size: '$likes' }
            }
          },
          { $sort: { likeCount: -1, publishedAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'author',
              foreignField: '_id',
              as: 'author',
              pipeline: [
                { $project: { username: 1, firstName: 1, lastName: 1, avatar: 1 } }
              ]
            }
          },
          { $unwind: '$author' },
          {
            $project: {
              content: 0 // Exclude full content
            }
          }
        ]);

        const totalPopular = await Post.countDocuments(filter);

        return res.json({
          posts: popularPosts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPopular / limit),
            totalPosts: totalPopular,
            hasNext: page < Math.ceil(totalPopular / limit),
            hasPrev: page > 1
          }
        });
      case 'views':
        sortQuery = { views: -1, publishedAt: -1 };
        break;
      case 'title':
        sortQuery = { title: 1 };
        break;
      case 'newest':
      default:
        sortQuery = { publishedAt: -1 };
        break;
    }

    // Get posts with author info
    const posts = await Post.find(filter)
      .populate('author', 'username firstName lastName avatar')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .select('-content'); // Exclude full content for list view

    // Add like count to each post
    const postsWithLikeCount = posts.map(post => ({
      ...post.toJSON(),
      likeCount: post.likes ? post.likes.length : 0
    }));

    // Get total count for pagination
    const total = await Post.countDocuments(filter);

    res.json({
      posts: postsWithLikeCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private (requires email verification and post creation permission)
router.post('/', [
  ...routeMiddleware.createPost,
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and cannot exceed 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('category')
    .isIn(['Technology', 'Lifestyle', 'Travel', 'Food', 'Health', 'Business', 'Education', 'Entertainment', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const postData = {
      ...req.body,
      author: req.user._id
    };

    const post = new Post(postData);
    await post.save();

    // Populate author info
    await post.populate('author', 'username firstName lastName avatar');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error while creating post' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (Author or Admin)
router.put('/:id', [
  ...routeMiddleware.updatePost,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content cannot be empty'),
  body('category')
    .optional()
    .isIn(['Technology', 'Lifestyle', 'Travel', 'Food', 'Health', 'Business', 'Education', 'Entertainment', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Update post
    Object.assign(post, req.body);
    await post.save();

    await post.populate('author', 'username firstName lastName avatar');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error while updating post' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (Author or Admin)
router.delete('/:id', routeMiddleware.deletePost, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Additional check to ensure admin can delete any post
    if (req.user.role !== 'admin' && post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied - you can only delete your own posts' });
    }

    await Post.findByIdAndDelete(req.params.id);
    
    // Also delete associated comments
    await Comment.deleteMany({ post: req.params.id });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error while deleting post' });
  }
});

// @route   GET /api/posts/featured
// @desc    Get featured posts (most liked/viewed posts)
// @access  Public
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 5;

    // Get posts with highest engagement (likes + views)
    const posts = await Post.aggregate([
      { $match: { status: 'published' } },
      {
        $addFields: {
          likeCount: { $size: '$likes' },
          engagementScore: {
            $add: [
              { $size: '$likes' },
              { $divide: ['$views', 10] } // Weight views less than likes
            ]
          }
        }
      },
      { $sort: { engagementScore: -1, publishedAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            { $project: { username: 1, firstName: 1, lastName: 1, avatar: 1 } }
          ]
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          content: 0 // Exclude full content
        }
      }
    ]);

    res.json({ posts });
  } catch (error) {
    console.error('Get featured posts error:', error);
    res.status(500).json({ message: 'Server error while fetching featured posts' });
  }
});

// @route   GET /api/posts/popular
// @desc    Get popular posts (most viewed in last 30 days)
// @access  Public
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 5;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const posts = await Post.find({
      status: 'published',
      publishedAt: { $gte: thirtyDaysAgo }
    })
    .populate('author', 'username firstName lastName avatar')
    .sort({ views: -1, publishedAt: -1 })
    .limit(limit)
    .select('-content');

    res.json({ posts });
  } catch (error) {
    console.error('Get popular posts error:', error);
    res.status(500).json({ message: 'Server error while fetching popular posts' });
  }
});

// @route   GET /api/posts/recent
// @desc    Get recent posts
// @access  Public
router.get('/recent', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 5;

    const posts = await Post.find({ status: 'published' })
      .populate('author', 'username firstName lastName avatar')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('-content');

    res.json({ posts });
  } catch (error) {
    console.error('Get recent posts error:', error);
    res.status(500).json({ message: 'Server error while fetching recent posts' });
  }
});

// @route   GET /api/posts/categories
// @desc    Get all categories with post counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/posts/tags
// @desc    Get all tags with post counts
// @access  Public
router.get('/tags', async (req, res) => {
  try {
    const tags = await Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }, // Limit to top 50 tags
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);

    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Server error while fetching tags' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user has already liked the post
    const existingLike = post.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(
        like => like.user.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      post.likes.push({ user: req.user._id });
    }

    await post.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`post_${post._id}`).emit('post_liked', {
        postId: post._id,
        likes: post.likes,
        likeCount: post.likes.length,
        isLiked: !existingLike
      });
    }

    res.json({
      message: existingLike ? 'Post unliked' : 'Post liked',
      likeCount: post.likes.length,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error while liking post' });
  }
});

// @route   POST /api/posts/upload/image
// @desc    Upload a post image to Cloudinary
// @access  Private
router.post('/upload/image', authenticateToken, uploadPostImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Return the Cloudinary URL
    res.status(200).json({
      url: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// ADMIN ROUTES

// @route   GET /api/posts/admin/all
// @desc    Get all posts with filters (admin only)
// @access  Private (Admin only)
router.get('/admin/all', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'all';
    const search = req.query.search || '';

    let query = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await Post.find(query)
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

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
    console.error('Admin get all posts error:', error);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
});

// @route   PUT /api/posts/admin/:id/status
// @desc    Update post status (admin only)
// @access  Private (Admin only)
router.put('/admin/:id/status', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.status = status;
    
    // If publishing, set publishedAt date
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
    
    await post.save();
    await post.populate('author', 'username firstName lastName avatar');

    res.json({
      message: `Post status updated to ${status} successfully`,
      post
    });
  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({ message: 'Server error while updating post status' });
  }
});

// @route   GET /api/posts/admin/stats
// @desc    Get post statistics (admin only)
// @access  Private (Admin only)
router.get('/admin/stats', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const publishedPosts = await Post.countDocuments({ status: 'published' });
    const draftPosts = await Post.countDocuments({ status: 'draft' });
    const archivedPosts = await Post.countDocuments({ status: 'archived' });
    
    // Get top posts by views
    const topViewedPosts = await Post.find({ status: 'published' })
      .populate('author', 'username firstName lastName')
      .sort({ views: -1 })
      .limit(5)
      .select('title slug views');
    
    // Get top posts by likes
    const topLikedPosts = await Post.aggregate([
      { $match: { status: 'published' } },
      { $addFields: { likeCount: { $size: '$likes' } } },
      { $sort: { likeCount: -1 } },
      { $limit: 5 },
      { $project: { title: 1, slug: 1, likeCount: 1 } }
    ]);
    
    // Get recent posts
    const recentPosts = await Post.find()
      .populate('author', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title slug status createdAt');

    res.json({
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      topViewedPosts,
      topLikedPosts,
      recentPosts
    });
  } catch (error) {
    console.error('Get post stats error:', error);
    res.status(500).json({ message: 'Server error while fetching post stats' });
  }
});

// @route   GET /api/posts/id/:id
// @desc    Get single post by ID (for editing)
// @access  Private
router.get('/id/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is author or admin
    if (post.author._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching post' });
  }
});

// @route   GET /api/posts/:slug
// @desc    Get single post by slug
// @access  Public
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      status: 'published'
    })
    .populate('author', 'username firstName lastName avatar bio socialLinks')
    .populate({
      path: 'commentCount'
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment view count and save
    post.views += 1;
    await post.save();
    
    console.log(`Incremented view count for post ${post._id} to ${post.views}`);

    // Check if current user liked the post
    let isLiked = false;
    if (req.user) {
      isLiked = post.isLikedByUser(req.user._id);
    }

    const postResponse = post.toJSON();
    postResponse.isLiked = isLiked;

    res.json(postResponse);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error while fetching post' });
  }
});

// @route   POST /api/posts/:id/save
// @desc    Save/unsave a post
// @access  Private
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if post is already saved
    const postIndex = user.savedPosts.indexOf(post._id);
    
    if (postIndex > -1) {
      // Unsave post
      user.savedPosts.splice(postIndex, 1);
      await user.save();
      res.json({
        message: 'Post removed from saved posts',
        isSaved: false
      });
    } else {
      // Save post
      user.savedPosts.push(post._id);
      await user.save();
      res.json({
        message: 'Post saved successfully',
        isSaved: true
      });
    }
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ message: 'Server error while saving post' });
  }
});

module.exports = router;
