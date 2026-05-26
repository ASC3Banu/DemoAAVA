const Joi = require('joi');
const logger = require('../configs/logger.config');
const security = require('../configs/security.config');

class ValidationMiddleware {
  validate(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        logger.warn('Validation failed', {
          path: req.path,
          errors
        });

        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request validation failed',
          details: errors
        });
      }

      req.body = value;
      next();
    };
  }

  sanitizeInput(req, res, next) {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizeObject(req.params);
    }
    next();
  }

  sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = security.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

const validationMiddleware = new ValidationMiddleware();
module.exports = validationMiddleware.validate.bind(validationMiddleware);
module.exports.sanitizeInput = validationMiddleware.sanitizeInput.bind(validationMiddleware);
