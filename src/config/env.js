require('dotenv').config();

const config = {
  app: {
    name: process.env.APP_NAME || 'Logistics Monitoring System',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    apiVersion: process.env.API_VERSION || 'v1'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  rateLimit: {
    windowMs: 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: true
  },
  security: {
    bcryptRounds: 10,
    sessionSecret: process.env.SESSION_SECRET || 'session-secret',
    csrfProtection: process.env.CSRF_PROTECTION === 'true'
  },
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090
  },
  cache: {
    defaultTTL: parseInt(process.env.CACHE_TTL) || 300,
    shipmentTTL: 120,
    predictionTTL: 300
  },
  ai: {
    predictionEndpoint: process.env.AI_PREDICTION_ENDPOINT || 'http://localhost:5000/predict',
    anomalyEndpoint: process.env.AI_ANOMALY_ENDPOINT || 'http://localhost:5000/anomaly'
  }
};

module.exports = config;