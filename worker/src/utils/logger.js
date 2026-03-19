const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const logger = {
  info: (message) => {
    const log = `[${getTimestamp()}] [INFO] ${message}`;
    console.log(log);
    fs.appendFileSync(path.join(logsDir, 'worker.log'), log + '\n');
  },
  error: (message, error = '') => {
    const log = `[${getTimestamp()}] [ERROR] ${message} ${error}`;
    console.error(log);
    fs.appendFileSync(path.join(logsDir, 'error.log'), log + '\n');
  },
  warn: (message) => {
    const log = `[${getTimestamp()}] [WARN] ${message}`;
    console.warn(log);
    fs.appendFileSync(path.join(logsDir, 'worker.log'), log + '\n');
  }
};

module.exports = logger;
