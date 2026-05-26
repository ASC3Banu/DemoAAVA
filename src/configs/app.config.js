/**
 * Application Configuration
 * Centralized configuration management
 * 
 * Security: Environment-based configuration, secrets management
 */

require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'logistics_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: 0
  },
  
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'logistics-monitoring-system',
    groupId: 'logistics-consumer-group'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '24h'
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-encryption-key-change-in-production'
  },
  
  cors: {
    allowedOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',')
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },
  
  logLevel: process.env.LOG_LEVEL || 'info'
};
