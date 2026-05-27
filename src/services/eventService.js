const eventRepository = require('../repositories/eventRepository');
const shipmentRepository = require('../repositories/shipmentRepository');
const { publishEvent, TOPICS } = require('../config/kafka');
const logger = require('../utils/logger');

class EventService {
  async createEvent(eventData) {
    try {
      const shipment = await shipmentRepository.findById(eventData.shipment_id);
      if (!shipment) {
        throw new Error('Shipment not found');
      }
      const event = await eventRepository.create(eventData);
      await publishEvent(TOPICS.SHIPMENT_EVENTS, event.shipment_id, { type: 'event_created', event: event });
      if (event.event_type === 'delay' || event.event_type === 'exception') {
        await publishEvent(TOPICS.ALERTS, event.shipment_id, { type: 'alert_trigger', event: event, shipment: shipment });
      }
      logger.info('Event created and published', { eventId: event.id, shipmentId: event.shipment_id });
      return event;
    } catch (error) {
      logger.error('Error in createEvent:', error);
      throw error;
    }
  }

  async getEvent(id) {
    try {
      const event = await eventRepository.findById(id);
      return event;
    } catch (error) {
      logger.error('Error in getEvent:', error);
      throw error;
    }
  }

  async getShipmentEvents(shipmentId, pagination) {
    try {
      const result = await eventRepository.findByShipmentId(shipmentId, pagination);
      return result;
    } catch (error) {
      logger.error('Error in getShipmentEvents:', error);
      throw error;
    }
  }

  async listEvents(filters, pagination) {
    try {
      const result = await eventRepository.findAll(filters, pagination);
      return result;
    } catch (error) {
      logger.error('Error in listEvents:', error);
      throw error;
    }
  }

  async processEvents() {
    try {
      const unprocessedEvents = await eventRepository.getUnprocessedEvents(100);
      logger.info(`Processing ${unprocessedEvents.length} unprocessed events`);
      for (const event of unprocessedEvents) {
        try {
          await this.processEvent(event);
          await eventRepository.markAsProcessed(event.id);
        } catch (error) {
          logger.error('Error processing event:', { eventId: event.id, error });
        }
      }
      return unprocessedEvents.length;
    } catch (error) {
      logger.error('Error in processEvents:', error);
      throw error;
    }
  }

  async processEvent(event) {
    try {
      const shipment = await shipmentRepository.findById(event.shipment_id);
      if (!shipment) return;
      if (event.event_type === 'delivery') {
        await shipmentRepository.updateStatus(event.shipment_id, 'delivered', 'system');
        await shipmentRepository.update(event.shipment_id, { actual_delivery: event.timestamp }, 'system');
      } else if (event.event_type === 'delay') {
        await shipmentRepository.updateStatus(event.shipment_id, 'delayed', 'system');
      } else if (event.event_type === 'pickup') {
        await shipmentRepository.updateStatus(event.shipment_id, 'in_transit', 'system');
      }
      if (event.location) {
        await shipmentRepository.updateLocation(event.shipment_id, event.location, 'system');
      }
      logger.info('Event processed', { eventId: event.id, eventType: event.event_type });
    } catch (error) {
      logger.error('Error in processEvent:', error);
      throw error;
    }
  }

  async deleteEvent(id) {
    try {
      const result = await eventRepository.delete(id);
      return result;
    } catch (error) {
      logger.error('Error in deleteEvent:', error);
      throw error;
    }
  }
}

module.exports = new EventService();