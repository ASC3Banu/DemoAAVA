const AuthMiddleware = require('../../../src/middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../../../src/config/env');
const { redisClient } = require('../../../src/config/database');

jest.mock('jsonwebtoken');
jest.mock('../../../src/config/database');

describe('AuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read:shipments']
      };

      jwt.verify.mockReturnValue(mockDecoded);
      redisClient.get = jest.fn().mockResolvedValue(null);

      await AuthMiddleware.authenticate(req, res, next);

      expect(req.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read:shipments']
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await AuthMiddleware.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_001'
      });
    });

    it('should reject expired token', async () => {
      req.headers.authorization = 'Bearer expired-token';
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await AuthMiddleware.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
        code: 'AUTH_003'
      });
    });
  });

  describe('authorize', () => {
    it('should authorize user with correct role', () => {
      req.user = {
        id: 'user-123',
        roles: ['admin']
      };

      const middleware = AuthMiddleware.authorize('admin', 'manager');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user without required role', () => {
      req.user = {
        id: 'user-123',
        roles: ['user']
      };

      const middleware = AuthMiddleware.authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTH_005',
        requiredRoles: ['admin']
      });
    });
  });
});