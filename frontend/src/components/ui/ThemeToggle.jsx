import { useTheme } from '@contexts/ThemeContext';
import { motion } from 'framer-motion';
import { HiSun, HiMoon } from 'react-icons/hi';

/**
 * ThemeToggle component for switching between dark and light modes
 * @returns {JSX.Element} ThemeToggle component
 */
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-secondary-100 dark:bg-secondary-800 transition-colors duration-300"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center justify-center"
        initial={{ rotate: 0 }}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {isDark ? (
          <HiMoon className="w-5 h-5 text-accent-400" />
        ) : (
          <HiSun className="w-5 h-5 text-accent-500" />
        )}
      </motion.div>
      
      {/* Glassmorphism effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
        style={{ zIndex: -1 }}
      />
    </motion.button>
  );
};

export default ThemeToggle;