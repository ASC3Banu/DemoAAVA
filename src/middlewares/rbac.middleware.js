/**
 * RBAC Middleware
 * Role-Based Access Control enforcement
 * 
 * Security: Permission checking, least privilege principle
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/error.util');

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const hasPermission = req.user.permissions.includes(requiredPermission) || 
                           req.user.permissions.includes('*');

      if (!hasPermission) {
        logger.warn(`Permission denied: ${req.user.id} attempted ${requiredPermission}`);
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkPermission };
