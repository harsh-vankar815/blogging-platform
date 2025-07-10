import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlassmorphicCard component with glassmorphism styling
 * @param {Object} props - Component props
 * @returns {JSX.Element} GlassmorphicCard component
 */
const GlassmorphicCard = ({
  children,
  className = '',
  hoverEffect = true,
  animateEntry = true,
  delay = 0,
  ...props
}) => {
  // Base classes for the card
  const baseClasses = `
    relative overflow-hidden rounded-xl
    bg-white/70 dark:bg-secondary-800/60
    backdrop-blur-md backdrop-saturate-150
    border border-white/20 dark:border-secondary-700/30
    shadow-lg shadow-secondary-900/5 dark:shadow-black/20
    transition-all duration-300 ease-in-out
    ${className}
  `;

  // Hover effect classes
  const hoverClasses = hoverEffect
    ? 'hover:shadow-xl hover:shadow-secondary-900/10 dark:hover:shadow-black/30 hover:-translate-y-1'
    : '';

  // Animation variants
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses}`}
      initial={animateEntry ? 'hidden' : 'visible'}
      animate="visible"
      variants={variants}
      transition={{ 
        duration: 0.5, 
        delay, 
        ease: [0.25, 0.1, 0.25, 1.0] // Cubic bezier easing
      }}
      {...props}
    >
      {/* Inner content */}
      <div className="relative z-10">{children}</div>
      
      {/* Glassmorphism highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 pointer-events-none" />
    </motion.div>
  );
};

GlassmorphicCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hoverEffect: PropTypes.bool,
  animateEntry: PropTypes.bool,
  delay: PropTypes.number,
};

export default GlassmorphicCard;