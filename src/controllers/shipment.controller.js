/**
 * Shipment Controller
 * Handles HTTP requests for shipment operations
 * 
 * Security: Input validation, RBAC enforcement, PII filtering
 * Compliance: Audit logging, data lineage tracking
 */

const shipmentService = require('../services/shipment.service');
const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/response.util');
const { AppError } = require('../utils/error.util');
const { sanitizeInput } = require('../utils/sanitizer.util');

class ShipmentController {
  /**
   * Create a new shipment
   * @route POST /api/v1/shipments
   */
  async createShipment(req, res, next) {
    try {
      const userId = req.user.id;
      const organizationId = req.user.organizationId;
      
      // Sanitize input
      const sanitizedData = sanitizeInput(req.body);
      
      // Validate required fields
      const { origin, destination, departure_time, arrival_time } = sanitizedData;
      
      if (!origin || !destination || !departure_time || !arrival_time) {
        throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
      }

      // Create shipment
      const shipment = await shipmentService.createShipment({
        ...sanitizedData,
        userId,
        organizationId
      });

      logger.info(`Shipment created: ${shipment.shipment_id}`, {
        userId,
        organizationId,
        shipmentId: shipment.shipment_id,
        requestId: req.id
      });

      return res.status(201).json(
        ApiResponse.success(shipment, 'Shipment created successfully', 201)
      );
    } catch (error) {
      logger.error('Error creating shipment:', error);
      next(error);
    }
  }

  /**
   * Get shipment by ID
   * @route GET /api/v1/shipments/:id
   */
  async getShipmentById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      // Validate shipment ID format
      if (!/^SHP-[0-9]{4}-[0-9]{6}$/.test(id)) {
        throw new AppError('Invalid shipment ID format', 400, 'VALIDATION_ERROR');
      }

      // Get shipment with RBAC check
      const shipment = await shipmentService.getShipmentById(id, organizationId);

      if (!shipment) {
        throw new AppError('Shipment not found', 404, 'NOT_FOUND');
      }

      logger.info(`Shipment retrieved: ${id}`, {
        userId,
        organizationId,
        shipmentId: id,
        requestId: req.id
      });

      return res.status(200).json(
        ApiResponse.success(shipment, 'Shipment retrieved successfully')
      );
    } catch (error) {
      logger.error('Error retrieving shipment:', error);
      next(error);
    }
  }

  /**
   * Update shipment
   * @route PUT /api/v1/shipments/:id
   */
  async updateShipment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;
      
      // Sanitize input
      const sanitizedData = sanitizeInput(req.body);

      // Update shipment with RBAC check
      const shipment = await shipmentService.updateShipment(
        id,
        sanitizedData,
        organizationId
      );

      if (!shipment) {
        throw new AppError('Shipment not found', 404, 'NOT_FOUND');
      }

      logger.info(`Shipment updated: ${id}`, {
        userId,
        organizationId,
        shipmentId: id,
        requestId: req.id
      });

      return res.status(200).json(
        ApiResponse.success(shipment, 'Shipment updated successfully')
      );
    } catch (error) {
      logger.error('Error updating shipment:', error);
      next(error);
    }
  }

  /**
   * List shipments with pagination and filtering
   * @route GET /api/v1/shipments
   */
  async listShipments(req, res, next) {
    try {
      const userId = req.user.id;
      const organizationId = req.user.organizationId;
      
      const { page = 1, limit = 20, status, origin, destination } = req.query;

      const filters = {
        organizationId,
        status,
        origin,
        destination
      };

      const result = await shipmentService.listShipments(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      logger.info('Shipments listed', {
        userId,
        organizationId,
        count: result.data.length,
        requestId: req.id
      });

      return res.status(200).json(
        ApiResponse.success(result, 'Shipments retrieved successfully')
      );
    } catch (error) {
      logger.error('Error listing shipments:', error);
      next(error);
    }
  }

  /**
   * Delete shipment
   * @route DELETE /api/v1/shipments/:id
   */
  async deleteShipment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      // Check user has delete permission
      if (!req.user.permissions.includes('shipment:delete')) {
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }

      await shipmentService.deleteShipment(id, organizationId);

      logger.info(`Shipment deleted: ${id}`, {
        userId,
        organizationId,
        shipmentId: id,
        requestId: req.id
      });

      return res.status(200).json(
        ApiResponse.success(null, 'Shipment deleted successfully')
      );
    } catch (error) {
      logger.error('Error deleting shipment:', error);
      next(error);
    }
  }
}

module.exports = new ShipmentController();