import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiLockClosed, HiMail, HiUser } from 'react-icons/hi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

// Components
import PageTransition from '../../components/ui/PageTransition';
import FormInput from '../../components/forms/FormInput';
import LoadingButton from '../../components/ui/LoadingButton';

// Store actions
import { login } from '../../store/slices/authSlice';

// Utils
import { APP_CONFIG, VALIDATION } from '../../utils/constants';
const API_URL = APP_CONFIG.API_URL;

const AdminRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
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
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!VALIDATION.USERNAME.PATTERN.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (formData.username.length < VALIDATION.USERNAME.MIN_LENGTH) {
      newErrors.username = `Username must be at least ${VALIDATION.USERNAME.MIN_LENGTH} characters`;
    } else if (formData.username.length > VALIDATION.USERNAME.MAX_LENGTH) {
      newErrors.username = `Username cannot exceed ${VALIDATION.USERNAME.MAX_LENGTH} characters`;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`;
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${API_URL}/auth/admin/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: 'admin' // Explicitly set role to admin
      });
      
      // Store tokens
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Update Redux state
      dispatch(login(response.data));
      
      toast.success('Admin registration successful!');
      navigate('/admin');
    } catch (error) {
      console.error('Admin registration error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Admin Registration - MERN Blog Platform</title>
        <meta name="description" content="Register as an admin for the blog platform" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-secondary-50 dark:bg-secondary-900">
        <div className="max-w-md w-full space-y-8">
          <div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center"
            >
              <HiUser className="h-6 w-6 text-white" />
            </motion.div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-white">
              Admin Registration
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Create an admin account
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  id="firstName"
                  name="firstName"
                  type="text"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  icon={HiUser}
                  autoComplete="given-name"
                  required
                />
                
                <FormInput
                  id="lastName"
                  name="lastName"
                  type="text"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  icon={HiUser}
                  autoComplete="family-name"
                  required
                />
              </div>
              
              <FormInput
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={HiMail}
                autoComplete="email"
                required
              />
              
              <FormInput
                id="username"
                name="username"
                type="text"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                icon={HiUser}
                autoComplete="username"
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
                autoComplete="new-password"
                required
              />
              
              <FormInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                icon={HiLockClosed}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Registering..."
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Register as Admin
              </LoadingButton>
            </div>
            
            <div className="text-center text-sm">
              Already have an admin account?{' '}
              <Link to="/admin/login" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                Sign in
              </Link>
            </div>
            
            <div className="text-center text-sm">
              <Link to="/register" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                Register as regular user
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminRegister; 