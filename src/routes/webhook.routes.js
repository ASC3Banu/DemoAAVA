const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhook.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.post('/',
  WebhookController.register
);

router.get('/',
  WebhookController.list
);

router.delete('/:id',
  WebhookController.delete
);

module.exports = router;