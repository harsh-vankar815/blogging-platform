const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    deviceType: String
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
refreshTokenSchema.index({ user: 1 });

// Remove expired tokens automatically
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to check if token is expired
refreshTokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Static method to cleanup expired tokens for a user
refreshTokenSchema.statics.cleanupExpiredTokens = async function(userId) {
  return this.deleteMany({
    user: userId,
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false }
    ]
  });
};

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllUserTokens = async function(userId) {
  return this.updateMany(
    { user: userId },
    { isActive: false }
  );
};

// Static method to limit tokens per user (keep only latest 5)
refreshTokenSchema.statics.limitUserTokens = async function(userId, limit = 5) {
  const tokens = await this.find({ user: userId, isActive: true })
    .sort({ createdAt: -1 })
    .skip(limit);
  
  if (tokens.length > 0) {
    const tokenIds = tokens.map(token => token._id);
    await this.updateMany(
      { _id: { $in: tokenIds } },
      { isActive: false }
    );
  }
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
