/**
 * Validation Middleware
 * Request validation using Joi schemas
 * 
 * Security: Input validation, XSS prevention
 */

const { createShipmentSchema, updateShipmentSchema } = require('../models/shipment.model');
const { createEventSchema } = require('../models/event.model');
const { AppError } = require('../utils/error.util');
const logger = require('../utils/logger');

const validateRequest = (req, res, next) => {
  try {
    let schema = null;

    if (req.path.includes('/shipments') && req.method === 'POST') {
      schema = createShipmentSchema;
    } else if (req.path.includes('/shipments') && req.method === 'PUT') {
      schema = updateShipmentSchema;
    } else if (req.path.includes('/events') && req.method === 'POST') {
      schema = createEventSchema;
    }

    if (schema) {
      const { error } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        throw new AppError(
          'Validation error',
          400,
          'VALIDATION_ERROR',
          { errors: errorMessages }
        );
      }
    }

    next();
  } catch (error) {
    logger.error('Validation error:', error);
    next(error);
  }
};

module.exports = { validateRequest };
