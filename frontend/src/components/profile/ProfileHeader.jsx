import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { HiPencil, HiCamera } from 'react-icons/hi';
import { FaTwitter, FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa';
import GlassmorphicCard from '@components/ui/GlassmorphicCard';
import { SlideTransition } from '@components/ui/PageTransition';
import AvatarUpload from '@components/profile/AvatarUpload';

/**
 * ProfileHeader component for displaying user profile information
 * @param {Object} props - Component props
 * @returns {JSX.Element} ProfileHeader component
 */
const ProfileHeader = ({ profile, isOwnProfile, onEditProfile, onAvatarClick }) => {
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  if (!profile || !profile.user) {
    return null;
  }
  
  const { user } = profile;
  
  // Default avatar if none is provided
  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`;
  
  // Social media links
  const socialLinks = user?.socialLinks || {};
  
  // Handle avatar upload modal
  const handleAvatarUploadClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAvatarClick) {
      onAvatarClick();
    } else {
      setShowAvatarUpload(true);
    }
  };
  
  const handleAvatarUploadClose = () => {
    setShowAvatarUpload(false);
  };
  
  // Handle successful avatar upload
  const handleAvatarUploaded = async (newAvatarUrl) => {
    // Refresh the page or update the user data
    window.location.reload();
  };
  
  return (
    <SlideTransition direction="down">
      <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 dark:from-primary-900/20 dark:to-secondary-900/20 py-8">
        <GlassmorphicCard className="container-custom p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar section */}
          <div className="relative">
            <motion.div 
              className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-secondary-700 shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img 
                src={avatarUrl} 
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-full h-full object-cover"
              />
              
              {/* Edit avatar button (only for own profile) */}
              {isOwnProfile && (
                <button
                  onClick={handleAvatarUploadClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  aria-label="Change profile picture"
                  type="button"
                >
                  <HiCamera className="w-8 h-8 text-white" />
                </button>
              )}
            </motion.div>
            
            {/* Click area for better mobile UX */}
            {isOwnProfile && (
              <button
                onClick={handleAvatarUploadClick}
                className="absolute -bottom-2 -right-2 bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full shadow-lg"
                aria-label="Change profile picture"
                type="button"
              >
                <HiCamera className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Profile info section */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
              </h1>
              
              {/* Edit profile button (only for own profile) */}
              {isOwnProfile && (
                <motion.button
                  onClick={onEditProfile}
                  className="mt-2 md:mt-0 inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow-md transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <HiPencil className="mr-2" />
                  Edit Profile
                </motion.button>
              )}
            </div>
            
            <p className="text-lg text-secondary-600 dark:text-secondary-300 mb-4">
                @{user?.username}
            </p>
            
            {/* Bio */}
              {user?.bio && (
              <p className="text-secondary-700 dark:text-secondary-200 mb-6 max-w-2xl">
                  {user?.bio}
              </p>
            )}
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/50 dark:bg-secondary-800/50 rounded-lg p-3 shadow-sm">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {user?.stats?.totalPosts || 0}
                </p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Posts</p>
              </div>
              
              <div className="bg-white/50 dark:bg-secondary-800/50 rounded-lg p-3 shadow-sm">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {user?.stats?.totalViews || 0}
                </p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Views</p>
              </div>
            </div>
            
            {/* Social links */}
            {(socialLinks.twitter || socialLinks.linkedin || socialLinks.github || socialLinks.website) && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.twitter && (
                  <a 
                    href={socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-secondary-600 hover:text-primary-500 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors duration-300"
                  >
                    <FaTwitter className="mr-2" />
                    Twitter
                  </a>
                )}
                
                {socialLinks.linkedin && (
                  <a 
                    href={socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-secondary-600 hover:text-primary-500 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors duration-300"
                  >
                    <FaLinkedin className="mr-2" />
                    LinkedIn
                  </a>
                )}
                
                {socialLinks.github && (
                  <a 
                    href={socialLinks.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-secondary-600 hover:text-primary-500 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors duration-300"
                  >
                    <FaGithub className="mr-2" />
                    GitHub
                  </a>
                )}
                
                {socialLinks.website && (
                  <a 
                    href={socialLinks.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-secondary-600 hover:text-primary-500 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors duration-300"
                  >
                    <FaGlobe className="mr-2" />
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Avatar upload modal */}
        {showAvatarUpload && (
          <AvatarUpload 
            onClose={handleAvatarUploadClose} 
            userId={currentUser?._id}
            currentAvatar={avatarUrl}
            onUpload={handleAvatarUploaded}
          />
        )}
      </GlassmorphicCard>
      </div>
    </SlideTransition>
  );
};

export default ProfileHeader;