const containerService = require('../services/containerService');
const Container = require('../models/Container');
const logger = require('../utils/logger');

// Create new container
exports.createContainer = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user already has active container
    const activeContainer = await Container.findOne({
      userId,
      status: { $in: ['created', 'running'] }
    });

    if (activeContainer) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active container. Please stop it first.'
      });
    }

    const containerData = await containerService.createContainer(userId);

    res.status(201).json({
      success: true,
      message: 'Container created successfully',
      data: containerData
    });
  } catch (error) {
    next(error);
  }
};

// Get user's containers
exports.getUserContainers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const containers = await Container.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: containers.length,
      data: { containers }
    });
  } catch (error) {
    next(error);
  }
};

// Get container by ID
exports.getContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const container = await Container.findOne({ 
      _id: id, 
      userId 
    });

    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Container not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { container }
    });
  } catch (error) {
    next(error);
  }
};

// Stop container
exports.stopContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const container = await Container.findOne({ 
      _id: id, 
      userId 
    });

    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Container not found'
      });
    }

    await containerService.stopContainer(container.containerId);

    container.status = 'stopped';
    container.stoppedAt = new Date();
    await container.save();

    logger.info(`Container stopped: ${container.containerId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Container stopped successfully',
      data: { container }
    });
  } catch (error) {
    next(error);
  }
};


// Restart container
exports.restartContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const container = await Container.findOne({ 
      _id: id, 
      userId 
    });

    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Container not found'
      });
    }

    if (container.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Container is already running'
      });
    }

    await containerService.restartContainer(container.containerId);

    container.status = 'running';
    container.startedAt = new Date();
    container.stoppedAt = null;
    await container.save();

    logger.info(`Container restarted: ${container.containerId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Container restarted successfully',
      data: { container }
    });
  } catch (error) {
    next(error);
  }
};

// Delete container
exports.deleteContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const container = await Container.findOne({ 
      _id: id, 
      userId 
    });

    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Container not found'
      });
    }

    // Stop container if running
    if (container.status === 'running') {
      await containerService.stopContainer(container.containerId);
    }

    await Container.findByIdAndDelete(id);

    logger.info(`Container deleted: ${container.containerId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Container deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get container stats
exports.getContainerStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const container = await Container.findOne({ 
      _id: id, 
      userId 
    });

    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Container not found'
      });
    }

    const stats = await containerService.getContainerStats(container.containerId);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};
