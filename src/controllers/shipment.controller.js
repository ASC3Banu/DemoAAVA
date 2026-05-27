const ShipmentService = require('../services/shipment.service');
const responseFormatter = require('../utils/responseFormatter');
const paginationHelper = require('../utils/pagination');
const logger = require('../utils/logger');

class ShipmentController {
  async create(req, res, next) {
    try {
      const shipment = await ShipmentService.createShipment(req.body, req.user.id);
      res.status(201).json(responseFormatter.created(shipment, 'Shipment created successfully'));
    } catch (error) {
      logger.error('Create shipment error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const shipment = await ShipmentService.getShipmentById(req.params.id);
      res.json(responseFormatter.success(shipment));
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json(responseFormatter.notFound('Shipment'));
      }
      next(error);
    }
  }

  async getByTrackingNumber(req, res, next) {
    try {
      const shipment = await ShipmentService.getShipmentByTrackingNumber(req.params.tracking_number);
      res.json(responseFormatter.success(shipment));
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json(responseFormatter.notFound('Shipment'));
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const shipment = await ShipmentService.updateShipment(req.params.id, req.body, req.user.id);
      res.json(responseFormatter.updated(shipment, 'Shipment updated successfully'));
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json(responseFormatter.notFound('Shipment'));
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await ShipmentService.deleteShipment(req.params.id, req.user.id);
      res.json(responseFormatter.deleted('Shipment deleted successfully'));
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json(responseFormatter.notFound('Shipment'));
      }
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { page, limit } = paginationHelper.validatePaginationParams(req.query.page, req.query.limit);
      const pagination = paginationHelper.paginate(req.query, page, limit);
      
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        carrier: req.query.carrier,
        from_date: req.query.from_date,
        to_date: req.query.to_date,
        search: req.query.search
      };

      const result = await ShipmentService.listShipments(filters, pagination);
      
      res.json(paginationHelper.formatResponse(result.shipments, result.total, page, limit));
    } catch (error) {
      logger.error('List shipments error:', error);
      next(error);
    }
  }
}

module.exports = new ShipmentController();