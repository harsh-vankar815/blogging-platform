import { useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { HiX, HiUpload, HiCheck, HiExclamation, HiPhotograph } from 'react-icons/hi';
import userService from '@services/userService';
import toast from 'react-hot-toast';

/**
 * AvatarUpload component for uploading profile pictures
 * @param {Object} props - Component props
 * @returns {JSX.Element} AvatarUpload component
 */
const AvatarUpload = ({ onClose, userId, currentAvatar, onUpload }) => {
  const dispatch = useDispatch();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [preview, setPreview] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setError(null);
      setUploadedImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  }, []);

  // Handle manual file selection
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setError(null);
      setUploadedImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': []
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    noClick: true, // Disable built-in click handling
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File is too large. Maximum size is 5MB.');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload an image file.');
      } else {
        setError('There was an error with your upload. Please try again.');
      }
    }
  });

  // Handle avatar upload
  const handleUpload = async () => {
    if (!uploadedImage) {
      setError('Please select an image to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create form data
      const formData = new FormData();
      formData.append('avatar', uploadedImage);

      console.log('Uploading file:', uploadedImage.name, uploadedImage.type, uploadedImage.size);

      // Upload the avatar - using the simpler uploadAvatar method
      const response = await userService.uploadAvatar(formData);
      
      // Check response
      if (response && response.avatar) {
        // Call onUpload callback if provided
        if (typeof onUpload === 'function') {
          onUpload(response.avatar);
        }
        
        toast.success('Profile picture updated successfully!');
        onClose();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  // Backdrop animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
          variants={modalVariants}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Update Profile Picture</h2>
            <button
              onClick={onClose}
              className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
              aria-label="Close"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Preview */}
            <div className="mb-6 flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-secondary-700 shadow-lg">
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Direct file input (hidden) */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
            />

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-secondary-300 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-600'}`}
              onClick={handleFileSelect}
            >
              <HiUpload className="w-10 h-10 mx-auto mb-2 text-secondary-400 dark:text-secondary-500" />
              <p className="text-secondary-700 dark:text-secondary-300">
                {isDragActive
                  ? 'Drop the image here...'
                  : 'Drag & drop an image here, or click to select'}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                Supported formats: JPG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>

            {/* Alternative upload button */}
            <div className="mt-4 text-center">
              <button
                onClick={handleFileSelect}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                type="button"
              >
                <HiPhotograph className="w-5 h-5 mr-2" />
                Select from your device
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-start">
                <HiExclamation className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <motion.button
              onClick={handleUpload}
              className={`px-4 py-2 ${!uploadedImage ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'} text-white rounded-lg shadow-md transition-colors flex items-center`}
              disabled={uploading || !uploadedImage}
              whileHover={uploadedImage ? { scale: 1.05 } : {}}
              whileTap={uploadedImage ? { scale: 0.95 } : {}}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <HiCheck className="mr-2" />
                  Save Changes
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarUpload;