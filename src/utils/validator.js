const Joi = require('joi');
const logger = require('./logger');

/**
 * Input Validation Utility using Joi
 * Prevents injection attacks and ensures data integrity
 */

// Common validation schemas
const schemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4'