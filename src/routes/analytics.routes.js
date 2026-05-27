const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.get('/predictions/:shipment_id',
  AnalyticsController.getPredictions
);

router.get('/dashboard',
  AnalyticsController.getDashboard
);

router.get('/anomalies/:shipment_id',
  AnalyticsController.detectAnomalies
);

module.exports = router;