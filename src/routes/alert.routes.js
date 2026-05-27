const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alert.controller');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const schemas = require('../utils/validator');

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post('/',
  authMiddleware.authorize('admin', 'manager'),
  validationMiddleware.validateBody(schemas.alert.create),
  AlertController.create
);

router.get('/',
  validationMiddleware.validateQuery(schemas.query.pagination),
  AlertController.list
);

router.get('/:id',
  AlertController.getById
);

router.put('/:id',
  validationMiddleware.validateBody(schemas.alert.update),
  AlertController.update
);

router.get('/shipments/:shipment_id/alerts',
  AlertController.getByShipmentId
);

module.exports = router;