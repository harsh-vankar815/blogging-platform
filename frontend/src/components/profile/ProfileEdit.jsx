import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { HiX, HiCheck, HiExclamation } from 'react-icons/hi';
import { FaTwitter, FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa';
import userService from '@services/userService';
import toast from 'react-hot-toast';

/**
 * ProfileEdit component for editing user profile information
 * @param {Object} props - Component props
 * @returns {JSX.Element} ProfileEdit component
 */
const ProfileEdit = ({ onClose, userData }) => {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with user data
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      bio: userData?.bio || '',
      'socialLinks.twitter': userData?.socialLinks?.twitter || '',
      'socialLinks.linkedin': userData?.socialLinks?.linkedin || '',
      'socialLinks.github': userData?.socialLinks?.github || '',
      'socialLinks.website': userData?.socialLinks?.website || ''
    }
  });

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);

      // Update profile
      const response = await userService.updateProfile(data);

      // Update user in Redux store
      // Note: This would depend on your actual Redux implementation
      // dispatch(updateUserProfile(response.user));

      toast.success('Profile updated successfully!');
      onClose(response.user); // Pass updated user data back to parent
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
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
          className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden"
          variants={modalVariants}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
              aria-label="Close"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500 dark:border-red-700' : 'border-secondary-300 dark:border-secondary-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white`}
                      {...register('firstName', { required: 'First name is required' })}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500 dark:border-red-700' : 'border-secondary-300 dark:border-secondary-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white`}
                      {...register('lastName', { required: 'Last name is required' })}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows="4"
                  className={`w-full px-3 py-2 border ${errors.bio ? 'border-red-500 dark:border-red-700' : 'border-secondary-300 dark:border-secondary-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white`}
                  placeholder="Tell us about yourself..."
                  {...register('bio', { maxLength: { value: 500, message: 'Bio cannot exceed 500 characters' } })}
                />
                <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                  {errors.bio ? errors.bio.message : 'Max 500 characters'}
                </p>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">Social Links</h3>
                <div className="space-y-4">
                  {/* Twitter */}
                  <div className="flex items-center">
                    <div className="w-10 flex-shrink-0">
                      <FaTwitter className="w-5 h-5 text-[#1DA1F2] mx-auto" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="Twitter URL"
                        className={`w-full px-3 py-2 border ${errors['socialLinks.twitter'] ? 'border-red-500 dark:border-red-700' : 'border-secondary-300 dark:border-secondary-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white`}
                        {...register('socialLinks.twitter', {
                          pattern: {
                            value: /^(https?:\/\/)?(www\.)?twitter\.com\/.+/i,
                            message: 'Please enter a valid Twitter URL'
                          }
                        })}
                      />
                      {errors['socialLinks.twitter'] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['socialLinks.twitter'].message}</p>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="flex items-center">
                    <div className="w-10 flex-shrink-0">
                      <FaLinkedin className="w-5 h-5 text-[#0077B5] mx-auto" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="LinkedIn URL"
                        className={`w-full px-3 py-2 border ${errors['socialLinks.linkedin'] ? 'border-red-500 dark:border-red-700' : 'border-secondary-300 dark:border-secondary-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white`}
                        {...register('socialLinks.linkedin', {
                          pattern: {
                            value: /^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i,
                            message: 'Please enter a valid LinkedIn URL'
                          }
                        })}
                      />
                      {errors['socialLinks.linkedin'] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['socialLinks.linkedin'].message}</p>
                      )}
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="flex items-center">
                    <div className="w-10 flex-shrink-0">
                      <FaGithub className="w-5 h-5 text-secondary-800 dark:text-secondary-200 mx-auto" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="GitHub URL"
                        className={`w-full px-3 py-2 border ${errors['socialLinks.github'] ? 'border-red-500 dark:border-red-700' : 'border-secondary-300 dark:border-secondary-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white`}
                        {...register('socialLinks.github', {
                          pattern: {
                            value: /^(https?:\/\/)?(www\.)?github\.com\/.+/i,
                            message: 'Please enter a valid GitHub URL'
                          }
                        })}
                      />
                      {errors['socialLinks.github'] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['socialLinks.github'].message}</p>
                      )}
                    </div>
                  </div>

                  {/* Website */}
                  <div className="flex items-center">
                    <div className="w-10 flex-shrink-0">
                      <FaGlobe className="w-5 h-5 text-secondary-600 dark:text-secondary-400 mx-auto" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="Website URL"
                        className={`w-full px-3 py-2 border ${errors['socialLinks.website'] ? 'border-red-500 dark:border-red-700' : 'border-secondary-300 dark:border-secondary-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white`}
                        {...register('socialLinks.website', {
                          pattern: {
                            value: /^(https?:\/\/)?(www\.)?[\w.-]+\.[a-z]{2,}(\/.+)?$/i,
                            message: 'Please enter a valid URL'
                          }
                        })}
                      />
                      {errors['socialLinks.website'] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors['socialLinks.website'].message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-start">
                  <HiExclamation className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow-md transition-colors flex items-center"
                disabled={submitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <HiCheck className="mr-2" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileEdit;