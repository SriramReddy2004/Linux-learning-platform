const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

// Public endpoints
router.post('/:workerId/health', workerController.receiveHealthReport);

// Admin/Internal endpoints
router.post('/register', workerController.registerWorker);
router.delete('/:workerId', workerController.unregisterWorker);
router.get('/', workerController.getWorkersStatus);
router.get('/:workerId', workerController.getWorkerStatus);
router.post('/:workerId/health-check', workerController.forceHealthCheck);

module.exports = router;
