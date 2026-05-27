const logger = require('../utils/logger');
const dataMasking = require('../utils/dataMasking');

const validateRequest = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });
      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));
        logger.warn('Input validation failed', {
          path: req.path,
          method: req.method,
          errors: errors,
          userId: req.user?.id
        });
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors
        });
      }
      req[source] = value;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation processing failed'
      });
    }
  };
};

const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim().replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]+>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '');
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitize(sanitized[key]);
      }
    }
    return sanitized;
  };
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /('|(\-\-)|(;)|(\|\|)|(\*))/i,
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
    /(script|javascript|onerror|onload)/i
  ];
  const checkForSQLInjection = (obj) => {
    if (!obj) return false;
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object') {
      return Object.values(obj).some(value => checkForSQLInjection(value));
    }
    return false;
  };
  if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
    logger.security('sql_injection_attempt', 'high', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      body: dataMasking.maskForLogging(req.body),
      query: req.query,
      userId: req.user?.id
    });
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid input detected'
    });
  }
  next();
};

module.exports = {
  validateRequest,
  sanitizeInput,
  preventSQLInjection
};