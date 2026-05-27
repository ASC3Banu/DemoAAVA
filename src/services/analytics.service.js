const axios = require('axios');
const config = require('../config/env');
const cacheManager = require('../utils/cache');
const { pgPool } = require('../config/database');
const logger = require('../utils/logger');

class AnalyticsService {
  async getPredictions(shipmentId) {
    try {
      const cacheKey = `prediction:${shipmentId}`;
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const shipmentQuery = `
        SELECT s.*, 
               json_agg(e ORDER BY e.timestamp DESC) as events
        FROM shipments s
        LEFT JOIN events e ON e.shipment_id = s.id
        WHERE s.id = $1
        GROUP BY s.id
      `;
      
      const result = await pgPool.query(shipmentQuery, [shipmentId]);
      if (result.rows.length === 0) {
        throw new Error('Shipment not found');
      }

      const shipmentData = result.rows[0];

      const response = await axios.post(config.ai.predictionEndpoint, {
        shipment_id: shipmentId,
        origin: shipmentData.origin,
        destination: shipmentData.destination,
        carrier: shipmentData.carrier,
        current_status: shipmentData.status,
        events: shipmentData.events || []
      }, {
        timeout: 5000
      });

      const predictions = {
        shipment_id: shipmentId,
        estimated_arrival: response.data.estimated_arrival,
        delay_probability: response.data.delay_probability,
        risk_factors: response.data.risk_factors || [],
        confidence_score: response.data.confidence_score,
        generated_at: new Date().toISOString()
      };

      await cacheManager.set(cacheKey, predictions, config.cache.predictionTTL);
      logger.info(`Predictions generated for shipment: ${shipmentId}`);
      
      return predictions;
    } catch (error) {
      logger.error('Failed to get predictions:', error);
      if (error.code === 'ECONNREFUSED') {
        return {
          shipment_id: shipmentId,
          error: 'AI service unavailable',
          fallback: true
        };
      }
      throw error;
    }
  }

  async getPerformanceDashboard(filters = {}) {
    try {
      const cacheKey = `dashboard:${JSON.stringify(filters)}`;
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_shipments,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed,
          AVG(EXTRACT(EPOCH FROM (actual_delivery - created_at))/3600) as avg_delivery_time_hours
        FROM shipments
        WHERE created_at >= COALESCE($1, NOW() - INTERVAL '30 days')
        AND created_at <= COALESCE($2, NOW())
      `;

      const alertsQuery = `
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_alerts
        FROM alerts
        WHERE created_at >= COALESCE($1, NOW() - INTERVAL '30 days')
      `;

      const [statsResult, alertsResult] = await Promise.all([
        pgPool.query(statsQuery, [filters.from_date, filters.to_date]),
        pgPool.query(alertsQuery, [filters.from_date])
      ]);

      const dashboard = {
        shipment_stats: statsResult.rows[0],
        alert_stats: alertsResult.rows[0],
        generated_at: new Date().toISOString()
      };

      await cacheManager.set(cacheKey, dashboard, 120);
      return dashboard;
    } catch (error) {
      logger.error('Failed to generate dashboard:', error);
      throw error;
    }
  }

  async detectAnomalies(shipmentId) {
    try {
      const eventsQuery = `
        SELECT * FROM events
        WHERE shipment_id = $1
        ORDER BY timestamp ASC
      `;
      
      const result = await pgPool.query(eventsQuery, [shipmentId]);
      
      const response = await axios.post(config.ai.anomalyEndpoint, {
        shipment_id: shipmentId,
        events: result.rows
      }, {
        timeout: 5000
      });

      return {
        shipment_id: shipmentId,
        anomalies_detected: response.data.anomalies || [],
        risk_score: response.data.risk_score,
        recommendations: response.data.recommendations || []
      };
    } catch (error) {
      logger.error('Failed to detect anomalies:', error);
      return {
        shipment_id: shipmentId,
        error: 'Anomaly detection unavailable',
        fallback: true
      };
    }
  }
}

module.exports = new AnalyticsService();