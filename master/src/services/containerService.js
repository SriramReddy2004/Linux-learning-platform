const { docker, DOCKER_CONFIG } = require('../config/docker');
const Container = require('../models/Container');
const workerRegistry = require('./workerRegistry');
const logger = require('../utils/logger');
const { URL } = require('url');

class ContainerService {
  async createContainer(userId, instanceName) {
    try {
      logger.info(`Master: Creating container for user: ${userId} with name: ${instanceName}`);

      // Try to get a healthy worker first
      const worker = workerRegistry.selectWorker();

      if (worker) {
        logger.info(`Assigning container creation to worker: ${worker.workerId}`);
        return await this.createContainerOnWorker(userId, worker, instanceName);
      } else {
        logger.warn('No healthy workers available, attempting local creation');
        if (process.env.ENABLE_FALLBACK_LOCAL === 'true' && docker) {
          return await this.createContainerLocal(userId, instanceName);
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
  async createContainerOnWorker(userId, worker, instanceName) {
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
        instanceName,
        sshPort: result.sshPort,
        status: 'running',
        startedAt: new Date(result.startedAt)
      });

      logger.info(`Container created on worker ${worker.workerId}: ${result.containerId}`);

      return {
        _id: containerDoc._id,
        containerId: result.containerId,
        instanceName: containerDoc.instanceName,
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
  async createContainerLocal(userId, instanceName) {
    try {
      if (!docker) {
        throw new Error('Docker not available for local creation');
      }

      logger.info(`Master: Creating container locally for user: ${userId} with name: ${instanceName}`);

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
        instanceName,
        sshPort: parseInt(sshPort),
        status: 'running',
        startedAt: new Date(info.State.StartedAt)
      });

      logger.info(`Container created locally: ${container.id} on port ${sshPort}`);

      return {
        _id: containerDoc._id,
        containerId: container.id,
        instanceName: containerDoc.instanceName,
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

  // Stop instance
  async stopContainer(containerId) {
    try {
      const instance = await Container.findOne({ _id: containerId });
      if (!instance) {
        throw new Error('Instance not found in database');
      }

      if (instance.createdOnWorker && instance.workerId) {
        logger.info(`Stopping instance on worker ${instance.workerId}: ${containerId}`);
        await workerRegistry.requestWorkerStopContainer(instance.workerId, containerId);
      } else if (!instance.createdOnWorker && docker) {
        logger.info(`Stopping local instance: ${instance.containerId}`);
        const dockerContainer = docker.getContainer(instance.containerId);
        await dockerContainer.stop({ t: 5 });
      }

      instance.status = 'stopped';
      instance.stoppedAt = new Date();
      await instance.save();

      logger.info(`Instance stopped: ${containerId}`);
    } catch (error) {
      logger.error('Error stopping instance:', error.message);
      throw error;
    }
  }

  // Restart instance
  async restartContainer(containerId) {
    try {
      const instance = await Container.findOne({ _id: containerId });
      if (!instance) {
        throw new Error('Instance not found in database');
      }
      containerId = instance.containerId;
      let result;
      if (instance.createdOnWorker && instance.workerId) {
        logger.info(`Restarting instance on worker ${instance.workerId}: ${containerId}`);
        result = await workerRegistry.requestWorkerRestartContainer(instance.workerId, containerId);
      } else if (!instance.createdOnWorker && docker) {
        logger.info(`Restarting local instance: ${containerId}`);
        const dockerContainer = docker.getContainer(containerId);
        await dockerContainer.restart({ t: 5 });
        const info = await dockerContainer.inspect();
        result = { sshPort: info.NetworkSettings.Ports['22/tcp']?.[0]?.HostPort };
      }

      instance.status = 'running';
      instance.sshPort = parseInt(result.sshPort);
      instance.lastActivityAt = new Date();
      await instance.save();

      logger.info(`Instance restarted: ${containerId}`);
      return result;
    } catch (error) {
      logger.error('Error restarting instance:', error.message);
      throw error;
    }
  }

  // Delete instance
  async deleteContainer(containerId) {
    try {
      const instance = await Container.findOne({ _id: containerId });
      if (!instance) {
        throw new Error('Instance not found in database');
      }

      if (instance.createdOnWorker && instance.workerId) {
        logger.info(`Deleting instance on worker ${instance.workerId}: ${containerId}`);
        await workerRegistry.requestWorkerDeleteContainer(instance.workerId, instance.containerId);
      } else if (!instance.createdOnWorker && docker) {
        logger.info(`Deleting local instance: ${containerId}`);
        const dockerContainer = docker.getContainer(instance.containerId);
        try {
          await dockerContainer.stop({ t: 5 });
        } catch (e) {
          // ignore stop errors
        }
        await dockerContainer.remove({ force: true });
      }

      await Container.deleteOne({ _id: containerId });
      logger.info(`Instance deleted: ${containerId}`);
    } catch (error) {
      logger.error('Error deleting instance:', error.message);
      throw error;
    }
  }

  // Get instance stats
  async getContainerStats(containerId) {
    try {
      const instance = await Container.findOne({ containerId });
      if (!instance) {
        throw new Error('Instance not found in database');
      }

      if (instance.createdOnWorker && instance.workerId) {
        logger.debug(`Getting stats from worker ${instance.workerId} for instance: ${containerId}`);
        return await workerRegistry.requestWorkerGetStats(instance.workerId, containerId);
      } else if (!instance.createdOnWorker && docker) {
        logger.debug(`Getting stats locally for instance: ${containerId}`);
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

  // Get user's instances
  async getUserContainers(userId, status = null) {
    try {
      const query = { userId };
      if (status) {
        query.status = status;
      }

      const instances = await Container.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

      return instances;
    } catch (error) {
      logger.error('Error getting user instances:', error.message);
      throw error;
    }
  }

  // Get instance by ID
  async getContainer(containerId) {
    try {
      const instance = await Container.findOne({ _id: containerId });
      logger.info(`Instance details: ${containerId} ------------ ${JSON.stringify(instance)}`);
      if (!instance) {
        throw new Error('Instance not found');
      }
      return instance;
    } catch (error) {
      logger.error('Error getting instance:', error.message);
      throw error;
    }
  }
}

module.exports = new ContainerService();
