const database = require('../configs/database.config');
const Alert = require('../models/alert.model');
const logger = require('../configs/logger.config');

class AlertRepository {
  async create(alertData) {
    try {
      const query = `
        INSERT INTO alerts (
          shipment_id, alert_type, severity, title, description,
          status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        alertData.shipment_id,
        alertData.alert_type,
        alertData.severity,
        alertData.title,
        alertData.description,
        'active',
        JSON.stringify(alertData.metadata || {})
      ];

      const result = await database.query(query, values);
      const alert = Alert.fromDatabase(result.rows[0]);
      
      logger.info('Alert created', {
        alertId: alert.id,
        shipmentId: alert.shipmentId,
        severity: alert.severity
      });
      
      return alert;
    } catch (error) {
      logger.error('Failed to create alert', { error: error.message });
      throw error;
    }
  }

  async findById(alertId) {
    try {
      const query = 'SELECT * FROM alerts WHERE id = $1';
      const result = await database.query(query, [alertId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return Alert.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find alert', { alertId, error: error.message });
      throw error;
    }
  }

  async findActive(filters = {}, pagination = {}) {
    try {
      let query = "SELECT * FROM alerts WHERE status IN ('active', 'acknowledged')";
      const values = [];
      let paramIndex = 1;

      if (filters.severity) {
        query += ` AND severity = $${paramIndex++}`;
        values.push(filters.severity);
      }

      if (filters.alert_type) {
        query += ` AND alert_type = $${paramIndex++}`;
        values.push(filters.alert_type);
      }

      if (filters.shipment_id) {
        query += ` AND shipment_id = $${paramIndex++}`;
        values.push(filters.shipment_id);
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await database.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      query += ' ORDER BY created_at DESC';
      
      if (pagination.limit) {
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        values.push(pagination.limit, pagination.offset || 0);
      }

      const result = await database.query(query, values);
      const alerts = result.rows.map(row => Alert.fromDatabase(row));

      return {
        data: alerts,
        total,
        page: pagination.page || 1,
        limit: pagination.limit || total,
        totalPages: pagination.limit ? Math.ceil(total / pagination.limit) : 1
      };
    } catch (error) {
      logger.error('Failed to find active alerts', { error: error.message });
      throw error;
    }
  }

  async acknowledge(alertId, userId) {
    try {
      const query = `
        UPDATE alerts
        SET status = 'acknowledged',
            acknowledged_by = $1,
            acknowledged_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND status = 'active'
        RETURNING *
      `;

      const result = await database.query(query, [userId, alertId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Alert acknowledged', { alertId, userId });
      return Alert.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error('Failed to acknowledge alert', { alertId, error: error.message });
      throw error;
    }
  }

  async resolve(alertId, userId) {
    try {
      const query = `
        UPDATE alerts
        SET status = 'resolved',
            resolved_by = $1,
            resolved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await database.query(query, [userId, alertId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Alert resolved', { alertId, userId });
      return Alert.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error('Failed to resolve alert', { alertId, error: error.message });
      throw error;
    }
  }

  async getEscalationCandidates() {
    try {
      const query = `
        SELECT * FROM alerts
        WHERE status IN ('active', 'acknowledged')
        AND (
          (severity = 'critical' AND created_at < NOW() - INTERVAL '1 hour')
          OR (severity = 'high' AND created_at < NOW() - INTERVAL '4 hours')
          OR (severity = 'medium' AND created_at < NOW() - INTERVAL '12 hours')
          OR (severity = 'low' AND created_at < NOW() - INTERVAL '24 hours')
        )
        ORDER BY severity DESC, created_at ASC
      `;

      const result = await database.query(query);
      return result.rows.map(row => Alert.fromDatabase(row));
    } catch (error) {
      logger.error('Failed to get escalation candidates', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AlertRepository();
