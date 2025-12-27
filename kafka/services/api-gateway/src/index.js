const express = require('express');
const cors = require('cors');

const { connectProducer, disconnectProducer } = require('./kafka/producer');
const db = require('./db');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/orders', ordersRouter);

// GET /api/inventory - Get all inventory items
app.get('/api/inventory', async (req, res) => {
  try {
    const inventory = await db.getInventory();
    res.json({ success: true, inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics - Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await db.getAnalytics();
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services/status - Health check for all services
app.get('/api/services/status', async (req, res) => {
  const services = [
    { name: 'api-gateway', port: 4000 },
    { name: 'payment-service', port: 4001 },
    { name: 'inventory-service', port: 4002 },
    { name: 'shipping-service', port: 4003 },
    { name: 'analytics-service', port: 4004 },
  ];

  const statuses = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await fetch(`http://localhost:${service.port}/health`);
        return {
          name: service.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          port: service.port,
        };
      } catch (error) {
        return {
          name: service.name,
          status: service.name === 'api-gateway' ? 'healthy' : 'offline',
          port: service.port,
        };
      }
    })
  );

  res.json({ success: true, services: statuses });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Retry helper with exponential backoff
async function retry(fn, name, maxRetries = 10, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`${name} connection attempt ${i + 1}/${maxRetries} failed: ${error.message}`);
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(1.5, i);
        console.log(`Retrying in ${Math.round(waitTime / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}

// Start server
async function start() {
  try {
    // Test database connection with retry
    await retry(async () => {
      await db.pool.query('SELECT 1');
      console.log('Database connected');
    }, 'Database');

    // Connect Kafka producer with retry
    await retry(async () => {
      await connectProducer();
    }, 'Kafka');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`API Gateway running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...');
  await disconnectProducer();
  await db.pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...');
  await disconnectProducer();
  await db.pool.end();
  process.exit(0);
});

start();
