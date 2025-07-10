import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiUsers, 
  HiDocumentText, 
  HiChat, 
  HiChartBar,
  HiMenu,
  HiX
} from 'react-icons/hi';
import { motion } from 'framer-motion';

const AdminSidebar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuItems = [
    { 
      path: '/admin', 
      label: 'Dashboard', 
      icon: HiHome 
    },
    { 
      path: '/admin/users', 
      label: 'Users', 
      icon: HiUsers 
    },
    { 
      path: '/admin/posts', 
      label: 'Posts', 
      icon: HiDocumentText 
    },
    { 
      path: '/admin/comments', 
      label: 'Comments', 
      icon: HiChat 
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 flex justify-between items-center bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">Admin Panel</h2>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
        >
          {isMobileMenuOpen ? (
            <HiX className="w-6 h-6" />
          ) : (
            <HiMenu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-64 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700 h-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-8">Admin Panel</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive(item.path) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="md:hidden absolute z-40 w-64 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700 h-screen"
        >
          <div className="p-6">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive(item.path) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default AdminSidebar; 