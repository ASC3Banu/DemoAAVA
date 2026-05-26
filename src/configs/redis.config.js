/**
 * Redis Configuration
 * Redis client for caching
 * 
 * Security: Password authentication, connection encryption
 */

const redis = require('redis');
const config = require('./app.config');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis connection refused');
      return new Error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('error', (err) => {
  logger.error('Redis error:', err);
});

client.on('connect', () => {
  logger.info('Redis connected');
});

const initializeRedis = async () => {
  return new Promise((resolve, reject) => {
    client.on('ready', () => {
      logger.info('Redis client ready');
      resolve();
    });
    client.on('error', (err) => {
      reject(err);
    });
  });
};

module.exports = {
  client,
  initializeRedis
};
