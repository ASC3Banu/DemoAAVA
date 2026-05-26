/**
 * Error Utility
 * Custom error classes
 */

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
