const UserRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

class UserService {
  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUserByEmail(email) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(id, updateData) {
    try {
      const user = await UserRepository.update(id, updateData);
      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`User updated: ${id}`);
      return user;
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  async listUsers(filters, pagination) {
    return await UserRepository.findAll(filters, pagination);
  }

  async updateUserRoles(userId, roles) {
    return await this.updateUser(userId, { roles });
  }

  async updateUserPermissions(userId, permissions) {
    return await this.updateUser(userId, { permissions });
  }
}

module.exports = new UserService();