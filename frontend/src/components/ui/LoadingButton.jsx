import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * LoadingButton component for buttons with loading state
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {string} props.loadingText - Text to display when loading
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {boolean} props.disabled - Whether the button is disabled
 * @returns {JSX.Element} LoadingButton component
 */
const LoadingButton = ({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  className = '',
  type = 'button',
  disabled = false,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`relative ${className}`}
      disabled={isLoading || disabled}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner size="sm" className="mr-2" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton; 