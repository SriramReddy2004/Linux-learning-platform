const WORKER_SECRET = process.env.WORKER_SECRET || 'worker-default-secret-change-this';

const generateWorkerToken = () => {
  // Simple token generation for worker authentication
  const payload = {
    type: 'worker',
    timestamp: Date.now(),
    workerId: process.env.WORKER_ID || 'worker-1'
  };

  // Base64 encode as a simple token (in production, use proper JWT)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const verifyWorkerToken = (token) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return decoded.type === 'worker';
  } catch (error) {
    return false;
  }
};

module.exports = {
  generateWorkerToken,
  verifyWorkerToken,
  WORKER_SECRET
};
