const shipmentRepository = require('../repositories/shipmentRepository');
const eventRepository = require('../repositories/eventRepository');
const { publishEvent, TOPICS } = require('../config/kafka');
const { cacheHelper } = require('../config/redis');
const logger = require('../utils/logger');
const { auditComplianceEvent } = require('../middleware/auditLogger');

class TrackingService {
  async createShipment(shipmentData, userId) {
    try {
      const shipment = await shipmentRepository.create(shipmentData, userId);
      await cacheHelper.set(`shipment:${shipment.id}`, shipment, 3600);
      await publishEvent(TOPICS.SHIPMENT_EVENTS, shipment.id, { type: 'shipment_created', shipment: shipment }, { userId });
      await auditComplianceEvent('shipment_created', { userId, shipmentId: shipment.id, gdpr: true });
      return shipment;
    } catch (error) {
      logger.error('Error in createShipment:', error);
      throw error;
    }
  }

  async getShipment(id) {
    try {
      const cached = await cacheHelper.get(`shipment:${id}`);
      if (cached) {
        logger.debug('Shipment retrieved from cache', { shipmentId: id });
        return cached;
      }
      const shipment = await shipmentRepository.findById(id);
      if (shipment) {
        await cacheHelper.set(`shipment:${id}`, shipment, 3600);
      }
      return shipment;
    } catch (error) {
      logger.error('Error in getShipment:', error);
      throw error;
    }
  }

  async getShipmentByTrackingNumber(trackingNumber) {
    try {
      const cached = await cacheHelper.get(`tracking:${trackingNumber}`);
      if (cached) return cached;
      const shipment = await shipmentRepository.findByTrackingNumber(trackingNumber);
      if (shipment) {
        await cacheHelper.set(`tracking:${trackingNumber}`, shipment, 3600);
      }
      return shipment;
    } catch (error) {
      logger.error('Error in getShipmentByTrackingNumber:', error);
      throw error;
    }
  }

  async listShipments(filters, pagination) {
    try {
      const cacheKey = `shipments:${JSON.stringify({ filters, pagination })}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached) return cached;
      const result = await shipmentRepository.findAll(filters, pagination);
      await cacheHelper.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      logger.error('Error in listShipments:', error);
      throw error;
    }
  }

  async updateShipment(id, updateData, userId) {
    try {
      const shipment = await shipmentRepository.update(id, updateData, userId);
      if (shipment) {
        await cacheHelper.del(`shipment:${id}`);
        await cacheHelper.invalidatePattern('shipments:*');
        await publishEvent(TOPICS.SHIPMENT_EVENTS, shipment.id, { type: 'shipment_updated', shipment: shipment }, { userId });
        await auditComplianceEvent('shipment_updated', { userId, shipmentId: id, gdpr: true });
      }
      return shipment;
    } catch (error) {
      logger.error('Error in updateShipment:', error);
      throw error;
    }
  }

  async deleteShipment(id, userId) {
    try {
      const result = await shipmentRepository.delete(id, userId);
      if (result) {
        await cacheHelper.del(`shipment:${id}`);
        await cacheHelper.invalidatePattern('shipments:*');
        await auditComplianceEvent('shipment_deleted', { userId, shipmentId: id, gdpr: true });
      }
      return result;
    } catch (error) {
      logger.error('Error in deleteShipment:', error);
      throw error;
    }
  }

  async updateShipmentStatus(id, status, userId) {
    try {
      const shipment = await shipmentRepository.updateStatus(id, status, userId);
      if (shipment) {
        await cacheHelper.del(`shipment:${id}`);
        await publishEvent(TOPICS.SHIPMENT_EVENTS, shipment.id, { type: 'status_changed', shipment: shipment, oldStatus: shipment.status, newStatus: status }, { userId });
        await eventRepository.create({ shipment_id: id, event_type: 'status_change', location: shipment.current_location || {}, timestamp: new Date(), description: `Status changed to ${status}`, metadata: { oldStatus: shipment.status, newStatus: status }, source: 'system' });
      }
      return shipment;
    } catch (error) {
      logger.error('Error in updateShipmentStatus:', error);
      throw error;
    }
  }

  async updateShipmentLocation(id, location, userId) {
    try {
      const shipment = await shipmentRepository.updateLocation(id, location, userId);
      if (shipment) {
        await cacheHelper.del(`shipment:${id}`);
        await publishEvent(TOPICS.SHIPMENT_EVENTS, shipment.id, { type: 'location_updated', shipment: shipment, location: location }, { userId });
        await eventRepository.create({ shipment_id: id, event_type: 'location_update', location: location, timestamp: new Date(), description: 'Location updated', source: 'system' });
      }
      return shipment;
    } catch (error) {
      logger.error('Error in updateShipmentLocation:', error);
      throw error;
    }
  }

  async getShipmentStatistics(filters) {
    try {
      const cacheKey = `stats:${JSON.stringify(filters)}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached) return cached;
      const stats = await shipmentRepository.getStatistics(filters);
      await cacheHelper.set(cacheKey, stats, 600);
      return stats;
    } catch (error) {
      logger.error('Error in getShipmentStatistics:', error);
      throw error;
    }
  }
}

module.exports = new TrackingService();