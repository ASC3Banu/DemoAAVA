const AnalyticsService = require('../services/analytics.service');
const responseFormatter = require('../utils/responseFormatter');
const logger = require('../utils/logger');

class AnalyticsController {
  async getPredictions(req, res, next) {
    try {
      const predictions = await AnalyticsService.getPredictions(req.params.shipment_id);
      res.json(responseFormatter.success(predictions));
    } catch (error) {
      logger.error('Get predictions error:', error);
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const filters = {
        from_date: req.query.from_date,
        to_date: req.query.to_date
      };
      const dashboard = await AnalyticsService.getPerformanceDashboard(filters);
      res.json(responseFormatter.success(dashboard));
    } catch (error) {
      logger.error('Get dashboard error:', error);
      next(error);
    }
  }

  async detectAnomalies(req, res, next) {
    try {
      const anomalies = await AnalyticsService.detectAnomalies(req.params.shipment_id);
      res.json(responseFormatter.success(anomalies));
    } catch (error) {
      logger.error('Detect anomalies error:', error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();