require('dotenv').config();

const app = require('./src/config/express');
const { setupHealthReporting } = require('./src/controllers/healthController');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;
const WORKER_ID = process.env.WORKER_ID || 'worker-1';
const axios = require('axios');
const os = require('os');

// Start server
const startWorker = async () => {
  try {

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Worker ${WORKER_ID} running on port ${PORT}`);
      logger.info(`📡 Master URL: ${process.env.MASTER_URL || 'http://localhost:3000'}`);
      logger.info(`🐳 Docker integration: Enabled`);
    });

    // Attempt to register with master
    const registerWithMaster = async () => {
      const masterUrl = process.env.MASTER_URL || 'http://localhost:3000';
      const workerUrl = process.env.WORKER_URL || `http://${process.env.WORKER_HOST || os.hostname()}:${PORT}`;
      const registerBody = {
        workerId: WORKER_ID,
        workerUrl,
        metadata: {
          hostname: os.hostname(),
          port: PORT
        }
      };

      const maxAttempts = 5;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          logger.info(`Registering worker with master (attempt ${attempt}) at ${masterUrl}`);
          await axios.post(`${masterUrl}/api/workers/register`, registerBody, { timeout: 5000 });
          logger.info('Worker registered with master successfully');
          return;
        } catch (err) {
          logger.warn(`Worker registration attempt ${attempt} failed: ${err.message}`);
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          logger.error('Worker failed to register with master after multiple attempts');
        }
      }
    };

    await registerWithMaster();

    // Setup periodic health reporting to master
    setupHealthReporting();

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Shutting down worker gracefully...');
      server.close(() => {
        logger.info('Worker server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after 10 seconds');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start worker:', error.message);
    process.exit(1);
  }
};

startWorker();
