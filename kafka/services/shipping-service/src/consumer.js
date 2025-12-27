const { Kafka, logLevel, Partitioners } = require('kafkajs');

// Silence KafkaJS partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: 'shipping-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const consumer = kafka.consumer({
  groupId: 'shipping-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
});

async function connect() {
  await consumer.connect();
  await producer.connect();
  console.log('Shipping Service: Kafka consumer and producer connected');
}

async function subscribe(topics) {
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
    console.log(`Shipping Service: Subscribed to topic: ${topic}`);
  }
}

async function startConsuming(messageHandler) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log(`Shipping Service: Received ${event.eventType} from ${topic}`);
        await messageHandler(event, topic, partition);
      } catch (error) {
        console.error('Shipping Service: Error processing message:', error);
      }
    },
  });
}

async function publishEvent(topic, event, key = null) {
  const message = {
    key: key || event.payload?.orderId || null,
    value: JSON.stringify(event),
    headers: {
      'event-type': event.eventType,
      'timestamp': event.timestamp,
      'correlation-id': event.metadata?.correlationId || '',
    },
  };

  await producer.send({
    topic,
    messages: [message],
  });

  console.log(`Shipping Service: Published ${event.eventType} to ${topic}`);
}

async function disconnect() {
  await consumer.disconnect();
  await producer.disconnect();
  console.log('Shipping Service: Kafka connections closed');
}

module.exports = {
  connect,
  subscribe,
  startConsuming,
  publishEvent,
  disconnect,
};
