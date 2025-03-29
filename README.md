# SOCIALS - Full Stack Social Media App

## Overview

SOCIALS is a feature-rich, full-stack social media application built with the MERN stack (MongoDB, Express, React, Node.js). It offers video sharing, user profiles, comments, likes, subscriptions, tweets, and playlists.

## Features

- User authentication (register, login, logout)
- Video uploads and streaming
- User profiles and channel subscriptions
- Comments and likes on videos
- Tweet posting and interaction
- Playlist creation and management
- Responsive UI with Material-UI
- Cloudinary integration for media storage

## Setup Requirements

- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account for media storage
- Windows, macOS, or Linux operating system

## Installation

### Quick Setup (Windows)

1. Clone this repository
2. Run the `start.bat` file by double-clicking it
   - This will automatically install dependencies and start both servers
   - It will create necessary directories for file uploads

### Manual Setup

1. Clone the repository
2. Install backend dependencies:
   ```
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```
4. Create required directories:
   ```
   mkdir -p public/temp public/images
   ```
5. Set up environment variables (see below)
6. Start the backend server:
   ```
   npm run dev
   ```
7. Start the frontend server:
   ```
   cd frontend
   npm run dev
   ```

## Environment Variables

The project requires the following environment variables:

### Backend (.env file in root directory)

```
# MongoDB connection string
MONGODB_URI=your_mongodb_connection_string/Social

# Port for server
PORT=8001

# Frontend URL for CORS
CORS_ORIGIN=http://localhost:5173

# JWT secrets and expiry
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env file in frontend directory)

```
VITE_API_URL=http://localhost:8001/api/v1
```

## Troubleshooting

If you encounter issues:

1. Run the `check-health.bat` file to verify API connectivity
2. Ensure MongoDB Atlas connection string is correct
3. Verify Cloudinary credentials are properly set
4. Check that all required directories (public/temp, public/images) exist
5. Confirm both servers are running (backend on port 8001, frontend on port 5173)
6. Clear browser cache and localStorage if authentication issues occur

## API Documentation

### Authentication

- POST `/api/v1/users/register` - Register new user
- POST `/api/v1/users/login` - User login
- POST `/api/v1/users/logout` - User logout
- POST `/api/v1/users/refresh-token` - Refresh access token

### Videos

- GET `/api/v1/videos` - Get all videos
- POST `/api/v1/videos` - Upload a new video
- GET `/api/v1/videos/:videoId` - Get video by ID
- PATCH `/api/v1/videos/:videoId` - Update video
- DELETE `/api/v1/videos/:videoId` - Delete video

### User Profile

- GET `/api/v1/users/profile` - Get user profile
- PATCH `/api/v1/users/update` - Update user details
- PATCH `/api/v1/users/avatar` - Update avatar
- PATCH `/api/v1/users/cover-image` - Update cover image

### More endpoints available for comments, likes, subscriptions, tweets, playlists.

## License

[MIT License](LICENSE)
