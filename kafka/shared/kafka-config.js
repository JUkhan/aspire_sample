const { Kafka, logLevel } = require('kafkajs');

const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'ecommerce-service';

/**
 * Create a Kafka instance with standard configuration
 */
function createKafkaClient(clientId = KAFKA_CLIENT_ID) {
  return new Kafka({
    clientId,
    brokers: KAFKA_BROKERS,
    logLevel: logLevel.WARN,
    retry: {
      initialRetryTime: 100,
      retries: 8,
    },
  });
}

/**
 * Create and connect a Kafka producer
 */
async function createProducer(kafka) {
  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });

  await producer.connect();
  console.log('Kafka Producer connected');

  return producer;
}

/**
 * Create and connect a Kafka consumer
 */
async function createConsumer(kafka, groupId, topics) {
  const consumer = kafka.consumer({
    groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  await consumer.connect();
  console.log(`Kafka Consumer connected (group: ${groupId})`);

  // Subscribe to topics
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
    console.log(`Subscribed to topic: ${topic}`);
  }

  return consumer;
}

/**
 * Publish a message to a Kafka topic
 */
async function publishMessage(producer, topic, message, key = null) {
  const payload = {
    topic,
    messages: [
      {
        key: key || message.payload?.orderId || null,
        value: JSON.stringify(message),
        headers: {
          'event-type': message.eventType,
          'timestamp': message.timestamp,
          'correlation-id': message.metadata?.correlationId,
        },
      },
    ],
  };

  await producer.send(payload);
  console.log(`Published ${message.eventType} to ${topic}`);
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(producer, consumer) {
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    try {
      if (consumer) await consumer.disconnect();
      if (producer) await producer.disconnect();
      console.log('Kafka connections closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = {
  createKafkaClient,
  createProducer,
  createConsumer,
  publishMessage,
  setupGracefulShutdown,
  KAFKA_BROKERS,
};
