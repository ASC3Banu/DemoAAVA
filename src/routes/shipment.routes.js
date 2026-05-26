/**
 * Shipment Routes
 * Defines HTTP routes for shipment operations
 */

const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipment.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

router.post('/', 
  checkPermission('shipment:create'),
  shipmentController.createShipment.bind(shipmentController)
);

router.get('/:id', 
  checkPermission('shipment:read'),
  shipmentController.getShipmentById.bind(shipmentController)
);

router.get('/', 
  checkPermission('shipment:read'),
  shipmentController.listShipments.bind(shipmentController)
);

router.put('/:id', 
  checkPermission('shipment:update'),
  shipmentController.updateShipment.bind(shipmentController)
);

router.delete('/:id', 
  checkPermission('shipment:delete'),
  shipmentController.deleteShipment.bind(shipmentController)
);

module.exports = router;
