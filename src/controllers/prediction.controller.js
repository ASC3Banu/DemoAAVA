const express = require('express');
const router = express.Router();
const predictionService = require('../services/prediction.service');
const logger = require('../configs/logger.config');

router.get('/:shipment_id',
  async (req, res, next) => {
    try {
      const prediction = await predictionService.predictDelay(req.params.shipment_id);
      res.status(200).json(prediction);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/batch',
  async (req, res, next) => {
    try {
      const { shipment_ids } = req.body;
      
      if (!Array.isArray(shipment_ids) || shipment_ids.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'shipment_ids must be a non-empty array'
        });
      }

      const predictions = await predictionService.batchPredictions(shipment_ids);
      res.status(200).json({ predictions });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
