const database = require('../configs/database.config');
const TrackingEvent = require('../models/event.model');
const logger = require('../configs/logger.config');

class EventRepository {
  async create(eventData) {
    try {
      const query = `
        INSERT INTO tracking_events (
          shipment_id, event_type, event_data, location,
          timestamp, source, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        eventData.shipment_id,
        eventData.event_type,
        JSON.stringify(eventData.event_data),
        eventData.location,
        eventData.timestamp || new Date(),
        eventData.source,
        JSON.stringify(eventData.metadata || {})
      ];

      const result = await database.query(query, values);
      const event = TrackingEvent.fromDatabase(result.rows[0]);
      
      logger.info('Tracking event created', {
        eventId: event.id,
        shipmentId: event.shipmentId,
        eventType: event.eventType
      });
      
      return event;
    } catch (error) {
      logger.error('Failed to create tracking event', { error: error.message });
      throw error;
    }
  }

  async findByShipmentId(shipmentId, filters = {}) {
    try {
      let query = 'SELECT * FROM tracking_events WHERE shipment_id = $1';
      const values = [shipmentId];
      let paramIndex = 2;

      if (filters.event_type) {
        query += ` AND event_type = $${paramIndex++}`;
        values.push(filters.event_type);
      }

      if (filters.from_date) {
        query += ` AND timestamp >= $${paramIndex++}`;
        values.push(filters.from_date);
      }

      if (filters.to_date) {
        query += ` AND timestamp <= $${paramIndex++}`;
        values.push(filters.to_date);
      }

      query += ' ORDER BY timestamp DESC';

      const result = await database.query(query, values);
      return result.rows.map(row => TrackingEvent.fromDatabase(row));
    } catch (error) {
      logger.error('Failed to find events by shipment ID', {
        shipmentId,
        error: error.message
      });
      throw error;
    }
  }

  async findById(eventId) {
    try {
      const query = 'SELECT * FROM tracking_events WHERE id = $1';
      const result = await database.query(query, [eventId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return TrackingEvent.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find event', { eventId, error: error.message });
      throw error;
    }
  }

  async getCriticalEvents(limit = 100) {
    try {
      const criticalEventTypes = [
        'delay_detected',
        'route_deviation',
        'customs_issue',
        'carrier_problem',
        'damage_reported'
      ];

      const query = `
        SELECT * FROM tracking_events
        WHERE event_type = ANY($1)
        ORDER BY timestamp DESC
        LIMIT $2
      `;

      const result = await database.query(query, [criticalEventTypes, limit]);
      return result.rows.map(row => TrackingEvent.fromDatabase(row));
    } catch (error) {
      logger.error('Failed to get critical events', { error: error.message });
      throw error;
    }
  }

  async getEventsByDateRange(startDate, endDate) {
    try {
      const query = `
        SELECT * FROM tracking_events
        WHERE timestamp BETWEEN $1 AND $2
        ORDER BY timestamp DESC
      `;

      const result = await database.query(query, [startDate, endDate]);
      return result.rows.map(row => TrackingEvent.fromDatabase(row));
    } catch (error) {
      logger.error('Failed to get events by date range', { error: error.message });
      throw error;
    }
  }
}

module.exports = new EventRepository();
