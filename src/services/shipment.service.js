const shipmentRepository = require('../repositories/shipment.repository');
const eventRepository = require('../repositories/event.repository');
const kafka = require('../configs/kafka.config');
const redis = require('../configs/redis.config');
const logger = require('../configs/logger.config');
const config = require('../configs/app.config');

class ShipmentService {
  async createShipment(shipmentData, userId) {
    try {
      const existing = await shipmentRepository.findByTrackingNumber(
        shipmentData.tracking_number
      );
      
      if (existing) {
        const error = new Error('Shipment with this tracking number already exists');
        error.name = 'ConflictError';
        error.statusCode = 409;
        throw error;
      }

      shipmentData.created_by = userId;
      const shipment = await shipmentRepository.create(shipmentData);

      await eventRepository.create({
        shipment_id: shipment.id,
        event_type: 'shipment_created',
        event_data: { status: 'created' },
        location: shipmentData.origin_location,
        source: 'system',
        metadata: { created_by: userId }
      });

      await kafka.publishEvent(config.kafka.topics.trackingEvents, {
        key: shipment.id,
        value: {
          event_type: 'shipment_created',
          shipment_id: shipment.id,
          tracking_number: shipment.trackingNumber,
          timestamp: new Date().toISOString()
        }
      });

      await redis.set(`shipment:${shipment.id}`, shipment.toJSON(), 3600);

      logger.info('Shipment created successfully', {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber
      });

      return shipment;
    } catch (error) {
      logger.error('Failed to create shipment', { error: error.message });
      throw error;
    }
  }

  async getShipmentById(shipmentId) {
    try {
      const cached = await redis.get(`shipment:${shipmentId}`);
      if (cached) {
        logger.debug('Shipment retrieved from cache', { shipmentId });
        return cached;
      }

      const shipment = await shipmentRepository.findById(shipmentId);
      
      if (!shipment) {
        const error = new Error('Shipment not found');
        error.name = 'NotFoundError';
        error.statusCode = 404;
        throw error;
      }

      await redis.set(`shipment:${shipmentId}`, shipment.toJSON(), 3600);

      return shipment;
    } catch (error) {
      logger.error('Failed to get shipment', { shipmentId, error: error.message });
      throw error;
    }
  }

  async searchShipments(filters, page = 1, limit = 20) {
    try {
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const result = await shipmentRepository.search(filters, pagination);
      
      logger.info('Shipments searched', {
        filters,
        resultCount: result.data.length,
        total: result.total
      });

      return result;
    } catch (error) {
      logger.error('Failed to search shipments', { error: error.message });
      throw error;
    }
  }

  async updateShipmentStatus(shipmentId, statusData, userId) {
    try {
      const shipment = await shipmentRepository.findById(shipmentId);
      
      if (!shipment) {
        const error = new Error('Shipment not found');
        error.name = 'NotFoundError';
        error.statusCode = 404;
        throw error;
      }

      const updatedShipment = await shipmentRepository.updateStatus(
        shipmentId,
        statusData
      );

      await eventRepository.create({
        shipment_id: shipmentId,
        event_type: 'status_change',
        event_data: {
          old_status: shipment.status,
          new_status: statusData.status
        },
        location: statusData.location,
        source: 'user',
        metadata: { updated_by: userId }
      });

      await kafka.publishEvent(config.kafka.topics.trackingEvents, {
        key: shipmentId,
        value: {
          event_type: 'status_updated',
          shipment_id: shipmentId,
          old_status: shipment.status,
          new_status: statusData.status,
          location: statusData.location,
          timestamp: new Date().toISOString()
        }
      });

      await redis.del(`shipment:${shipmentId}`);

      logger.info('Shipment status updated', {
        shipmentId,
        oldStatus: shipment.status,
        newStatus: statusData.status
      });

      return updatedShipment;
    } catch (error) {
      logger.error('Failed to update shipment status', {
        shipmentId,
        error: error.message
      });
      throw error;
    }
  }

  async getShipmentEvents(shipmentId, filters = {}) {
    try {
      const shipment = await shipmentRepository.findById(shipmentId);
      
      if (!shipment) {
        const error = new Error('Shipment not found');
        error.name = 'NotFoundError';
        error.statusCode = 404;
        throw error;
      }

      const events = await eventRepository.findByShipmentId(shipmentId, filters);
      
      logger.info('Shipment events retrieved', {
        shipmentId,
        eventCount: events.length
      });

      return events;
    } catch (error) {
      logger.error('Failed to get shipment events', {
        shipmentId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ShipmentService();
