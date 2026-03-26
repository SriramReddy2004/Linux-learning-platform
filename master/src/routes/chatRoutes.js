const express = require('express');
const { protect } = require('../middlewares/auth.js');
const { streamChat, getAvailableModels } = require('../controllers/chatController.js');

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Get available AI models
router.get('/models', getAvailableModels);

// Stream chat response
router.post('/', streamChat);

module.exports = router;
