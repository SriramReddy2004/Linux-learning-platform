const { docker } = require('../config/docker');
const logger = require('../utils/logger');
const axios = require('axios');

// Get worker health status
const getHealth = async (req, res, next) => {
  try {
    // Check Docker connection
    // const dockerInfo = await docker.getInfo();
    
    // Count running containers managed by this worker
    const containers = await docker.listContainers({ all: true, filters: { label: ['managedBy=worker'] } });
    const runningCount = containers.filter(c => c.State === 'running').length;

    const health = {
      status: 'healthy',
      workerId: process.env.WORKER_ID || 'worker-1',
      timestamp: new Date().toISOString(),
      docker: {
        active: true,
        // version: dockerInfo.ServerVersion,
        containersManaged: containers.length,
        containersRunning: runningCount
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    };

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error getting health status:', error.message);
    
    const health = {
      status: 'unhealthy',
      workerId: process.env.WORKER_ID || 'worker-1',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    };

    res.status(503).json({
      success: false,
      data: health
    });
  }
};

// Report health to master
const reportHealth = async (req, res, next) => {
  try {
    const masterUrl = process.env.MASTER_URL || 'http://localhost:3000';
    const workerId = process.env.WORKER_ID || 'worker-1';

    // Get current health
    // const dockerInfo = await docker.getInfo();
    const containers = await docker.listContainers({ all: true, filters: { label: ['managedBy=worker'] } });
    const runningCount = containers.filter(c => c.State === 'running').length;

    const healthReport = {
      workerId,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      docker: {
        active: true,
        // version: dockerInfo.ServerVersion,
        containersManaged: containers.length,
        containersRunning: runningCount
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    logger.info(`Reporting health to master: ${masterUrl}`);

    // Send health report to master
    try {
      await axios.post(`${masterUrl}/api/workers/${workerId}/health`, healthReport, {
        timeout: 5000
      });
      logger.info('Health report sent successfully');
    } catch (axiosError) {
      logger.warn(`Failed to report health to master: ${axiosError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Health report sent',
      data: healthReport
    });
  } catch (error) {
    logger.error('Error reporting health:', error.message);
    next(error);
  }
};

// Setup periodic health reporting
const setupHealthReporting = () => {
  const reportInterval = parseInt(process.env.HEALTH_REPORT_INTERVAL || '30000'); // 30 seconds

  setInterval(async () => {
    try {
      const masterUrl = process.env.MASTER_URL || 'http://localhost:3000';
      const workerId = process.env.WORKER_ID || 'worker-1';

      // const dockerInfo = await docker.getInfo();
      const containers = await docker.listContainers({ all: true, filters: { label: ['managedBy=worker'] } });
      const runningCount = containers.filter(c => c.State === 'running').length;

      const healthReport = {
        workerId,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        docker: {
          active: true,
          // version: dockerInfo.ServerVersion,
          containersManaged: containers.length,
          containersRunning: runningCount
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };

      try {
        await axios.post(`${masterUrl}/api/workers/${workerId}/health`, healthReport, {
          timeout: 5000
        });
        logger.info('Periodic health report sent');
      } catch (error) {
        logger.warn(`Periodic health report failed: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error in periodic health reporting:', error.message);
    }
  }, reportInterval);

  logger.info(`Health reporting started - interval: ${reportInterval}ms`);
};

module.exports = {
  getHealth,
  reportHealth,
  setupHealthReporting
};
