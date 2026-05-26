const { Kafka } = require('kafkajs');
const logger = require('./logger.config');
const config = require('./app.config');

class KafkaConfig {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.consumer = null;
  }

  async connect() {
    try {
      this.kafka = new Kafka({
        clientId: config.kafka.clientId,
        brokers: config.kafka.brokers,
        ssl: config.kafka.ssl,
        sasl: config.kafka.sasl.username ? {
          mechanism: config.kafka.sasl.mechanism,
          username: config.kafka.sasl.username,
          password: config.kafka.sasl.password
        } : undefined
      });

      this.producer = this.kafka.producer();
      await this.producer.connect();
      logger.info('Kafka producer connected');

      this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
      await this.consumer.connect();
      logger.info('Kafka consumer connected');

      return { producer: this.producer, consumer: this.consumer };
    } catch (error) {
      logger.error('Kafka connection failed', { error: error.message });
      throw error;
    }
  }

  async publishEvent(topic, message) {
    try {
      await this.producer.send({
        topic,
        messages: [{
          key: message.key || null,
          value: JSON.stringify(message.value),
          headers: message.headers || {}
        }]
      });
      logger.debug('Event published to Kafka', { topic, messageId: message.key });
    } catch (error) {
      logger.error('Failed to publish event', { topic, error: error.message });
      throw error;
    }
  }

  async subscribe(topics, handler) {
    try {
      await this.consumer.subscribe({ topics, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = JSON.parse(message.value.toString());
            await handler(topic, value, message);
          } catch (error) {
            logger.error('Message processing failed', { topic, error: error.message });
          }
        }
      });
      logger.info('Kafka consumer subscribed', { topics });
    } catch (error) {
      logger.error('Kafka subscription failed', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    if (this.producer) {
      await this.producer.disconnect();
      logger.info('Kafka producer disconnected');
    }
    if (this.consumer) {
      await this.consumer.disconnect();
      logger.info('Kafka consumer disconnected');
    }
  }
}

module.exports = new KafkaConfig();
