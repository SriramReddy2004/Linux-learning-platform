const workerRegistry = require('../services/workerRegistry');
const logger = require('../utils/logger');

// Register a worker
exports.registerWorker = (req, res, next) => {
  try {
    const { workerId, workerUrl, metadata } = req.body;

    if (!workerId || !workerUrl) {
      return res.status(400).json({
        success: false,
        message: 'workerId and workerUrl are required'
      });
    }

    const worker = workerRegistry.registerWorker(workerId, workerUrl, metadata);

    res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// Unregister a worker
exports.unregisterWorker = (req, res, next) => {
  try {
    const { workerId } = req.params;

    workerRegistry.unregisterWorker(workerId);

    res.status(200).json({
      success: true,
      message: 'Worker unregistered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Receive health report from worker
exports.receiveHealthReport = (req, res, next) => {
  try {
    const { workerId } = req.params;
    const health = req.body;

    const worker = workerRegistry.workers.get(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Update worker health
    worker.status = health.status || 'healthy';
    worker.lastHeartbeat = new Date();
    worker.containersCount = health.docker?.containersManaged || 0;
    worker.containersRunning = health.docker?.containersRunning || 0;

    logger.debug(`Health report received from worker ${workerId}`);

    res.status(200).json({
      success: true,
      message: 'Health report received'
    });
  } catch (error) {
    next(error);
  }
};

// Get all workers status
exports.getWorkersStatus = (req, res, next) => {
  try {
    const status = workerRegistry.getWorkersStatus();
    const stats = workerRegistry.getWorkerStats();

    res.status(200).json({
      success: true,
      data: {
        workers: status,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get specific worker status
exports.getWorkerStatus = (req, res, next) => {
  try {
    const { workerId } = req.params;

    const worker = workerRegistry.workers.get(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// Force health check for a worker
exports.forceHealthCheck = async (req, res, next) => {
  try {
    const { workerId } = req.params;

    const worker = workerRegistry.workers.get(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    await workerRegistry.checkWorkerHealth(workerId);

    res.status(200).json({
      success: true,
      message: 'Health check completed',
      data: worker
    });
  } catch (error) {
    next(error);
  }
};
