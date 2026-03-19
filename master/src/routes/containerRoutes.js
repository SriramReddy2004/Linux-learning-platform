const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

router.post('/', containerController.createContainer);
router.get('/', containerController.getUserContainers);
router.get('/:id', containerController.getContainer);
router.post('/:id/stop', containerController.stopContainer);
router.post('/:id/restart', containerController.restartContainer);
router.delete('/:id', containerController.deleteContainer);
router.get('/:id/stats', containerController.getContainerStats);

module.exports = router;
