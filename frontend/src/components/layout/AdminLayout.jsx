import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children, title }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return null; // Don't render anything while redirecting
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col md:flex-row bg-secondary-50 dark:bg-secondary-950"
    >
      {/* Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminLayout; 