const { Pool } = require('pg');
const redis = require('redis');
const { InfluxDB } = require('@influxdata/influxdb-client');

// PostgreSQL Configuration
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'logistics_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis Cache Configuration
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD,
  database: 0
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// InfluxDB Configuration for Time-Series Data
const influxDB = new InfluxDB({
  url: process.env.INFLUX_URL || 'http://localhost:8086',
  token: process.env.INFLUX_TOKEN
});

const influxOrg = process.env.INFLUX_ORG || 'logistics';
const influxBucket = process.env.INFLUX_BUCKET || 'events';

// Database Health Check
const checkDatabaseHealth = async () => {
  try {
    await pgPool.query('SELECT 1');
    await redisClient.ping();
    return { postgres: 'healthy', redis: 'healthy', influx: 'healthy' };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { postgres: 'unhealthy', redis: 'unhealthy', error: error.message };
  }
};

module.exports = {
  pgPool,
  redisClient,
  influxDB,
  influxOrg,
  influxBucket,
  checkDatabaseHealth
};