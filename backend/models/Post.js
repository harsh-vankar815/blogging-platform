const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  featuredImage: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Technology', 'Lifestyle', 'Travel', 'Food', 'Health', 'Business', 'Education', 'Entertainment', 'Sports', 'Other'],
    default: 'Other'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  readTime: {
    type: Number, // in minutes
    default: 1
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// Note: slug index is already created by unique: true in schema field
postSchema.index({ author: 1 });
postSchema.index({ status: 1 });
postSchema.index({ category: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ publishedAt: -1 });
postSchema.index({ createdAt: -1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Method to check if a user has liked this post
postSchema.methods.isLikedByUser = function(userId) {
  if (!userId || !this.likes || this.likes.length === 0) return false;
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Virtual for comment count (will be populated from Comment model)
postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true
});

// Generate slug from title
postSchema.pre('save', function(next) {
  // Only generate slug if title is modified and no slug is provided
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Add timestamp to ensure uniqueness
    if (this.isNew) {
      this.slug += '-' + Date.now();
    }
  }
  
  // Calculate read time (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  
  // Auto-generate excerpt if not provided
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content.substring(0, 200) + '...';
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
