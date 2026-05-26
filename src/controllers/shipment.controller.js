const express = require('express');
const router = express.Router();
const shipmentService = require('../services/shipment.service');
const validation = require('../middleware/validation.middleware');
const { authorize } = require('../middleware/auth.middleware');
const Joi = require('joi');
const logger = require('../configs/logger.config');

const createShipmentSchema = Joi.object({
  tracking_number: Joi.string().required().max(50),
  origin_location: Joi.string().required().max(200),
  destination_location: Joi.string().required().max(200),
  transport_mode: Joi.string().valid('air', 'sea', 'road', 'rail').required(),
  carrier_id: Joi.string().required().max(50),
  estimated_delivery: Joi.date().iso().optional(),
  cargo_details: Joi.object({
    weight: Joi.number().min(0).optional(),
    dimensions: Joi.object({
      length: Joi.number().min(0),
      width: Joi.number().min(0),
      height: Joi.number().min(0)
    }).optional(),
    value: Joi.number().min(0).optional(),
    description: Joi.string().max(500).optional()
  }).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().required(),
  location: Joi.string().required(),
  notes: Joi.string().optional()
});

router.post('/',
  authorize('logistics_manager', 'admin'),
  validation(createShipmentSchema),
  async (req, res, next) => {
    try {
      const shipment = await shipmentService.createShipment(req.body, req.user.id);
      res.status(201).json(shipment.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

router.get('/',
  async (req, res, next) => {
    try {
      const { status, carrier_id, transport_mode, origin_location, destination_location, page = 1, limit = 20 } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (carrier_id) filters.carrier_id = carrier_id;
      if (transport_mode) filters.transport_mode = transport_mode;
      if (origin_location) filters.origin_location = origin_location;
      if (destination_location) filters.destination_location = destination_location;

      const result = await shipmentService.searchShipments(filters, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:shipment_id',
  async (req, res, next) => {
    try {
      const shipment = await shipmentService.getShipmentById(req.params.shipment_id);
      res.status(200).json(shipment.toJSON ? shipment.toJSON() : shipment);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:shipment_id/status',
  authorize('logistics_manager', 'admin'),
  validation(updateStatusSchema),
  async (req, res, next) => {
    try {
      const shipment = await shipmentService.updateShipmentStatus(
        req.params.shipment_id,
        req.body,
        req.user.id
      );
      res.status(200).json(shipment.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:shipment_id/events',
  async (req, res, next) => {
    try {
      const { event_type, from_date, to_date } = req.query;
      const filters = {};
      if (event_type) filters.event_type = event_type;
      if (from_date) filters.from_date = from_date;
      if (to_date) filters.to_date = to_date;

      const events = await shipmentService.getShipmentEvents(req.params.shipment_id, filters);
      res.status(200).json({ events: events.map(e => e.toJSON()) });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
