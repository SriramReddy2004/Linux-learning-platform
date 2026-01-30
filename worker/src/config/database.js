const logger = require('../utils/logger');

// Worker doesn't need database connection
// All data is managed by the master backend
const connectDatabase = async () => {
  logger.info('Worker: Database connection not required (managed by master backend)');
};

module.exports = { connectDatabase };
