import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import connectDB from './db/index.js';

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
  path: './.env'
});

// Check and log Cloudinary configuration
console.log("\n=== Cloudinary Configuration ===");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing");
console.log("==============================\n");

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(morgan("dev")); // HTTP request logger

// Enhanced CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Static file serving
app.use(express.static("public"));
app.use("/temp", express.static("public/temp"));
app.use("/images", express.static("public/images"));

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', req.body);
  }
  next();
});

// Import route files
import videoRoutes from './routes/video.routes.js';
import userRoutes from './routes/user.routes.js';
import commentRoutes from './routes/comment.routes.js';
import likeRoutes from './routes/like.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import tweetRoutes from './routes/tweet.routes.js';
import playlistRoutes from './routes/playlist.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import healthcheckRoutes from './routes/healthcheck.routes.js';

// Debug route to check API is working
app.get('/api/v1/debug', (req, res) => {
  res.json({
    success: true,
    message: "API debug endpoint is working",
    data: { 
      message: "API is functioning correctly",
      timestamp: new Date().toISOString()
    }
  });
});

// Routes - with console log for each route registration
console.log('Registering API routes...');

console.log('Mounting /api/v1/videos routes');
app.use('/api/v1/videos', videoRoutes);

console.log('Mounting /api/v1/users routes'); 
app.use('/api/v1/users', userRoutes);

console.log('Mounting /api/v1/comments routes');
app.use('/api/v1/comments', commentRoutes);

console.log('Mounting /api/v1/likes routes');
app.use('/api/v1/likes', likeRoutes);

console.log('Mounting /api/v1/subscriptions routes');
app.use('/api/v1/subscriptions', subscriptionRoutes);

console.log('Mounting /api/v1/tweets routes');
app.use('/api/v1/tweets', tweetRoutes);

console.log('Mounting /api/v1/playlists routes');
app.use('/api/v1/playlists', playlistRoutes);

console.log('Mounting /api/v1/dashboard routes');
app.use('/api/v1/dashboard', dashboardRoutes);

console.log('Mounting /api/v1/healthcheck routes');
app.use('/api/v1/healthcheck', healthcheckRoutes);

// Handle options preflight requests
app.options('*', cors());

// Basic placeholder route for the root path
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "API is up and running.",
    data: { message: "Server is running" }
  });
});

// Special route for testing login
app.post('/api/v1/test-login', (req, res) => {
  const { email, username, password } = req.body;
  res.json({
    success: true,
    message: "Test login endpoint reached successfully",
    data: { received: { email, username, password } }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Global 404 handler
app.use((req, res, next) => {
  console.error(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Resource not found",
    errors: [`The requested URL ${req.originalUrl} was not found on this server`],
    data: null
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(statusCode).json({
    success: false,
    message: message,
    errors: err.errors || [],
    data: null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Start server
    const PORT = process.env.PORT || 8001;
    app.listen(PORT, () => {
      console.log(`⚙️ Server is running at port: ${PORT}`);
      console.log(`API base URL: http://localhost:${PORT}/api/v1`);
      console.log('Available routes:');
      console.log('- /api/v1/users/login (POST)');
      console.log('- /api/v1/users/register (POST)');
      console.log('- /api/v1/healthcheck (GET)');
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer(); 