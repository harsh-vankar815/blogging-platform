import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Helmet } from 'react-helmet-async'
import { HiArrowRight, HiPencil, HiUsers, HiGlobe } from 'react-icons/hi'
import { fetchPosts } from '@store/slices/postsSlice'

const Home = () => {
  const dispatch = useDispatch()
  const { posts, loading } = useSelector((state) => state.posts)
  const { isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    // Fetch recent posts for homepage
    dispatch(fetchPosts({ limit: 6 }))
  }, [dispatch])

  const features = [
    {
      icon: HiPencil,
      title: 'Write & Share',
      description: 'Create beautiful blog posts with our rich text editor and share your thoughts with the world.',
    },
    {
      icon: HiUsers,
      title: 'Connect',
      description: 'Engage with readers through comments, likes, and build a community around your content.',
    },
    {
      icon: HiGlobe,
      title: 'Discover',
      description: 'Explore diverse content from writers around the globe and discover new perspectives.',
    },
  ]

  return (
    <>
      <Helmet>
        <title>MERN Blog Platform - Share Your Stories</title>
        <meta name="description" content="A modern blogging platform built with MERN stack. Write, share, and discover amazing content." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-secondary-900 dark:to-secondary-800 py-20">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 dark:text-white mb-6">
              Share Your{' '}
              <span className="text-gradient">Stories</span>
              {' '}with the World
            </h1>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 mb-8 max-w-2xl mx-auto">
              A modern blogging platform where writers connect, share ideas, and build communities. 
              Start your journey today and let your voice be heard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/create-post" className="btn-primary text-lg px-8 py-3">
                  Start Writing
                  <HiArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3">
                    Get Started
                    <HiArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link to="/blog" className="btn-outline text-lg px-8 py-3">
                    Explore Posts
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-secondary-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-2xl mx-auto">
              Everything you need to create, share, and grow your blog in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-secondary-100 dark:border-secondary-700 hover:border-primary-200 dark:hover:border-primary-800 hover:translate-y-[-5px]"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center mb-6 transform rotate-3 shadow-md">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-300 text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section className="py-20 bg-secondary-50 dark:bg-secondary-800">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
                Recent Posts
              </h2>
              <p className="text-xl text-secondary-600 dark:text-secondary-300">
                Discover the latest stories from our community
              </p>
            </div>
            <Link
              to="/blog"
              className="btn-outline hidden sm:flex items-center"
            >
              View All Posts
              <HiArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="card p-6 animate-pulse">
                  <div className="h-48 bg-secondary-200 dark:bg-secondary-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-2"></div>
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(0, 6).map((post) => (
                <article key={post._id} className="card-hover p-6">
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-400 mb-2">
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{post.readTime} min read</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-300 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.firstName}+${post.author?.lastName}&background=3b82f6&color=fff`}
                        alt={post.author?.firstName}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-secondary-600 dark:text-secondary-400">
                        {post.author?.firstName} {post.author?.lastName}
                      </span>
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                    >
                      Read More
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-12 sm:hidden">
            <Link to="/blog" className="btn-outline">
              View All Posts
              <HiArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-600 z-0"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')] z-0"></div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl p-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-6">
              Ready to Start Your Blogging Journey?
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-300 mb-8 max-w-2xl mx-auto">
              Join thousands of writers who are already sharing their stories and building their audience.
            </p>
            {!isAuthenticated && (
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg hover:shadow-xl"
              >
                Sign Up for Free
                <HiArrowRight className="ml-2 w-5 h-5" />
              </Link>
            )}
            
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-secondary-500 dark:text-secondary-400">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free to get started
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
