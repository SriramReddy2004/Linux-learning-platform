const { Client } = require('ssh2');
const logger = require('../utils/logger');

class SSHService {
  async connect(host, port, username, password) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        logger.info(`SSH connected to ${host}:${port}`);
        resolve(conn);
      });

      conn.on('error', (err) => {
        logger.error('SSH connection error:', err.message);
        reject(err);
      });

      logger.info(`SSH connecting to ${host}:${port} as ${username}, ${password}`);

      conn.connect({
        host,
        port: parseInt(port),
        username,
        password
      });
    });
  }

  async executeCommand(conn, command) {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          logger.error('SSH command error:', err.message);
          reject(err);
          return;
        }

        let output = '';
        stream.on('close', (code) => {
          resolve({ code, output });
        });

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += data.toString();
        });
      });
    });
  }

  async disconnect(conn) {
    conn.end();
    logger.info('SSH disconnected');
  }
}

module.exports = new SSHService();
