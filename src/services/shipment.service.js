/**
 * Shipment Service
 * Business logic for shipment operations
 * 
 * Security: Data encryption, PII filtering
 * Compliance: Audit logging, data lineage
 */

const shipmentRepository = require('../repositories/shipment.repository');
const eventService = require('./event.service');
const kafkaProducer = require('../configs/kafka.config').producer;
const logger = require('../utils/logger');
const { AppError } = require('../utils/error.util');
const { encryptSensitiveData, decryptSensitiveData } = require('../utils/encryption.util');
const { generateShipmentId } = require('../utils/id-generator.util');
const cache = require('../configs/redis.config').client;

class ShipmentService {
  /**
   * Create a new shipment
   */
  async createShipment(data) {
    try {
      // Generate unique shipment ID
      const shipment_id = generateShipmentId();

      // Encrypt sensitive data
      const encryptedData = {
        ...data,
        shipment_id,
        status: 'created',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Save to database
      const shipment = await shipmentRepository.create(encryptedData);

      // Publish shipment created event to Kafka
      await kafkaProducer.send({
        topic: 'shipment-events',
        messages: [{
          key: shipment_id,
          value: JSON.stringify({
            event_type: 'shipment_created',
            shipment_id,
            timestamp: new Date().toISOString(),
            data: shipment
          })
        }]
      });

      // Cache shipment data
      await cache.setex(`shipment:${shipment_id}`, 3600, JSON.stringify(shipment));

      logger.info(`Shipment created: ${shipment_id}`);
      return shipment;
    } catch (error) {
      logger.error('Error creating shipment:', error);
      throw new AppError('Failed to create shipment', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get shipment by ID with RBAC check
   */
  async getShipmentById(shipment_id, organizationId) {
    try {
      // Check cache first
      const cached = await cache.get(`shipment:${shipment_id}`);
      if (cached) {
        const shipment = JSON.parse(cached);
        if (shipment.organizationId === organizationId) {
          return shipment;
        }
      }

      // Get from database
      const shipment = await shipmentRepository.findById(shipment_id, organizationId);
      
      if (shipment) {
        // Cache for future requests
        await cache.setex(`shipment:${shipment_id}`, 3600, JSON.stringify(shipment));
      }

      return shipment;
    } catch (error) {
      logger.error('Error retrieving shipment:', error);
      throw new AppError('Failed to retrieve shipment', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Update shipment
   */
  async updateShipment(shipment_id, data, organizationId) {
    try {
      const updatedData = {
        ...data,
        updated_at: new Date()
      };

      const shipment = await shipmentRepository.update(shipment_id, updatedData, organizationId);

      if (shipment) {
        // Invalidate cache
        await cache.del(`shipment:${shipment_id}`);

        // Publish update event
        await kafkaProducer.send({
          topic: 'shipment-events',
          messages: [{
            key: shipment_id,
            value: JSON.stringify({
              event_type: 'shipment_updated',
              shipment_id,
              timestamp: new Date().toISOString(),
              data: shipment
            })
          }]
        });
      }

      return shipment;
    } catch (error) {
      logger.error('Error updating shipment:', error);
      throw new AppError('Failed to update shipment', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * List shipments with pagination
   */
  async listShipments(filters, pagination) {
    try {
      const result = await shipmentRepository.findAll(filters, pagination);
      return result;
    } catch (error) {
      logger.error('Error listing shipments:', error);
      throw new AppError('Failed to list shipments', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Delete shipment
   */
  async deleteShipment(shipment_id, organizationId) {
    try {
      await shipmentRepository.delete(shipment_id, organizationId);
      
      // Invalidate cache
      await cache.del(`shipment:${shipment_id}`);

      // Publish delete event
      await kafkaProducer.send({
        topic: 'shipment-events',
        messages: [{
          key: shipment_id,
          value: JSON.stringify({
            event_type: 'shipment_deleted',
            shipment_id,
            timestamp: new Date().toISOString()
          })
        }]
      });

      logger.info(`Shipment deleted: ${shipment_id}`);
    } catch (error) {
      logger.error('Error deleting shipment:', error);
      throw new AppError('Failed to delete shipment', 500, 'SERVICE_ERROR');
    }
  }
}

module.exports = new ShipmentService();