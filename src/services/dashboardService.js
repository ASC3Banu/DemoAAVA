const shipmentRepository = require('../repositories/shipmentRepository');
const alertRepository = require('../repositories/alertRepository');
const eventRepository = require('../repositories/eventRepository');
const logger = require('../utils/logger');
const { cacheHelper } = require('../config/redis');

class DashboardService {
  async getDashboardData(filters = {}) {
    try {
      const cacheKey = `dashboard:${JSON.stringify(filters)}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached) return cached;
      const [shipmentStats, alertStats, recentEvents, criticalAlerts] = await Promise.all([
        shipmentRepository.getStatistics(filters),
        this.getAlertStatistics(filters),
        eventRepository.findAll(filters, { limit: 10, sortBy: 'timestamp', sortOrder: 'DESC' }),
        alertRepository.getOpenAlerts('critical')
      ]);
      const dashboardData = {
        shipments: shipmentStats,
        alerts: alertStats,
        recentEvents: recentEvents.events,
        criticalAlerts: criticalAlerts,
        timestamp: new Date()
      };
      await cacheHelper.set(cacheKey, dashboardData, 300);
      return dashboardData;
    } catch (error) {
      logger.error('Error in getDashboardData:', error);
      throw error;
    }
  }

  async getAlertStatistics(filters = {}) {
    try {
      const allAlerts = await alertRepository.findAll(filters, { limit: 1000 });
      const stats = {
        total: allAlerts.pagination.total,
        bySeverity: {},
        byStatus: {},
        byType: {}
      };
      allAlerts.alerts.forEach(alert => {
        stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
        stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
        stats.byType[alert.alert_type] = (stats.byType[alert.alert_type] || 0) + 1;
      });
      return stats;
    } catch (error) {
      logger.error('Error in getAlertStatistics:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(filters = {}) {
    try {
      const cacheKey = `performance:${JSON.stringify(filters)}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached) return cached;
      const shipments = await shipmentRepository.findAll(filters, { limit: 1000 });
      const deliveredShipments = shipments.shipments.filter(s => s.status === 'delivered');
      const delayedShipments = shipments.shipments.filter(s => s.status === 'delayed');
      const onTimeDeliveries = deliveredShipments.filter(s => {
        if (!s.actual_delivery) return false;
        return new Date(s.actual_delivery) <= new Date(s.estimated_delivery);
      });
      const metrics = {
        totalShipments: shipments.pagination.total,
        delivered: deliveredShipments.length,
        delayed: delayedShipments.length,
        inTransit: shipments.shipments.filter(s => s.status === 'in_transit').length,
        onTimeDeliveryRate: deliveredShipments.length > 0 ? (onTimeDeliveries.length / deliveredShipments.length * 100).toFixed(2) : 0,
        averageDeliveryTime: this.calculateAverageDeliveryTime(deliveredShipments),
        timestamp: new Date()
      };
      await cacheHelper.set(cacheKey, metrics, 600);
      return metrics;
    } catch (error) {
      logger.error('Error in getPerformanceMetrics:', error);
      throw error;
    }
  }

  calculateAverageDeliveryTime(shipments) {
    if (shipments.length === 0) return 0;
    const totalHours = shipments.reduce((sum, shipment) => {
      if (!shipment.actual_delivery) return sum;
      const hours = (new Date(shipment.actual_delivery) - new Date(shipment.created_at)) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    return (totalHours / shipments.length).toFixed(2);
  }

  async getCarrierPerformance(filters = {}) {
    try {
      const cacheKey = `carrier_performance:${JSON.stringify(filters)}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached) return cached;
      const shipments = await shipmentRepository.findAll(filters, { limit: 5000 });
      const carrierStats = {};
      shipments.shipments.forEach(shipment => {
        const carrierId = shipment.carrier_id;
        if (!carrierStats[carrierId]) {
          carrierStats[carrierId] = { total: 0, delivered: 0, delayed: 0, onTime: 0 };
        }
        carrierStats[carrierId].total++;
        if (shipment.status === 'delivered') {
          carrierStats[carrierId].delivered++;
          if (shipment.actual_delivery && new Date(shipment.actual_delivery) <= new Date(shipment.estimated_delivery)) {
            carrierStats[carrierId].onTime++;
          }
        }
        if (shipment.status === 'delayed') {
          carrierStats[carrierId].delayed++;
        }
      });
      const performance = Object.entries(carrierStats).map(([carrierId, stats]) => ({
        carrierId,
        ...stats,
        onTimeRate: stats.delivered > 0 ? (stats.onTime / stats.delivered * 100).toFixed(2) : 0
      }));
      await cacheHelper.set(cacheKey, performance, 600);
      return performance;
    } catch (error) {
      logger.error('Error in getCarrierPerformance:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();