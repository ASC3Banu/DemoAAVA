const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { checkDatabaseHealth } = require('./config/database');

const PORT = config.app.port;

const startServer = async () => {
  try {
    const dbHealth = await checkDatabaseHealth();
    logger.info('Database health check:', dbHealth);

    const server = app.listen(PORT, () => {
      logger.info(`🚀 ${config.app.name} is running`);
      logger.info(`📡 Environment: ${config.app.env}`);
      logger.info(`🌐 Server listening on port ${PORT}`);
      logger.info(`📋 API Version: ${config.app.apiVersion}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api/${config.app.apiVersion}`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/api/${config.app.apiVersion}/health`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

    const gracefulShutdown = () => {
      logger.info('Received shutdown signal, closing server gracefully');
      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();