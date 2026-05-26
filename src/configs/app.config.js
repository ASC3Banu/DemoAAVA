require('dotenv').config();

module.exports = {
  app: {
    name: 'AI-Powered Logistics Monitoring System',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: '/api/v1'
  },

  tls: {
    enabled: process.env.TLS_ENABLED === 'true',
    keyPath: process.env.TLS_KEY_PATH || './certs/key.pem',
    certPath: process.env.TLS_CERT_PATH || './certs/cert.pem',
    minVersion: 'TLSv1.3'
  },

  cors: {
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'logistics_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10)
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyPath: process.env.DB_ENCRYPTION_KEY_PATH || './keys/db-encryption.key'
    }
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    tls: process.env.REDIS_TLS === 'true',
    keyPrefix: 'logistics:',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10)
  },

  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    clientId: 'logistics-monitoring-system',
    groupId: 'logistics-consumer-group',
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: {
      mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
      username: process.env.KAFKA_USERNAME || '',
      password: process.env.KAFKA_PASSWORD || ''
    },
    topics: {
      trackingEvents: 'tracking-events',
      predictions: 'ai-predictions',
      alerts: 'alert-notifications'
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: 'logistics-monitoring-system'
  },

  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      saltLength: 64,
      tagLength: 16
    },
    sensitiveFields: [
      'ssn', 'credit_card', 'passport', 'driver_license',
      'medical_record', 'bank_account', 'email', 'phone'
    ]
  }
};
