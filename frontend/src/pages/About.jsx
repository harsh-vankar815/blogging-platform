import { motion } from 'framer-motion'
import { HiUsers, HiPencil, HiGlobe } from 'react-icons/hi'
import PageTransition from '../components/ui/PageTransition'

const About = () => {
  return (
    <PageTransition>
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-6">
            About BlogPlatform
          </h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-xl font-medium text-secondary-800 dark:text-secondary-200 mb-8">
              Welcome to BlogPlatform, a modern space for writers and readers to connect through 
              meaningful content. Our mission is to provide a seamless platform for sharing ideas,
              stories, and knowledge.
            </p>
            
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-8 mb-12 border border-secondary-200 dark:border-secondary-700">
              <h2 className="text-2xl font-semibold mb-6 text-secondary-900 dark:text-white">Our Story</h2>
              <p className="mb-4 text-secondary-800 dark:text-secondary-200">
                Founded in 2023, BlogPlatform was created with the vision of building a community where 
                writers can express themselves freely and readers can discover high-quality content.
              </p>
              <p className="text-secondary-800 dark:text-secondary-200">
                We believe in the power of words to inspire, educate, and connect people across the globe.
                Our platform is designed with both writers and readers in mind, offering intuitive tools
                for content creation and a pleasant reading experience.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-6 border border-secondary-200 dark:border-secondary-700">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <HiUsers className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center text-secondary-900 dark:text-white">Community</h3>
                <p className="text-center text-secondary-800 dark:text-secondary-200">
                  Join a vibrant community of writers and readers passionate about sharing ideas.
                </p>
              </div>
              
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-6 border border-secondary-200 dark:border-secondary-700">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <HiPencil className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center text-secondary-900 dark:text-white">Creativity</h3>
                <p className="text-center text-secondary-800 dark:text-secondary-200">
                  Express yourself with our powerful yet intuitive writing tools and editor.
                </p>
              </div>
              
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-6 border border-secondary-200 dark:border-secondary-700">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <HiGlobe className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center text-secondary-900 dark:text-white">Global Reach</h3>
                <p className="text-center text-secondary-800 dark:text-secondary-200">
                  Share your stories with readers from around the world and make an impact.
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-8 mb-8 border border-secondary-200 dark:border-secondary-700">
              <h2 className="text-2xl font-semibold mb-6 text-secondary-900 dark:text-white">Our Team</h2>
              <p className="mb-4 text-secondary-800 dark:text-secondary-200">
                We are a dedicated team of developers, designers, and content creators passionate about 
                building the best blogging platform possible. With backgrounds in web development, UX design,
                and content strategy, we bring diverse skills to create an exceptional user experience.
              </p>
              <p className="text-secondary-800 dark:text-secondary-200">
                Our team is committed to continuous improvement, regularly updating the platform with new
                features and optimizations based on user feedback and emerging technologies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

export default About 