const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      client: redisClient,
      prefix: 'rate_limit:',
      sendCommand: (...args) => redisClient.call(...args)
    }),
    handler: (req, res) => {
      logger.security('rate_limit_exceeded', 'medium', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent'),
        userId: req.user?.id
      });
      res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Rate limit exceeded',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    skip: (req) => {
      return req.user?.role === 'admin';
    },
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    }
  };
  return rateLimit(defaultOptions);
};

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later'
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded'
});

const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded for sensitive operations'
});

const webhookLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Webhook rate limit exceeded'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  strictLimiter,
  webhookLimiter
};