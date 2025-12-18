const { docker, DOCKER_CONFIG } = require('../config/docker');
const Container = require('../models/Container');
const logger = require('../utils/logger');

class ContainerService {
  async createContainer(userId) {
    try {
      logger.info(`Creating container for user: ${userId}`);

      // Create container with SSH
      const container = await docker.createContainer({
        Image: DOCKER_CONFIG.image,
        Tty: true,
        Cmd: ['/usr/sbin/sshd', '-D'],
        ExposedPorts: { '22/tcp': {} },
        Hostname: 'ubuntu-lab',
        HostConfig: {
          AutoRemove: false,
          PortBindings: { '22/tcp': [{ HostPort: '0' }] },
          CpuQuota: DOCKER_CONFIG.cpuQuota,
          Memory: DOCKER_CONFIG.memoryLimit,
        },
        Labels: { 
          userId: userId.toString(),
          app: 'linux-learning-mentor'
        },
      });

      // Start the container
      await container.start();

      // Get container info
      const info = await container.inspect();
      const sshPort = info.NetworkSettings.Ports['22/tcp'][0].HostPort;

      // Save to database
      const containerDoc = await Container.create({
        containerId: container.id,
        userId,
        image: DOCKER_CONFIG.image,
        sshPort: parseInt(sshPort),
        status: 'running',
        startedAt: new Date(info.State.StartedAt)
      });

      logger.info(`Container created successfully: ${container.id} on port ${sshPort}`);

      return {
        _id: containerDoc._id,
        containerId: container.id,
        sshPort: parseInt(sshPort),
        image: DOCKER_CONFIG.image,
        status: 'running',
        startedAt: containerDoc.startedAt
      };
    } catch (error) {
      logger.error('Error creating container:', error);
      throw error;
    }
  }

  async stopContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      await container.stop({ t: 5 }); // 5 second timeout
      logger.info(`Container stopped: ${containerId}`);
    } catch (error) {
      if (error.statusCode === 304) {
        logger.warn(`Container already stopped: ${containerId}`);
      } else if (error.statusCode === 404) {
        logger.warn(`Container not found: ${containerId}`);
      } else {
        throw error;
      }
    }
  }

  async restartContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      await container.restart({ t: 5 }); // 5 second timeout
      logger.info(`Container restarted: ${containerId}`);
    } catch (error) {
      if (error.statusCode === 404) {
        logger.warn(`Container not found: ${containerId}`);
      } else {
        throw error;
      }
    }
  }

  async removeContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);

      // Try to stop first (ignore already stopped / missing)
      try {
        await container.stop({ t: 5 });
      } catch (stopErr) {
        // ignore 304 (already stopped) and 404 (not found)
        if (!(stopErr && stopErr.statusCode && [304, 404].includes(stopErr.statusCode))) {
          throw stopErr;
        }
      }

      // Remove container forcefully to ensure it is cleaned up
      await container.remove({ force: true, v: false });
      logger.info(`Container permanently removed: ${containerId}`);
    } catch (error) {
      if (error && error.statusCode === 404) {
        logger.warn(`Container not found: ${containerId}`);
      } else if (error && error.statusCode === 409) {
        logger.warn(`Container removal conflict (in use): ${containerId}`);
      } else {
        logger.error('Error removing container:', error);
        throw error;
      }
    }
  }

  async getContainerStats(containerId) {
    try {
      const container = docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

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
    } catch (error) {
      logger.error('Error getting container stats:', error);
      throw error;
    }
  }

  async listContainers(filters = {}) {
    try {
      const containers = await docker.listContainers({
        all: true,
        filters: JSON.stringify(filters)
      });
      return containers;
    } catch (error) {
      logger.error('Error listing containers:', error);
      throw error;
    }
  }

  async cleanupOrphanedContainers() {
    try {
      const containers = await this.listContainers({
        label: ['app=linux-learning-mentor']
      });

      for (const containerInfo of containers) {
        const container = docker.getContainer(containerInfo.Id);
        const uptime = Date.now() - (containerInfo.Created * 1000);

        // Stop containers older than 2 hours
        if (uptime > 2 * 60 * 60 * 1000) {
          await this.stopContainer(containerInfo.Id);
          logger.info(`Cleaned up old container: ${containerInfo.Id}`);
        }
      }
    } catch (error) {
      logger.error('Error cleaning up containers:', error);
    }
  }
}

module.exports = new ContainerService();
