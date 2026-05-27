const UserModel = require('../models/user.model');
const cacheManager = require('../utils/cache');
const config = require('../config/env');

class UserRepository {
  async create(userData) {
    const user = await UserModel.create(userData);
    await cacheManager.set(`user:${user.id}`, user, config.cache.defaultTTL);
    return user;
  }

  async findById(id) {
    const cached = await cacheManager.get(`user:${id}`);
    if (cached) {
      return cached;
    }

    const user = await UserModel.findById(id);
    if (user) {
      await cacheManager.set(`user:${id}`, user, config.cache.defaultTTL);
    }
    return user;
  }

  async findByEmail(email) {
    const cached = await cacheManager.get(`user:email:${email}`);
    if (cached) {
      return cached;
    }

    const user = await UserModel.findByEmail(email);
    if (user) {
      await cacheManager.set(`user:email:${email}`, user, config.cache.defaultTTL);
      await cacheManager.set(`user:${user.id}`, user, config.cache.defaultTTL);
    }
    return user;
  }

  async update(id, updateData) {
    const user = await UserModel.update(id, updateData);
    if (user) {
      await cacheManager.del(`user:${id}`);
      await cacheManager.del(`user:email:${user.email}`);
    }
    return user;
  }

  async verifyPassword(email, password) {
    return await UserModel.verifyPassword(email, password);
  }

  async findAll(filters, pagination) {
    const users = await UserModel.findAll(filters, pagination);
    return users;
  }
}

module.exports = new UserRepository();