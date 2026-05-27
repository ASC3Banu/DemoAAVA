const AuthService = require('../services/auth.service');
const responseFormatter = require('../utils/responseFormatter');
const logger = require('../utils/logger');

class AuthController {
  async register(req