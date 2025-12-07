const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { protect } = require('../middlewares/auth');
const sessionService = require('../services/sessionService');

// All routes are protected
router.use(protect);

// Get user sessions
router.get('/', async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
});

// Get session by ID
router.get('/:id', async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('containerId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
