import { Link } from 'react-router-dom'
import { HiHeart } from 'react-icons/hi'
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaGithub, FaPen, FaHeart, FaArrowUp } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-secondary-50 dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-secondary-900 dark:text-white">
                BlogPlatform
              </span>
            </Link>
            <p className="text-secondary-600 dark:text-secondary-400 mb-4 max-w-md">
              A modern blogging platform built with the MERN stack. Share your thoughts, 
              connect with readers, and build your online presence.
            </p>
            <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-500">
              <span>Made with</span>
              <HiHeart className="w-4 h-4 text-red-500 mx-1" />
              <span>by HARSH VANKAR</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-500 dark:text-secondary-500 text-sm">
              © {currentYear} BlogPlatform. All rights reserved.
            </p>
            <div className="flex flex-col items-center lg:items-end space-y-4">
                  <div className="text-sm text-gray-400 text-center lg:text-right">
                    Follow us for updates and inspiration
                  </div>
                  <div className="flex space-x-4">
                    {[
                      { href: 'https://facebook.com', icon: FaFacebook, label: 'Facebook', color: 'hover:text-blue-500' },
                      { href: 'https://twitter.com', icon: FaTwitter, label: 'Twitter', color: 'hover:text-sky-400' },
                      { href: 'https://instagram.com', icon: FaInstagram, label: 'Instagram', color: 'hover:text-pink-500 dark:hover:' },
                      { href: 'https://linkedin.com', icon: FaLinkedin, label: 'LinkedIn', color: 'hover:text-blue-600' },
                      { href: 'https://github.com', icon: FaGithub, label: 'GitHub', color: 'hover:text-gray-300' },
                    ].map(({ href, icon: Icon, label, color }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 ${color} transition-all duration-200 transform hover:scale-110 hover:bg-gray-700 bg-white border border-solid `}
                        aria-label={label}
                      >
                        <Icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
