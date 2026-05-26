/**
 * Event Routes
 * Defines HTTP routes for event operations
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

router.post('/', 
  checkPermission('event:create'),
  eventController.createEvent.bind(eventController)
);

router.get('/:id', 
  checkPermission('event:read'),
  eventController.getEventById.bind(eventController)
);

router.get('/', 
  checkPermission('event:read'),
  eventController.listEvents.bind(eventController)
);

module.exports = router;
