const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');
const { setupBasicMiddleware, setupRateLimiting, setupErrorHandling } = require('./middleware');
const middleware = require('./middleware');
const monitorDbHealth = require('./middleware/dbHealth');
const http = require('http');
const { Server } = require('socket.io');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const User = require('./models/User');
require('dotenv').config();

// Fix EventEmitter warning
process.setMaxListeners(20);

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Setup comprehensive middleware
setupBasicMiddleware(app);
setupRateLimiting(app);

// Add database health monitoring
app.use(monitorDbHealth);

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Note: Body parsing and logging are now handled by setupBasicMiddleware

// Database connection
const mongoUri = process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.replace(/\n/g, '').replace(/\s+/g, '') : 
  'mongodb://localhost:27017/mern-blog';

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,    // Increased timeout to 30 seconds
  heartbeatFrequencyMS: 2000,         // Check connection every 2 seconds
  socketTimeoutMS: 45000,             // Close sockets after 45s of inactivity
  family: 4,                          // Use IPv4, skip trying IPv6
  maxPoolSize: 10,                    // Maximum number of connections
  minPoolSize: 2,                     // Minimum number of connections
  connectTimeoutMS: 30000,            // Give up initial connection after 30 seconds
  retryWrites: true,                  // Enable retryable writes
  w: 'majority'                       // Write concern
};

let isConnected = false;

const connectWithRetry = async () => {
  try {
    if (isConnected) return; // Prevent multiple connection attempts

    await mongoose.connect(mongoUri, mongooseOptions);
    isConnected = true;
    console.log('MongoDB connected successfully');

    // Reset connection flags and error counts on successful connection
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('Mongoose connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose connection disconnected');
      isConnected = false;
      // Try to reconnect
      setTimeout(() => {
        if (!isConnected) {
          console.log('Attempting to reconnect to MongoDB...');
          connectWithRetry();
        }
      }, 5000);
    });

  } catch (err) {
    console.error('MongoDB connection error:', err);
    isConnected = false;
    // Wait for 5 seconds before retrying
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection
connectWithRetry();

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error while closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Handle uncaught errors
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to uncaught exception');
    process.exit(1);
  } catch (closeErr) {
    console.error('Error while closing MongoDB connection:', closeErr);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to unhandled rejection');
    process.exit(1);
  } catch (closeErr) {
    console.error('Error while closing MongoDB connection:', closeErr);
    process.exit(1);
  }
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);

