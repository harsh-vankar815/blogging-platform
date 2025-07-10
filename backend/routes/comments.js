const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Make io available to routes
router.use((req, res, next) => {
  if (req.app.get('io')) {
    req.io = req.app.get('io');
  }
  next();
});

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a specific post
// @access  Public
router.get('/post/:postId', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get top-level comments (no parent)
    const comments = await Comment.find({
      post: postId,
      parentComment: null,
      isApproved: true
    })
    .populate('author', 'username firstName lastName avatar')
    .populate({
      path: 'replyCount'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Add user interaction data if authenticated
    const commentsWithUserData = comments.map(comment => {
      const commentObj = comment.toJSON();
      if (req.user) {
        commentObj.isLiked = comment.likes.some(
          like => like.user.toString() === req.user._id.toString()
        );
        commentObj.canEdit = comment.author._id.toString() === req.user._id.toString();
        commentObj.canDelete = comment.author._id.toString() === req.user._id.toString() || req.user.role === 'admin';
      }
      return commentObj;
    });

    const total = await Comment.countDocuments({
      post: postId,
      parentComment: null,
      isApproved: true
    });

    res.json({
      comments: commentsWithUserData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error while fetching comments' });
  }
});

// @route   GET /api/comments/:commentId/replies
// @desc    Get replies for a specific comment
// @access  Public
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;

    const replies = await Comment.find({
      parentComment: commentId,
      isApproved: true
    })
    .populate('author', 'username firstName lastName avatar')
    .sort({ createdAt: 1 });

    // Add user interaction data if authenticated
    const repliesWithUserData = replies.map(reply => {
      const replyObj = reply.toJSON();
      if (req.user) {
        replyObj.isLiked = reply.likes.some(
          like => like.user.toString() === req.user._id.toString()
        );
        replyObj.canEdit = reply.author._id.toString() === req.user._id.toString();
        replyObj.canDelete = reply.author._id.toString() === req.user._id.toString() || req.user.role === 'admin';
      }
      return replyObj;
    });

    res.json({ replies: repliesWithUserData });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Server error while fetching replies' });
  }
});

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', [
  authenticateToken,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and cannot exceed 1000 characters'),
  body('post')
    .isMongoId()
    .withMessage('Valid post ID is required'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Parent comment ID must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, post: postId, parentComment } = req.body;

    // Verify post exists
    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // If replying to a comment, verify parent comment exists
    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = new Comment({
      content,
      post: postId,
      author: req.user._id,
      parentComment: parentComment || null
    });

    await comment.save();
    await comment.populate('author', 'username firstName lastName avatar');

    // Update post with new comment count
    postExists.commentCount = await Comment.countDocuments({ post: postId, isApproved: true });
    await postExists.save();

    // Emit socket event if io is available
    if (req.app.get('io')) {
      req.app.get('io').to(`post_${postId}`).emit('comment_added', {
        postId,
        comment
      });
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error while creating comment' });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (Author only)
router.put('/:id', [
  authenticateToken,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    comment.content = req.body.content;
    await comment.save();

    await comment.populate('author', 'username firstName lastName avatar');

    // Emit socket event if io is available
    if (req.app.get('io')) {
      req.app.get('io').to(`post_${comment.post}`).emit('comment_updated', {
        postId: comment.post,
        commentId: comment._id,
        comment
      });
    }

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error while updating comment' });
  }
});

// ADMIN ROUTES

// @route   GET /api/comments/admin/all
// @desc    Get all comments with filters (admin only)
// @access  Private (Admin only)
router.get('/admin/all', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const isApproved = req.query.isApproved;
    const needsModeration = req.query.needsModeration;
    const search = req.query.search || '';

    let query = {};
    
    // Filter by approval status if provided
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }
    
    // Filter by moderation status if provided
    if (needsModeration !== undefined) {
      query.needsModeration = needsModeration === 'true';
    }
    
    // Search functionality
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const comments = await Comment.find(query)
      .populate('author', 'username firstName lastName avatar')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments(query);

    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin get all comments error:', error);
    res.status(500).json({ message: 'Server error while fetching comments' });
  }
});

