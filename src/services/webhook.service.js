const axios = require('axios');
const { pgPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class WebhookService {
  async registerWebhook(webhookData) {
    const id = uuidv4();
    const query = `
      INSERT INTO webhooks (
        id, user_id, url, events, is_active, secret, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const values = [
      id,
      webhookData.user_id,
      webhookData.url,
      JSON.stringify(webhookData.events),
      true,
      webhookData.secret || this.generateSecret()
    ];

    const result = await pgPool.query(query, values);
    return result.rows[0];
  }

  async triggerWebhook(webhookId, eventData) {
    try {
      const webhook = await this.getWebhookById(webhookId);
      if (!webhook || !webhook.is_active) {
        return;
      }

      const response = await axios.post(webhook.url, eventData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': this.generateSignature(eventData, webhook.secret)
        },
        timeout: 10000
      });

      await this.logWebhookDelivery(webhookId, 'success', response.status);
      logger.info(`Webhook triggered successfully: ${webhookId}`);
    } catch (error) {
      await this.logWebhookDelivery(webhookId, 'failed', error.response?.status || 0);
      logger.error(`Webhook trigger failed: ${webhookId}`, error);
    }
  }

  async getWebhookById(id) {
    const query = 'SELECT * FROM webhooks WHERE id = $1';
    const result = await pgPool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getUserWebhooks(userId) {
    const query = 'SELECT * FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pgPool.query(query, [userId]);
    return result.rows;
  }

  async deleteWebhook(id) {
    const query = 'DELETE FROM webhooks WHERE id = $1 RETURNING id';
    const result = await pgPool.query(query, [id]);
    return result.rows.length > 0;
  }

  generateSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  generateSignature(data, secret) {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
  }

  async logWebhookDelivery(webhookId, status, statusCode) {
    const query = `
      INSERT INTO webhook_logs (
        webhook_id, status, status_code, timestamp
      ) VALUES ($1, $2, $3, NOW())
    `;
    await pgPool.query(query, [webhookId, status, statusCode]);
  }
}

module.exports = new WebhookService();