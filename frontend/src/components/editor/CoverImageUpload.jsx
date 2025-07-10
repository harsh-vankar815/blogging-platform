import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX } from 'react-icons/fi';
import api from '@services/api';

const CoverImageUpload = ({ value, onChange, error }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/post-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // The backend returns { url, publicId }
      if (!response || typeof response.url !== 'string') {
        console.error('Invalid response:', response);
        throw new Error('Invalid response from server');
      }

      onChange(response.url);
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError(error.response?.data?.message || error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
  });

  const removeCoverImage = () => {
    onChange('');
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Cover Image
      </label>

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Cover preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={removeCoverImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
            title="Remove image"
          >
            <FiX size={20} />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-700'}
            ${error ? 'border-red-500' : ''}
            hover:border-primary-500 dark:hover:border-primary-500`}
        >
          <input {...getInputProps()} />
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isDragActive
              ? "Drop the image here..."
              : "Drag & drop an image here, or click to select"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            PNG, JPG, WEBP up to 10MB
          </p>
          {uploading && (
            <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
              Uploading...
            </p>
          )}
        </div>
      )}

      {(error || uploadError) && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-500">
          {error || uploadError}
        </p>
      )}
    </div>
  );
};

export default CoverImageUpload; 