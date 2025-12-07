const Session = require('../models/Session');
const Container = require('../models/Container');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class SessionService {
  async createSession(userId, containerId, socketId) {
    try {
      const container = await Container.findById(containerId);

      if (!container) {
        throw new Error('Container not found');
      }

      const session = await Session.create({
        sessionId: uuidv4(),
        userId,
        containerId,
        socketId,
        startedAt: new Date(),
        isActive: true
      });

      logger.info(`Session created: ${session.sessionId} for user ${userId}`);

      return session;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async endSession(sessionId) {
    try {
      const session = await Session.findOne({ sessionId });

      if (!session) {
        throw new Error('Session not found');
      }

      await session.endSession();

      logger.info(`Session ended: ${sessionId}, duration: ${session.duration}s`);

      return session;
    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  async getUserSessions(userId, limit = 10) {
    try {
      const sessions = await Session.find({ userId })
        .populate('containerId')
        .sort({ startedAt: -1 })
        .limit(limit);

      return sessions;
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      throw error;
    }
  }

  async updateCommandCount(sessionId) {
    try {
      await Session.findOneAndUpdate(
        { sessionId },
        { $inc: { commandsExecuted: 1 } }
      );
    } catch (error) {
      logger.error('Error updating command count:', error);
    }
  }

  async getActiveSessionBySocket(socketId) {
    try {
      return await Session.findOne({ socketId, isActive: true });
    } catch (error) {
      logger.error('Error getting active session:', error);
      return null;
    }
  }
}

module.exports = new SessionService();
