const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const shipmentRoutes = require('./shipment.routes');
const eventRoutes = require('./event.routes');
const alertRoutes = require('./alert.routes');
const analyticsRoutes = require('./analytics.routes');
const userRoutes = require('./user.routes');
const webhookRoutes = require('./webhook.routes');

router.use('/auth', authRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/', eventRoutes);
router.use('/alerts', alertRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);
router.use('/webhooks', webhookRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1'
  });
});

module.exports = router;