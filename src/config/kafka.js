const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'logistics-monitoring-system',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_SASL_MECHANISM ? {
    mechanism: process.env.KAFKA_SASL_MECHANISM,
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD
  } : undefined
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_CONSUMER_GROUP || 'logistics-consumer-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000
});

const TOPICS = {
  SHIPMENT_CREATED: 'shipment.created',
  SHIPMENT_UPDATED: 'shipment.updated',
  EVENT_CREATED: 'event.created',
  ALERT_CREATED: 'alert.created',
  WEBHOOK_TRIGGER: 'webhook.trigger'
};

const initKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();
    console.log('Kafka producer and consumer connected');
  } catch (error) {
    console.error('Failed to connect to Kafka:', error);
    throw error;
  }
};

const publishEvent = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{
        key: message.id || Date.now().toString(),
        value: JSON.stringify(message),
        timestamp: Date.now().toString()
      }]
    });
  } catch (error) {
    console.error('Failed to publish event:', error);
    throw error;
  }
};

module.exports = {
  kafka,
  producer,
  consumer,
  TOPICS,
  initKafka,
  publishEvent
};