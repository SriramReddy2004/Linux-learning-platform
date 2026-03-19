const { docker, DOCKER_CONFIG } = require('../config/docker');
const Container = require('../models/Container');
const workerRegistry = require('./workerRegistry');
const logger = require('../utils/logger');
const { URL } = require('url');

class ContainerService {
  async createContainer(userId) {
    try {
      logger.info(`Master: Creating container for user: ${userId}`);

      // Try to get a healthy worker first
      const worker = workerRegistry.selectWorker();

      if (worker) {
        logger.info(`Assigning container creation to worker: ${worker.workerId}`);
        return await this.createContainerOnWorker(userId, worker);
      } else {
        logger.warn('No healthy workers available, attempting local creation');
        if (process.env.ENABLE_FALLBACK_LOCAL === 'true' && docker) {
          return await this.createContainerLocal(userId);
        } else {
          throw new Error('No workers available and local fallback disabled');
        }
      }
    } catch (error) {
      logger.error('Error creating container:', error.message);
      throw error;
    }
  }

  // Create container on a worker
  async createContainerOnWorker(userId, worker) {
    try {
      const containerData = {
        userId,
        containerId: `${userId}-${Date.now()}`
      };

      const result = await workerRegistry.requestWorkerCreateContainer(worker.workerId, containerData);

      // Save to database
      // parse worker host from worker.url if present
      let workerHost = null;
      try {
        const parsed = new URL(worker.url);
        workerHost = parsed.hostname;
      } catch (e) {
        // fallback: use the raw url if parsing fails
        workerHost = worker.url;
      }

      const containerDoc = await Container.create({
        containerId: result.containerId,
        userId,
        workerId: worker.workerId,
        workerHost,
        createdOnWorker: true,
        image: result.image,
        sshPort: result.sshPort,
        status: 'running',
        startedAt: new Date(result.startedAt)
      });

      logger.info(`Container created on worker ${worker.workerId}: ${result.containerId}`);

      return {
        _id: containerDoc._id,
        containerId: result.containerId,
        sshPort: result.sshPort,
        image: result.image,
        status: 'running',
        startedAt: containerDoc.startedAt,
        workerId: worker.workerId,
        workerHost
      };
    } catch (error) {
      logger.error('Error creating container on worker:', error.message);
      throw error;
    }
  }

  // Create container locally (fallback)
  async createContainerLocal(userId) {
    try {
      if (!docker) {
        throw new Error('Docker not available for local creation');
      }

      logger.info(`Master: Creating container locally for user: ${userId}`);

      const container = await docker.createContainer({
        Image: DOCKER_CONFIG.image,
        Tty: true,
        Cmd: ['/usr/sbin/sshd', '-D'],
        ExposedPorts: { '22/tcp': {} },
        Hostname: 'ubuntu-lab',
        HostConfig: {
          AutoRemove: false,
          NetworkMode: 'egress_net',
          PortBindings: { '22/tcp': [{HostPort: '0'}]},
          CpuQuota: DOCKER_CONFIG.cpuQuota,
          Memory: DOCKER_CONFIG.memoryLimit
        },
        Labels: { 
          userId: userId.toString(),
          app: 'linux-learning-mentor',
          managedBy: 'worker'
        }
      });

      await container.start();
      const info = await container.inspect();
      const sshPort = info.NetworkSettings.Ports['22/tcp'][0].HostPort;

      const containerDoc = await Container.create({
        containerId: container.id,
        userId,
        createdOnWorker: false,
        image: DOCKER_CONFIG.image,
        sshPort: parseInt(sshPort),
        status: 'running',
        startedAt: new Date(info.State.StartedAt)
      });

      logger.info(`Container created locally: ${container.id} on port ${sshPort}`);

      return {
        _id: containerDoc._id,
        containerId: container.id,
        sshPort: parseInt(sshPort),
        image: DOCKER_CONFIG.image,
        status: 'running',
        startedAt: containerDoc.startedAt,
        createdLocally: true
      };
    } catch (error) {
      logger.error('Error creating container locally:', error.message);
      throw error;
    }
  }

  // Stop container
  async stopContainer(containerId) {
    try {
      const container = await Container.findOne({ _id: containerId });
      if (!container) {
        throw new Error('Container not found in database');
      }

      if (container.createdOnWorker && container.workerId) {
        logger.info(`Stopping container on worker ${container.workerId}: ${containerId}`);
        await workerRegistry.requestWorkerStopContainer(container.workerId, containerId);
      } else if (!container.createdOnWorker && docker) {
        logger.info(`Stopping local container: ${container.containerId}`);
        const dockerContainer = docker.getContainer(container.containerId);
        await dockerContainer.stop({ t: 5 });
      }

      container.status = 'stopped';
      container.stoppedAt = new Date();
      await container.save();

      logger.info(`Container stopped: ${containerId}`);
    } catch (error) {
      logger.error('Error stopping container:', error.message);
      throw error;
    }
  }

