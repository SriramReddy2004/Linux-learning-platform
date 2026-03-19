const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// GET health status
router.get('/', healthController.getHealth);

// POST health report to master
router.post('/report', healthController.reportHealth);

module.exports = router;
