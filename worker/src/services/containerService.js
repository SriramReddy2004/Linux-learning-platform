const { docker, DOCKER_CONFIG } = require('../config/docker');
const logger = require('../utils/logger');

class ContainerService {
  async createContainer(containerData) {
    try {
      const { userId, containerId: clientContainerId } = containerData;
      
      logger.info(`Worker: Creating container for user: ${userId}`);

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
          clientContainerId: clientContainerId,
          app: 'linux-learning-mentor',
          managedBy: 'worker'
        },
      });

      // Start the container
      await container.start();

      // Get container info
      const info = await container.inspect();
      const sshPort = info.NetworkSettings.Ports['22/tcp'][0].HostPort;

      logger.info(`Worker: Container created successfully: ${container.id} on port ${sshPort}`);

      return {
        containerId: container.id,
        sshPort: parseInt(sshPort),
        image: DOCKER_CONFIG.image,
        status: 'running',
        startedAt: new Date(info.State.StartedAt),
        workerId: process.env.WORKER_ID || 'worker-1'
      };
    } catch (error) {
      logger.error('Worker: Error creating container:', error.message);
      throw error;
    }
  }

  async stopContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      await container.stop({ t: 5 }); // 5 second timeout
      logger.info(`Worker: Container stopped: ${containerId}`);
      return { success: true, containerId };
    } catch (error) {
      if (error.statusCode === 304) {
        logger.warn(`Worker: Container already stopped: ${containerId}`);
        return { success: true, containerId };
      } else if (error.statusCode === 404) {
        logger.warn(`Worker: Container not found: ${containerId}`);
        return { success: false, error: 'Container not found' };
      } else {
        throw error;
      }
    }
  }

  async restartContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      
      // Use restart to properly restart the container
      await container.restart({ t: 5 }); // 5 second timeout
      
      
      // Get updated container info to ensure port mapping is correct
      const info = await container.inspect();
      
      if (!info.State.Running) {
        throw new Error('Container failed to restart');
      }
      
      // Get the SSH port
      const sshPort = info.NetworkSettings.Ports['22/tcp']?.[0]?.HostPort;
      
      logger.info(`Worker: Container restarted: ${containerId} on port ${sshPort}`);
      
      return { 
        success: true,
        containerId,
        sshPort: parseInt(sshPort) 
      };
    } catch (error) {
      logger.error('Worker: Error restarting container:', error.message);
      throw error;
    }
  }

  async deleteContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      
      // Stop if running
      try {
        await container.stop({ t: 5 });
      } catch (error) {
        if (error.statusCode !== 304 && error.statusCode !== 404) {
          throw error;
        }
      }
      
      // Remove container
      await container.remove();
      
      logger.info(`Worker: Container deleted: ${containerId}`);
      return { success: true, containerId };
    } catch (error) {
      if (error.statusCode === 404) {
        logger.warn(`Worker: Container not found for deletion: ${containerId}`);
        return { success: false, error: 'Container not found' };
      }
      logger.error('Worker: Error deleting container:', error.message);
      throw error;
    }
  }

  async getContainerStats(containerId) {
    try {
      const container = docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      
      // Calculate CPU percentage
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
      const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
      const cpuPercent = (cpuDelta / systemDelta) * 100.0;

      // Memory stats
      const memoryUsage = stats.memory_stats.usage;
      const memoryLimit = stats.memory_stats.limit;
      const memoryPercent = (memoryUsage / memoryLimit) * 100;

      return {
        containerId,
        cpu: {
          percent: isFinite(cpuPercent) ? cpuPercent.toFixed(2) : 0,
          usage: stats.cpu_stats.cpu_usage.total_usage
        },
        memory: {
          usage: memoryUsage,
          limit: memoryLimit,
          percent: memoryPercent.toFixed(2)
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Worker: Error getting container stats:', error.message);
      throw error;
    }
  }

  async getContainerInfo(containerId) {
    try {
      const container = docker.getContainer(containerId);
      const info = await container.inspect();

      return {
        containerId: info.Id,
        image: info.Config.Image,
        status: info.State.Running ? 'running' : 'stopped',
        sshPort: info.NetworkSettings.Ports['22/tcp']?.[0]?.HostPort,
        createdAt: info.Created,
        startedAt: info.State.StartedAt,
        labels: info.Config.Labels
      };
    } catch (error) {
      logger.error('Worker: Error getting container info:', error.message);
      throw error;
    }
  }
}

module.exports = new ContainerService();
