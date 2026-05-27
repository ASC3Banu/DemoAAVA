const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/user.repository');
const config = require('../config/env');
const { redisClient } = require('../config/database');
const auditLogger = require('../middleware/auditLogger');

class AuthService {
  async register(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await UserRepository.create(userData);
    
    await auditLogger.constructor.saveAuditLog({
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      method: 'POST',
      path: '/auth/register',
      query: '{}',
      body: JSON.stringify({ email: user.email }),
      statusCode: 201,
      responseTime: 0,
      ip: 'system',
      userAgent: 'system',
      correlationId: `reg-${Date.now()}`
    });

    return user;
  }

  async login(email, password) {
    const userId = await UserRepository.verifyPassword(email, password);
    if (!userId) {
      throw new Error('Invalid credentials');
    }

    const user = await UserRepository.findById(userId);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await redisClient.setEx(`session:${user.id}`, 86400, token);

    await auditLogger.constructor.saveAuditLog({
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      method: 'POST',
      path: '/auth/login',
      query: '{}',
      body: JSON.stringify({ email }),
      statusCode: 200,
      responseTime: 0,
      ip: 'system',
      userAgent: 'system',
      correlationId: `login-${Date.now()}`
    });

    return {
      user,
      token,
      refreshToken,
      expiresIn: config.jwt.expiresIn
    };
  }

  async logout(userId, token) {
    await redisClient.del(`session:${userId}`);
    await redisClient.setEx(`blacklist:${token}`, 86400, 'true');
    return true;
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      const user = await UserRepository.findById(decoded.userId);
      
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      const newToken = this.generateToken(user);
      await redisClient.setEx(`session:${user.id}`, 86400, newToken);

      return {
        token: newToken,
        expiresIn: config.jwt.expiresIn
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }
}

module.exports = new AuthService();