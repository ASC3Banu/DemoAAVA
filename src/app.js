const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const auditLogger = require('./middleware/auditLogger');
const sanitizer = require('./middleware/sanitizer');
const { createRateLimiter } = require('./middleware/rateLimiter');
const { redisClient } = require('./config/database');
const { initKafka } = require('./config/kafka');
const logger = require('./utils/logger');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors(config.cors));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

app.use(sanitizer.sanitizeInput.bind(sanitizer));
app.use(auditLogger.log.bind(auditLogger));
app.use(createRateLimiter());

app.use(`/api/${config.app.apiVersion}`, routes);

app.use(errorHandler.notFound.bind(errorHandler));
app.use(errorHandler.handle.bind(errorHandler));

const initializeServices = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');

    await initKafka();
    logger.info('Kafka initialized successfully');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

initializeServices();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await redisClient.quit();
  process.exit(0);
});

module.exports = app;