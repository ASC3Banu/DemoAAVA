const eventService = require('../services/eventService');
const logger = require('../utils/logger');

class EventController {
  async createEvent(req, res, next) {
    try {
      const event = await eventService.createEvent(req.body);
      logger.audit('create_event', req.user.id, 'events', { eventId: event.id });
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async getEvent(req, res, next) {
    try {
      const event = await eventService.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async getShipmentEvents(req, res, next) {
    try {
      const pagination = { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 50, sortBy: req.query.sortBy || 'timestamp', sortOrder: req.query.sortOrder || 'DESC' };
      const result = await eventService.getShipmentEvents(req.params.shipmentId, pagination);
      res.json({ success: true, data: result.events, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async listEvents(req, res, next) {
    try {
      const filters = { event_type: req.query.event_type, severity: req.query.severity, processed: req.query.processed, date_from: req.query.date_from, date_to: req.query.date_to };
      const pagination = { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 50, sortBy: req.query.sortBy || 'timestamp', sortOrder: req.query.sortOrder || 'DESC' };
      const result = await eventService.listEvents(filters, pagination);
      res.json({ success: true, data: result.events, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      const result = await eventService.deleteEvent(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Event not found' });
      }
      logger.audit('delete_event', req.user.id, 'events', { eventId: req.params.id });
      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();