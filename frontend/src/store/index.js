import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'

// Import slices
import authReducer from './slices/authSlice'
import postsReducer from './slices/postsSlice'
import commentsReducer from './slices/commentsSlice'
import uiReducer from './slices/uiSlice'

// Auth persist config
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'user', 'isAuthenticated'] // Only persist essential auth data
}

// Combine reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  posts: postsReducer,
  comments: commentsReducer,
  ui: uiReducer,
})

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

// Create persistor
export const persistor = persistStore(store)

// Export types for TypeScript (if needed)
export const RootState = store.getState
export const AppDispatch = store.dispatch
