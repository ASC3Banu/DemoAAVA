/**
 * Alert Routes
 * Defines HTTP routes for alert operations
 */

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

router.get('/', 
  checkPermission('alert:read'),
  alertController.getAlerts.bind(alertController)
);

router.get('/:id', 
  checkPermission('alert:read'),
  alertController.getAlertById.bind(alertController)
);

router.patch('/:id/acknowledge', 
  checkPermission('alert:update'),
  alertController.acknowledgeAlert.bind(alertController)
);

router.patch('/:id/resolve', 
  checkPermission('alert:update'),
  alertController.resolveAlert.bind(alertController)
);

module.exports = router;
