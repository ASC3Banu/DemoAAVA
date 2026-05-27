const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { redisClient } = require('../config/database');

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_001'
        });
      }

      const token = authHeader.substring(7);
      
      const blacklisted = await redisClient.get(`blacklist:${token}`);
      if (blacklisted) {
        return res.status(401).json({
          success: false,
          error: 'Token has been revoked',
          code: 'AUTH_002'
        });
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || []
      };
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'AUTH_003'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'AUTH_004'
      });
    }
  }

  authorize(...requiredRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_001'
        });
      }

      const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'AUTH_005',
          requiredRoles
        });
      }

      next();
    };
  }

  checkPermission(requiredPermission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_001'
        });
      }

      if (!req.user.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied',
          code: 'AUTH_006',
          requiredPermission
        });
      }

      next();
    };
  }
}

module.exports = new AuthMiddleware();