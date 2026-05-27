const UserService = require('../services/user.service');
const responseFormatter = require('../utils/responseFormatter');
const paginationHelper = require('../utils/pagination');
const logger = require('../utils/logger');

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.id);
      res.json(responseFormatter.success(user));
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await UserService.updateUser(req.user.id, req.body);
      res.json(responseFormatter.updated(user, 'Profile updated successfully'));
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.json(responseFormatter.success(user));
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json(responseFormatter.notFound('User'));
      }
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { page, limit } = paginationHelper.validatePaginationParams(req.query.page, req.query.limit);
      const pagination = paginationHelper.paginate(req.query, page, limit);
      
      const filters = {
        is_active: req.query.is_active,
        tier: req.query.tier
      };

      const users = await UserService.listUsers(filters, pagination);
      res.json(responseFormatter.success(users));
    } catch (error) {
      logger.error('List users error:', error);
      next(error);
    }
  }
}

module.exports = new UserController();