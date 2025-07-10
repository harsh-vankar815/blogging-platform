/**
 * Script to test comment like and dislike functionality
 * Run with: node scripts/testCommentReactions.js
 */

const mongoose = require('mongoose');
const Comment = require('../models/Comment');
require('dotenv').config();

// Get MongoDB connection string from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogging_platform';

// Test user IDs
const testUsers = [
  new mongoose.Types.ObjectId(), // user1
  new mongoose.Types.ObjectId(), // user2
  new mongoose.Types.ObjectId()  // user3
];

async function testCommentReactions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get a comment to test with
    const comment = await Comment.findOne();
    
    if (!comment) {
      console.log('No comments found in the database');
      return;
    }
    
    console.log(`Testing with comment ID: ${comment._id}`);
    console.log(`Initial state: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);

    // Test 1: User 1 likes the comment
    console.log('\nTest 1: User 1 likes the comment');
    await comment.like(testUsers[0]);
    console.log(`After Test 1: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);
    
    // Test 2: User 2 dislikes the comment
    console.log('\nTest 2: User 2 dislikes the comment');
    await comment.dislike(testUsers[1]);
    console.log(`After Test 2: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);
    
    // Test 3: User 3 both likes and dislikes the comment
    console.log('\nTest 3: User 3 both likes and dislikes the comment');
    await comment.like(testUsers[2]);
    await comment.dislike(testUsers[2]);
    console.log(`After Test 3: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);
    
    // Test 4: User 1 unlikes the comment
    console.log('\nTest 4: User 1 unlikes the comment');
    await comment.like(testUsers[0]);
    console.log(`After Test 4: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);
    
    // Test 5: User 2 undislikes the comment
    console.log('\nTest 5: User 2 undislikes the comment');
    await comment.dislike(testUsers[1]);
    console.log(`After Test 5: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);

    // Final check
    console.log('\nFinal state of comment reactions:');
    console.log(`Likes: ${comment.likes.length}`);
    comment.likes.forEach((like, i) => {
      console.log(`  Like ${i+1}: User ${like.user}`);
    });
    
    console.log(`Dislikes: ${comment.dislikes.length}`);
    comment.dislikes.forEach((dislike, i) => {
      console.log(`  Dislike ${i+1}: User ${dislike.user}`);
    });

    // Reset the comment to empty likes and dislikes
    console.log('\nResetting comment to empty likes and dislikes');
    comment.likes = [];
    comment.dislikes = [];
    await comment.save();
    console.log(`After reset: likes=${comment.likes.length}, dislikes=${comment.dislikes.length}`);

  } catch (error) {
    console.error('Error testing comment reactions:', error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
testCommentReactions(); 