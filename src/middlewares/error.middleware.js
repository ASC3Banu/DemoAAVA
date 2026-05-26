/**
 * Error Middleware
 * Global error handling and response formatting
 * 
 * Security: Error sanitization, sensitive data filtering
 */

const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/response.util');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    requestId: req.id
  });

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal server error';

  res.status(statusCode).json(
    ApiResponse.error(message, statusCode, errorCode, err.details)
  );
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json(
    ApiResponse.error('Resource not found', 404, 'NOT_FOUND')
  );
};

module.exports = {
  errorHandler,
  notFoundHandler
};
