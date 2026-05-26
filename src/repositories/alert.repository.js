/**
 * Alert Repository
 * Data access layer for alert operations
 */

const db = require('../configs/database.config').pool;
const logger = require('../utils/logger');

class AlertRepository {
  async create(data) {
    const query = `
      INSERT INTO alerts (
        alert_id, shipment_id, severity, description, status,
        alert_type, prediction_confidence, organization_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      data.alert_id,
      data.shipment_id,
      data.severity,
      data.description,
      data.status,
      data.alert_type || 'manual',
      data.prediction_confidence || null,
      data.organizationId,
      data.created_at
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  async findById(alert_id, organizationId) {
    const query = `
      SELECT * FROM alerts
      WHERE alert_id = $1 AND organization_id = $2
    `;

    try {
      const result = await db.query(query, [alert_id, organizationId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding alert:', error);
      throw error;
    }
  }

  async findAll(filters, pagination) {
    const conditions = ['organization_id = $1'];
    const values = [filters.organizationId];
    let paramCount = 2;

    if (filters.shipment_id) {
      conditions.push(`shipment_id = $${paramCount}`);
      values.push(filters.shipment_id);
      paramCount++;
    }

    if (filters.severity) {
      conditions.push(`severity = $${paramCount}`);
      values.push(filters.severity);
      paramCount++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    const offset = (pagination.page - 1) * pagination.limit;
    values.push(pagination.limit, offset);

    const query = `
      SELECT * FROM alerts
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM alerts
      WHERE ${conditions.join(' AND ')}
    `;

    try {
      const [dataResult, countResult] = await Promise.all([
        db.query(query, values),
        db.query(countQuery, values.slice(0, -2))
      ]);

      return {
        data: dataResult.rows,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(countResult.rows[0].count / pagination.limit)
        }
      };
    } catch (error) {
      logger.error('Error finding alerts:', error);
      throw error;
    }
  }

  async update(alert_id, data, organizationId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
        paramCount++;
      }
    });

    values.push(alert_id, organizationId);

    const query = `
      UPDATE alerts
      SET ${fields.join(', ')}
      WHERE alert_id = $${paramCount} AND organization_id = $${paramCount + 1}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating alert:', error);
      throw error;
    }
  }
}

module.exports = new AlertRepository();
