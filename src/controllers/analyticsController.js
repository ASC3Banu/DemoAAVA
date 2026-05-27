const dashboardService = require('../services/dashboardService');
const predictionService = require('../services/predictionService');
const logger = require('../utils/logger');

class AnalyticsController {
  async getDashboard(req, res, next) {
    try {
      const filters = { date_from: req.query.date_from, date_to: req.query.date_to };
      const data = await dashboardService.getDashboardData(filters);
      res.json({ success: true, data: data });
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceMetrics(req, res, next) {
    try {
      const filters = { date_from: req.query.date_from, date_to: req.query.date_to };
      const metrics = await dashboardService.getPerformanceMetrics(filters);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierPerformance(req, res, next) {
    try {
      const filters = { date_from: req.query.date_from, date_to: req.query.date_to };
      const performance = await dashboardService.getCarrierPerformance(filters);
      res.json({ success: true, data: performance });
    } catch (error) {
      next(error);
    }
  }

  async predictDelay(req, res, next) {
    try {
      const prediction = await predictionService.predictDelay(req.params.shipmentId);
      res.json({ success: true, data: prediction });
    } catch (error) {
      next(error);
    }
  }

  async predictDeliveryTime(req, res, next) {
    try {
      const prediction = await predictionService.predictDeliveryTime(req.params.shipmentId);
      res.json({ success: true, data: prediction });
    } catch (error) {
      next(error);
    }
  }

  async analyzeRisk(req, res, next) {
    try {
      const analysis = await predictionService.analyzeShipmentRisk(req.params.shipmentId);
      res.json({ success: true, data: analysis });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();