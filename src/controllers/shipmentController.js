const trackingService = require('../services/trackingService');
const logger = require('../utils/logger');
const dataMasking = require('../utils/dataMasking');

class ShipmentController {
  async createShipment(req, res, next) {
    try {
      const shipment = await trackingService.createShipment(req.body, req.user.id);
      logger.audit('create_shipment', req.user.id, 'shipments', { shipmentId: shipment.id });
      res.status(201).json({ success: true, data: dataMasking.maskResponse(shipment, req.user.role) });
    } catch (error) {
      next(error);
    }
  }

  async getShipment(req, res, next) {
    try {
      const shipment = await trackingService.getShipment(req.params.id);
      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      res.json({ success: true, data: dataMasking.maskResponse(shipment, req.user.role) });
    } catch (error) {
      next(error);
    }
  }

  async getShipmentByTracking(req, res, next) {
    try {
      const shipment = await trackingService.getShipmentByTrackingNumber(req.params.trackingNumber);
      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      res.json({ success: true, data: dataMasking.maskResponse(shipment, req.user.role) });
    } catch (error) {
      next(error);
    }
  }

  async listShipments(req, res, next) {
    try {
      const filters = { status: req.query.status, transport_mode: req.query.transport_mode, carrier_id: req.query.carrier_id, date_from: req.query.date_from, date_to: req.query.date_to };
      const pagination = { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20, sortBy: req.query.sortBy || 'created_at', sortOrder: req.query.sortOrder || 'DESC' };
      const result = await trackingService.listShipments(filters, pagination);
      res.json({ success: true, data: result.shipments.map(s => dataMasking.maskResponse(s, req.user.role)), pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async updateShipment(req, res, next) {
    try {
      const shipment = await trackingService.updateShipment(req.params.id, req.body, req.user.id);
      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      logger.audit('update_shipment', req.user.id, 'shipments', { shipmentId: req.params.id });
      res.json({ success: true, data: dataMasking.maskResponse(shipment, req.user.role) });
    } catch (error) {
      next(error);
    }
  }

  async deleteShipment(req, res, next) {
    try {
      const result = await trackingService.deleteShipment(req.params.id, req.user.id);
      if (!result) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      logger.audit('delete_shipment', req.user.id, 'shipments', { shipmentId: req.params.id });
      res.json({ success: true, message: 'Shipment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const shipment = await trackingService.updateShipmentStatus(req.params.id, status, req.user.id);
      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      res.json({ success: true, data: dataMasking.maskResponse(shipment, req.user.role) });
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const { location } = req.body;
      const shipment = await trackingService.updateShipmentLocation(req.params.id, location, req.user.id);
      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      res.json({ success: true, data: dataMasking.maskResponse(shipment, req.user.role) });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const filters = { date_from: req.query.date_from, date_to: req.query.date_to };
      const stats = await trackingService.getShipmentStatistics(filters);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShipmentController();