import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet-async'
import { HiOutlineDocumentText, HiOutlineBookmark, HiOutlineHeart, HiPencil, HiTrash, HiEye, HiRefresh } from 'react-icons/hi'

// Services
import userService from '@services/userService'
import { formatDate, formatNumber } from '@utils/helpers'

// Components
import ProfileHeader from '@components/profile/ProfileHeader'
import AvatarUpload from '@components/profile/AvatarUpload'
import ProfileEdit from '@components/profile/ProfileEdit'
import GlassmorphicCard from '@components/ui/GlassmorphicCard'
import SkeletonLoader, { SkeletonProfile, SkeletonPostCard } from '@components/ui/SkeletonLoader'
import PostCard from '@components/ui/PostCard'
import PageTransition, { FadeTransition } from '@components/ui/PageTransition'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

// Redux actions
import { fetchUserPosts, deletePost } from '@store/slices/postsSlice'

const Profile = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user: currentUser, isAuthenticated } = useSelector((state) => state.auth)
  const { userPosts, loading: postsLoading } = useSelector((state) => state.posts)

  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [stats, setStats] = useState({
    totalPosts: 0,
    published: 0,
    drafts: 0,
    views: 0,
    likes: 0
  })

  const isOwnProfile = isAuthenticated && currentUser?.username === username

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await userService.getUserProfile(username)
        setProfileData(response)
      } catch (error) {
        console.error('Error fetching profile:', error)
        setError(error.response?.data?.message || 'Failed to load profile')
        if (error.response?.status === 404) {
          navigate('/404')
        }
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username, navigate])

  // Fetch user posts if it's the current user's profile
  useEffect(() => {
    if (isOwnProfile && currentUser?._id) {
      dispatch(fetchUserPosts({ userId: currentUser._id }));
    }
  }, [dispatch, currentUser, isOwnProfile]);

  // Calculate stats when userPosts change
  useEffect(() => {
    if (isOwnProfile && userPosts.length > 0) {
      const published = userPosts.filter(post => post.status === 'published').length;
      const drafts = userPosts.filter(post => post.status === 'draft').length;
      const totalViews = userPosts.reduce((acc, post) => acc + post.views, 0);
      const totalLikes = userPosts.reduce((acc, post) => acc + (post.likes?.length || 0), 0);
      
      setStats({
        totalPosts: userPosts.length,
        published,
        drafts,
        views: totalViews,
        likes: totalLikes
      });
    }
  }, [userPosts, isOwnProfile]);

  // Handle profile update
  const handleProfileUpdate = async (profileData) => {
    try {
      await userService.updateProfile(profileData)
      toast.success('Profile updated successfully')
      // Refresh profile data
      const response = await userService.getUserProfile(username)
      setProfileData(response)
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (avatarUrl) => {
    try {
      // Update the user in the Redux store if needed
      // dispatch(updateUserAvatar(avatarUrl));
      
      toast.success('Avatar updated successfully');
      
      // Refresh profile data
      const response = await userService.getUserProfile(username);
      setProfileData(response);
      setShowAvatarModal(false);
      
      // Force refresh to ensure new avatar is displayed
      window.location.reload();
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
    }
  }

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    setIsDeleting(true);
    try {
      await dispatch(deletePost(postId)).unwrap();
      toast.success('Post deleted successfully');
      setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle refresh posts
  const handleRefreshPosts = () => {
    if (currentUser?._id) {
      dispatch(fetchUserPosts({ userId: currentUser._id }));
      toast.success('Posts refreshed');
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <SkeletonProfile />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <SkeletonPostCard key={index} />
            ))}
          </div>
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-12">
          <GlassmorphicCard className="p-8 max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
              Profile Not Found
            </h1>
            <p className="text-secondary-600 dark:text-secondary-300 mb-6">
              {error}
            </p>
            <Button onClick={() => navigate('/')} variant="primary">
              Go Home
            </Button>
          </GlassmorphicCard>
        </div>
      </PageTransition>
    )
  }

  const { user, recentPosts } = profileData || { user: {}, recentPosts: [] }

  return (
    <PageTransition>
      <Helmet>
        <title>{`${user.firstName} ${user.lastName} (@${user.username}) - MERN Blog Platform`}</title>
        <meta name="description" content={user.bio || `Profile of ${user.firstName} ${user.lastName}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
        {/* Profile Header */}
        <ProfileHeader 
          profile={profileData}
          isOwnProfile={isOwnProfile} 
          onEditProfile={() => setShowEditModal(true)}
          onAvatarClick={() => isOwnProfile && setShowAvatarModal(true)}
        />

        {/* Stats Section */}
        <div className="bg-white dark:bg-secondary-800 border-t border-gray-200 dark:border-secondary-700">
          <div className="container-custom py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {formatNumber(user.stats?.totalPosts || 0)}
                </div>
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  Posts
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {formatNumber(user.stats?.totalViews || 0)}
                </div>
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  Views
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {formatNumber(user.stats?.totalLikes || 0)}
                </div>
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  Likes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {formatDate(user.createdAt, 'yyyy')}
                </div>
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  Member Since
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="container-custom py-8">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-secondary-700">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'posts'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300'
                  }`}
                >
                  Posts ({user.stats?.totalPosts || 0})
                </button>
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'manage'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300'
                    }`}
                  >
                    Manage Posts
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('about')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'about'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300'
                  }`}
                >
                  About
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'posts' && (
                <div>
                  {recentPosts && recentPosts.length > 0 ? (
                    <div className="space-y-6">
                      {recentPosts.map((post) => (
                        <PostCard key={post._id} post={post} />
                      ))}

                      {user.stats?.totalPosts > recentPosts.length && (
                        <div className="text-center pt-6">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/blog?author=${user.username}`)}
                          >
                            View All Posts ({user.stats.totalPosts})
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-secondary-400 dark:text-secondary-500 mb-4">
                        <HiPencil className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                        No posts yet
                      </h3>
                      <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                        {isOwnProfile
                          ? "You haven't written any posts yet. Start sharing your thoughts!"
                          : `${user.firstName} hasn't written any posts yet.`}
                      </p>
                      {isOwnProfile && (
                        <Button
                          variant="primary"
                          onClick={() => navigate('/create-post')}
                        >
                          Create Your First Post
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'manage' && isOwnProfile && (
                <div>
                  {/* Stats Cards for own profile */}
                  {userPosts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <GlassmorphicCard className="p-4">
                        <div className="flex flex-col items-center">
                          <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                            Total Posts
                          </h3>
                          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                            {stats.totalPosts}
                          </p>
                        </div>
                      </GlassmorphicCard>
                      
                      <GlassmorphicCard className="p-4">
                        <div className="flex flex-col items-center">
                          <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                            Published
                          </h3>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {stats.published}
                          </p>
                        </div>
                      </GlassmorphicCard>
                      
                      <GlassmorphicCard className="p-4">
                        <div className="flex flex-col items-center">
                          <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                            Drafts
                          </h3>
                          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                            {stats.drafts}
                          </p>
                        </div>
                      </GlassmorphicCard>
                      
                      <GlassmorphicCard className="p-4">
                        <div className="flex flex-col items-center">
                          <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                            Total Views
                          </h3>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.views}
                          </p>
                        </div>
                      </GlassmorphicCard>
                    </div>
                  )}
                  
                  {/* Posts Management Table */}
                  <GlassmorphicCard>
                    <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
                        Manage Your Posts
                      </h2>
                      <div className="flex space-x-2">
                        <Button 
                          variant="text" 
                          onClick={handleRefreshPosts} 
                          icon={<HiRefresh />}
                          disabled={postsLoading}
                        >
                          Refresh
                        </Button>
                        <Button 
                          variant="primary"
                          onClick={() => navigate('/create-post')}
                          icon={<HiPencil />}
                        >
                          New Post
                        </Button>
                      </div>
                    </div>

                    {postsLoading ? (
                      <div className="p-4">
                        <SkeletonLoader count={5} height="60px" className="mb-4" />
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="p-8 text-center">
                        <HiOutlineDocumentText className="mx-auto h-12 w-12 text-secondary-400" />
                        <h3 className="mt-2 text-lg font-medium text-secondary-900 dark:text-white">
                          No posts yet
                        </h3>
                        <p className="mt-1 text-secondary-500 dark:text-secondary-400">
                          Get started by creating a new post
                        </p>
                        <div className="mt-6">
                          <Button 
                            onClick={() => navigate('/create-post')}
                            variant="primary" 
                            size="sm"
                          >
                            Create New Post
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                          <thead className="bg-secondary-50 dark:bg-secondary-800">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                                Title
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                                Published
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                                Views
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                            {userPosts.map((post) => (
                              <tr key={post._id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-secondary-900 dark:text-white">
                                    {post.title}
                                  </div>
                                  <div className="text-sm text-secondary-500 dark:text-secondary-400">
                                    {post.category}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    post.status === 'published' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                      : post.status === 'draft'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                                  {post.publishedAt ? formatDate(post.publishedAt, 'MMM dd, yyyy') : 'Not published'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                                  {post.views}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex space-x-2 justify-end">
                                    <Button 
                                      onClick={() => navigate(`/blog/${post.slug}`)}
                                      variant="text"
                                      size="xs"
                                      icon={<HiEye />}
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      onClick={() => navigate(`/edit-post/${post._id}`)}
                                      variant="text"
                                      size="xs"
                                      icon={<HiPencil />}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="text"
                                      size="xs"
                                      icon={<HiTrash />}
                                      onClick={() => setSelectedPost(post)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-300"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </GlassmorphicCard>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="max-w-2xl mx-auto">
                  {/* Bio */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-3">
                      Bio
                    </h3>
                    {user.bio ? (
                      <p className="text-secondary-600 dark:text-secondary-300 whitespace-pre-line">
                        {user.bio}
                      </p>
                    ) : (
                      <p className="text-secondary-500 dark:text-secondary-400 italic">
                        {isOwnProfile
                          ? "You haven't added a bio yet. Edit your profile to add one."
                          : `${user.firstName} hasn't added a bio yet.`}
                      </p>
                    )}
                  </div>

                  {/* Social Links */}
                  {(user.socialLinks?.twitter || user.socialLinks?.linkedin || 
                    user.socialLinks?.github || user.socialLinks?.website) && (
                    <div>
                      <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-3">
                        Connect
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {user.socialLinks?.twitter && (
                          <a
                            href={user.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-secondary-600 hover:text-primary-500 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                          >
                            <span className="mr-2">Twitter</span>
                          </a>
                        )}
                        {user.socialLinks?.linkedin && (
                          <a
                            href={user.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-secondary-600 hover:text-primary-500 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                          >
                            <span className="mr-2">LinkedIn</span>
                          </a>
                        )}
                        {user.socialLinks?.github && (
                          <a
                            href={user.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-secondary-600 hover:text-primary-500 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                          >
                            <span className="mr-2">GitHub</span>
                          </a>
                        )}
                        {user.socialLinks?.website && (
                          <a
                            href={user.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-secondary-600 hover:text-primary-500 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                          >
                            <span className="mr-2">Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <ProfileEdit 
            onClose={() => setShowEditModal(false)} 
            userData={user}
            onSubmit={handleProfileUpdate} 
          />
        )}

        {/* Avatar Upload Modal */}
        {showAvatarModal && (
          <AvatarUpload 
            onClose={() => setShowAvatarModal(false)}
            userId={currentUser?._id}
            currentAvatar={user.avatar} 
            onUpload={handleAvatarUpload} 
          />
        )}

        {/* Delete Confirmation Modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                Delete Post
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                Are you sure you want to delete "{selectedPost.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedPost(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleDeletePost(selectedPost._id)}
                  loading={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

export default Profile
