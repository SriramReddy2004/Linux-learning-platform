const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');

// Create container - POST request from master
router.post('/', containerController.createContainer);

// Stop container
router.post('/:containerId/stop', containerController.stopContainer);

// Restart container
router.post('/:containerId/restart', containerController.restartContainer);

// Delete container
router.delete('/:containerId', containerController.deleteContainer);

// Get container stats
router.get('/:containerId/stats', containerController.getContainerStats);

// Get container info
router.get('/:containerId/info', containerController.getContainerInfo);

module.exports = router;
