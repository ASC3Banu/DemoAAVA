const logger = require('../utils/logger');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces permission-based access to resources
 */

// Role definitions with hierarchical permissions
const ROLES = {
  admin: {
    level: 4,
    permissions: [
      'shipments:read', 'shipments:write', 'shipments:delete',
      'events:read', 'events:write', 'events:delete',
      'alerts:read', 'alerts:write', 'alerts:delete',
      'analytics:read', 'analytics:write',
      'carriers:read', 'carriers:write', 'carriers:delete',
      'users:read', 'users:write', 'users:delete',
      'webhooks:read', 'webhooks:write', 'webhooks:delete',
      'system:manage'
    ]
  },
  logistics_manager: {
    level: 3,
    permissions: [
      'shipments:read', 'shipments:write',
      'events:read', 'events:write',
      'alerts:read', 'alerts:write',
      'analytics:read',
      'carriers:read', 'carriers:write',
      'webhooks:read'
    ]
  },
  analyst: {
    level: 2,
    permissions: [
      'shipments:read',
      'events:read',
      'alerts:read',
      'analytics:read',
      'carriers:read'
    ]
  },
  viewer: {
    level: 1,
    permissions: [
      'shipments:read',
      'events:read',
      'alerts:read'
    ]
  }
};

const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const userRole = req.user.role;
      const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (!allowedRoles.includes(userRole)) {
        logger.security('unauthorized_access', 'medium', {
          userId: req.user.id,
          role: userRole,
          requiredRoles: allowedRoles,
          resource: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to access this resource' });
      }
      next();
    } catch (error) {
      logger.error('RBAC role check error:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const userRole = req.user.role;
      const rolePermissions = ROLES[userRole]?.permissions || [];
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const hasPermission = permissions.every(permission => rolePermissions.includes(permission) || req.user.permissions?.includes(permission));
      if (!hasPermission) {
        logger.security('insufficient_permissions', 'medium', {
          userId: req.user.id,
          role: userRole,
          requiredPermissions: permissions,
          userPermissions: rolePermissions,
          resource: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
      }
      logger.audit('permission_check', req.user.id, req.path, { permissions: permissions, granted: true });
      next();
    } catch (error) {
      logger.error('RBAC permission check error:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

const checkResourceOwnership = (resourceGetter) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }
      const resource = await resourceGetter(req);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      if (resource.userId !== req.user.id && resource.createdBy !== req.user.id) {
        logger.security('unauthorized_resource_access', 'high', {
          userId: req.user.id,
          resourceId: resource.id,
          resourceType: req.path,
          ip: req.ip
        });
        return res.status(403).json({ error: 'Forbidden', message: 'You can only access your own resources' });
      }
      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Resource ownership check error:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

module.exports = { ROLES, requireRole, requirePermission, checkResourceOwnership };