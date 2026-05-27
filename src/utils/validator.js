const Joi = require('joi');

const schemas = {
  shipment: {
    create: Joi.object({
      tracking_number: Joi.string().required().min(5).max(50),
      origin: Joi.object({
        address: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        postal_code: Joi.string().required(),
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      }).required(),
      destination: Joi.object({
        address: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        postal_code: Joi.string().required(),
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      }).required(),
      status: Joi.string().valid('pending', 'in_transit', 'delivered', 'delayed', 'cancelled').default('pending'),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      estimated_delivery: Joi.date().iso().required(),
      carrier: Joi.string().required(),
      weight: Joi.number().positive(),
      dimensions: Joi.object({
        length: Joi.number().positive(),
        width: Joi.number().positive(),
        height: Joi.number().positive()
      }),
      metadata: Joi.object()
    }),
    update: Joi.object({
      status: Joi.string().valid('pending', 'in_transit', 'delivered', 'delayed', 'cancelled'),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
      estimated_delivery: Joi.date().iso(),
      actual_delivery: Joi.date().iso(),
      metadata: Joi.object()
    })
  },
  event: {
    create: Joi.object({
      shipment_id: Joi.string().uuid().required(),
      event_type: Joi.string().valid('pickup', 'in_transit', 'customs', 'out_for_delivery', 'delivered', 'exception').required(),
      location: Joi.object({
        address: Joi.string(),
        city: Joi.string(),
        country: Joi.string(),
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      }).required(),
      description: Joi.string().max(500),
      metadata: Joi.object()
    })
  },
  alert: {
    create: Joi.object({
      shipment_id: Joi.string().uuid().required(),
      alert_type: Joi.string().valid('delay', 'exception', 'customs_hold', 'delivery_failed').required(),
      severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      message: Joi.string().required().max(500),
      assigned_to: Joi.string().uuid(),
      metadata: Joi.object()
    }),
    update: Joi.object({
      status: Joi.string().valid('open', 'acknowledged', 'resolved', 'closed'),
      assigned_to: Joi.string().uuid(),
      resolution_notes: Joi.string().max(1000)
    })
  },
  user: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
      first_name: Joi.string().required().max(50),
      last_name: Joi.string().required().max(50),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      company: Joi.string().max(100)
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }),
    update: Joi.object({
      first_name: Joi.string().max(50),
      last_name: Joi.string().max(50),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      company: Joi.string().max(100)
    })
  },
  query: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20)
    }),
    shipmentFilter: Joi.object({
      status: Joi.string().valid('pending', 'in_transit', 'delivered', 'delayed', 'cancelled'),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
      carrier: Joi.string(),
      from_date: Joi.date().iso(),
      to_date: Joi.date().iso(),
      search: Joi.string().max(100)
    })
  }
};

module.exports = schemas;