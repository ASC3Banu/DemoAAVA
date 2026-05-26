const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

const config = require('./configs/app.config');
const logger = require('./configs/logger.config');
const errorHandler = require('./middleware/error.middleware');
const authMiddleware = require('./middleware/auth.middleware');
const auditMiddleware = require('./middleware/audit.middleware');
const { sanitizeInput } = require('./middleware/validation.middleware');

const shipmentRoutes = require('./controllers/shipment.controller');
const eventRoutes = require('./controllers/event.controller');
const predictionRoutes = require('./controllers/prediction.controller');
const alertRoutes = require('./controllers/alert.controller');
const dashboardRoutes = require('./controllers/dashboard.controller');

const app = express();

app.set('trust proxy', 1);

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
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

const corsOptions = {
  origin: config.cors.allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version', 'X-Request-ID']
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      user: req.user?.id
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60
    });
  }
});
app.use('/api/', limiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(sanitizeInput);
app.use(auditMiddleware);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.app.version,
    uptime: process.uptime()
  });
});

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    name: 'AI-Powered Logistics Monitoring System API',
    version: '1.0.0',
    description: 'Comprehensive API for global shipment tracking and logistics optimization'
  });
});

app.use('/api/v1', authMiddleware);
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/predictions', predictionRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

module.exports = app;
