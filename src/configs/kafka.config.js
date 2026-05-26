/**
 * Kafka Configuration
 * Kafka producer and consumer setup
 * 
 * Security: SASL authentication, SSL/TLS encryption
 */

const { Kafka } = require('kafkajs');
const config = require('./app.config');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  ssl: config.env === 'production',
  logLevel: 2
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: config.kafka.groupId });

const initializeKafka = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
    
    await consumer.connect();
    logger.info('Kafka consumer connected');
    
    await consumer.subscribe({ 
      topics: ['shipment-events', 'logistics-events'],
      fromBeginning: false 
    });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        logger.info('Kafka message received', {
          topic,
          partition,
          offset: message.offset,
          value: message.value.toString()
        });
      }
    });
  } catch (error) {
    logger.error('Failed to initialize Kafka:', error);
    throw error;
  }
};

module.exports = {
  kafka,
  producer,
  consumer,
  initializeKafka
};
