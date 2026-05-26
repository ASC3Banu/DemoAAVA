const { Pool } = require('pg');
const logger = require('./logger.config');
const config = require('./app.config');

class DatabaseConfig {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
        min: config.database.pool.min,
        max: config.database.pool.max,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });

      await this.pool.query('SELECT NOW()');
      logger.info('PostgreSQL database connected successfully');
      return this.pool;
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      throw error;
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Query execution failed', { text, error: error.message });
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection closed');
    }
  }
}

module.exports = new DatabaseConfig();
