.env configurations for Frontend:
# API Configuration
VITE_API_URL=http://localhost:5000/api
# App Configuration
VITE_APP_NAME=MERN Blog Platform
VITE_APP_DESCRIPTION=A modern blogging platform built with MERN stack
VITE_APP_URL=http://localhost:5173
# Feature Flags
VITE_ENABLE_COMMENTS=true
VITE_ENABLE_SOCIAL_LOGIN=true
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_NOTIFICATIONS=true

.env configurations for Backend:
# Server Configuration
NODE_ENV=development
PORT=5000
# Database Configuration
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-mern-blog-2024
JWT_EXPIRES_IN=15m
ROTATE_REFRESH_TOKENS=true
# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# Client Configuration
FRONTEND_URL=https://blogging-platform-virid-ten.vercel.app
# Google OAuth Configuration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
VITE_ENABLE_SOCIAL_LOGIN=true
# Rate Limiting Configuration (Development)
DISABLE_RATE_LIMIT=false
DISABLE_AUTH_RATE_LIMIT=false
MONGODB_URI=


# Blogging Platform

A full-stack blogging platform with a React frontend and Node.js backend.

## Features

- User authentication and authorization
- Create, read, update, and delete blog posts
- Comment system with real-time updates
- Admin dashboard for content moderation
- Rich text editor for post creation
- Responsive design with Tailwind CSS
- File uploads with Cloudinary integration

## Project Structure

- **Frontend**: React with Vite, Redux, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB (Mongoose)

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```
2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

## License

MIT 