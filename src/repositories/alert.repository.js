const AlertModel = require('../models/alert.model');
const cacheManager = require('../utils/cache');
const config = require('../config/env');

class AlertRepository {
  async create(alertData) {
    const alert = await AlertModel.create(alertData);
    await cacheManager.delPattern('alerts:list:*');
    return alert;
  }

  async findById(id) {
    const cached = await cacheManager.get(`alert:${id}`);
    if (cached) {
      return cached;
    }

    const alert = await AlertModel.findById(id);
    if (alert) {
      await cacheManager.set(`alert:${id}`, alert, config.cache.defaultTTL);
    }
    return alert;
  }

  async update(id, updateData) {
    const alert = await AlertModel.update(id, updateData);
    if (alert) {
      await cacheManager.del(`alert:${id}`);
      await cacheManager.delPattern('alerts:list:*');
    }
    return alert;
  }

  async findByShipmentId(shipmentId) {
    const cached = await cacheManager.get(`alerts:shipment:${shipmentId}`);
    if (cached) {
      return cached;
    }

    const alerts = await AlertModel.findByShipmentId(shipmentId);
    await cacheManager.set(`alerts:shipment:${shipmentId}`, alerts, config.cache.defaultTTL);
    return alerts;
  }

  async findAll(filters, pagination) {
    const cacheKey = `alerts:list:${JSON.stringify(filters)}:${pagination.page}:${pagination.limit}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const alerts = await AlertModel.findAll(filters, pagination);
    const total = await AlertModel.count(filters);

    const result = { alerts, total };
    await cacheManager.set(cacheKey, result, config.cache.defaultTTL);
    return result;
  }
}

module.exports = new AlertRepository();