const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getUserHistory, clearHistory } = require('../controllers/videoController');

const router = express.Router();

// Watch history routes (protected)
router.get('/history', protect, getUserHistory);
router.delete('/history', protect, clearHistory);

module.exports = router; 