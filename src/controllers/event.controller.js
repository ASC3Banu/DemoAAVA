/**
 * Event Controller
 * Handles HTTP requests for logistics event operations
 * 
 * Security: Input validation, RBAC enforcement
 * Compliance: Audit logging, event sourcing
 */

const eventService = require('../services/event.service');
const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/response.util');
const { AppError } = require('../utils/error.util');
const { sanitizeInput } = require('../utils/sanitizer.util');

class EventController {
  /**
   * Create a logistics event
   * @route POST /api/v1/events
   */
  async createEvent(req, res, next) {
    try {
      const userId = req.user.id;
      const organizationId = req.user.organizationId;
      
      // Sanitize input
      const sanitizedData = sanitizeInput(req.body);
      
      // Validate required fields
      const { shipment_id, event_type, event_time, location } = sanitizedData;
      
      if (!shipment_id || !event_type || !event_time || !location) {
        throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
      }

      // Validate event type
      const validEventTypes = ['departure', 'arrival', 'delay', 'customs_clearance', 'delivery', 'exception'];
      if (!validEventTypes.includes(event_type)) {
        throw new AppError('Invalid event type', 400, 'VALIDATION_ERROR');
      }

      // Create event
      const event = await eventService.createEvent({
        ...sanitizedData,
        userId,
        organizationId
      });

      logger.info(`Event created: ${event.event_id}`, {
        userId,
        organizationId,
        eventId: event.event_id,
        shipmentId: shipment_id,
        requestId: req.id
      });

      return res.status(201).json(
        ApiResponse.success(event, 'Event created successfully', 201)
      );
    } catch (error) {
      logger.error('Error creating event:', error);
      next(error);
    }
  }

  /**
   * Get event by ID
   * @route GET /api/v1/events/:id
   */
  async getEventById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user.organizationId;

      const event = await eventService.getEventById(id, organizationId);

      if (!event) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      return res.status(200).json(
        ApiResponse.success(event, 'Event retrieved successfully')
      );
    } catch (error) {
      logger.error('Error retrieving event:', error);
      next(error);
    }
  }

  /**
   * List events for a shipment
   * @route GET /api/v1/events
   */
  async listEvents(req, res, next) {
    try {
      const organizationId = req.user.organizationId;
      const { shipment_id, event_type, page = 1, limit = 50 } = req.query;

      const filters = {
        organizationId,
        shipment_id,
        event_type
      };

      const result = await eventService.listEvents(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return res.status(200).json(
        ApiResponse.success(result, 'Events retrieved successfully')
      );
    } catch (error) {
      logger.error('Error listing events:', error);
      next(error);
    }
  }
}

module.exports = new EventController();