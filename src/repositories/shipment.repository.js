const database = require('../configs/database.config');
const Shipment = require('../models/shipment.model');
const logger = require('../configs/logger.config');
const security = require('../configs/security.config');

class ShipmentRepository {
  async create(shipmentData) {
    try {
      const encryptedCargo = security.encryptAES256(shipmentData.cargo_details);
      
      const query = `
        INSERT INTO shipments (
          tracking_number, origin_location, destination_location,
          transport_mode, carrier_id, estimated_delivery,
          cargo_details, cargo_iv, cargo_auth_tag, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        shipmentData.tracking_number,
        shipmentData.origin_location,
        shipmentData.destination_location,
        shipmentData.transport_mode,
        shipmentData.carrier_id,
        shipmentData.estimated_delivery,
        encryptedCargo.encrypted,
        encryptedCargo.iv,
        encryptedCargo.authTag,
        'created',
        shipmentData.created_by
      ];

      const result = await database.query(query, values);
      const shipment = Shipment.fromDatabase(result.rows[0]);
      
      logger.info('Shipment created', { shipmentId: shipment.id });
      return shipment;
    } catch (error) {
      logger.error('Failed to create shipment', { error: error.message });
      throw error;
    }
  }

  async findById(shipmentId) {
    try {
      const query = 'SELECT * FROM shipments WHERE id = $1';
      const result = await database.query(query, [shipmentId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      if (row.cargo_details && row.cargo_iv && row.cargo_auth_tag) {
        row.cargo_details = security.decryptAES256(
          row.cargo_details,
          row.cargo_iv,
          row.cargo_auth_tag
        );
      }

      return Shipment.fromDatabase(row);
    } catch (error) {
      logger.error('Failed to find shipment', { shipmentId, error: error.message });
      throw error;
    }
  }

  async findByTrackingNumber(trackingNumber) {
    try {
      const query = 'SELECT * FROM shipments WHERE tracking_number = $1';
      const result = await database.query(query, [trackingNumber]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return Shipment.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find shipment by tracking number', {
        trackingNumber,
        error: error.message
      });
      throw error;
    }
  }

  async search(filters, pagination) {
    try {
      let query = 'SELECT * FROM shipments WHERE 1=1';
      const values = [];
      let paramIndex = 1;

      if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        values.push(filters.status);
      }

      if (filters.carrier_id) {
        query += ` AND carrier_id = $${paramIndex++}`;
        values.push(filters.carrier_id);
      }

      if (filters.transport_mode) {
        query += ` AND transport_mode = $${paramIndex++}`;
        values.push(filters.transport_mode);
      }

      if (filters.origin_location) {
        query += ` AND origin_location ILIKE $${paramIndex++}`;
        values.push(`%${filters.origin_location}%`);
      }

      if (filters.destination_location) {
        query += ` AND destination_location ILIKE $${paramIndex++}`;
        values.push(`%${filters.destination_location}%`);
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await database.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      query += ` ORDER BY created_at DESC`;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(pagination.limit, pagination.offset);

      const result = await database.query(query, values);
      const shipments = result.rows.map(row => Shipment.fromDatabase(row));

      return {
        data: shipments,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      logger.error('Failed to search shipments', { error: error.message });
      throw error;
    }
  }

  async updateStatus(shipmentId, statusData) {
    try {
      const query = `
        UPDATE shipments
        SET status = $1, current_location = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const values = [statusData.status, statusData.location, shipmentId];
      const result = await database.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Shipment status updated', {
        shipmentId,
        status: statusData.status
      });
      
      return Shipment.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update shipment status', {
        shipmentId,
        error: error.message
      });
      throw error;
    }
  }

  async delete(shipmentId) {
    try {
      const query = 'DELETE FROM shipments WHERE id = $1 RETURNING id';
      const result = await database.query(query, [shipmentId]);
      
      logger.info('Shipment deleted', { shipmentId });
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to delete shipment', { shipmentId, error: error.message });
      throw error;
    }
  }

  async getActiveShipments() {
    try {
      const query = `
        SELECT * FROM shipments
        WHERE status IN ('created', 'picked_up', 'in_transit', 'customs_clearance', 'out_for_delivery')
        ORDER BY estimated_delivery ASC
      `;
      
      const result = await database.query(query);
      return result.rows.map(row => Shipment.fromDatabase(row));
    } catch (error) {
      logger.error('Failed to get active shipments', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ShipmentRepository();
