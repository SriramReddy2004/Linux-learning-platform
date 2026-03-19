const Docker = require('dockerode');
const os = require('os');
const logger = require('../utils/logger');

// Auto-detect Docker connection based on platform
const getDockerConnection = () => {
  return new Docker({ host: process.env.DOCKER_HOST, port: process.env.DOCKER_PORT });
  if (process.env.DOCKER_HOST) {
    return new Docker({ socketPath: process.env.DOCKER_HOST });
  }

  if (os.platform() === 'win32') {
    return new Docker({ host: 'localhost', port: 2375 });
  }

  return new Docker({ socketPath: '/var/run/docker.sock' });
};

const docker = getDockerConnection();

// Test Docker connection
docker.ping()
  .then(() => logger.info('✅ Docker connection established'))
  .catch((err) => logger.error('❌ Docker connection failed:', err.message));

const DOCKER_CONFIG = {
  image: process.env.DOCKER_IMAGE || 'play-with-linux',
  cpuQuota: parseInt(process.env.CONTAINER_CPU_QUOTA) || 50000,
  memoryLimit: parseInt(process.env.CONTAINER_MEMORY_LIMIT) || 512 * 1024 * 1024,
  sshUsername: 'user',
  sshPassword: 'user',
};

module.exports = { docker, DOCKER_CONFIG };
