const express = require('express');
const router = express.Router();
const eventRepository = require('../repositories/event.repository');
const logger = require('../configs/logger.config');

router.get('/critical',
  async (req, res, next) => {
    try {
      const { limit = 100 } = req.query;
      const events = await eventRepository.getCriticalEvents(parseInt(limit));
      res.status(200).json({ events: events.map(e => e.toJSON()) });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
