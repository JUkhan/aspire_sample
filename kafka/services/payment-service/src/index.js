const express = require('express');
const consumer = require('./consumer');
const processor = require('./processor');

const app = express();
const PORT = process.env.PORT || 4001;

const Topics = {
  ORDERS: 'orders',
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
  });
});

// Start the service
async function start() {
  try {
    // Test database connection
    await processor.pool.query('SELECT 1');
    console.log('Payment Service: Database connected');

    // Connect to Kafka
    await consumer.connect();

    // Subscribe to topics
    await consumer.subscribe([Topics.ORDERS]);

    // Start consuming messages
    await consumer.startConsuming(async (event, topic, partition) => {
      await processor.handleEvent(event, consumer.publishEvent);
    });

    // Start HTTP server for health checks
    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    console.log('Payment Service: Ready to process payments');
  } catch (error) {
    console.error('Payment Service: Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Payment Service: Shutting down...');
  await consumer.disconnect();
  await processor.pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
