const logger = require('../configs/logger.config');

class ErrorHandler {
  handle(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    const errorResponse = {
      error: err.name || 'Error',
      message: message,
      statusCode: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.id
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }

    logger.error('Request error', {
      error: message,
      stack: err.stack,
      statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      requestId: req.id
    });

    if (err.name === 'ValidationError') {
      return res.status(400).json(errorResponse);
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json(errorResponse);
    }

    if (err.name === 'ForbiddenError') {
      return res.status(403).json(errorResponse);
    }

    if (err.name === 'NotFoundError') {
      return res.status(404).json(errorResponse);
    }

    if (err.name === 'ConflictError') {
      return res.status(409).json(errorResponse);
    }

    res.status(statusCode).json(errorResponse);
  }
}

const errorHandler = new ErrorHandler();
module.exports = errorHandler.handle.bind(errorHandler);
