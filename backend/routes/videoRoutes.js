const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getVideos,
  getVideo,
  getTrendingVideos,
  getUserHistory,
  clearHistory
} = require('../controllers/videoController');

const router = express.Router();

// Get all videos (paginated)
router.get('/', getVideos);

// Get a specific video by ID
router.get('/:id', getVideo);

// Get trending videos
router.get('/trending', getTrendingVideos);

// User history routes (protected)
router.get('/user/history', protect, getUserHistory);
router.delete('/user/history', protect, clearHistory);

module.exports = router; 