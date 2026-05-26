const https = require('https');
const fs = require('fs');
const app = require('./app');
const config = require('./configs/app.config');
const logger = require('./configs/logger.config');
const database = require('./configs/database.config');
const redis = require('./configs/redis.config');
const kafka = require('./configs/kafka.config');

const PORT = config.app.port || 3000;

async function initializeConnections() {
  try {
    await database.connect();
    logger.info('Database connection established');

    await redis.connect();
    logger.info('Redis connection established');

    await kafka.connect();
    logger.info('Kafka connection established');

    return true;
  } catch (error) {
    logger.error('Failed to initialize connections', { error: error.message });
    throw error;
  }
}

async function startServer() {
  try {
    await initializeConnections();

    if (config.tls.enabled && fs.existsSync(config.tls.keyPath) && fs.existsSync(config.tls.certPath)) {
      const tlsOptions = {
        key: fs.readFileSync(config.tls.keyPath),
        cert: fs.readFileSync(config.tls.certPath),
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
        ciphers: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256'
        ].join(':'),
        honorCipherOrder: true
      };

      const server = https.createServer(tlsOptions, app);
      server.listen(PORT, () => {
        logger.info('🚀 AI-Powered Logistics Monitoring System started');
        logger.info(`📡 Server running on https://localhost:${PORT}`);
        logger.info('🔒 TLS 1.3 enabled');
        logger.info(`🌍 Environment: ${config.app.env}`);
      });
    } else {
      app.listen(PORT, () => {
        logger.info('🚀 AI-Powered Logistics Monitoring System started');
        logger.info(`📡 Server running on http://localhost:${PORT}`);
        logger.info(`🌍 Environment: ${config.app.env}`);
        logger.warn('⚠️  TLS not enabled - running in HTTP mode');
      });
    }
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();

module.exports = { startServer };
