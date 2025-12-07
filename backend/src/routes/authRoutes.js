const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { authLimiter } = require('../middlewares/rateLimiter');
const { 
  registerValidator, 
  loginValidator, 
  changePasswordValidator 
} = require('../validators/authValidator');

// Public routes
router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put('/password', protect, changePasswordValidator, validate, authController.changePassword);

module.exports = router;
