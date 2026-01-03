const express = require('express');
const authRoutes = require('./authRoutes');
const containerRoutes = require('./containerRoutes');
const workerRoutes = require('./workerRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/containers', containerRoutes);
router.use('/workers', workerRoutes);

module.exports = router;
