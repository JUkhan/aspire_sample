const { Kafka, logLevel, Partitioners } = require('kafkajs');

// Silence KafkaJS partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

let producer = null;

async function connectProducer() {
  producer = kafka.producer({
    allowAutoTopicCreation: true,
  });

  await producer.connect();
  console.log('API Gateway Kafka Producer connected');
  return producer;
}

async function publishEvent(topic, event, key = null) {
  if (!producer) {
    throw new Error('Producer not connected');
  }

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

  console.log(`Published ${event.eventType} to ${topic}`);
  return true;
}

async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    console.log('API Gateway Kafka Producer disconnected');
  }
}

function getProducer() {
  return producer;
}

module.exports = {
  kafka,
  connectProducer,
  publishEvent,
  disconnectProducer,
  getProducer,
};
