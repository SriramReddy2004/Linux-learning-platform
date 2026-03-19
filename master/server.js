require('dotenv').config();

const app = require('./src/config/express');
const { connectDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

// Start server
const startMaster = async () => {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Master service running on port ${PORT}`);
      logger.info(`📡 Load balance strategy: ${process.env.LOAD_BALANCE_STRATEGY || 'least-load'}`);
      logger.info(`💾 Database: MongoDB`);
      logger.info(`🐳 Worker support: Enabled`);
      logger.info(`↩️ Fallback to local: ${process.env.ENABLE_FALLBACK_LOCAL === 'true' ? 'Enabled' : 'Disabled'}`);
    });

    // Attach Socket.IO for terminals and realtime events
    try {
      const { initializeSocketIO } = require('./src/socket/socketManager');
      const io = initializeSocketIO(server);
      logger.info('Socket.IO initialized on master server');
    } catch (err) {
      logger.warn('Failed to initialize Socket.IO:', err.message);
    }

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Shutting down master service gracefully...');
      server.close(() => {
        logger.info('Master server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after 10 seconds');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start master service:', error.message);
    process.exit(1);
  }
};

startMaster();
