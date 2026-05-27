const ShipmentRepository = require('../repositories/shipment.repository');
const { publishEvent, TOPICS } = require('../config/kafka');
const dataLineageTracker = require('../utils/dataLineage');
const logger = require('../utils/logger');

class ShipmentService {
  async createShipment(shipmentData, userId) {
    try {
      const shipment = await ShipmentRepository.create(shipmentData);

      await dataLineageTracker.trackDataChange({
        entityType: 'shipment',
        entityId: shipment.id,
        action: 'create',
        userId,
        oldValue: null,
        newValue: shipment,
        metadata: { tracking_number: shipment.tracking_number }
      });

      await publishEvent(TOPICS.SHIPMENT_CREATED, {
        id: shipment.id,
        tracking_number: shipment.tracking_number,
        status: shipment.status,
        timestamp: new Date().toISOString()
      });

      logger.info(`Shipment created: ${shipment.id}`);
      return shipment;
    } catch (error) {
      logger.error('Failed to create shipment:', error);
      throw error;
    }
  }

  async getShipmentById(id) {
    const shipment = await ShipmentRepository.findById(id);
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    return shipment;
  }

  async getShipmentByTrackingNumber(trackingNumber) {
    const shipment = await ShipmentRepository.findByTrackingNumber(trackingNumber);
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    return shipment;
  }

  async updateShipment(id, updateData, userId) {
    try {
      const oldShipment = await ShipmentRepository.findById(id);
      if (!oldShipment) {
        throw new Error('Shipment not found');
      }

      const updatedShipment = await ShipmentRepository.update(id, updateData);

      await dataLineageTracker.trackDataChange({
        entityType: 'shipment',
        entityId: id,
        action: 'update',
        userId,
        oldValue: oldShipment,
        newValue: updatedShipment,
        metadata: { fields_updated: Object.keys(updateData) }
      });

      await publishEvent(TOPICS.SHIPMENT_UPDATED, {
        id: updatedShipment.id,
        tracking_number: updatedShipment.tracking_number,
        status: updatedShipment.status,
        changes: updateData,
        timestamp: new Date().toISOString()
      });

      logger.info(`Shipment updated: ${id}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to update shipment:', error);
      throw error;
    }
  }

  async deleteShipment(id, userId) {
    try {
      const shipment = await ShipmentRepository.findById(id);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      await ShipmentRepository.delete(id);

      await dataLineageTracker.trackDataChange({
        entityType: 'shipment',
        entityId: id,
        action: 'delete',
        userId,
        oldValue: shipment,
        newValue: null,
        metadata: { tracking_number: shipment.tracking_number }
      });

      logger.info(`Shipment deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete shipment:', error);
      throw error;
    }
  }

  async listShipments(filters, pagination) {
    const result = await ShipmentRepository.findAll(filters, pagination);
    return result;
  }
}

module.exports = new ShipmentService();