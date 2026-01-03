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

    const containers = await containerService.getUserContainers(userId, status);

    res.status(200).json({
      success: true,
      data: { containers }
    });
  } catch (error) {
    next(error);
  }
};

// Get specific container
exports.getContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const container = await containerService.getContainer(id);

    if (container.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this container'
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

    const container = await containerService.getContainer(id);

    if (container.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this container'
      });
    }

    await containerService.stopContainer(id);

    res.status(200).json({
      success: true,
      message: 'Container stopped successfully'
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

    const container = await containerService.getContainer(id);

    if (container.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this container'
      });
    }

    const result = await containerService.restartContainer(id);

    res.status(200).json({
      success: true,
      message: 'Container restarted successfully',
      data: result
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

    const container = await containerService.getContainer(id);

    if (container.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this container'
      });
    }

    await containerService.deleteContainer(id);

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

    const container = await containerService.getContainer(id);

    if (container.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this container'
      });
    }

    const stats = await containerService.getContainerStats(id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
