const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const validationMiddleware = require('../middleware/validation');
const schemas = require('../utils/validator');
const { createRateLimiter