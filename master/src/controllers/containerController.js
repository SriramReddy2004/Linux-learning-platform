const containerService = require('../services/containerService');
const Container = require('../models/Container');
const logger = require('../utils/logger');

// Create new instance
exports.createContainer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { instanceName } = req.body;

    // Validate instanceName
    if (!instanceName || typeof instanceName !== 'string' || instanceName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'instanceName is required and must be a non-empty string'
      });
    }

    // Check if user already has an active instance
    const activeInstance = await Container.findOne({
      userId,
      status: { $in: ['created', 'running'] }
    });

    if (activeInstance) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active instance. Please stop it first.'
      });
    }

    const instanceData = await containerService.createContainer(userId, instanceName.trim());

    res.status(201).json({
      success: true,
      message: 'Instance created successfully',
      data: instanceData
    });
  } catch (error) {
    next(error);
  }
};

// Get user's instances
exports.getUserContainers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const instances = await containerService.getUserContainers(userId, status);

    res.status(200).json({
      success: true,
      data: { containers: instances }
    });
  } catch (error) {
    next(error);
  }
};

// Get specific instance
exports.getContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const instance = await containerService.getContainer(id);

    if (instance.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this instance'
      });
    }

    res.status(200).json({
      success: true,
      data: { container: instance }
    });
  } catch (error) {
    next(error);
  }
};

// Stop instance
exports.stopContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const instance = await containerService.getContainer(id);

    if (instance.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this instance'
      });
    }

    await containerService.stopContainer(id);

    res.status(200).json({
      success: true,
      message: 'Instance stopped successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Restart instance
exports.restartContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const instance = await containerService.getContainer(id);

    if (instance.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this instance'
      });
    }

    const result = await containerService.restartContainer(id);

    res.status(200).json({
      success: true,
      message: 'Instance restarted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Delete instance
exports.deleteContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const instance = await containerService.getContainer(id);

    if (instance.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this instance'
      });
    }

    await containerService.deleteContainer(id);

    res.status(200).json({
      success: true,
      message: 'Instance deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get instance stats
exports.getContainerStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const instance = await containerService.getContainer(id);

    if (instance.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this instance'
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
