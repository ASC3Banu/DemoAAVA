const EventService = require('../services/event.service');
const responseFormatter = require('../utils/responseFormatter');
const paginationHelper = require('../utils/pagination');
const logger = require('../utils/logger');

class EventController {
  async create(req, res, next) {
    try {
      const eventData = {
        ...req.body,
        shipment_id: req.params.shipment_id
      };
      const event = await EventService.createEvent(eventData);
      res.status(201).json(responseFormatter.created(event, 'Event created successfully'));
    } catch (error) {
      logger.error('Create event error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const event = await EventService.getEventById(req.params.id);
      res.json(responseFormatter.success(event));
    } catch (error) {
      if (error.message === 'Event not found') {
        return res.status(404).json(responseFormatter.notFound('Event'));
      }
      next(error);
    }
  }

  async getByShipmentId(req, res, next) {
    try {
      const { page, limit } = paginationHelper.validatePaginationParams(req.query.page, req.query.limit);
      const pagination = paginationHelper.paginate(req.query, page, limit);
      
      const result = await EventService.getEventsByShipmentId(req.params.shipment_id, pagination);
      
      res.json(paginationHelper.formatResponse(result.events, result.total, page, limit));
    } catch (error) {
      logger.error('Get events error:', error);
      next(error);
    }
  }
}

module.exports = new EventController();