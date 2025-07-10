import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * SkeletonLoader component for loading states
 * @param {Object} props - Component props
 * @returns {JSX.Element} SkeletonLoader component
 */
const SkeletonLoader = ({ 
  variant = 'rectangle',
  width = 'full',
  height = '16',
  className = '',
  animate = true,
  ...props
}) => {
  // Base classes for all skeleton types
  const baseClasses = `
    bg-gradient-to-r from-secondary-200 via-secondary-100 to-secondary-200
    dark:from-secondary-700 dark:via-secondary-800 dark:to-secondary-700
    bg-[length:400%_100%]
    rounded overflow-hidden
    w-${width} h-${height}
    ${className}
  `;

  // Variant-specific classes
  const variantClasses = {
    rectangle: '',
    circle: 'rounded-full',
    text: 'h-4 rounded-md',
    avatar: 'rounded-full h-10 w-10',
    button: 'h-10 rounded-md',
    card: 'rounded-xl',
  };

  // Animation properties
  const animation = animate ? {
    backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  } : {};

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant] || ''}`}
      animate={animation}
      {...props}
    />
  );
};

/**
 * SkeletonPostCard component for post card loading states
 * @returns {JSX.Element} SkeletonPostCard component
 */
export const SkeletonPostCard = () => {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-white dark:bg-secondary-800 shadow-md p-4">
      <SkeletonLoader variant="rectangle" height="48" className="mb-4" />
      <SkeletonLoader variant="text" width="3/4" className="mb-2" />
      <SkeletonLoader variant="text" width="full" className="mb-4" />
      <div className="flex items-center space-x-2">
        <SkeletonLoader variant="avatar" />
        <div className="space-y-2">
          <SkeletonLoader variant="text" width="24" />
          <SkeletonLoader variant="text" width="32" />
        </div>
      </div>
    </div>
  );
};

/**
 * SkeletonProfile component for profile loading states
 * @returns {JSX.Element} SkeletonProfile component
 */
export const SkeletonProfile = () => {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-white dark:bg-secondary-800 shadow-md p-6">
      <div className="flex flex-col items-center mb-6">
        <SkeletonLoader variant="avatar" width="24" height="24" className="mb-4" />
        <SkeletonLoader variant="text" width="1/3" className="mb-2" />
        <SkeletonLoader variant="text" width="1/4" className="mb-4" />
      </div>
      <SkeletonLoader variant="text" width="full" className="mb-2" />
      <SkeletonLoader variant="text" width="full" className="mb-2" />
      <SkeletonLoader variant="text" width="3/4" className="mb-6" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SkeletonLoader variant="rectangle" height="20" />
        <SkeletonLoader variant="rectangle" height="20" />
      </div>
      <SkeletonLoader variant="text" width="1/4" className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonLoader variant="rectangle" height="32" />
        <SkeletonLoader variant="rectangle" height="32" />
      </div>
    </div>
  );
};

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(['rectangle', 'circle', 'text', 'avatar', 'button', 'card']),
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string,
  animate: PropTypes.bool,
};

export default SkeletonLoader;