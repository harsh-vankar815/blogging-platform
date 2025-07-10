const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  hashedToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
passwordResetSchema.index({ user: 1 });

// Remove expired tokens automatically
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate reset token
passwordResetSchema.statics.generateResetToken = function() {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  return { resetToken, hashedToken };
};

// Static method to find valid token
passwordResetSchema.statics.findValidToken = async function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return this.findOne({
    hashedToken,
    expiresAt: { $gt: new Date() },
    isUsed: false
  }).populate('user');
};

// Instance method to mark token as used
passwordResetSchema.methods.markAsUsed = async function() {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Static method to cleanup old tokens for a user
passwordResetSchema.statics.cleanupUserTokens = async function(userId) {
  return this.deleteMany({
    user: userId,
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ]
  });
};

// Static method to revoke all active tokens for a user
passwordResetSchema.statics.revokeUserTokens = async function(userId) {
  return this.updateMany(
    { 
      user: userId,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    },
    { 
      isUsed: true,
      usedAt: new Date()
    }
  );
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