// @route   PUT /api/comments/admin/:id/approve
// @desc    Approve or disapprove a comment (admin only)
// @access  Private (Admin only)
router.put('/admin/:id/approve', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { isApproved } = req.body;
    
    if (isApproved === undefined) {
      return res.status(400).json({ message: 'isApproved field is required' });
    }

    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.isApproved = isApproved;
    comment.needsModeration = false;
    
    if (!isApproved) {
      comment.moderationReason = req.body.moderationReason || 'Rejected by admin';
    } else {
      comment.moderationReason = null;
    }
    
    await comment.save();
    await comment.populate('author', 'username firstName lastName avatar');
    await comment.populate('post', 'title slug');

    // Emit socket event if io is available
    if (req.app.get('io')) {
      req.app.get('io').to(`post_${comment.post._id}`).emit('comment_moderated', {
        postId: comment.post._id,
        commentId: comment._id,
        isApproved: comment.isApproved
      });
    }

    res.json({
      message: isApproved ? 'Comment approved successfully' : 'Comment disapproved successfully',
      comment
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ message: 'Server error while approving comment' });
  }
});

// @route   PUT /api/comments/admin/:id/flag
// @desc    Flag or unflag a comment for moderation (admin only)
// @access  Private (Admin only)
router.put('/admin/:id/flag', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { needsModeration, moderationReason } = req.body;
    
    if (needsModeration === undefined) {
      return res.status(400).json({ message: 'needsModeration field is required' });
    }

    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.needsModeration = needsModeration;
    
    if (needsModeration) {
      comment.moderationReason = moderationReason || 'Flagged for review';
    } else {
      comment.moderationReason = null;
    }
    
    await comment.save();
    await comment.populate('author', 'username firstName lastName avatar');
    await comment.populate('post', 'title slug');

    res.json({
      message: needsModeration ? 'Comment flagged for moderation' : 'Comment unflagged',
      comment
    });
  } catch (error) {
    console.error('Flag comment error:', error);
    res.status(500).json({ message: 'Server error while flagging comment' });
  }
});

// @route   GET /api/comments/admin/stats
// @desc    Get comment statistics (admin only)
// @access  Private (Admin only)
router.get('/admin/stats', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const totalComments = await Comment.countDocuments();
    const approvedComments = await Comment.countDocuments({ isApproved: true });
    const pendingModeration = await Comment.countDocuments({ needsModeration: true });
    const rejectedComments = await Comment.countDocuments({ isApproved: false });
    
    // Get recent comments
    const recentComments = await Comment.find()
      .populate('author', 'username firstName lastName')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content createdAt isApproved needsModeration');

    res.json({
      totalComments,
      approvedComments,
      pendingModeration,
      rejectedComments,
      recentComments
    });
  } catch (error) {
    console.error('Get comment stats error:', error);
    res.status(500).json({ message: 'Server error while fetching comment stats' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private (Author or Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the post ID before deleting the comment
    const postId = comment.post;

    // Delete the comment and all its replies
    await Comment.deleteMany({
      $or: [
        { _id: req.params.id },
        { parentComment: req.params.id }
      ]
    });

    // Update post with new comment count
    const post = await Post.findById(postId);
    if (post) {
      post.commentCount = await Comment.countDocuments({ post: postId, isApproved: true });
      await post.save();

      // Emit socket event if io is available
      if (req.app.get('io')) {
        req.app.get('io').to(`post_${postId}`).emit('comment_deleted', {
          postId,
          commentId: req.params.id
        });
      }
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error while deleting comment' });
  }
});

// @route   POST /api/comments/:id/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    console.log(`Like request received for comment ${req.params.id} by user ${req.user._id}`);
    
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar');
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    await comment.like(req.user._id);
    console.log(`After like operation: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);

    // Send real-time update if socket is available
    if (req.app.get('io')) {
      const eventData = {
        type: 'LIKE',
        commentId: comment._id.toString(),
        postId: comment.post.toString(),
        likes: comment.likes || [],
        dislikes: comment.dislikes || [],
        likeCount: comment.likes.length,
        dislikeCount: comment.dislikes.length
      };
      
      console.log('Emitting comment_updated event with data:', JSON.stringify({
        ...eventData,
        likes: `Array(${eventData.likes.length})`,
        dislikes: `Array(${eventData.dislikes.length})`
      }));
      
      req.app.get('io').to(`post_${comment.post}`).emit('comment_updated', eventData);
    }

    res.json({
      success: true,
      message: 'Comment like updated successfully',
      data: {
        likes: comment.likes || [],
        dislikes: comment.dislikes || [],
        likeCount: comment.likes.length,
        dislikeCount: comment.dislikes.length
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment like' });
  }
});

// @route   POST /api/comments/:id/dislike
// @desc    Dislike/undislike a comment
// @access  Private
router.post('/:id/dislike', authenticateToken, async (req, res) => {
  try {
    console.log(`Dislike request received for comment ${req.params.id} by user ${req.user._id}`);
    
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar');
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    await comment.dislike(req.user._id);
    console.log(`After dislike operation: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);

    // Send real-time update if socket is available
    if (req.app.get('io')) {
      const eventData = {
        type: 'DISLIKE',
        commentId: comment._id.toString(),
        postId: comment.post.toString(),
        likes: comment.likes || [],
        dislikes: comment.dislikes || [],
        likeCount: comment.likes.length,
        dislikeCount: comment.dislikes.length
      };
      
      console.log('Emitting comment_updated event with data:', JSON.stringify({
        ...eventData,
        likes: `Array(${eventData.likes.length})`,
        dislikes: `Array(${eventData.dislikes.length})`
      }));
      
      req.app.get('io').to(`post_${comment.post}`).emit('comment_updated', eventData);
    }

    res.json({
      success: true,
      message: 'Comment dislike updated successfully',
      data: {
        likes: comment.likes || [],
        dislikes: comment.dislikes || [],
        likeCount: comment.likes.length,
        dislikeCount: comment.dislikes.length
      }
    });
  } catch (error) {
    console.error('Dislike comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment dislike' });
  }
});

