const alertService = require('../services/alertService');
const logger = require('../utils/logger');

class AlertController {
  async createAlert(req, res, next) {
    try {
      const alert = await alertService.createAlert(req.body);
      logger.audit('create_alert', req.user.id, 'alerts', { alertId: alert.id });
      res.status(201).json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  async getAlert(req, res, next) {
    try {
      const alert = await alertService.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  async listAlerts(req, res, next) {
    try {
      const filters = { alert_type: req.query.alert_type, severity: req.query.severity, status: req.query.status, shipment_id: req.query.shipment_id, date_from: req.query.date_from, date_to: req.query.date_to };
      const pagination = { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20, sortBy: req.query.sortBy || 'triggered_at', sortOrder: req.query.sortOrder || 'DESC' };
      const result = await alertService.listAlerts(filters, pagination);
      res.json({ success: true, data: result.alerts, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async acknowledgeAlert(req, res, next) {
    try {
      const alert = await alertService.acknowledgeAlert(req.params.id, req.user.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      logger.audit('acknowledge_alert', req.user.id, 'alerts', { alertId: req.params.id });
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  async resolveAlert(req, res, next) {
    try {
      const alert = await alertService.resolveAlert(req.params.id, req.user.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      logger.audit('resolve_alert', req.user.id, 'alerts', { alertId: req.params.id });
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  async getOpenAlerts(req, res, next) {
    try {
      const severity = req.query.severity || null;
      const alerts = await alertService.getOpenAlerts(severity);
      res.json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlertController();