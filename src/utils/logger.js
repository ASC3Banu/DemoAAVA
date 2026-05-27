const winston = require('winston');
const path = require('path');

/**
 * Winston Structured Logging Configuration
 * Implements comprehensive logging with PII masking
 */

// Custom format for masking sensitive data
const maskSensitiveData = winston.format((info) => {
  const sensitiveFields = [
    'password',
    'token',
    'api_key',
    'secret',
    'authorization',
    'credit_card',
    'ssn',
    'cvv'
  ];

  const maskValue = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const masked = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in masked) {
      const lowerKey = key.toLowerCase();
      
      // Check if field should be masked
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        masked[key] = '***REDACTED***';
      } else if (typeof masked[key] === 'object') {
        masked[key] = maskValue(masked[key]);
      }
    }

    return masked;
  };

  info.message = typeof info.message === 'object' ? maskValue(info.message) : info.message;
  
  if (info.meta) {
    info.meta = maskValue(info.meta);
  }

  return info;
});

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  maskSensitiveData(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'logistics-monitoring-system',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    // Audit log file (immutable, for compliance)
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'audit.log'),
      level: 'info',
      maxsize: 52428800, // 50MB
      maxFiles: 50,
      tailable: false // Immutable for compliance
    })
  ],
  exitOnError: false
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// Audit logging helper
logger.audit = (action, userId, resource, details = {}) => {
  logger.info('AUDIT', {
    action,
    userId,
    resource,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown'
  });
};

// Security event logging
logger.security = (event, severity, details = {}) => {
  logger.warn('SECURITY_EVENT', {
    event,
    severity,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;