const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Ensure environment variables are loaded
require('dotenv').config();

// JWT Strategy for API authentication
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback-secret-key',
  issuer: 'mern-blog',
  audience: 'mern-blog-users'
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId).select('-password');
    
    if (!user) {
      return done(null, false);
    }

    // Check if user account is active
    if (!user.isActive) {
      return done(null, false);
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(payload.iat)) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      // User exists, return user
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.provider = 'google';
      user.emailVerified = true; // Google emails are pre-verified
      user.avatar = user.avatar || profile.photos[0]?.value;
      await user.save();
      return done(null, user);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      provider: 'google',
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      username: await generateUniqueUsername(profile.name.givenName, profile.name.familyName),
      avatar: profile.photos[0]?.value || '',
      emailVerified: true, // Google emails are pre-verified
      isActive: true
    });

    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
  }));
}

// Helper function to generate unique username
async function generateUniqueUsername(firstName, lastName) {
  const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
