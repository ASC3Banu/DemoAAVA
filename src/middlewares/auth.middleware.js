/**
 * Authentication Middleware
 * Handles JWT token validation and user authentication
 * 
 * Security: JWT validation, token expiry check
 */

const jwt = require('jsonwebtoken');
const config = require('../configs/app.config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/error.util');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role,
        permissions: decoded.permissions || []
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
};

module.exports = { authenticate };
