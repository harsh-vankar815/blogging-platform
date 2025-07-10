import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  HiSearch, 
  HiOutlineDocumentText, 
  HiOutlineTrash, 
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineArchive,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

// Components
import PageTransition from '@components/ui/PageTransition';
import GlassmorphicCard from '@components/ui/GlassmorphicCard';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import { RequireAdmin } from '@components/auth/PermissionGate';
import AdminLayout from '@components/layout/AdminLayout';

// Utils
import { APP_CONFIG } from '@utils/constants';
const API_URL = APP_CONFIG.API_URL;
import { formatDate } from '@utils/helpers';

const AdminPostManagement = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0
  });
  const [processingPost, setProcessingPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Fetch posts with pagination, search and filters
  const fetchPosts = async (pageNum = 1, searchQuery = '', status = 'all') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/posts/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pageNum,
          limit: 10,
          search: searchQuery,
          status
        }
      });
      
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to load posts');
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPosts(page, search, statusFilter);
  }, [token, page, statusFilter]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts(1, search, statusFilter);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  // Handle post status change
  const handleStatusChange = async (postId, newStatus) => {
    try {
      setProcessingPost(postId);
      const response = await axios.put(
        `${API_URL}/posts/admin/${postId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update post in the list
      setPosts(posts.map(post => 
        post._id === postId ? { ...post, status: newStatus } : post
      ));
      
      toast.success(response.data.message);
    } catch (err) {
      console.error('Error changing post status:', err);
      toast.error(err.response?.data?.message || 'Failed to update post status');
    } finally {
      setProcessingPost(null);
    }
  };

  // Handle post delete confirmation
  const confirmDelete = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  // Handle post delete
  const handleDelete = async () => {
    if (!postToDelete) return;
    
    try {
      setProcessingPost(postToDelete._id);
      await axios.delete(`${API_URL}/posts/${postToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove post from the list
      setPosts(posts.filter(post => post._id !== postToDelete._id));
      
      toast.success('Post deleted successfully');
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setProcessingPost(null);
    }
  };

  return (
    <RequireAdmin>
      <AdminLayout>
        <PageTransition>
          <Helmet>
            <title>Post Management - Admin Dashboard</title>
            <meta name="description" content="Manage blog posts, approve or delete content" />
          </Helmet>
          
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4 md:mb-0">
                Post Management
              </h1>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="w-full md:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <HiSearch className="absolute left-3 top-2.5 text-secondary-400 dark:text-secondary-500 h-5 w-5" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1.5 bg-primary-500 text-white p-1 rounded-md hover:bg-primary-600"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
            
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => handleStatusFilterChange('all')}
                className={`px-4 py-2 rounded-md ${
                  statusFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                All Posts
              </button>
              <button
                onClick={() => handleStatusFilterChange('published')}
                className={`px-4 py-2 rounded-md ${
                  statusFilter === 'published'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => handleStatusFilterChange('draft')}
                className={`px-4 py-2 rounded-md ${
                  statusFilter === 'draft'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                Drafts
              </button>
              <button
                onClick={() => handleStatusFilterChange('archived')}
                className={`px-4 py-2 rounded-md ${
                  statusFilter === 'archived'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                Archived
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <GlassmorphicCard className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => fetchPosts(page, search, statusFilter)}
                  className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  <HiOutlineRefresh className="h-5 w-5" />
                  <span>Try Again</span>
                </button>
              </GlassmorphicCard>
            ) : (
              <>
                {/* Posts Table */}
                <GlassmorphicCard className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                      <thead className="bg-secondary-50 dark:bg-secondary-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Post
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Author
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                        {posts.map((post) => (
                          <tr key={post._id}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {post.featuredImage ? (
                                    <img 
                                      className="h-10 w-10 rounded object-cover" 
                                      src={post.featuredImage} 
                                      alt={post.title} 
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                                      <HiOutlineDocumentText className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-secondary-900 dark:text-white">
                                    {post.title}
                                  </div>
                                  <div className="text-xs text-secondary-500 dark:text-secondary-400">
                                    {post.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img 
                                  className="h-6 w-6 rounded-full mr-2" 
                                  src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.firstName}+${post.author.lastName}&background=random`} 
                                  alt={`${post.author.firstName} ${post.author.lastName}`} 
                                />
                                <span className="text-sm text-secondary-900 dark:text-white">
                                  {post.author.firstName} {post.author.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                post.status === 'published' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : post.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {post.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                              {formatDate(post.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                {/* View Post */}
                                <Link to={`/blog/${post.slug}`} target="_blank">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                                    title="View Post"
                                  >
                                    <HiOutlineEye className="h-5 w-5" />
                                  </motion.button>
                                </Link>
                                
                                {/* Publish/Unpublish */}
                                {post.status !== 'published' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(post._id, 'published')}
                                    disabled={processingPost === post._id}
                                    className={`p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 ${
                                      processingPost === post._id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Publish Post"
                                  >
                                    <HiOutlineCheck className="h-5 w-5" />
                                  </motion.button>
                                )}
                                
                                {/* Draft */}
                                {post.status !== 'draft' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(post._id, 'draft')}
                                    disabled={processingPost === post._id}
                                    className={`p-1 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800 ${
                                      processingPost === post._id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Set as Draft"
                                  >
                                    <HiOutlineX className="h-5 w-5" />
                                  </motion.button>
                                )}
                                
                                {/* Archive */}
                                {post.status !== 'archived' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(post._id, 'archived')}
                                    disabled={processingPost === post._id}
                                    className={`p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${
                                      processingPost === post._id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Archive Post"
                                  >
                                    <HiOutlineArchive className="h-5 w-5" />
                                  </motion.button>
                                )}
                                
                                {/* Delete */}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => confirmDelete(post)}
                                  disabled={processingPost === post._id}
                                  className={`p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 ${
                                    processingPost === post._id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title="Delete Post"
                                >
                                  <HiOutlineTrash className="h-5 w-5" />
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {posts.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-10 text-center text-secondary-500 dark:text-secondary-400">
                              {search ? 'No posts found matching your search.' : 'No posts found.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassmorphicCard>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      Showing {posts.length} of {pagination.totalPosts} posts
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`p-2 rounded-md ${
                          page === 1
                            ? 'bg-secondary-100 text-secondary-400 dark:bg-secondary-800 dark:text-secondary-600 cursor-not-allowed'
                            : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                        }`}
                      >
                        <HiOutlineChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1 rounded-md ${
                            pageNum === page
                              ? 'bg-primary-500 text-white'
                              : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                        disabled={page === pagination.totalPages}
                        className={`p-2 rounded-md ${
                          page === pagination.totalPages
                            ? 'bg-secondary-100 text-secondary-400 dark:bg-secondary-800 dark:text-secondary-600 cursor-not-allowed'
                            : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                        }`}
                      >
                        <HiOutlineChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4"
                >
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    Delete Post
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                    Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button 
                      className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setPostToDelete(null);
                      }}
                      disabled={processingPost === postToDelete?._id}
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      onClick={handleDelete}
                      disabled={processingPost === postToDelete?._id}
                    >
                      {processingPost === postToDelete?._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </PageTransition>
      </AdminLayout>
    </RequireAdmin>
  );
};

export default AdminPostManagement; 