const ShipmentModel = require('../models/shipment.model');
const cacheManager = require('../utils/cache');
const config = require('../config/env');

class ShipmentRepository {
  async create(shipmentData) {
    const shipment = await ShipmentModel.create(shipmentData);
    await cacheManager.set(`shipment:${shipment.id}`, shipment, config.cache.shipmentTTL);
    await cacheManager.delPattern('shipments:list:*');
    return shipment;
  }

  async findById(id) {
    const cached = await cacheManager.get(`shipment:${id}`);
    if (cached) {
      return cached;
    }

    const shipment = await ShipmentModel.findById(id);
    if (shipment) {
      await cacheManager.set(`shipment:${id}`, shipment, config.cache.shipmentTTL);
    }
    return shipment;
  }

  async findByTrackingNumber(trackingNumber) {
    const cached = await cacheManager.get(`shipment:tracking:${trackingNumber}`);
    if (cached) {
      return cached;
    }

    const shipment = await ShipmentModel.findByTrackingNumber(trackingNumber);
    if (shipment) {
      await cacheManager.set(`shipment:tracking:${trackingNumber}`, shipment, config.cache.shipmentTTL);
    }
    return shipment;
  }

  async update(id, updateData) {
    const shipment = await ShipmentModel.update(id, updateData);
    if (shipment) {
      await cacheManager.del(`shipment:${id}`);
      await cacheManager.del(`shipment:tracking:${shipment.tracking_number}`);
      await cacheManager.delPattern('shipments:list:*');
    }
    return shipment;
  }

  async delete(id) {
    const result = await ShipmentModel.delete(id);
    if (result) {
      await cacheManager.del(`shipment:${id}`);
      await cacheManager.delPattern('shipments:list:*');
    }
    return result;
  }

  async findAll(filters, pagination) {
    const cacheKey = `shipments:list:${JSON.stringify(filters)}:${pagination.page}:${pagination.limit}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const shipments = await ShipmentModel.findAll(filters, pagination);
    const total = await ShipmentModel.count(filters);

    const result = { shipments, total };
    await cacheManager.set(cacheKey, result, config.cache.shipmentTTL);
    return result;
  }
}

module.exports = new ShipmentRepository();