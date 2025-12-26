const redis = require('redis');

const REDIS_URL = 'redis://localhost:6379';
const STREAM_KEY = 'orders:stream';
const CONSUMER_GROUP = 'order-processors';
const CONSUMER_NAME = `consumer-${process.pid}`;

// Create Redis client
const consumerClient = redis.createClient({ url: REDIS_URL });

consumerClient.on('error', (err) => console.error('Redis Consumer Client Error:', err));

// Initialize consumer group
async function initConsumer() {
  await consumerClient.connect();
  console.log('Consumer connected to Redis');

  // Create consumer group (ignore error if already exists)
  try {
    await consumerClient.xGroupCreate(STREAM_KEY, CONSUMER_GROUP, '0', {
      MKSTREAM: true
    });
    console.log('Consumer group created');
  } catch (err) {
    if (err.message.includes('BUSYGROUP')) {
      console.log('Consumer group already exists');
    } else {
      throw err;
    }
  }
}

// Process individual message
async function processMessage(messageId, data) {
  console.log(`Processing message ${messageId}:`, data);

  try {
    // Simulate message processing
    await simulateOrderProcessing(data);

    // Acknowledge successful processing
    await consumerClient.xAck(STREAM_KEY, CONSUMER_GROUP, messageId);
    console.log(`✓ Message ${messageId} acknowledged`);

  } catch (error) {
    console.error(`✗ Failed to process message ${messageId}:`, error.message);
    // Message remains pending and can be retried
  }
}

// Simulate processing logic
async function simulateOrderProcessing(order) {
  // Simulate some async work
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate occasional failures (10% failure rate for demo)
  if (Math.random() < 0.1) {
    throw new Error('Processing failed - will retry');
  }

  console.log(`Order processed: ${order.orderId} - ${order.product} x${order.quantity}`);
}

// Handle messages that are pending for too long (recovery mechanism)
async function processPendingMessages() {
  try {
    const pending = await consumerClient.xPendingRange(
      STREAM_KEY,
      CONSUMER_GROUP,
      '-',
      '+',
      10
    );

    // Process messages pending for more than 30 seconds
    const staleMessages = pending.filter(msg => msg.millisecondsSinceLastDelivery > 30000);

    if (staleMessages.length > 0) {
      console.log(`Found ${staleMessages.length} stale messages, claiming them...`);

      for (const msg of staleMessages) {
        // Claim the message for this consumer
        const claimed = await consumerClient.xClaim(
          STREAM_KEY,
          CONSUMER_GROUP,
          CONSUMER_NAME,
          30000, // Min idle time
          [msg.id]
        );

        if (claimed && claimed.length > 0) {
          await processMessage(claimed[0].id, claimed[0].message);
        }
      }
    }
  } catch (error) {
    console.error('Error processing pending messages:', error);
  }
}

// Consumer: Process messages with acknowledgment
async function processMessages() {
  console.log(`Consumer ${CONSUMER_NAME} started processing...`);

  while (true) {
    try {
      // Read new messages from the stream
      const messages = await consumerClient.xReadGroup(
        CONSUMER_GROUP,
        CONSUMER_NAME,
        [
          {
            key: STREAM_KEY,
            id: '>' // Read only new messages not delivered to other consumers
          }
        ],
        {
          COUNT: 10,
          BLOCK: 5000 // Block for 5 seconds if no messages
        }
      );

      if (messages && messages.length > 0) {
        for (const stream of messages) {
          for (const message of stream.messages) {
            await processMessage(message.id, message.message);
          }
        }
      }

      // Also check for pending messages that might have failed
      await processPendingMessages();

    } catch (error) {
      console.error('Error processing messages:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down consumer gracefully...');
  await consumerClient.quit();
  process.exit(0);
});

// Start consumer
async function start() {
  try {
    await initConsumer();
    await processMessages();
  } catch (error) {
    console.error('Failed to start consumer:', error);
    process.exit(1);
  }
}

start();
