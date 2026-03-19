const Session = require('../models/Session');
const logger = require('../utils/logger');

class SessionService {
  async createSession(userId, containerId) {
    try {
      const session = await Session.create({
        userId,
        containerId,
        status: 'active'
      });

      logger.info(`Session created: ${session._id} for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Error creating session:', error.message);
      throw error;
    }
  }

  async endSession(sessionId) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'completed';
      session.endedAt = new Date();
      session.duration = (session.endedAt - session.startedAt) / 1000; // in seconds

      await session.save();

      logger.info(`Session ended: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error('Error ending session:', error.message);
      throw error;
    }
  }

  async addCommand(sessionId, command, output) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.commands.push({
        command,
        output,
        executedAt: new Date()
      });

      await session.save();
      return session;
    } catch (error) {
      logger.error('Error adding command to session:', error.message);
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

  async getSession(sessionId) {
    try {
      const session = await Session.findById(sessionId)
        .populate('userId')
        .populate('containerId');

      return session;
    } catch (error) {
      logger.error('Error getting session:', error.message);
      throw error;
    }
  }
}

module.exports = new SessionService();