// @route   POST /api/comments/:id/report
// @desc    Report a comment for moderation
// @access  Private
router.post('/:id/report', authenticateToken, [
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason is required and cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reason } = req.body;
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Mark for moderation
    comment.needsModeration = true;
    comment.moderationReason = reason;
    await comment.save();
    
    res.json({
      message: 'Comment reported for moderation',
    });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({ message: 'Server error while reporting comment' });
  }
});

// @route   POST /api/comments/:id/moderate
// @desc    Moderate a reported comment (approve or reject)
// @access  Private (Admin only)
router.post('/:id/moderate', authenticateToken, [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either "approve" or "reject"')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required' });
    }

    const { action } = req.body;
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (action === 'approve') {
      comment.needsModeration = false;
      comment.isApproved = true;
      comment.moderationReason = null;
    } else {
      // Soft delete the comment if rejected
      await Comment.softDelete(comment._id, req.user._id);
      comment.needsModeration = false;
      comment.isApproved = false;
    }

    await comment.save();
    
    // Emit socket event
    if (req.io) {
      if (action === 'approve') {
        req.io.to(`post_${comment.post}`).emit('comment_approved', {
          postId: comment.post,
          commentId: comment._id
        });
      } else {
        req.io.to(`post_${comment.post}`).emit('comment_deleted', {
          postId: comment.post,
          commentId: comment._id
        });
      }
    }

    res.json({
      message: action === 'approve' ? 'Comment approved' : 'Comment rejected',
      comment
    });
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({ message: 'Server error while moderating comment' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment (soft delete)
// @access  Private (Author or Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to delete
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete
    await Comment.softDelete(comment._id, req.user._id);
    
    // Emit socket event
    if (req.io) {
      req.io.to(`post_${comment.post}`).emit('comment_deleted', {
        postId: comment.post,
        commentId: comment._id
      });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error while deleting comment' });
  }
});

// @route   GET /api/comments/moderation
// @desc    Get comments that need moderation
// @access  Private (Admin only)
router.get('/moderation', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get comments that need moderation
    const comments = await Comment.find({
      needsModeration: true,
      isDeleted: false
    })
    .populate('author', 'username firstName lastName avatar')
    .populate('post', 'title slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Comment.countDocuments({
      needsModeration: true,
      isDeleted: false
    });

    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get moderation comments error:', error);
    res.status(500).json({ message: 'Server error while fetching comments for moderation' });
  }
});

module.exports = router;