  // Restart container
  async restartContainer(containerId) {
    try {
      const container = await Container.findOne({ _id: containerId });
      if (!container) {
        throw new Error('Container not found in database');
      }
      containerId = container.containerId;
      let result;
      if (container.createdOnWorker && container.workerId) {
        logger.info(`Restarting container on worker ${container.workerId}: ${containerId}`);
        result = await workerRegistry.requestWorkerRestartContainer(container.workerId, containerId);
      } else if (!container.createdOnWorker && docker) {
        logger.info(`Restarting local container: ${containerId}`);
        const dockerContainer = docker.getContainer(containerId);
        await dockerContainer.restart({ t: 5 });
        const info = await dockerContainer.inspect();
        result = { sshPort: info.NetworkSettings.Ports['22/tcp']?.[0]?.HostPort };
      }

      container.status = 'running';
      container.sshPort = parseInt(result.sshPort);
      container.lastActivityAt = new Date();
      await container.save();

      logger.info(`Container restarted: ${containerId}`);
      return result;
    } catch (error) {
      logger.error('Error restarting container:', error.message);
      throw error;
    }
  }

  // Delete container
  async deleteContainer(containerId) {
    try {
      const container = await Container.findOne({ _id: containerId });
      if (!container) {
        throw new Error('Container not found in database');
      }

      if (container.createdOnWorker && container.workerId) {
        logger.info(`Deleting container on worker ${container.workerId}: ${containerId}`);
        await workerRegistry.requestWorkerDeleteContainer(container.workerId, container.containerId);
      } else if (!container.createdOnWorker && docker) {
        logger.info(`Deleting local container: ${containerId}`);
        const dockerContainer = docker.getContainer(container.containerId);
        try {
          await dockerContainer.stop({ t: 5 });
        } catch (e) {
          // ignore stop errors
        }
        await dockerContainer.remove({ force: true });
      }

      await Container.deleteOne({ _id: containerId });
      logger.info(`Container deleted: ${containerId}`);
    } catch (error) {
      logger.error('Error deleting container:', error.message);
      throw error;
    }
  }

  // Get container stats
  async getContainerStats(containerId) {
    try {
      const container = await Container.findOne({ containerId });
      if (!container) {
        throw new Error('Container not found in database');
      }

      if (container.createdOnWorker && container.workerId) {
        logger.debug(`Getting stats from worker ${container.workerId} for container: ${containerId}`);
        return await workerRegistry.requestWorkerGetStats(container.workerId, containerId);
      } else if (!container.createdOnWorker && docker) {
        logger.debug(`Getting stats locally for container: ${containerId}`);
        const dockerContainer = docker.getContainer(containerId);
        const stats = await dockerContainer.stats({ stream: false });

        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - 
                         stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - 
                            stats.precpu_stats.system_cpu_usage;
        const cpuPercent = (cpuDelta / systemDelta) * 
                           stats.cpu_stats.online_cpus * 100;

        return {
          cpuPercent: cpuPercent.toFixed(2),
          memoryUsage: stats.memory_stats.usage,
          memoryLimit: stats.memory_stats.limit,
          memoryPercent: ((stats.memory_stats.usage / stats.memory_stats.limit) * 100).toFixed(2),
          networkRx: stats.networks?.eth0?.rx_bytes || 0,
          networkTx: stats.networks?.eth0?.tx_bytes || 0
        };
      }
    } catch (error) {
      logger.error('Error getting container stats:', error.message);
      throw error;
    }
  }

  // Get user's containers
  async getUserContainers(userId, status = null) {
    try {
      const query = { userId };
      if (status) {
        query.status = status;
      }

      const containers = await Container.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

      return containers;
    } catch (error) {
      logger.error('Error getting user containers:', error.message);
      throw error;
    }
  }

  // Get container by ID
  async getContainer(containerId) {
    try {
      const container = await Container.findOne({ _id: containerId });
      logger.info(`Container details: ${containerId} ------------ ${JSON.stringify(container)}`);
      if (!container) {
        throw new Error('Container not found');
      }
      return container;
    } catch (error) {
      logger.error('Error getting container:', error.message);
      throw error;
    }
  }
}

module.exports = new ContainerService();
