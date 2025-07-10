/**
 * Script to reset all comment likes and dislikes to empty arrays
 * Run with: node scripts/resetCommentReactions.js
 */

const mongoose = require('mongoose');
const Comment = require('../models/Comment');
require('dotenv').config();

// Get MongoDB connection string from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogging_platform';

async function resetCommentReactions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get total comment count
    const totalComments = await Comment.countDocuments();
    console.log(`Found ${totalComments} comments in the database`);

    // Reset all comments' likes and dislikes to empty arrays
    const result = await Comment.updateMany(
      {}, // Match all documents
      { $set: { likes: [], dislikes: [] } } // Reset likes and dislikes
    );

    console.log(`Reset likes and dislikes for ${result.modifiedCount} comments`);
    console.log('Operation completed successfully');

    // Verify the reset
    const sampleComments = await Comment.find().limit(5);
    console.log('Sample comments after reset:');
    sampleComments.forEach(comment => {
      console.log(`Comment ID: ${comment._id}, Likes: ${comment.likes.length}, Dislikes: ${comment.dislikes.length}`);
    });

  } catch (error) {
    console.error('Error resetting comment reactions:', error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
resetCommentReactions(); 