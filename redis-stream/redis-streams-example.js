const express = require('express');
const redis = require('redis');

const app = express();
app.use(express.json());

// Create Redis client for publisher
const publisherClient = redis.createClient({ url: 'redis://localhost:6379' });
const client = redis.createClient({ url: 'redis://localhost:6379' });

const STREAM_KEY = 'orders:stream';
const CONSUMER_GROUP = 'order-processors';

// Connect clients
async function initRedis() {
  await publisherClient.connect();
  await client.connect();
  console.log('Connected to Redis');
}

// Producer: API endpoint to add messages to stream
app.post('/orders', async (req, res) => {
  try {
    const { orderId, product, quantity, userId } = req.body;
    
    const messageId = await publisherClient.xAdd(STREAM_KEY, '*', {
      orderId: orderId.toString(),
      product,
      quantity: quantity.toString(),
      userId: userId.toString(),
      timestamp: Date.now().toString()
    });
    
    res.json({ 
      success: true, 
      messageId,
      message: 'Order added to stream' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Replay: Get message history
app.get('/orders/history', async (req, res) => {
  try {
    const { start = '-', end = '+', count = 100 } = req.query;

    const messages = await client.xRange(
      STREAM_KEY,
      start,
      end,
      { COUNT: parseInt(count) }
    );

    const formatted = messages.map(msg => ({
      id: msg.id,
      data: msg.message
    }));

    res.json({ messages: formatted, count: formatted.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending messages (not yet acknowledged)
app.get('/orders/pending', async (req, res) => {
  try {
    const pending = await client.xPending(
      STREAM_KEY,
      CONSUMER_GROUP
    );

    if (pending.pending === 0) {
      return res.json({ message: 'No pending messages', pending: [] });
    }

    // Get detailed info about pending messages
    const details = await client.xPendingRange(
      STREAM_KEY,
      CONSUMER_GROUP,
      '-',
      '+',
      100
    );

    res.json({
      summary: pending,
      messages: details
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get stream info
app.get('/stream/info', async (req, res) => {
  try {
    const info = await client.xInfoStream(STREAM_KEY);
    const groups = await client.xInfoGroups(STREAM_KEY);

    res.json({ stream: info, groups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await publisherClient.quit();
  await client.quit();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initRedis();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('\nAvailable endpoints:');
      console.log('  POST /orders - Add order to stream');
      console.log('  GET /orders/history - View message history');
      console.log('  GET /orders/pending - View pending messages');
      console.log('  GET /stream/info - View stream information');
      console.log('\nNote: Consumer is in a separate process (consumer.js)');
    });

  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();
