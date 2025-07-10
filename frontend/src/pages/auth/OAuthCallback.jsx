import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet-async'
import { updateUser } from '@store/slices/authSlice'
import { setAuthToken } from '@services/api'
import toast from 'react-hot-toast'
import NanoProgress from '@components/ui/NanoProgress'

const OAuthCallback = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken')
        const refreshToken = searchParams.get('refreshToken')
        const userParam = searchParams.get('user')
        const error = searchParams.get('error')

        if (error) {
          toast.error('Authentication failed. Please try again.')
          navigate('/login')
          return
        }

        if (!accessToken || !refreshToken || !userParam) {
          toast.error('Invalid authentication response.')
          navigate('/login')
          return
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam))

        // Set tokens in API service
        setAuthToken(accessToken)

        // Store token in localStorage
        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', refreshToken)

        // Update Redux store with user data
        dispatch(updateUser(user))

        toast.success(`Welcome ${user.firstName}!`)
        navigate('/')
      } catch (error) {
        console.error('OAuth callback error:', error)
        toast.error('Authentication failed. Please try again.')
        navigate('/login')
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate, dispatch])

  return (
    <>
      <Helmet>
        <title>Authenticating... - MERN Blog Platform</title>
        <meta name="description" content="Completing authentication" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center">
          <NanoProgress
            isVisible={true}
            speed="fast"
            color="bg-primary-600"
            height={3}
          />
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2 mt-4">
            Completing authentication...
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            Please wait while we sign you in.
          </p>
        </div>
      </div>
    </>
  )
}

export default OAuthCallback
