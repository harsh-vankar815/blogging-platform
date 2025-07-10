const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

class JWTService {
  // Generate access token
  generateAccessToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'mern-blog',
        audience: 'mern-blog-users'
      }
    );
  }

  // Generate refresh token
  async generateRefreshToken(userId, deviceInfo = {}) {
    // Clean up old tokens first
    await RefreshToken.cleanupExpiredTokens(userId);
    
    // Limit number of active tokens per user
    await RefreshToken.limitUserTokens(userId, 5);

    // Create new refresh token
    const refreshToken = new RefreshToken({
      user: userId,
      deviceInfo: {
        userAgent: deviceInfo.userAgent || '',
        ip: deviceInfo.ip || '',
        deviceType: this.getDeviceType(deviceInfo.userAgent || '')
      }
    });

    await refreshToken.save();
    return refreshToken.token;
  }

  // Generate token pair (access + refresh)
  async generateTokenPair(user, deviceInfo = {}) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(user._id, deviceInfo);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiration()
    };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'mern-blog',
        audience: 'mern-blog-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify and use refresh token
  async verifyRefreshToken(token) {
    const refreshToken = await RefreshToken.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!refreshToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Update last used timestamp
    refreshToken.lastUsed = new Date();
    await refreshToken.save();

    return refreshToken;
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshTokenString, deviceInfo = {}) {
    const refreshToken = await this.verifyRefreshToken(refreshTokenString);
    
    if (!refreshToken.user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Generate new access token
    const payload = {
      userId: refreshToken.user._id,
      email: refreshToken.user.email,
      role: refreshToken.user.role,
      emailVerified: refreshToken.user.emailVerified
    };

    const accessToken = this.generateAccessToken(payload);

    // Optionally rotate refresh token for enhanced security
    let newRefreshToken = refreshTokenString;
    if (process.env.ROTATE_REFRESH_TOKENS === 'true') {
      // Deactivate old refresh token
      refreshToken.isActive = false;
      await refreshToken.save();
      
      // Generate new refresh token
      newRefreshToken = await this.generateRefreshToken(refreshToken.user._id, deviceInfo);
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.getTokenExpiration(),
      user: refreshToken.user
    };
  }

  // Revoke refresh token
  async revokeRefreshToken(token) {
    const refreshToken = await RefreshToken.findOne({ token });
    if (refreshToken) {
      refreshToken.isActive = false;
      await refreshToken.save();
    }
  }

  // Revoke all refresh tokens for a user
  async revokeAllUserTokens(userId) {
    await RefreshToken.revokeAllUserTokens(userId);
  }

  // Get token expiration time in seconds
  getTokenExpiration() {
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    
    // Convert to seconds
    if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    } else if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 60 * 60;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 24 * 60 * 60;
    } else {
      return parseInt(expiresIn);
    }
  }

  // Extract device type from user agent
  getDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  // Decode token without verification (for expired tokens)
  decodeToken(token) {
    return jwt.decode(token);
  }

  // Check if token is expired
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  // Get token payload without verification
  getTokenPayload(token) {
    try {
      return this.decodeToken(token);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new JWTService();
