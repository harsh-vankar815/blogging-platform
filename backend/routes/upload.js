const express = require('express');
const { authenticateToken } = require('../middleware');
const { uploadPostImage, deleteImage, getPublicIdFromUrl, isCloudinaryConfigured } = require('../services/cloudinaryService');

const router = express.Router();

// Custom error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ message: err.message || 'Error uploading file' });
  }
  next();
};

// @route   POST /api/upload/post-image
// @desc    Upload a post image to Cloudinary
// @access  Private
router.post('/post-image', authenticateToken, (req, res, next) => {
  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured) {
    return res.status(500).json({ message: 'Image upload service is not properly configured' });
  }
  
  // Use multer upload
  uploadPostImage.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: err.message || 'Error uploading file' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Return the Cloudinary URL
    res.status(200).json({
      url: req.file.path,
      publicId: req.file.filename
    });
  });
});

// @route   DELETE /api/upload/delete-image
// @desc    Delete an image from Cloudinary
// @access  Private
router.delete('/delete-image', authenticateToken, async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      return res.status(500).json({ message: 'Image upload service is not properly configured' });
    }
    
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Image URL is required' });
    }
    
    const publicId = getPublicIdFromUrl(url);
    
    if (!publicId) {
      return res.status(400).json({ message: 'Invalid image URL' });
    }
    
    const result = await deleteImage(publicId);
    
    res.status(200).json({
      message: 'Image deleted successfully',
      result
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router; 