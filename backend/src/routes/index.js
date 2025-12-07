const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const containerRoutes = require('./containerRoutes');
const sessionRoutes = require('./sessionRoutes');
const userRoutes = require('./userRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/containers', containerRoutes);
router.use('/sessions', sessionRoutes);
router.use('/users', userRoutes);

module.exports = router;
