import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { HiHome, HiArrowLeft } from 'react-icons/hi'

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found - MERN Blog Platform</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-secondary-900 px-4">
        <div className="text-center max-w-md mx-auto">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-8xl font-bold text-primary-600 dark:text-primary-400 mb-4">
              404
            </div>
            <div className="w-24 h-1 gradient-primary mx-auto rounded-full"></div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white mb-4">
            Page Not Found
          </h1>
          <p className="text-secondary-600 dark:text-secondary-300 mb-8">
            Sorry, the page you're looking for doesn't exist. It might have been moved, 
            deleted, or you entered the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn-primary flex items-center justify-center"
            >
              <HiHome className="w-4 h-4 mr-2" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-outline flex items-center justify-center"
            >
              <HiArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-secondary-200 dark:border-secondary-700">
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4">
              You might be looking for:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                to="/blog"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Blog Posts
              </Link>
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFound
