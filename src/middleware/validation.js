const Joi = require('joi');

class ValidationMiddleware {
  validateBody(schema) {
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

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VAL_001',
          details: errors
        });
      }

      req.body = value;
      next();
    };
  }

  validateQuery(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          code: 'VAL_002',
          details: errors
        });
      }

      req.query = value;
      next();
    };
  }

  validateParams(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          code: 'VAL_003',
          details: errors
        });
      }

      req.params = value;
      next();
    };
  }
}

module.exports = new ValidationMiddleware();