// Admin dashboard statistics route
app.get('/api/admin/dashboard', [middleware.authenticateToken, middleware.requireAdmin], async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Get post statistics
    const totalPosts = await Post.countDocuments();
    const publishedPosts = await Post.countDocuments({ status: 'published' });
    const draftPosts = await Post.countDocuments({ status: 'draft' });
    const newPostsToday = await Post.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Get comment statistics
    const totalComments = await Comment.countDocuments();
    const pendingModeration = await Comment.countDocuments({ needsModeration: true });
    const newCommentsToday = await Comment.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username firstName lastName avatar createdAt');

    const recentPosts = await Post.find()
      .populate('author', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title slug status createdAt');

    const recentComments = await Comment.find()
      .populate('author', 'username firstName lastName')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content createdAt isApproved needsModeration');

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        recent: recentUsers
      },
      posts: {
        total: totalPosts,
        published: publishedPosts,
        drafts: draftPosts,
        newToday: newPostsToday,
        recent: recentPosts
      },
      comments: {
        total: totalComments,
        pendingModeration,
        newToday: newCommentsToday,
        recent: recentComments
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard statistics' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Setup comprehensive error handling
setupErrorHandling(app);

const PORT = process.env.PORT || 5000;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join a room for a specific post
  socket.on('join_post', (postId) => {
    socket.join(`post_${postId}`);
    console.log(`Socket ${socket.id} joined room: post_${postId}`);
  });
  
  // Leave a room
  socket.on('leave_post', (postId) => {
    socket.leave(`post_${postId}`);
    console.log(`Socket ${socket.id} left room: post_${postId}`);
  });
  
  // Handle new comment
  socket.on('new_comment', (data) => {
    io.to(`post_${data.postId}`).emit('comment_added', data);
  });
  
  // Comment like event
  socket.on('comment_like', async (data) => {
    try {
      console.log('Received comment_like event:', data);
      const { postId, commentId, userId, likes, dislikes } = data;
      
      // Validate required data
      if (!postId || !commentId || !userId) {
        console.error('Invalid comment_like data:', data);
        return;
      }
      
      // If likes/dislikes are not provided, fetch from database
      let likeData = { likes, dislikes };
      if (!likes || !dislikes) {
        const comment = await Comment.findById(commentId);
        if (!comment) {
          console.error('Comment not found:', commentId);
          return;
        }
        likeData = {
          likes: comment.likes || [],
          dislikes: comment.dislikes || []
        };
      }
      
      // Broadcast to all clients in the post room
      io.to(`post:${postId}`).emit('comment_liked', {
        postId,
        commentId,
        userId,
        likes: likeData.likes,
        dislikes: likeData.dislikes
      });
      
      console.log('Broadcast comment_liked event to room:', `post:${postId}`);
    } catch (error) {
      console.error('Error handling comment_like event:', error);
    }
  });
  
  // Comment dislike event
  socket.on('comment_dislike', async (data) => {
    try {
      console.log('Received comment_dislike event:', data);
      const { postId, commentId, userId, likes, dislikes } = data;
      
      // Validate required data
      if (!postId || !commentId || !userId) {
        console.error('Invalid comment_dislike data:', data);
        return;
      }
      
      // If likes/dislikes are not provided, fetch from database
      let dislikeData = { likes, dislikes };
      if (!likes || !dislikes) {
        const comment = await Comment.findById(commentId);
        if (!comment) {
          console.error('Comment not found:', commentId);
          return;
        }
        dislikeData = {
          likes: comment.likes || [],
          dislikes: comment.dislikes || []
        };
      }
      
      // Broadcast to all clients in the post room
      io.to(`post:${postId}`).emit('comment_disliked', {
        postId,
        commentId,
        userId,
        likes: dislikeData.likes,
        dislikes: dislikeData.dislikes
      });
      
      console.log('Broadcast comment_disliked event to room:', `post:${postId}`);
    } catch (error) {
      console.error('Error handling comment_dislike event:', error);
    }
  });
  
  // Handle post like
  socket.on('post_like', async (data) => {
    try {
      // Get the updated post to ensure we have accurate like count
      const post = await Post.findById(data.postId);
      if (!post) {
        console.error('Post not found for like update:', data.postId);
        return;
      }
      
      // Broadcast to all clients in the post room
      io.to(`post_${data.postId}`).emit('post_liked', {
        postId: data.postId,
        likes: post.likes || [],
        likeCount: post.likes ? post.likes.length : 0,
        isLiked: data.isLiked
      });
    } catch (error) {
      console.error('Error handling post like socket event:', error);
    }
  });
  
  // Handle comment update
  socket.on('comment_update', (data) => {
    io.to(`post_${data.postId}`).emit('comment_updated', data);
  });
  
  // Handle comment delete
  socket.on('comment_delete', (data) => {
    io.to(`post_${data.postId}`).emit('comment_deleted', data);
  });
  
  // Handle comment report
  socket.on('comment_report', (data) => {
    io.to(`post_${data.postId}`).emit('comment_reported', data);
    // Also emit to admin channel
    io.to('admin_channel').emit('comment_needs_moderation', data);
  });
  
  // Handle room joining
  socket.on('join_room', (data) => {
    try {
      const { room } = data;
      if (!room) {
        console.error('No room specified in join_room event');
        return;
      }
      
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    } catch (error) {
      console.error('Error handling join_room event:', error);
    }
  });
  
  // Handle room leaving
  socket.on('leave_room', (data) => {
    try {
      const { room } = data;
      if (!room) {
        console.error('No room specified in leave_room event');
        return;
      }
      
      socket.leave(room);
      console.log(`User ${socket.id} left room: ${room}`);
    } catch (error) {
      console.error('Error handling leave_room event:', error);
    }
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for testing
module.exports = { app, server, io };
