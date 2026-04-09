/**
 * GreenLeaf Commerce - Main Server File
 * Climate-optimized quick-commerce platform
 */

require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { initializeSocket } = require('./src/services/socket.service');
const http = require('http');
const config = require('./src/config/env');

const { validateEnvironment } = require('./src/utils/envValidator');
validateEnvironment();

const BASE_PORT = parseInt(process.env.PORT) || 5000;

logger.info(`Server startup`, {
  cwd: process.cwd(),
  filename: __filename
});

const startServerOnPort = (port, retries = 5) => {
  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(port, '0.0.0.0', () => {
    logger.info(`✅ GreenLeaf Commerce Server running on http://localhost:${port}`);
    logger.info(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔥 Carbon-optimized delivery platform initialized`);
    logger.info(`⚡ Socket.io ready for real-time tracking`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      logger.warn(`⚠️ Port ${port} busy, retrying ${port + 1} (${retries} left)`);
      setTimeout(() => startServerOnPort(port + 1, retries - 1), 1000);
    } else {
      logger.error('❌ Server failed:', err.message);
      process.exit(1);
    }
  });
};

const startServer = async () => {
  try {
    await connectDB();
    startServerOnPort(BASE_PORT);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Process handlers
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
