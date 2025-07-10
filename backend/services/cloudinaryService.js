const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  if (!cloud_name || !api_key || !api_secret) {
    console.error('Missing Cloudinary configuration. Please check your environment variables.');
    return false;
  }
  return true;
};

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = validateCloudinaryConfig();

// Configure storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mern-blog/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    format: 'webp',
    resource_type: 'image'
  }
});

// Configure storage for post images
const postImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mern-blog/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    format: 'webp',
    resource_type: 'image'
  }
});

// Create multer upload instances with error handling
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      return cb(new Error('Image upload service is not properly configured'), false);
    }
    
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    
    cb(null, true);
  }
});

const uploadPostImage = multer({
  storage: postImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      return cb(new Error('Image upload service is not properly configured'), false);
    }
    
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    
    cb(null, true);
  }
});

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise} - The result of the deletion
 */
const deleteImage = async (publicId) => {
  if (!publicId) return null;
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - The Cloudinary URL
 * @returns {string|null} - The public ID or null if not found
 */
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Extract the public ID from the URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
    const regex = /\/v\d+\/(.+)\./;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadPostImage,
  deleteImage,
  getPublicIdFromUrl,
  isCloudinaryConfigured
};