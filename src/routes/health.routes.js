/**
 * Health Routes
 * Health check endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../configs/database.config').pool;
const redis = require('../configs/redis.config').client;

router.get('/', async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'logistics-monitoring-system'
  });
});

router.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    
    res.status(200).json({
      status: 'ready',
      checks: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

module.exports = router;
