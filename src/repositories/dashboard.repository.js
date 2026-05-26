/**
 * Dashboard Repository
 * Data access layer for dashboard analytics
 */

const db = require('../configs/database.config').pool;
const logger = require('../utils/logger');

class DashboardRepository {
  async getOperationalMetrics(filters) {
    const query = `
      SELECT 
        COUNT(DISTINCT s.shipment_id) as total_shipments,
        COUNT(DISTINCT CASE WHEN s.status = 'in_transit' THEN s.shipment_id END) as in_transit,
        COUNT(DISTINCT CASE WHEN s.status = 'delivered' THEN s.shipment_id END) as delivered,
        COUNT(DISTINCT CASE WHEN s.status = 'delayed' THEN s.shipment_id END) as delayed,
        COUNT(DISTINCT a.alert_id) as total_alerts,
        COUNT(DISTINCT CASE WHEN a.severity = 'critical' THEN a.alert_id END) as critical_alerts
      FROM shipments s
      LEFT JOIN alerts a ON s.shipment_id = a.shipment_id
      WHERE s.organization_id = $1
        AND ($2::timestamp IS NULL OR s.created_at >= $2)
        AND ($3::timestamp IS NULL OR s.created_at <= $3)
    `;

    try {
      const result = await db.query(query, [
        filters.organizationId,
        filters.start_date || null,
        filters.end_date || null
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting operational metrics:', error);
      throw error;
    }
  }

  async getShipmentStatistics(organizationId, period) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        status
      FROM shipments
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '${period}'
      GROUP BY DATE(created_at), status
      ORDER BY date DESC
    `;

    try {
      const result = await db.query(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting shipment statistics:', error);
      throw error;
    }
  }

  async getAlertAnalytics(organizationId, period) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        severity,
        COUNT(*) as count
      FROM alerts
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '${period}'
      GROUP BY DATE(created_at), severity
      ORDER BY date DESC
    `;

    try {
      const result = await db.query(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting alert analytics:', error);
      throw error;
    }
  }

  async getPerformanceKPIs(organizationId) {
    const query = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (actual_arrival_time - scheduled_arrival_time))/3600) as avg_delay_hours,
        (COUNT(CASE WHEN status = 'delivered' AND actual_arrival_time <= scheduled_arrival_time THEN 1 END)::float / 
         NULLIF(COUNT(CASE WHEN status = 'delivered' THEN 1 END), 0)) * 100 as on_time_delivery_rate,
        COUNT(DISTINCT shipment_id) as total_shipments_last_30_days
      FROM shipments
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
    `;

    try {
      const result = await db.query(query, [organizationId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting performance KPIs:', error);
      throw error;
    }
  }
}

module.exports = new DashboardRepository();
