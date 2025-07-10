import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

/**
 * Theme provider component for managing dark/light mode
 * @param {Object} props - Component props
 * @returns {JSX.Element} ThemeProvider component
 */
export const ThemeProvider = ({ children }) => {
  // Check if user has a theme preference in localStorage or prefers dark mode
  const getInitialTheme = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedPreference = window.localStorage.getItem('color-theme');
      if (typeof storedPreference === 'string') {
        return storedPreference;
      }

      const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
      if (userMedia.matches) {
        return 'dark';
      }
    }

    // Default theme is light
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Update theme class on document element and store preference
  const rawSetTheme = (rawTheme) => {
    const root = window.document.documentElement;
    const isDark = rawTheme === 'dark';

    // Remove the old theme class
    root.classList.remove(isDark ? 'light' : 'dark');
    // Add the new theme class
    root.classList.add(rawTheme);

    // Save theme preference to localStorage
    localStorage.setItem('color-theme', rawTheme);
  };

  // Update theme when it changes
  useEffect(() => {
    rawSetTheme(theme);
  }, [theme]);

  // Toggle between dark and light mode
  const toggleTheme = () => {
    // Force the theme to be the opposite of the current theme
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    rawSetTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook for using the theme context
 * @returns {Object} Theme context value
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;