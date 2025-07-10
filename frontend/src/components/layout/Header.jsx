import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { HiMenu, HiX, HiSun, HiMoon, HiSearch, HiPlus, HiUser } from 'react-icons/hi'
import { logout } from '../../store/slices/authSlice'
import { toggleTheme } from '../../store/slices/uiSlice'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { theme } = useSelector((state) => state.ui)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }

  const handleThemeToggle = () => {
    dispatch(toggleTheme())
  }

  const renderNavLinks = () => {
    return (
      <div className="hidden md:flex items-center space-x-6">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/blog" className="nav-link">
          Blog
        </Link>
        <Link to="/about" className="nav-link">
          About
        </Link>
        <Link to="/contact" className="nav-link">
          Contact
        </Link>
        {isAuthenticated && (
          <Link to="/create-post" className="nav-link">
            Write
          </Link>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <Link to="/admin" className="nav-link text-primary-500 dark:text-primary-400 font-medium">
            Admin
          </Link>
        )}
      </div>
    );
  };

  return (
    <header className="bg-white dark:bg-secondary-900 shadow-sm border-b border-secondary-200 dark:border-secondary-700 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-secondary-900 dark:text-white">
              BlogPlatform
            </span>
          </Link>

          {/* Desktop Navigation */}
          {renderNavLinks()}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search */}
            <button className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <HiSearch className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {theme === 'dark' ? (
                <HiSun className="w-5 h-5" />
              ) : (
                <HiMoon className="w-5 h-5" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Create Post */}
                <Link
                  to="/create-post"
                  className="btn-primary flex items-center space-x-2"
                >
                  <HiPlus className="w-4 h-4" />
                  <span>Write</span>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-secondary-700 dark:text-secondary-300"
                  >
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=3b82f6&color=fff`}
                      alt={user?.firstName}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium">{user?.firstName}</span>
                  </button>
                  
                  {/* User dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-md shadow-lg py-1 z-50 border border-secondary-200 dark:border-secondary-700">
                      <Link 
                        to={`/profile/${user?.username}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                      >
                        Your Profile
                      </Link>
                      <Link 
                        to="/create-post"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                      >
                        Create Post
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="btn-ghost">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-secondary-600 dark:text-secondary-400"
          >
            {mobileMenuOpen ? (
              <HiX className="w-6 h-6" />
            ) : (
              <HiMenu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-200 dark:border-secondary-700">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Blog
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                About
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Contact
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to={`/profile/${user?.username}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/create-post"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Write Post
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  onClick={handleThemeToggle}
                  className="flex items-center space-x-2 text-secondary-600 dark:text-secondary-400"
                >
                  {theme === 'dark' ? (
                    <>
                      <HiSun className="w-5 h-5" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <HiMoon className="w-5 h-5" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>

                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400"
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-ghost"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
