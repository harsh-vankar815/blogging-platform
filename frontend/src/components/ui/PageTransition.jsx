import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * PageTransition component for animated page transitions
 * @param {Object} props - Component props
 * @returns {JSX.Element} PageTransition component
 */
const PageTransition = ({ children, className = '', ...props }) => {
  // Animation variants for page transitions
  const variants = {
    initial: {
      opacity: 0,
      y: 8,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -8,
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ 
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1.0] // Cubic bezier easing
      }}
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideTransition component for sliding transitions
 * @param {Object} props - Component props
 * @returns {JSX.Element} SlideTransition component
 */
export const SlideTransition = ({ 
  children, 
  direction = 'right',
  distance = 50,
  className = '', 
  ...props 
}) => {
  // Map direction to x/y values
  const directionMap = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance },
  };

  const { x, y } = directionMap[direction] || directionMap.right;

  // Animation variants for slide transitions
  const variants = {
    initial: {
      opacity: 0,
      x,
      y,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
    },
    exit: {
      opacity: 0,
      x: -x,
      y: -y,
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ 
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1.0] // Cubic bezier easing
      }}
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeTransition component for fade transitions
 * @param {Object} props - Component props
 * @returns {JSX.Element} FadeTransition component
 */
export const FadeTransition = ({ 
  children, 
  duration = 0.3,
  delay = 0,
  className = '', 
  ...props 
}) => {
  // Animation variants for fade transitions
  const variants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ 
        duration,
        delay,
        ease: 'easeInOut'
      }}
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

SlideTransition.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['left', 'right', 'up', 'down']),
  distance: PropTypes.number,
  className: PropTypes.string,
};

FadeTransition.propTypes = {
  children: PropTypes.node.isRequired,
  duration: PropTypes.number,
  delay: PropTypes.number,
  className: PropTypes.string,
};

export default PageTransition;