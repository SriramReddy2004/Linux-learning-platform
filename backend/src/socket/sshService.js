const { Client } = require('ssh2');
const { DOCKER_CONFIG } = require('../config/docker');
const logger = require('../utils/logger');

class SSHService {
  createSSHConnection(sshPort, socket, sessionId) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let stream = null;

      conn.on('ready', () => {
        logger.info(`SSH connection established for session ${sessionId}`);

        conn.shell({ term: 'xterm-256color' }, (err, shellStream) => {
          if (err) {
            logger.error('SSH shell error:', err);
            socket.emit('output', `SSH error: ${err.message}\r\n`);
            conn.end();
            reject(err);
            return;
          }

          stream = shellStream;

          // Pipe SSH output to client
          shellStream.on('data', (data) => {
            socket.emit('output', data.toString());
          });

          // Handle shell close
          shellStream.on('close', () => {
            socket.emit('output', '\r\n✅ Session closed.\r\n');
            conn.end();
            logger.info(`SSH shell closed for session ${sessionId}`);
          });

          // Store write function for later use
          shellStream.write = shellStream.write.bind(shellStream);
          shellStream.setWindow = (rows, cols) => {
            shellStream.setWindow(rows, cols, 0, 0);
          };

          resolve(shellStream);
        });
      });

      conn.on('error', (err) => {
        logger.error('SSH connection error:', err);
        socket.emit('output', `❌ SSH Connection Error: ${err.message}\r\n`);
        reject(err);
      });

      conn.on('close', () => {
        logger.info(`SSH connection closed for session ${sessionId}`);
      });

      // Connect to SSH
      conn.connect({
        host: process.env.DOCKER_HOST,
        port: sshPort,
        username: DOCKER_CONFIG.sshUsername,
        password: DOCKER_CONFIG.sshPassword,
        readyTimeout: 10000
      });

      // Store connection for cleanup
      socket.sshConnection = conn;
    });
  }

  closeSSHConnection(connection) {
    try {
      if (connection && typeof connection.end === 'function') {
        connection.end();
        logger.info('SSH connection closed gracefully');
      }
    } catch (error) {
      logger.error('Error closing SSH connection:', error);
    }
  }
}

module.exports = new SSHService();
