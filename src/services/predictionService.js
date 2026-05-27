const shipmentRepository = require('../repositories/shipmentRepository');
const eventRepository = require('../repositories/eventRepository');
const logger = require('../utils/logger');
const { cacheHelper } = require('../config/redis');

class PredictionService {
  async predictDelay(shipmentId) {
    try {
      const shipment = await shipmentRepository.findById(shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }
      const events = await eventRepository.findByShipmentId(shipmentId, { limit: 100 });
      const delayEvents = events.events.filter(e => e.event_type === 'delay' || e.event_type === 'exception');
      const delayProbability = this.calculateDelayProbability(shipment, delayEvents);
      const estimatedDelay = this.estimateDelay(shipment, delayEvents);
      const prediction = {
        shipmentId: shipmentId,
        delayProbability: delayProbability,
        estimatedDelay: estimatedDelay,
        confidence: this.calculateConfidence(events.events.length),
        factors: this.identifyDelayFactors(shipment, delayEvents),
        timestamp: new Date()
      };
      await cacheHelper.set(`prediction:${shipmentId}`, prediction, 1800);
      logger.info('Delay prediction generated', { shipmentId, delayProbability });
      return prediction;
    } catch (error) {
      logger.error('Error in predictDelay:', error);
      throw error;
    }
  }

  calculateDelayProbability(shipment, delayEvents) {
    let probability = 0;
    if (delayEvents.length > 0) probability += 0.3;
    if (delayEvents.length > 2) probability += 0.2;
    if (shipment.transport_mode === 'sea') probability += 0.15;
    if (shipment.transport_mode === 'air') probability += 0.05;
    const daysUntilDelivery = Math.ceil((new Date(shipment.estimated_delivery) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDelivery < 2) probability += 0.1;
    return Math.min(probability, 1.0);
  }

  estimateDelay(shipment, delayEvents) {
    if (delayEvents.length === 0) return 0;
    const avgDelayPerEvent = 24;
    const baseDelay = delayEvents.length * avgDelayPerEvent;
    const transportModeFactor = { air: 0.5, road: 1.0, rail: 1.2, sea: 1.5 };
    const factor = transportModeFactor[shipment.transport_mode] || 1.0;
    return Math.round(baseDelay * factor);
  }

  calculateConfidence(eventCount) {
    if (eventCount < 5) return 'low';
    if (eventCount < 15) return 'medium';
    return 'high';
  }

  identifyDelayFactors(shipment, delayEvents) {
    const factors = [];
    if (delayEvents.length > 0) factors.push('Previous delays detected');
    if (shipment.transport_mode === 'sea') factors.push('Sea transport has higher delay risk');
    const daysUntilDelivery = Math.ceil((new Date(shipment.estimated_delivery) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDelivery < 2) factors.push('Tight delivery schedule');
    return factors;
  }

  async predictDeliveryTime(shipmentId) {
    try {
      const shipment = await shipmentRepository.findById(shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }
      const delayPrediction = await this.predictDelay(shipmentId);
      const estimatedDelivery = new Date(shipment.estimated_delivery);
      if (delayPrediction.estimatedDelay > 0) {
        estimatedDelivery.setHours(estimatedDelivery.getHours() + delayPrediction.estimatedDelay);
      }
      return {
        shipmentId: shipmentId,
        originalEstimate: shipment.estimated_delivery,
        predictedDelivery: estimatedDelivery,
        delayHours: delayPrediction.estimatedDelay,
        confidence: delayPrediction.confidence,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error in predictDeliveryTime:', error);
      throw error;
    }
  }

  async analyzeShipmentRisk(shipmentId) {
    try {
      const shipment = await shipmentRepository.findById(shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }
      const events = await eventRepository.findByShipmentId(shipmentId, { limit: 100 });
      const exceptionEvents = events.events.filter(e => e.event_type === 'exception');
      const riskScore = this.calculateRiskScore(shipment, events.events, exceptionEvents);
      return {
        shipmentId: shipmentId,
        riskScore: riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        factors: this.identifyRiskFactors(shipment, events.events, exceptionEvents),
        recommendations: this.getRecommendations(riskScore),
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error in analyzeShipmentRisk:', error);
      throw error;
    }
  }

  calculateRiskScore(shipment, events, exceptionEvents) {
    let score = 0;
    score += exceptionEvents.length * 15;
    if (shipment.status === 'delayed') score += 20;
    const daysUntilDelivery = Math.ceil((new Date(shipment.estimated_delivery) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDelivery < 1) score += 25;
    if (events.length < 3) score += 10;
    return Math.min(score, 100);
  }

  getRiskLevel(score) {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  identifyRiskFactors(shipment, events, exceptionEvents) {
    const factors = [];
    if (exceptionEvents.length > 0) factors.push(`${exceptionEvents.length} exception events`);
    if (shipment.status === 'delayed') factors.push('Shipment currently delayed');
    if (events.length < 3) factors.push('Limited tracking updates');
    return factors;
  }

  getRecommendations(riskScore) {
    const recommendations = [];
    if (riskScore > 50) recommendations.push('Increase monitoring frequency');
    if (riskScore > 70) recommendations.push('Contact carrier immediately');
    if (riskScore > 80) recommendations.push('Prepare contingency plan');
    return recommendations;
  }
}

module.exports = new PredictionService();