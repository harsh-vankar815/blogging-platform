import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { HiUsers, HiDocumentText, HiChat, HiChartBar, HiExclamationCircle } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

// Components
import PageTransition from '@components/ui/PageTransition';
import GlassmorphicCard from '@components/ui/GlassmorphicCard';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import { RequireAdmin } from '@components/auth/PermissionGate';
import AdminLayout from '@components/layout/AdminLayout';

// Utils
import { APP_CONFIG } from '@utils/constants';
import { formatDate } from '@utils/helpers';

const API_URL = APP_CONFIG.API_URL;

const AdminDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [token]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <GlassmorphicCard className="p-8 text-center">
            <HiExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error Loading Dashboard</h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              Try Again
            </button>
          </GlassmorphicCard>
        </div>
      </AdminLayout>
    );
  }

  return (
    <RequireAdmin>
      <AdminLayout>
        <PageTransition>
          <Helmet>
            <title>Admin Dashboard - MERN Blog Platform</title>
            <meta name="description" content="Admin dashboard for managing users, posts, and comments" />
          </Helmet>
          
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-secondary-900 dark:text-white">
              Dashboard Overview
            </h1>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Users Stats */}
              <GlassmorphicCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Users</h2>
                  <HiUsers className="w-8 h-8 text-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.users?.total || 0}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Total</p>
                  </div>
                  <div className="text-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.users?.active || 0}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Active</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <span className="font-semibold text-primary-500">{stats?.users?.newToday || 0}</span> new users today
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/admin/users')}
                  className="w-full mt-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Manage Users
                </motion.button>
              </GlassmorphicCard>
              
              {/* Posts Stats */}
              <GlassmorphicCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Posts</h2>
                  <HiDocumentText className="w-8 h-8 text-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.posts?.total || 0}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Total</p>
                  </div>
                  <div className="text-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.posts?.published || 0}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Published</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <span className="font-semibold text-primary-500">{stats?.posts?.drafts || 0}</span> drafts,
                    <span className="font-semibold text-primary-500 ml-1">{stats?.posts?.newToday || 0}</span> new today
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/admin/posts')}
                  className="w-full mt-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Manage Posts
                </motion.button>
              </GlassmorphicCard>
              
              {/* Comments Stats */}
              <GlassmorphicCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Comments</h2>
                  <HiChat className="w-8 h-8 text-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.comments?.total || 0}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Total</p>
                  </div>
                  <div className="text-center p-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                    <p className="text-2xl font-bold">{stats?.comments?.pendingModeration || 0}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Pending</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    <span className="font-semibold text-primary-500">{stats?.comments?.newToday || 0}</span> new comments today
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/admin/comments')}
                  className="w-full mt-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Moderate Comments
                </motion.button>
              </GlassmorphicCard>
            </div>
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Users */}
              <GlassmorphicCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
                <div className="space-y-4">
                  {stats?.users?.recent?.map(user => (
                    <div key={user._id} className="flex items-center space-x-3">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.users?.recent || stats.users.recent.length === 0) && (
                    <p className="text-center text-secondary-500 dark:text-secondary-400 py-4">
                      No recent users
                    </p>
                  )}
                </div>
              </GlassmorphicCard>
              
              {/* Recent Posts */}
              <GlassmorphicCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
                <div className="space-y-4">
                  {stats?.posts?.recent?.map(post => (
                    <div key={post._id} className="border-b border-secondary-200 dark:border-secondary-700 pb-3 last:border-0">
                      <p className="font-medium">{post.title}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          post.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {post.status}
                        </span>
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!stats?.posts?.recent || stats.posts.recent.length === 0) && (
                    <p className="text-center text-secondary-500 dark:text-secondary-400 py-4">
                      No recent posts
                    </p>
                  )}
                </div>
              </GlassmorphicCard>
              
              {/* Recent Comments */}
              <GlassmorphicCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Comments</h3>
                <div className="space-y-4">
                  {stats?.comments?.recent?.map(comment => (
                    <div key={comment._id} className="border-b border-secondary-200 dark:border-secondary-700 pb-3 last:border-0">
                      <p className="text-sm line-clamp-2">
                        {comment.content}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          comment.needsModeration ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          comment.isApproved ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {comment.needsModeration ? 'Needs Review' : 
                           comment.isApproved ? 'Approved' : 'Rejected'}
                        </span>
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!stats?.comments?.recent || stats.comments.recent.length === 0) && (
                    <p className="text-center text-secondary-500 dark:text-secondary-400 py-4">
                      No recent comments
                    </p>
                  )}
                </div>
              </GlassmorphicCard>
            </div>
          </div>
        </PageTransition>
      </AdminLayout>
    </RequireAdmin>
  );
};

export default AdminDashboard; 