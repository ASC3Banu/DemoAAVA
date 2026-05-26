const redis = require('redis');
const logger = require('./logger.config');
const config = require('./app.config');

class RedisConfig {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      const options = {
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          tls: config.redis.tls
        },
        password: config.redis.password,
        database: config.redis.db
      };

      this.client = redis.createClient(options);

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', { error: err.message });
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error('Redis connection failed', { error: error.message });
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(`${config.redis.keyPrefix}${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET failed', { key, error: error.message });
      throw error;
    }
  }

  async set(key, value, ttl = config.redis.ttl) {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(`${config.redis.keyPrefix}${key}`, ttl, serialized);
    } catch (error) {
      logger.error('Redis SET failed', { key, error: error.message });
      throw error;
    }
  }

  async del(key) {
    try {
      await this.client.del(`${config.redis.keyPrefix}${key}`);
    } catch (error) {
      logger.error('Redis DEL failed', { key, error: error.message });
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
  }
}

module.exports = new RedisConfig();
