import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiMail, HiPhone, HiLocationMarker, HiCheckCircle } from 'react-icons/hi'
import PageTransition from '../components/ui/PageTransition'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    // Here you would normally send the form data to your backend
    // For now, we'll simulate a successful submission
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
    } catch (err) {
      setError('Something went wrong. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="container-custom py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-6">
            Contact Us
          </h1>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 border border-secondary-200 dark:border-secondary-700 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-secondary-900 dark:text-white">
                  Get in Touch
                </h2>
                <p className="text-secondary-700 dark:text-secondary-300 mb-6">
                  Have questions or feedback? We'd love to hear from you. Fill out the form or reach out directly.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <HiMail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">Email</p>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">contact@blogplatform.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <HiPhone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">Phone</p>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <HiLocationMarker className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">Address</p>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">
                        123 Blog Street<br />
                        San Francisco, CA 94107
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl shadow-sm p-6 border border-primary-100 dark:border-primary-800/30">
                <h3 className="text-lg font-medium text-primary-800 dark:text-primary-300 mb-2">
                  Business Hours
                </h3>
                <div className="space-y-2 text-sm text-primary-700 dark:text-primary-400">
                  <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p>Saturday: 10:00 AM - 2:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 border border-secondary-200 dark:border-secondary-700">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <HiCheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-secondary-900 dark:text-white">
                      Thank you for your message!
                    </h3>
                    <p className="text-secondary-700 dark:text-secondary-300 mb-6">
                      We've received your inquiry and will get back to you as soon as possible.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="btn-primary"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-semibold mb-4 text-secondary-900 dark:text-white">
                      Send us a Message
                    </h2>
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md text-red-600 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="message" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows="5"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`btn-primary ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

export default Contact 