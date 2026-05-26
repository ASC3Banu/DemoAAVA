/**
 * Event Model
 * Defines the event data structure and validation
 */

const Joi = require('joi');

const eventSchema = Joi.object({
  event_id: Joi.string().pattern(/^EVT-[0-9]{4}-[0-9]{6}$/).required(),
  shipment_id: Joi.string().pattern(/^SHP-[0-9]{4}-[0-9]{6}$/).required(),
  event_type: Joi.string().valid('departure', 'arrival', 'delay', 'customs_clearance', 'delivery', 'exception').required(),
  event_time: Joi.date().iso().required(),
  location: Joi.string().max(255).required(),
  details: Joi.string().max(1000).optional(),
  userId: Joi.string().required(),
  organizationId: Joi.string().required(),
  created_at: Joi.date().iso().required()
});

const createEventSchema = Joi.object({
  shipment_id: Joi.string().pattern(/^SHP-[0-9]{4}-[0-9]{6}$/).required(),
  event_type: Joi.string().valid('departure', 'arrival', 'delay', 'customs_clearance', 'delivery', 'exception').required(),
  event_time: Joi.date().iso().required(),
  location: Joi.string().max(255).required(),
  details: Joi.string().max(1000).optional()
});

module.exports = {
  eventSchema,
  createEventSchema
};
