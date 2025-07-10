import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * RoleGuard component to protect routes based on user role
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles allowed to access the route
 * @param {string} props.redirectTo - Path to redirect to if not authorized
 * @returns {JSX.Element} The protected component or redirect
 */
const RoleGuard = ({
  children,
  allowedRoles = ['admin'],
  redirectTo = '/dashboard'
}) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    toast.error(`Access denied. ${allowedRoles.join(' or ')} role required.`);
    return <Navigate to={redirectTo} replace />;
  }
  
  // User has required role, render the protected component
  return children;
};

export default RoleGuard;
