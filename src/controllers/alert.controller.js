const AlertService = require('../services/alert.service');
const responseFormatter = require('../utils/responseFormatter');
const paginationHelper = require('../utils/pagination');
const logger = require('../utils/logger');

class AlertController {
  async create(req, res, next) {
    try {
      const alert = await AlertService.createAlert(req.body);
      res.status(201).json(responseFormatter.created(alert, 'Alert created successfully'));
    } catch (error) {
      logger.error('Create alert error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const alert = await AlertService.getAlertById(req.params.id);
      res.json(responseFormatter.success(alert));
    } catch (error) {
      if (error.message === 'Alert not found') {
        return res.status(404).json(responseFormatter.notFound('Alert'));
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const alert = await AlertService.updateAlert(req.params.id, req.body, req.user.id);
      res.json(responseFormatter.updated(alert, 'Alert updated successfully'));
    } catch (error) {
      if (error.message === 'Alert not found') {
        return res.status(404).json(responseFormatter.notFound('Alert'));
      }
      next(error);
    }
  }

  async getByShipmentId(req, res, next) {
    try {
      const alerts = await AlertService.getAlertsByShipmentId(req.params.shipment_id);
      res.json(responseFormatter.success(alerts));
    } catch (error) {
      logger.error('Get alerts error:', error);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { page, limit } = paginationHelper.validatePaginationParams(req.query.page, req.query.limit);
      const pagination = paginationHelper.paginate(req.query, page, limit);
      
      const filters = {
        status: req.query.status,
        severity: req.query.severity,
        alert_type: req.query.alert_type,
        assigned_to: req.query.assigned_to
      };

      const result = await AlertService.listAlerts(filters, pagination);
      
      res.json(paginationHelper.formatResponse(result.alerts, result.total, page, limit));
    } catch (error) {
      logger.error('List alerts error:', error);
      next(error);
    }
  }
}

module.exports = new AlertController();