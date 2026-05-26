/**
 * Alert Controller
 * Handles HTTP requests for alert management operations
 * 
 * Security: Input validation, RBAC enforcement
 * Compliance: Audit logging, alert tracking
 */

const alertService = require('../services/alert.service');
const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/response.util');
const { AppError } = require('../utils/error.util');

class AlertController {
  /**
   * Get alerts
   * @route GET /api/v1/alerts
   */
  async getAlerts(req, res, next) {
    try {
      const organizationId = req.user.organizationId;
      const { shipment_id, severity, status, page = 1, limit = 20 } = req.query;

      // Validate severity if provided
      if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
        throw new AppError('Invalid severity level', 400, 'VALIDATION_ERROR');
      }

      const filters = {
        organizationId,
        shipment_id,
        severity,
        status
      };

      const result = await alertService.getAlerts(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      logger.info('Alerts retrieved', {
        userId: req.user.id,
        organizationId,
        count: result.data.length,
        requestId: req.id
      });

      return res.status(200).json(
        ApiResponse.success(result, 'Alerts retrieved successfully')
      );
    } catch (error) {
      logger.error('Error retrieving alerts:', error);
      next(error);
    }
  }

  /**
   * Get alert by ID
   * @route GET /api/v1/alerts/:id
   */
  async getAlertById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user.organizationId;

      const alert = await alertService.getAlertById(id, organizationId);

      if (!alert) {
        throw new AppError('Alert not found', 404, 'NOT_FOUND');
      }

      return res.status(200).json(
        ApiResponse.success(alert, 'Alert retrieved successfully')
      );
    } catch (error) {
      logger.error('Error retrieving alert:', error);
      next(error);
    }
  }

  /**
   * Acknowledge alert
   * @route PATCH /api/v1/alerts/:id/acknowledge
   */
  async acknowledgeAlert(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      const alert = await alertService.acknowledgeAlert(id, userId, organizationId);

      if (!alert) {
        throw new AppError('Alert not found', 404, 'NOT_FOUND');
      }

      logger.info(`Alert acknowledged: ${id}`, {
        userId,
        organizationId,
        alertId: id,
        requestId: req.id
      });

      return res.status(200).json(
        ApiResponse.success(alert, 'Alert acknowledged successfully')
      );
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      next(error);
    }
  }

  /**
   * Resolve alert
   * @route PATCH /api/v1/alerts/:id/resolve
   */
  async resolveAlert(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const organizationId = req.user.organizationId;
      const { resolution_notes } = req.body;

      const alert = await alertService.resolveAlert(id, userId, organizationId, resolution_notes);

      if (!alert) {
        throw new AppError('Alert not found', 404, 'NOT_FOUND');
      }

      logger.info(`Alert resolved: ${id}`, {
        userId,
        organizationId,
        alertId: id,
        requestId: req.id
      });

      return res.status(200).json(
        ApiResponse.success(alert, 'Alert resolved successfully')
      );
    } catch (error) {
      logger.error('Error resolving alert:', error);
      next(error);
    }
  }
}

module.exports = new AlertController();