/**
 * Server Bootstrap
 * Starts the Express application and initializes database connections
 */

const app = require('./app');
const config = require('./configs/app.config');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./configs/database.config');
const { initializeRedis } = require('./configs/redis.config');
const { initializeKafka } = require('./configs/kafka.config');

const PORT = config.port || 3000;

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database connection established');

    // Initialize Redis connection
    await initializeRedis();
    logger.info('Redis connection established');

    // Initialize Kafka connection
    await initializeKafka();
    logger.info('Kafka connection established');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();