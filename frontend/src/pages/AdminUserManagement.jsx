import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  HiSearch, 
  HiOutlineUserCircle, 
  HiOutlineBan, 
  HiOutlineShieldCheck, 
  HiOutlineShieldExclamation,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi';
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

const AdminUserManagement = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });
  const [processingUser, setProcessingUser] = useState(null);

  // Fetch users with pagination and search
  const fetchUsers = async (pageNum = 1, searchQuery = '') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pageNum,
          limit: 10,
          search: searchQuery
        }
      });
      
      setUsers(response.data.users);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers(page, search);
  }, [token, page]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  // Handle ban/unban user
  const handleToggleBan = async (userId) => {
    if (userId === currentUser._id) {
      toast.error('You cannot ban yourself');
      return;
    }
    
    try {
      setProcessingUser(userId);
      const response = await axios.put(
        `${API_URL}/users/admin/${userId}/toggle-ban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update user in the list
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: !user.isActive } : user
      ));
      
      toast.success(response.data.message);
    } catch (err) {
      console.error('Error toggling user ban:', err);
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setProcessingUser(null);
    }
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser._id) {
      toast.error('You cannot change your own role');
      return;
    }
    
    try {
      setProcessingUser(userId);
      const response = await axios.put(
        `${API_URL}/users/admin/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update user in the list
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success(response.data.message);
    } catch (err) {
      console.error('Error changing user role:', err);
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setProcessingUser(null);
    }
  };

  return (
    <RequireAdmin>
      <AdminLayout>
        <PageTransition>
          <Helmet>
            <title>User Management - Admin Dashboard</title>
            <meta name="description" content="Manage users, ban/unban accounts, and change user roles" />
          </Helmet>
          
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4 md:mb-0">
                User Management
              </h1>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="w-full md:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
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
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <GlassmorphicCard className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => fetchUsers(page, search)}
                  className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  <HiOutlineRefresh className="h-5 w-5" />
                  <span>Try Again</span>
                </button>
              </GlassmorphicCard>
            ) : (
              <>
                {/* Users Table */}
                <GlassmorphicCard className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                      <thead className="bg-secondary-50 dark:bg-secondary-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Role
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Joined
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                        {users.map((user) => (
                          <tr key={user._id} className={user._id === currentUser._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {user.avatar ? (
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover" 
                                      src={user.avatar} 
                                      alt={`${user.firstName} ${user.lastName}`} 
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                                      <HiOutlineUserCircle className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-secondary-900 dark:text-white">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-secondary-500 dark:text-secondary-400">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-secondary-900 dark:text-white">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {user.isActive ? 'Active' : 'Banned'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                {/* Ban/Unban Button */}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleToggleBan(user._id)}
                                  disabled={processingUser === user._id || user._id === currentUser._id}
                                  className={`p-1 rounded-full ${
                                    user.isActive 
                                      ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800' 
                                      : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
                                  } ${(processingUser === user._id || user._id === currentUser._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={user.isActive ? 'Ban User' : 'Unban User'}
                                >
                                  <HiOutlineBan className="h-5 w-5" />
                                </motion.button>
                                
                                {/* Change Role Buttons */}
                                {user.role !== 'admin' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRoleChange(user._id, 'admin')}
                                    disabled={processingUser === user._id || user._id === currentUser._id}
                                    className={`p-1 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 ${
                                      (processingUser === user._id || user._id === currentUser._id) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Make Admin"
                                  >
                                    <HiOutlineShieldCheck className="h-5 w-5" />
                                  </motion.button>
                                )}
                                
                                {user.role !== 'user' && user._id !== currentUser._id && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRoleChange(user._id, 'user')}
                                    disabled={processingUser === user._id}
                                    className={`p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 ${
                                      processingUser === user._id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Make Regular User"
                                  >
                                    <HiOutlineShieldExclamation className="h-5 w-5" />
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {users.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-10 text-center text-secondary-500 dark:text-secondary-400">
                              {search ? 'No users found matching your search.' : 'No users found.'}
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
                      Showing {users.length} of {pagination.totalUsers} users
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
          </div>
        </PageTransition>
      </AdminLayout>
    </RequireAdmin>
  );
};

export default AdminUserManagement; 