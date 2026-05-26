const express = require('express');
const router = express.Router();
const alertService = require('../services/alert.service');
const { authorize } = require('../middleware/auth.middleware');
const logger = require('../configs/logger.config');

router.get('/',
  async (req, res, next) => {
    try {
      const { severity, alert_type, page = 1, limit = 20 } = req.query;
      
      const filters = {};
      if (severity) filters.severity = severity;
      if (alert_type) filters.alert_type = alert_type;

      const result = await alertService.getActiveAlerts(filters, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:alert_id/acknowledge',
  async (req, res, next) => {
    try {
      const alert = await alertService.acknowledgeAlert(
        req.params.alert_id,
        req.user.id
      );
      res.status(200).json(alert.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:alert_id/resolve',
  authorize('logistics_manager', 'admin'),
  async (req, res, next) => {
    try {
      const alert = await alertService.resolveAlert(
        req.params.alert_id,
        req.user.id
      );
      res.status(200).json(alert.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
