const { Server } = require('socket.io');
const { verifySocketToken } = require('../utils/jwt');
const sshService = require('./sshService');
const sessionService = require('../services/sessionService');
const Container = require('../models/Container');
const logger = require('../utils/logger');

// Store active connections
const activeConnections = new Map();

const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: No token provided'));
      const decoded = verifySocketToken(token);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.userId}`);

    // Start shell session - expects { containerId } or { sshPort, containerId }
    socket.on('start-shell', async ({ sshPort, containerId }) => {
      try {
        logger.info(`Starting shell session for user ${socket.userId} on container ${containerId || 'unknown'}`);

        // Create session record
        const session = await sessionService.createSession(socket.userId, containerId);

        // Resolve host and port
        let host = process.env.DOCKER_HOST || 'localhost';
        let port = sshPort;

        if (containerId) {
          const container = await Container.findOne({ _id: containerId });
          if (!container) throw new Error('Container not found');

          port = port || container.sshPort;
          if (container.createdOnWorker && container.workerHost) {
            host = container.workerHost;
          } else {
            host = process.env.DOCKER_HOST || 'localhost';
          }
        }

        if (!port) throw new Error('SSH port not available');

        // Credentials - configurable via env or defaults
        const sshUser = process.env.WORKER_SSH_USERNAME || process.env.SSH_USERNAME || 'user';
        const sshPass = process.env.WORKER_SSH_PASSWORD || process.env.SSH_PASSWORD || 'user';

        // Connect via SSH
        const conn = await sshService.connect(host, port, sshUser, sshPass);

        // Open an interactive shell
        conn.shell({ term: 'xterm-256color' }, (err, shellStream) => {
          if (err) {
            logger.error('SSH shell error:', err.message);
            socket.emit('output', `SSH error: ${err.message}\r\n`);
            conn.end();
            return;
          }

          // Pipe SSH output to client
          shellStream.on('data', (data) => {
            socket.emit('output', data.toString());
          });

          shellStream.on('close', () => {
            socket.emit('output', '\r\n✅ Session closed.\r\n');
            try { conn.end(); } catch (e) { /* ignore */ }
            logger.info(`SSH shell closed for session ${session._id}`);
          });

          // Store connection for later writes and cleanup
          activeConnections.set(socket.id, {
            sshConnection: shellStream,
            rawConnection: conn,
            containerId,
            sessionId: session._id,
            userId: socket.userId
          });

          // Notify client
          socket.emit('shell-ready', {
            sessionId: session._id,
            message: 'Shell session started successfully'
          });
        });

      } catch (error) {
        logger.error('Error starting shell:', error.message);
        socket.emit('shell-error', { message: error.message || 'Failed to start shell session' });
      }
    });

    // Handle input from client
    socket.on('input', (data) => {
      const connection = activeConnections.get(socket.id);
      if (connection && connection.sshConnection) {
        try {
          connection.sshConnection.write(data);
        } catch (err) {
          logger.error('Error writing to SSH stream:', err.message);
        }

        if (data.includes('\n') || data.includes('\r')) {
          sessionService.updateCommandCount(connection.sessionId).catch(() => {});
        }
      }
    });

    // Handle resize events
    socket.on('resize', ({ rows, cols }) => {
      const connection = activeConnections.get(socket.id);
      if (connection && connection.sshConnection) {
        try {
          if (typeof connection.sshConnection.setWindow === 'function') {
            connection.sshConnection.setWindow(rows, cols, 0, 0);
          }
        } catch (error) {
          logger.error('Error resizing terminal:', error.message);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`Client disconnected: ${socket.id}`);
      const connection = activeConnections.get(socket.id);
      if (connection) {
        try {
          if (connection.rawConnection && typeof connection.rawConnection.end === 'function') {
            connection.rawConnection.end();
          }
        } catch (e) {
          logger.error('Error closing SSH connection:', e.message);
        }

        if (connection.sessionId) {
          try { await sessionService.endSession(connection.sessionId); } catch (e) { /* ignore */ }
        }

        activeConnections.delete(socket.id);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}: ${error}`);
    });
  });

  return io;
};

module.exports = { initializeSocketIO, activeConnections };
