/**
 * Dashboard Routes
 * Defines HTTP routes for dashboard operations
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

router.get('/metrics', 
  checkPermission('dashboard:read'),
  dashboardController.getDashboardMetrics.bind(dashboardController)
);

router.get('/shipment-stats', 
  checkPermission('dashboard:read'),
  dashboardController.getShipmentStatistics.bind(dashboardController)
);

router.get('/alert-analytics', 
  checkPermission('dashboard:read'),
  dashboardController.getAlertAnalytics.bind(dashboardController)
);

router.get('/kpis', 
  checkPermission('dashboard:read'),
  dashboardController.getPerformanceKPIs.bind(dashboardController)
);

module.exports = router;
