const axios = require('axios');
const logger = require('../utils/logger');

class WorkerRegistry {
  constructor() {
    this.workers = new Map(); // workerId -> worker data
    this.workerHealth = new Map(); // workerId -> health info
    this.healthCheckInterval = parseInt(process.env.WORKER_HEALTH_CHECK_INTERVAL || '30000');
    this.healthTimeout = parseInt(process.env.WORKER_HEALTH_TIMEOUT || '10000');
    this.loadBalanceStrategy = process.env.LOAD_BALANCE_STRATEGY || 'least-load';
    this.startHealthMonitoring();
  }

  // Register a worker
  registerWorker(workerId, workerUrl, metadata = {}) {
    const worker = {
      workerId,
      url: workerUrl,
      status: 'unknown',
      lastHeartbeat: null,
      containersCount: 0,
      containersRunning: 0,
      healthScore: 100,
      metadata,
      registeredAt: new Date()
    };

    this.workers.set(workerId, worker);
    logger.info(`Worker registered: ${workerId} at ${workerUrl}`);
    
    // Immediately check health
    this.checkWorkerHealth(workerId);
    
    return worker;
  }

  // Unregister a worker
  unregisterWorker(workerId) {
    this.workers.delete(workerId);
    this.workerHealth.delete(workerId);
    logger.info(`Worker unregistered: ${workerId}`);
  }

  // Check health of a specific worker
  async checkWorkerHealth(workerId) {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    try {
      const response = await axios.get(`${worker.url}/health`, {
        timeout: this.healthTimeout
      });

      const health = response.data.data;
      worker.status = 'healthy';
      worker.lastHeartbeat = new Date();
      worker.containersCount = health.docker?.containersManaged || 0;
      worker.containersRunning = health.docker?.containersRunning || 0;
      worker.healthScore = 100;

      this.workerHealth.set(workerId, health);
      logger.debug(`Health check passed for worker: ${workerId}`);
    } catch (error) {
      worker.status = 'unhealthy';
      worker.healthScore = Math.max(0, worker.healthScore - 25);
      logger.warn(`Health check failed for worker ${workerId}: ${error.message}`);

      if (worker.healthScore <= 0) {
        logger.error(`Worker marked as dead: ${workerId}`);
        worker.status = 'dead';
      }
    }
  }

  // Start periodic health monitoring
  startHealthMonitoring() {
    setInterval(async () => {
      for (const [workerId] of this.workers) {
        await this.checkWorkerHealth(workerId);
      }
    }, this.healthCheckInterval);

    logger.info(`Health monitoring started - interval: ${this.healthCheckInterval}ms`);
  }

  // Get list of healthy workers
  getHealthyWorkers() {
    return Array.from(this.workers.values()).filter(w => w.status === 'healthy');
  }

  // Select best worker based on load balancing strategy
  selectWorker() {
    const healthyWorkers = this.getHealthyWorkers();
    
    if (healthyWorkers.length === 0) {
      return null;
    }

    switch (this.loadBalanceStrategy) {
      case 'least-load':
        return this.selectLeastLoadWorker(healthyWorkers);
      case 'round-robin':
        return this.selectRoundRobinWorker(healthyWorkers);
      case 'random':
        return healthyWorkers[Math.floor(Math.random() * healthyWorkers.length)];
      default:
        return this.selectLeastLoadWorker(healthyWorkers);
    }
  }

  // Least load algorithm - select worker with fewest running containers
  selectLeastLoadWorker(workers) {
    return workers.reduce((best, current) => {
      return current.containersRunning < best.containersRunning ? current : best;
    });
  }

  // Round robin algorithm
  selectRoundRobinWorker(workers) {
    if (!this.roundRobinIndex) {
      this.roundRobinIndex = 0;
    }
    const worker = workers[this.roundRobinIndex % workers.length];
    this.roundRobinIndex++;
    return worker;
  }

  // Request worker to create container
  async requestWorkerCreateContainer(workerId, containerData) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker not found: ${workerId}`);
    }

    try {
      logger.info(`Requesting worker ${workerId} to create container for user ${containerData.userId}`);
      
      const response = await axios.post(`${worker.url}/api/containers`, containerData, {
        timeout: 30000
      });

      logger.info(`Container creation successful on worker ${workerId}`);
      return response.data.data;
    } catch (error) {
      logger.error(`Container creation failed on worker ${workerId}:`, error.message);
      worker.healthScore = Math.max(0, worker.healthScore - 10);
      throw error;
    }
  }

  // Request worker to stop container
  async requestWorkerStopContainer(workerId, containerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker not found: ${workerId}`);
    }

    try {
      const response = await axios.post(`${worker.url}/api/containers/${containerId}/stop`, {}, {
        timeout: 15000
      });
      return response.data.data;
    } catch (error) {
      logger.error(`Container stop failed on worker ${workerId}:`, error.message);
      throw error;
    }
  }

  // Request worker to restart container
  async requestWorkerRestartContainer(workerId, containerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker not found: ${workerId}`);
    }

    try {
      const response = await axios.post(`${worker.url}/api/containers/${containerId}/restart`, {}, {
        timeout: 15000
      });
      return response.data.data;
    } catch (error) {
      logger.error(`Container restart failed on worker ${workerId}:`, error.message);
      throw error;
    }
  }

  // Request worker to delete container
  async requestWorkerDeleteContainer(workerId, containerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker not found: ${workerId}`);
    }

    try {
      const response = await axios.delete(`${worker.url}/api/containers/${containerId}`, {
        timeout: 15000
      });
      return response.data.data;
    } catch (error) {
      logger.error(`Container deletion failed on worker ${workerId}:`, error.message);
      throw error;
    }
  }

  // Request worker to get container stats
  async requestWorkerGetStats(workerId, containerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker not found: ${workerId}`);
    }

    try {
      const response = await axios.get(`${worker.url}/api/containers/${containerId}/stats`, {
        timeout: 10000
      });
      return response.data.data;
    } catch (error) {
      logger.error(`Get stats failed on worker ${workerId}:`, error.message);
      throw error;
    }
  }

  // Get all workers status
  getWorkersStatus() {
    return Array.from(this.workers.values()).map(w => ({
      workerId: w.workerId,
      url: w.url,
      status: w.status,
      containersManaged: w.containersCount,
      containersRunning: w.containersRunning,
      healthScore: w.healthScore,
      lastHeartbeat: w.lastHeartbeat
    }));
  }

  // Get worker count by status
  getWorkerStats() {
    const status = this.getWorkersStatus();
    return {
      total: status.length,
      healthy: status.filter(w => w.status === 'healthy').length,
      unhealthy: status.filter(w => w.status === 'unhealthy').length,
      dead: status.filter(w => w.status === 'dead').length,
      totalContainers: status.reduce((sum, w) => sum + w.containersManaged, 0),
      totalRunning: status.reduce((sum, w) => sum + w.containersRunning, 0)
    };
  }
}

module.exports = new WorkerRegistry();
