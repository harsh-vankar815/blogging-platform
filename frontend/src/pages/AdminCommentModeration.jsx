import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  HiSearch, 
  HiOutlineChat, 
  HiOutlineTrash, 
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineFlag,
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
import { formatDate, truncateText } from '@utils/helpers';

const AdminCommentModeration = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('needsModeration');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalComments: 0
  });
  const [processingComment, setProcessingComment] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [commentToReject, setCommentToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch comments with pagination, search and filters
  const fetchComments = async (pageNum = 1, searchQuery = '', filterType = 'needsModeration') => {
    try {
      setLoading(true);
      
      // Determine filter parameters
      let params = {
        page: pageNum,
        limit: 10,
        search: searchQuery
      };
      
      if (filterType === 'needsModeration') {
        params.needsModeration = true;
      } else if (filterType === 'approved') {
        params.isApproved = true;
        params.needsModeration = false;
      } else if (filterType === 'rejected') {
        params.isApproved = false;
        params.needsModeration = false;
      }
      
      const response = await axios.get(`${API_URL}/comments/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setComments(response.data.comments);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.response?.data?.message || 'Failed to load comments');
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchComments(page, search, filter);
  }, [token, page, filter]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComments(1, search, filter);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  // Handle comment approval
  const handleApprove = async (commentId) => {
    try {
      setProcessingComment(commentId);
      const response = await axios.put(
        `${API_URL}/comments/admin/${commentId}/approve`,
        { isApproved: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update comment in the list or remove if filtering
      if (filter === 'needsModeration' || filter === 'rejected') {
        setComments(comments.filter(comment => comment._id !== commentId));
      } else {
        setComments(comments.map(comment => 
          comment._id === commentId ? { ...comment, isApproved: true, needsModeration: false } : comment
        ));
      }
      
      toast.success('Comment approved successfully');
    } catch (err) {
      console.error('Error approving comment:', err);
      toast.error(err.response?.data?.message || 'Failed to approve comment');
    } finally {
      setProcessingComment(null);
    }
  };

  // Handle comment rejection confirmation
  const confirmReject = (comment) => {
    setCommentToReject(comment);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Handle comment rejection
  const handleReject = async () => {
    if (!commentToReject) return;
    
    try {
      setProcessingComment(commentToReject._id);
      
      const response = await axios.put(
        `${API_URL}/comments/admin/${commentToReject._id}/approve`,
        { 
          isApproved: false,
          moderationReason: rejectionReason || 'Rejected by admin'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update comment in the list or remove if filtering
      if (filter === 'needsModeration' || filter === 'approved') {
        setComments(comments.filter(comment => comment._id !== commentToReject._id));
      } else {
        setComments(comments.map(comment => 
          comment._id === commentToReject._id ? { 
            ...comment, 
            isApproved: false, 
            needsModeration: false,
            moderationReason: rejectionReason || 'Rejected by admin'
          } : comment
        ));
      }
      
      toast.success('Comment rejected');
      setShowRejectModal(false);
      setCommentToReject(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting comment:', err);
      toast.error(err.response?.data?.message || 'Failed to reject comment');
    } finally {
      setProcessingComment(null);
    }
  };

  // Handle flag for moderation
  const handleFlag = async (commentId, shouldFlag) => {
    try {
      setProcessingComment(commentId);
      
      const response = await axios.put(
        `${API_URL}/comments/admin/${commentId}/flag`,
        { 
          needsModeration: shouldFlag,
          moderationReason: shouldFlag ? 'Flagged for review' : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update comment in the list or remove if filtering
      if ((filter === 'needsModeration' && !shouldFlag) || 
          (filter !== 'needsModeration' && shouldFlag)) {
        setComments(comments.filter(comment => comment._id !== commentId));
      } else {
        setComments(comments.map(comment => 
          comment._id === commentId ? { 
            ...comment, 
            needsModeration: shouldFlag,
            moderationReason: shouldFlag ? 'Flagged for review' : null
          } : comment
        ));
      }
      
      toast.success(shouldFlag ? 'Comment flagged for moderation' : 'Comment unflagged');
    } catch (err) {
      console.error('Error flagging comment:', err);
      toast.error(err.response?.data?.message || 'Failed to update comment');
    } finally {
      setProcessingComment(null);
    }
  };

  return (
    <RequireAdmin>
      <AdminLayout>
    <PageTransition>
      <Helmet>
            <title>Comment Moderation - Admin Dashboard</title>
            <meta name="description" content="Moderate blog comments, approve or reject user comments" />
      </Helmet>

          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4 md:mb-0">
            Comment Moderation
          </h1>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="w-full md:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search comments..."
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

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => handleFilterChange('needsModeration')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'needsModeration'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                Needs Moderation
              </button>
              <button
                onClick={() => handleFilterChange('approved')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'approved'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => handleFilterChange('rejected')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'rejected'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                All Comments
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
                  onClick={() => fetchComments(page, search, filter)}
                  className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  <HiOutlineRefresh className="h-5 w-5" />
                  <span>Try Again</span>
                </button>
              </GlassmorphicCard>
            ) : (
              <>
                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <GlassmorphicCard key={comment._id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        {/* Comment Content */}
                        <div className="flex-1 mb-4 md:mb-0 md:mr-4">
                          <div className="flex items-center mb-2">
                            <img 
                              src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.firstName}+${comment.author.lastName}&background=random`}
                              alt={`${comment.author.firstName} ${comment.author.lastName}`}
                              className="w-8 h-8 rounded-full mr-2"
                            />
                            <div>
                              <span className="font-medium text-secondary-900 dark:text-white">
                                {comment.author.firstName} {comment.author.lastName}
                              </span>
                              <span className="text-xs text-secondary-500 dark:text-secondary-400 ml-2">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-secondary-800 dark:text-secondary-200 mb-2">
                            {comment.content}
                          </p>
                          
                          <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-400">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              comment.needsModeration 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                : comment.isApproved
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {comment.needsModeration ? 'Needs Review' : 
                               comment.isApproved ? 'Approved' : 'Rejected'}
                            </span>
                            
                            {comment.moderationReason && (
                              <span className="ml-2">
                                Reason: {comment.moderationReason}
                              </span>
                            )}
                            
                            <span className="mx-2">•</span>
                            
                            <Link 
                              to={`/blog/${comment.post.slug}`} 
                              target="_blank"
                              className="hover:text-primary-500 transition-colors"
                            >
                              On: {truncateText(comment.post.title, 30)}
                            </Link>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex md:flex-col items-center md:items-end space-x-2 md:space-x-0 md:space-y-2">
                          {/* View Post */}
                          <Link to={`/blog/${comment.post.slug}`} target="_blank">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                              title="View Post"
                            >
                              <HiOutlineEye className="h-5 w-5" />
                            </motion.button>
                          </Link>
                          
                          {/* Approve */}
                          {(!comment.isApproved || comment.needsModeration) && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleApprove(comment._id)}
                              disabled={processingComment === comment._id}
                              className={`p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 ${
                                processingComment === comment._id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Approve Comment"
                            >
                              <HiOutlineCheck className="h-5 w-5" />
                            </motion.button>
                          )}
                          
                          {/* Reject */}
                          {(comment.isApproved || comment.needsModeration) && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => confirmReject(comment)}
                              disabled={processingComment === comment._id}
                              className={`p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 ${
                                processingComment === comment._id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Reject Comment"
                            >
                              <HiOutlineX className="h-5 w-5" />
                            </motion.button>
                          )}
                          
                          {/* Flag/Unflag */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleFlag(comment._id, !comment.needsModeration)}
                            disabled={processingComment === comment._id}
                            className={`p-1 rounded-full ${
                              comment.needsModeration
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800'
                            } ${processingComment === comment._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={comment.needsModeration ? 'Remove Flag' : 'Flag for Moderation'}
                          >
                            <HiOutlineFlag className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>
                    </GlassmorphicCard>
                  ))}
                  
                  {comments.length === 0 && (
                    <GlassmorphicCard className="p-8 text-center">
                      <HiOutlineChat className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600 dark:text-secondary-400">
                        {search 
                          ? 'No comments found matching your search.' 
                          : filter === 'needsModeration'
                          ? 'No comments need moderation at this time.'
                          : filter === 'approved'
                          ? 'No approved comments found.'
                          : filter === 'rejected'
                          ? 'No rejected comments found.'
                          : 'No comments found.'}
            </p>
          </GlassmorphicCard>
                  )}
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      Showing {comments.length} of {pagination.totalComments} comments
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
            
            {/* Reject Comment Modal */}
            {showRejectModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4"
                >
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                    Reject Comment
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                    Please provide a reason for rejecting this comment (optional):
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection"
                    className="w-full p-2 border border-secondary-300 dark:border-secondary-700 rounded-md bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white mb-4"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-3">
                    <button 
                      className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700"
                      onClick={() => {
                        setShowRejectModal(false);
                        setCommentToReject(null);
                        setRejectionReason('');
                      }}
                      disabled={processingComment === commentToReject?._id}
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      onClick={handleReject}
                      disabled={processingComment === commentToReject?._id}
                    >
                      {processingComment === commentToReject?._id ? 'Rejecting...' : 'Reject Comment'}
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

export default AdminCommentModeration; 