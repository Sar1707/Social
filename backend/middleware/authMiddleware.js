const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
  let token;
  
  // Check if auth token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token (without password)
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error('Auth token error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else if (req.cookies && req.cookies.token) {
    // Check for token in cookies as a fallback
    try {
      token = req.cookies.token;
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token (without password)
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error('Auth cookie error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Optional middleware to attach user info if token exists, but doesn't require auth
exports.optionalAuth = async (req, res, next) => {
  let token;
  
  // Check if auth token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token (without password)
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      console.error('Auth token error in optional auth:', error);
      req.user = null;
    }
  } else if (req.cookies && req.cookies.token) {
    // Check for token in cookies as a fallback
    try {
      token = req.cookies.token;
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token (without password)
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      console.error('Auth cookie error in optional auth:', error);
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
}; 