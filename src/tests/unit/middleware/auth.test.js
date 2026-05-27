const { authenticateToken } = require('../../../middleware/auth');
const { verifyToken } = require('../../../config/auth');
const { redisClient } = require('../../../config/redis');

jest.mock('../../../config/auth');
jest.mock('../../../config/redis');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      req.headers['authorization'] = 'Bearer valid-token';
      const mockDecoded = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write']
      };

      verifyToken.mockReturnValue(mockDecoded);
      redisClient.get.mockResolvedValue(null);

      await authenticateToken(req, res, next);

      expect(req.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write']
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'No token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject blacklisted token', async () => {
      req.headers['authorization'] = 'Bearer blacklisted-token';
      redisClient.get.mockResolvedValue('true');

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token revoked',
        message: 'This token has been revoked'
      });
    });

    it('should reject invalid token', async () => {
      req.headers['authorization'] = 'Bearer invalid-token';
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      redisClient.get.mockResolvedValue(null);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Authentication failed'
      });
    });
  });
});