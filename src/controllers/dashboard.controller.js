/**
 * Dashboard Controller
 * Handles HTTP requests for operational metrics and analytics
 * 
 * Security: RBAC enforcement, data aggregation
 * Compliance: Performance monitoring, KPI tracking
 */

const dashboardService = require('../services/dashboard.service');
const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/response.util');
const { AppError } = require('../utils/error.util');

class DashboardController {
  /**
   * Get operational metrics
   * @route GET /api/v1/dashboard/metrics
   */
  async getDashboardMetrics(req, res, next) {
    try {
      const organizationId = req.user.organizationId;
      const { start_date, end_date, region } = req.query;

      const filters = {
        organizationId,
        start_date,
        end_date,
        region
      };

      const metrics = await dashboardService.getOperationalMetrics(filters);

      logger.info('Dashboard metrics retrieved', {
        userId: req.user.id,
        organizationId,
        requestId: req.id
      });

      return res.status(200).json(
        ApiResponse.success(metrics, 'Dashboard metrics retrieved successfully')
      );
    } catch (error) {
      logger.error('Error retrieving dashboard metrics:', error);
      next(error);
    }
  }

  /**
   * Get shipment statistics
   * @route GET /api/v1/dashboard/shipment-stats
   */
  async getShipmentStatistics(req, res, next) {
    try {
      const organizationId = req.user.organizationId;
      const { period = '30d' } = req.query;

      const stats = await dashboardService.getShipmentStatistics(organizationId, period);

      return res.status(200).json(
        ApiResponse.success(stats, 'Shipment statistics retrieved successfully')
      );
    } catch (error) {
      logger.error('Error retrieving shipment statistics:', error);
      next(error);
    }
  }

  /**
   * Get alert analytics
   * @route GET /api/v1/dashboard/alert-analytics
   */
  async getAlertAnalytics(req, res, next) {
    try {
      const organizationId = req.user.organizationId;
      const { period = '30d' } = req.query;

      const analytics = await dashboardService.getAlertAnalytics(organizationId, period);

      return res.status(200).json(
        ApiResponse.success(analytics, 'Alert analytics retrieved successfully')
      );
    } catch (error) {
      logger.error('Error retrieving alert analytics:', error);
      next(error);
    }
  }

  /**
   * Get performance KPIs
   * @route GET /api/v1/dashboard/kpis
   */
  async getPerformanceKPIs(req, res, next) {
    try {
      const organizationId = req.user.organizationId;

      const kpis = await dashboardService.getPerformanceKPIs(organizationId);

      return res.status(200).json(
        ApiResponse.success(kpis, 'Performance KPIs retrieved successfully')
      );
    } catch (error) {
      logger.error('Error retrieving performance KPIs:', error);
      next(error);
    }
  }
}

module.exports = new DashboardController();