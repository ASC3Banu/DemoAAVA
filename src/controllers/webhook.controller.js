const WebhookService = require('../services/webhook.service');
const responseFormatter = require('../utils/responseFormatter');
const logger = require('../utils/logger');

class WebhookController {
  async register(req, res, next) {
    try {
      const webhookData = {
        ...req.body,
        user_id: req.user.id
      };
      const webhook = await WebhookService.registerWebhook(webhookData);
      res.status(201).json(responseFormatter.created(webhook, 'Webhook registered successfully'));
    } catch (error) {
      logger.error('Register webhook error:', error);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const webhooks = await WebhookService.getUserWebhooks(req.user.id);
      res.json(responseFormatter.success(webhooks));
    } catch (error) {
      logger.error('List webhooks error:', error);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await WebhookService.deleteWebhook(req.params.id);
      res.json(responseFormatter.deleted('Webhook deleted successfully'));
    } catch (error) {
      logger.error('Delete webhook error:', error);
      next(error);
    }
  }
}

module.exports = new WebhookController();