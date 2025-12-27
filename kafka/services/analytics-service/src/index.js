const express = require('express');
const http = require('http');
const consumer = require('./consumer');
const { createWebSocketServer, getConnectedClientsCount } = require('./websocket');

const app = express();
const PORT = process.env.PORT || 4004;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
createWebSocketServer(server);

// Middleware
app.use(express.json());

// Enable CORS for the dashboard
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics-service',
    timestamp: new Date().toISOString(),
    websocketClients: getConnectedClientsCount(),
  });
});

// Get real-time stats
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: consumer.getStats(),
  });
});

// Get full analytics from database
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await consumer.getAnalyticsFromDB();
    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const Topics = {
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  INVENTORY: 'inventory',
  SHIPPING: 'shipping',
  ORDERS_REPLAY: 'orders-replay',
};

// Start the service
async function start() {
  try {
    // Test database connection
    await consumer.pool.query('SELECT 1');
    console.log('Analytics Service: Database connected');

    // Connect to Kafka
    await consumer.connect();

    // Subscribe to ALL topics to gather comprehensive analytics
    await consumer.subscribe([
      Topics.ORDERS,
      Topics.PAYMENTS,
      Topics.INVENTORY,
      Topics.SHIPPING,
      Topics.ORDERS_REPLAY,
    ]);

    // Start consuming messages
    await consumer.startConsuming();

    // Start HTTP + WebSocket server
    server.listen(PORT, () => {
      console.log(`Analytics Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`WebSocket: ws://localhost:${PORT}`);
      console.log(`Stats API: http://localhost:${PORT}/api/stats`);
      console.log(`Analytics API: http://localhost:${PORT}/api/analytics`);
    });

    console.log('Analytics Service: Ready to collect analytics');
  } catch (error) {
    console.error('Analytics Service: Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Analytics Service: Shutting down...');
  await consumer.disconnect();
  server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
