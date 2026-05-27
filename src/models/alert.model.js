const { pgPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AlertModel {
  async create(alertData) {
    const id = uuidv4();
    const query = `
      INSERT INTO alerts (
        id, shipment_id, alert_type, severity, message,
        status, assigned_to, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      alertData.shipment_id,
      alertData.alert_type,
      alertData.severity,
      alertData.message,
      alertData.status || 'open',
      alertData.assigned_to || null,
      JSON.stringify(alertData.metadata || {})
    ];

    const result = await pgPool.query(query, values);
    return this.formatAlert(result.rows[0]);
  }

  async findById(id) {
    const query = 'SELECT * FROM alerts WHERE id = $1';
    const result = await pgPool.query(query, [id]);
    return result.rows[0] ? this.formatAlert(result.rows[0]) : null;
  }

  async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (key === 'metadata') {
        fields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(updateData[key]));
      } else {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
      paramCount++;
    });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE alerts
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pgPool.query(query, values);
    return result.rows[0] ? this.formatAlert(result.rows[0]) : null;
  }

  async findByShipmentId(shipmentId) {
    const query = 'SELECT * FROM alerts WHERE shipment_id = $1 ORDER BY created_at DESC';
    const result = await pgPool.query(query, [shipmentId]);
    return result.rows.map(row => this.formatAlert(row));
  }

  async findAll(filters = {}, pagination = {}) {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.severity) {
      query += ` AND severity = $${paramCount}`;
      values.push(filters.severity);
      paramCount++;
    }

    if (filters.alert_type) {
      query += ` AND alert_type = $${paramCount}`;
      values.push(filters.alert_type);
      paramCount++;
    }

    if (filters.assigned_to) {
      query += ` AND assigned_to = $${paramCount}`;
      values.push(filters.assigned_to);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (pagination.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(pagination.limit);
      paramCount++;
    }

    if (pagination.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(pagination.offset);
    }

    const result = await pgPool.query(query, values);
    return result.rows.map(row => this.formatAlert(row));
  }

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) FROM alerts WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.severity) {
      query += ` AND severity = $${paramCount}`;
      values.push(filters.severity);
    }

    const result = await pgPool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  formatAlert(row) {
    return {
      id: row.id,
      shipment_id: row.shipment_id,
      alert_type: row.alert_type,
      severity: row.severity,
      message: row.message,
      status: row.status,
      assigned_to: row.assigned_to,
      resolution_notes: row.resolution_notes,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

module.exports = new AlertModel();