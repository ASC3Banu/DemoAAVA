const { pgPool } = require('../config/database');

class DataLineageTracker {
  async trackDataChange(params) {
    const {
      entityType,
      entityId,
      action,
      userId,
      oldValue,
      newValue,
      metadata
    } = params;

    try {
      const query = `
        INSERT INTO data_lineage (
          entity_type, entity_id, action, user_id,
          old_value, new_value, metadata, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const result = await pgPool.query(query, [
        entityType,
        entityId,
        action,
        userId,
        JSON.stringify(oldValue),
        JSON.stringify(newValue),
        JSON.stringify(metadata),
        new Date().toISOString()
      ]);

      return result.rows[0].id;
    } catch (error) {
      console.error('Failed to track data lineage:', error);
      throw error;
    }
  }

  async getEntityHistory(entityType, entityId) {
    try {
      const query = `
        SELECT * FROM data_lineage
        WHERE entity_type = $1 AND entity_id = $2
        ORDER BY timestamp DESC
      `;

      const result = await pgPool.query(query, [entityType, entityId]);
      return result.rows;
    } catch (error) {
      console.error('Failed to get entity history:', error);
      throw error;
    }
  }

  async getUserActivity(userId, startDate, endDate) {
    try {
      const query = `
        SELECT * FROM data_lineage
        WHERE user_id = $1
        AND timestamp >= $2
        AND timestamp <= $3
        ORDER BY timestamp DESC
      `;

      const result = await pgPool.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Failed to get user activity:', error);
      throw error;
    }
  }
}

module.exports = new DataLineageTracker();