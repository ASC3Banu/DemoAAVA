const express = require('express');
const router = express.Router();
const ShipmentController = require('../controllers/shipment.controller');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const schemas = require('../utils/validator');

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post('/',
  validationMiddleware.validateBody(schemas.shipment.create),
  ShipmentController.create
);

router.get('/',
  validationMiddleware.validateQuery(schemas.query.pagination),
  validationMiddleware.validateQuery(schemas.query.shipmentFilter),
  ShipmentController.list
);

router.get('/:id',
  ShipmentController.getById
);

router.get('/tracking/:tracking_number',
  ShipmentController.getByTrackingNumber
);

router.put('/:id',
  validationMiddleware.validateBody(schemas.shipment.update),
  ShipmentController.update
);

router.delete('/:id',
  authMiddleware.authorize('admin', 'manager'),
  ShipmentController.delete
);

module.exports = router;