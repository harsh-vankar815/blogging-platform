const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    max: 3 // Maximum nesting level (0 = top level, 3 = deepest allowed)
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  needsModeration: {
    type: Boolean,
    default: false
  },
  moderationReason: {
    type: String,
    default: null
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
  dislikes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
commentSchema.index({ post: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ isApproved: 1 });
commentSchema.index({ needsModeration: 1 });
commentSchema.index({ level: 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
commentSchema.virtual('dislikeCount').get(function() {
  return this.dislikes ? this.dislikes.length : 0;
});

// Virtual for replies count
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

// Pre-save middleware to handle edit tracking
commentSchema.pre('save', function(next) {
  // Track edits
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  
  // Calculate nesting level
  if (this.parentComment && this.isNew) {
    // Find parent comment and set level
    mongoose.model('Comment').findById(this.parentComment)
      .then(parentComment => {
        if (parentComment) {
          this.level = Math.min(parentComment.level + 1, 3);
        }
        next();
      })
      .catch(err => {
        console.error('Error calculating comment level:', err);
        next();
      });
  } else {
  next();
  }
});

// Statics for soft delete
commentSchema.statics.softDelete = async function(commentId, userId) {
  const comment = await this.findById(commentId);
  
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  comment.isDeleted = true;
  comment.deletedAt = new Date();
  comment.deletedBy = userId;
  comment.content = '[This comment has been deleted]';
  
  return comment.save();
};

// Method to like a comment
commentSchema.methods.like = async function(userId) {
  console.log(`Like method called for comment ${this._id} by user ${userId}`);
  console.log(`Before: likes=${this.likes.length}, dislikes=${this.dislikes.length}`);
  
  // Add to likes if not already liked, otherwise remove (toggle)
  const likeIndex = this.likes.findIndex(
    like => like.user && like.user.toString() === userId.toString()
  );
  
  if (likeIndex === -1) {
    this.likes.push({ user: userId });
    console.log('Added like');
  } else {
    // Unlike if already liked
    this.likes.splice(likeIndex, 1);
    console.log('Removed like');
  }
  
  console.log(`After: likes=${this.likes.length}, dislikes=${this.dislikes.length}`);
  return this.save();
};

// Method to dislike a comment
commentSchema.methods.dislike = async function(userId) {
  console.log(`Dislike method called for comment ${this._id} by user ${userId}`);
  console.log(`Before: likes=${this.likes.length}, dislikes=${this.dislikes.length}`);
  
  // Add to dislikes if not already disliked, otherwise remove (toggle)
  const dislikeIndex = this.dislikes.findIndex(
    dislike => dislike.user && dislike.user.toString() === userId.toString()
  );
  
  if (dislikeIndex === -1) {
    this.dislikes.push({ user: userId });
    console.log('Added dislike');
  } else {
    // Undislike if already disliked
    this.dislikes.splice(dislikeIndex, 1);
    console.log('Removed dislike');
  }
  
  console.log(`After: likes=${this.likes.length}, dislikes=${this.dislikes.length}`);
  return this.save();
};

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);
