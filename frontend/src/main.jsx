import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'

import App from './App.jsx'
import { store, persistor } from './store/index.js'
import NanoProgress from './components/ui/NanoProgress.jsx'
import './styles/index.css'

// Loading component for PersistGate with nanoscopic progress
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
    <NanoProgress
      isVisible={true}
      speed="fast"
      color="bg-primary-600"
      height={3}
    />
    <div className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
      Loading application...
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <BrowserRouter>
          <HelmetProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#f9fafb',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#f9fafb',
                  },
                },
              }}
            />
          </HelmetProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)
