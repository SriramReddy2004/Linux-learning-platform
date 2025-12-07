const { Server } = require('socket.io');
const { verifySocketToken } = require('../utils/jwt');
const sshService = require('./sshService');
const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');

// Store active connections
const activeConnections = new Map();

const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifySocketToken(token);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

    // Start shell session
    socket.on('start-shell', async ({ sshPort, containerId }) => {
      try {
        logger.info(`Starting shell session for user ${socket.userId} on port ${sshPort}`);

        // Create session record
        const session = await sessionService.createSession(
          socket.userId,
          containerId,
          socket.id
        );

        // Establish SSH connection
        const sshConnection = await sshService.createSSHConnection(
          sshPort,
          socket,
          session.sessionId
        );

        // Store connection info
        activeConnections.set(socket.id, {
          sshConnection,
          containerId,
          sessionId: session.sessionId,
          userId: socket.userId
        });

        socket.emit('shell-ready', {
          sessionId: session.sessionId,
          message: 'Shell session started successfully'
        });

      } catch (error) {
        logger.error('Error starting shell:', error);
        socket.emit('shell-error', {
          message: error.message || 'Failed to start shell session'
        });
      }
    });

    // Handle input from client
    socket.on('input', (data) => {
      const connection = activeConnections.get(socket.id);

      if (connection && connection.sshConnection) {
        connection.sshConnection.write(data);

        // Update command count if it's a newline (command execution)
        if (data.includes('\n') || data.includes('\r')) {
          sessionService.updateCommandCount(connection.sessionId);
        }
      }
    });

    // Handle resize events
    socket.on('resize', ({ rows, cols }) => {
      const connection = activeConnections.get(socket.id);

      if (connection && connection.sshConnection) {
        try {
          connection.sshConnection.setWindow(rows, cols);
        } catch (error) {
          logger.error('Error resizing terminal:', error);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`Client disconnected: ${socket.id}`);

      const connection = activeConnections.get(socket.id);

      if (connection) {
        // Close SSH connection
        if (connection.sshConnection) {
          sshService.closeSSHConnection(connection.sshConnection);
        }

        // End session
        if (connection.sessionId) {
          await sessionService.endSession(connection.sessionId);
        }

        // Remove from active connections
        activeConnections.delete(socket.id);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
};

module.exports = { initializeSocketIO, activeConnections };
