const containerService = require('../services/containerService');
const logger = require('../utils/logger');

// Create container - receives request from master
exports.createContainer = async (req, res, next) => {
  try {
    const containerData = req.body;

    if (!containerData.userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    logger.info(`Controller: Received container creation request for user: ${containerData.userId}`);

    const result = await containerService.createContainer(containerData);

    res.status(201).json({
      success: true,
      message: 'Container created successfully on worker',
      data: result
    });
  } catch (error) {
    logger.error('Controller error creating container:', error.message);
    next(error);
  }
};

// Stop container
exports.stopContainer = async (req, res, next) => {
  try {
    const { containerId } = req.params;

    if (!containerId) {
      return res.status(400).json({
        success: false,
        message: 'containerId is required'
      });
    }

    const result = await containerService.stopContainer(containerId);

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Container stopped successfully' : result.error,
      data: result
    });
  } catch (error) {
    logger.error('Controller error stopping container:', error.message);
    next(error);
  }
};

// Restart container
exports.restartContainer = async (req, res, next) => {
  try {
    const { containerId } = req.params;

    if (!containerId) {
      return res.status(400).json({
        success: false,
        message: 'containerId is required'
      });
    }

    const result = await containerService.restartContainer(containerId);

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Container restarted successfully' : 'Failed to restart container',
      data: result
    });
  } catch (error) {
    logger.error('Controller error restarting container:', error.message);
    next(error);
  }
};

// Delete container
exports.deleteContainer = async (req, res, next) => {
  try {
    const { containerId } = req.params;

    if (!containerId) {
      return res.status(400).json({
        success: false,
        message: 'containerId is required'
      });
    }

    const result = await containerService.deleteContainer(containerId);

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Container deleted successfully' : result.error,
      data: result
    });
  } catch (error) {
    logger.error('Controller error deleting container:', error.message);
    next(error);
  }
};

// Get container stats
exports.getContainerStats = async (req, res, next) => {
  try {
    const { containerId } = req.params;

    if (!containerId) {
      return res.status(400).json({
        success: false,
        message: 'containerId is required'
      });
    }

    const stats = await containerService.getContainerStats(containerId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Controller error getting stats:', error.message);
    next(error);
  }
};

// Get container info
exports.getContainerInfo = async (req, res, next) => {
  try {
    const { containerId } = req.params;

    if (!containerId) {
      return res.status(400).json({
        success: false,
        message: 'containerId is required'
      });
    }

    const info = await containerService.getContainerInfo(containerId);

    res.status(200).json({
      success: true,
      data: info
    });
  } catch (error) {
    logger.error('Controller error getting info:', error.message);
    next(error);
  }
};
