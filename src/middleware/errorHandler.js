const logger = require('../utils/logger');
const dataMasking = require('../utils/dataMasking');

class AppError extends Error {
  constructor(message