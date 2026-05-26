/**
 * Shipment Model
 * Defines the shipment data structure and validation
 */

const Joi = require('joi');

const shipmentSchema = Joi.object({
  shipment_id: Joi.string().pattern(/^SHP-[0-9]{4}-[0-9]{6}$/).required(),
  origin: Joi.string().max(255).required(),
  destination: Joi.string().max(255).required(),
  departure_time: Joi.date().iso().required(),
  arrival_time: Joi.date().iso().min(Joi.ref('departure_time')).required(),
  carrier: Joi.string().max(100).optional(),
  transport_mode: Joi.string().valid('air', 'sea', 'road', 'rail', 'multimodal').optional(),
  status: Joi.string().valid('created', 'in_transit', 'delayed', 'delivered', 'cancelled').required(),
  current_location: Joi.string().max(500).optional(),
  actual_departure_time: Joi.date().iso().optional(),
  estimated_arrival_time: Joi.date().iso().optional(),
  userId: Joi.string().required(),
  organizationId: Joi.string().required(),
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required()
});

const createShipmentSchema = Joi.object({
  origin: Joi.string().max(255).required(),
  destination: Joi.string().max(255).required(),
  departure_time: Joi.date().iso().required(),
  arrival_time: Joi.date().iso().min(Joi.ref('departure_time')).required(),
  carrier: Joi.string().max(100).optional(),
  transport_mode: Joi.string().valid('air', 'sea', 'road', 'rail', 'multimodal').optional()
});

const updateShipmentSchema = Joi.object({
  origin: Joi.string().max(255).optional(),
  destination: Joi.string().max(255).optional(),
  departure_time: Joi.date().iso().optional(),
  arrival_time: Joi.date().iso().optional(),
  carrier: Joi.string().max(100).optional(),
  transport_mode: Joi.string().valid('air', 'sea', 'road', 'rail', 'multimodal').optional(),
  status: Joi.string().valid('created', 'in_transit', 'delayed', 'delivered', 'cancelled').optional(),
  current_location: Joi.string().max(500).optional(),
  actual_departure_time: Joi.date().iso().optional(),
  estimated_arrival_time: Joi.date().iso().optional()
});

module.exports = {
  shipmentSchema,
  createShipmentSchema,
  updateShipmentSchema
};
