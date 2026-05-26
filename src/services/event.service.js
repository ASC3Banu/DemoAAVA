/**
 * Event Service
 * Business logic for logistics event processing
 * 
 * Security: Event validation, data integrity
 * Compliance: Event sourcing, audit trail
 */

const eventRepository = require('../repositories/event.repository');
const kafkaProducer = require('../configs/kafka.config').producer;
const logger = require('../utils/logger');
const { AppError } = require('../utils/error.util');
const { generateEventId } = require('../utils/id-generator.util');

class EventService {
  /**
   * Create a logistics event
   */
  async createEvent(data) {
    try {
      const event_id = generateEventId();

      const eventData = {
        ...data,
        event_id,
        created_at: new Date()
      };

      // Save to database
      const event = await eventRepository.create(eventData);

      // Publish to Kafka for event processing
      await kafkaProducer.send({
        topic: 'logistics-events',
        messages: [{
          key: event.shipment_id,
          value: JSON.stringify({
            event_id,
            event_type: event.event_type,
            shipment_id: event.shipment_id,
            timestamp: event.event_time,
            location: event.location,
            details: event.details
          })
        }]
      });

      logger.info(`Event created: ${event_id}`);
      return event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw new AppError('Failed to create event', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(event_id, organizationId) {
    try {
      const event = await eventRepository.findById(event_id, organizationId);
      return event;
    } catch (error) {
      logger.error('Error retrieving event:', error);
      throw new AppError('Failed to retrieve event', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * List events with filters
   */
  async listEvents(filters, pagination) {
    try {
      const result = await eventRepository.findAll(filters, pagination);
      return result;
    } catch (error) {
      logger.error('Error listing events:', error);
      throw new AppError('Failed to list events', 500, 'SERVICE_ERROR');
    }
  }
}

module.exports = new EventService();