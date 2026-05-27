const AlertRepository = require('../repositories/alert.repository');
const { publishEvent, TOPICS } = require('../config/kafka');
const logger = require('../utils/logger');

class AlertService {
  async createAlert(alertData) {
    try {
      const alert = await AlertRepository.create(alertData);

      await publishEvent(TOPICS.ALERT_CREATED, {
        id: alert.id,
        shipment_id: alert.shipment_id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        timestamp: new Date().toISOString()
      });

      logger.info(`Alert created: ${alert.id} for shipment ${alert.shipment_id}`);
      return alert;
    } catch (error) {
      logger.error('Failed to create alert:', error);
      throw error;
    }
  }

  async getAlertById(id) {
    const alert = await AlertRepository.findById(id);
    if (!alert) {
      throw new Error('Alert not found');
    }
    return alert;
  }

  async updateAlert(id, updateData, userId) {
    try {
      const alert = await AlertRepository.update(id, updateData);
      if (!alert) {
        throw new Error('Alert not found');
      }

      logger.info(`Alert updated: ${id} by user ${userId}`);
      return alert;
    } catch (error) {
      logger.error('Failed to update alert:', error);
      throw error;
    }
  }

  async getAlertsByShipmentId(shipmentId) {
    return await AlertRepository.findByShipmentId(shipmentId);
  }

  async listAlerts(filters, pagination) {
    return await AlertRepository.findAll(filters, pagination);
  }

  async evaluateAlertRules(shipmentId, eventData) {
    const rules = [
      {
        condition: (event) => event.event_type === 'exception',
        alert: {
          alert_type: 'exception',
          severity: 'high',
          message: 'Exception occurred during shipment'
        }
      },
      {
        condition: (event) => event.event_type === 'customs' && event.metadata?.hold === true,
        alert: {
          alert_type: 'customs_hold',
          severity: 'medium',
          message: 'Shipment held at customs'
        }
      }
    ];

    for (const rule of rules) {
      if (rule.condition(eventData)) {
        await this.createAlert({
          shipment_id: shipmentId,
          ...rule.alert,
          metadata: eventData.metadata
        });
      }
    }
  }
}

module.exports = new AlertService();