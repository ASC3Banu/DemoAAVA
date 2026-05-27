const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const schemas = require('../utils/validator');

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.get('/profile',
  UserController.getProfile
);

router.put('/profile',
  validationMiddleware.validateBody(schemas.user.update),
  UserController.updateProfile
);

router.get('/',
  authMiddleware.authorize('admin'),
  validationMiddleware.validateQuery(schemas.query.pagination),
  UserController.list
);

router.get('/:id',
  authMiddleware.authorize('admin', 'manager'),
  UserController.getById
);

module.exports = router;