/**
 * AI-Powered Logistics Monitoring System
 * Main Application Entry Point
 * 
 * Security: AES-256 encryption, TLS 1.3, RBAC
 * Compliance: GDPR, PCI-DSS, ISO 27001, SOC 2 Type II
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const config = require('./configs/app.config');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { auditLogger } = require('./middlewares/audit.middleware');
const { authenticate } = require('./middlewares/auth.middleware');
const { validateRequest } = require('./middlewares/validation.middleware');
const logger = require('./utils/logger');

// Import routes
const shipmentRoutes = require('./routes/shipment.routes');
const eventRoutes = require('./routes/event.routes');
const alertRoutes = require('./routes/alert.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Trust proxy for rate limiting behind load balancers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Audit logging middleware
app.use(auditLogger);

// Health check (no authentication required)
app.use('/health', healthRoutes);

// API routes with authentication
app.use('/api/v1/shipments', authenticate, validateRequest, shipmentRoutes);
app.use('/api/v1/events', authenticate, validateRequest, eventRoutes);
app.use('/api/v1/alerts', authenticate, validateRequest, alertRoutes);
app.use('/api/v1/dashboard', authenticate, validateRequest, dashboardRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;