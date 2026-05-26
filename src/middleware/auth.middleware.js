const jwt = require('jsonwebtoken');
const logger = require('../configs/logger.config');
const config = require('../configs/app.config');
const redis = require('../configs/redis.config');

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No token provided'
        });
      }

      const token = authHeader.substring(7);
      
      const blacklisted = await redis.get(`blacklist:${token}`);
      if (blacklisted) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has been revoked'
        });
      }

      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer
      });

      req.user = decoded;
      req.token = token;
      
      logger.debug('User authenticated', {
        userId: decoded.id,
        role: decoded.role
      });
      
      next();
    } catch (error) {
      logger.warn('Authentication failed', {
        error: error.message,
        ip: req.ip
      });
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired'
        });
      }
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
  }

  authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed', {
          userId: req.user.id,
          role: req.user.role,
          requiredRoles: allowedRoles
        });
        
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      next();
    };
  }

  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: config.jwt.algorithm,
      issuer: config.jwt.issuer
    });
  }

  async revokeToken(token) {
    try {
      const decoded = jwt.decode(token);
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (ttl > 0) {
        await redis.set(`blacklist:${token}`, true, ttl);
      }
      
      logger.info('Token revoked', { userId: decoded.id });
    } catch (error) {
      logger.error('Token revocation failed', { error: error.message });
      throw error;
    }
  }
}

const authMiddleware = new AuthMiddleware();
module.exports = authMiddleware.authenticate.bind(authMiddleware);
module.exports.authorize = authMiddleware.authorize.bind(authMiddleware);
module.exports.generateToken = authMiddleware.generateToken.bind(authMiddleware);
module.exports.revokeToken = authMiddleware.revokeToken.bind(authMiddleware);
