/**
 * Database Configuration
 * PostgreSQL connection pool management
 * 
 * Security: Connection pooling, SSL/TLS support
 */

const { Pool } = require('pg');
const config = require('./app.config');
const logger = require('../utils/logger');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  ssl: config.env === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
  process.exit(-1);
});

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection pool initialized');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};
