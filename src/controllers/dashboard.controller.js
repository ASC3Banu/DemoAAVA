const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard.service');
const logger = require('../configs/logger.config');

router.get('/metrics',
  async (req, res, next) => {
    try {
      const { time_range = '24h', region, transport_mode } = req.query;
      
      const filters = {};
      if (region) filters.region = region;
      if (transport_mode) filters.transport_mode = transport_mode;

      const metrics = await dashboardService.getMetrics(time_range, filters);
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
