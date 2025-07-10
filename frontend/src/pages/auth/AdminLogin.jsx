import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiLockClosed, HiMail } from 'react-icons/hi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import PageTransition from '../../components/ui/PageTransition';
import FormInput from '../../components/forms/FormInput';
import LoadingButton from '../../components/ui/LoadingButton';

// Store actions
import { login } from '../../store/slices/authSlice';

// Services
import authService from '../../services/authService';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await authService.adminLogin(formData);
      
      // Update Redux state
      dispatch(login(response));
      
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors
        error.response.data.errors.forEach(err => {
          toast.error(err.msg || err.message);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Admin Login - MERN Blog Platform</title>
        <meta name="description" content="Login to access admin dashboard" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-900">
        <div className="max-w-md w-full space-y-8">
          <div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center"
            >
              <HiLockClosed className="h-6 w-6 text-white" />
            </motion.div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-white">
              Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Access the admin dashboard
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <FormInput
                id="email"
                name="email"
                type="email"
                label="Email address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={HiMail}
                autoComplete="email"
                required
              />
              
              <FormInput
                id="password"
                name="password"
                type="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={HiLockClosed}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/login" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                  Regular user login
                </Link>
              </div>
            </div>

            <div>
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Logging in..."
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Sign in as Admin
              </LoadingButton>
            </div>
            
            <div className="text-center text-sm">
              <Link to="/admin/register" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                Register as Admin
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminLogin; 