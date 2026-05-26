/**
 * Alert Service
 * Business logic for alert management
 * 
 * Security: Alert validation, notification security
 * Compliance: Alert tracking, escalation workflows
 */

const alertRepository = require('../repositories/alert.repository');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');
const { AppError } = require('../utils/error.util');
const { generateAlertId } = require('../utils/id-generator.util');

class AlertService {
  /**
   * Create an alert
   */
  async createAlert(data) {
    try {
      const alert_id = generateAlertId();

      const alertData = {
        ...data,
        alert_id,
        status: 'active',
        created_at: new Date()
      };

      const alert = await alertRepository.create(alertData);

      // Send notifications based on severity
      await notificationService.sendAlertNotification(alert);

      logger.info(`Alert created: ${alert_id}`);
      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw new AppError('Failed to create alert', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get alerts with filters
   */
  async getAlerts(filters, pagination) {
    try {
      const result = await alertRepository.findAll(filters, pagination);
      return result;
    } catch (error) {
      logger.error('Error retrieving alerts:', error);
      throw new AppError('Failed to retrieve alerts', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alert_id, organizationId) {
    try {
      const alert = await alertRepository.findById(alert_id, organizationId);
      return alert;
    } catch (error) {
      logger.error('Error retrieving alert:', error);
      throw new AppError('Failed to retrieve alert', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alert_id, userId, organizationId) {
    try {
      const alert = await alertRepository.update(alert_id, {
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date()
      }, organizationId);

      logger.info(`Alert acknowledged: ${alert_id} by user ${userId}`);
      return alert;
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw new AppError('Failed to acknowledge alert', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alert_id, userId, organizationId, resolution_notes) {
    try {
      const alert = await alertRepository.update(alert_id, {
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date(),
        resolution_notes
      }, organizationId);

      logger.info(`Alert resolved: ${alert_id} by user ${userId}`);
      return alert;
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw new AppError('Failed to resolve alert', 500, 'SERVICE_ERROR');
    }
  }
}

module.exports = new AlertService();