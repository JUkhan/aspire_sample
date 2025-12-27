const express = require('express');
const consumer = require('./consumer');
const processor = require('./processor');

const app = express();
const PORT = process.env.PORT || 4003;

const Topics = {
  PAYMENTS: 'payments',
  INVENTORY: 'inventory',
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'shipping-service',
    timestamp: new Date().toISOString(),
  });
});

// Start the service
async function start() {
  try {
    // Test database connection
    await processor.pool.query('SELECT 1');
    console.log('Shipping Service: Database connected');

    // Connect to Kafka
    await consumer.connect();

    // Subscribe to payment and inventory topics
    // Shipping only proceeds when both payment is processed AND inventory is reserved
    await consumer.subscribe([Topics.PAYMENTS, Topics.INVENTORY]);

    // Start consuming messages
    await consumer.startConsuming(async (event, topic, partition) => {
      await processor.handleEvent(event, consumer.publishEvent);
    });

    // Start HTTP server for health checks
    app.listen(PORT, () => {
      console.log(`Shipping Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    console.log('Shipping Service: Ready to handle shipments');
  } catch (error) {
    console.error('Shipping Service: Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Shipping Service: Shutting down...');
  await consumer.disconnect();
  await processor.pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
