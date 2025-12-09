I'll create a complete web API example with Express.js that publishes orders to RabbitMQ and processes them with multiple consumer instances.

## Project Structure

```
order-system/
├── package.json
├── config/
│   └── rabbitmq.js
├── services/
│   ├── orderPublisher.js
│   └── orderConsumer.js
├── api-server.js
└── worker.js
```

## Setup

**package.json**
```json
{
  "name": "order-system",
  "version": "1.0.0",
  "scripts": {
    "api": "node api-server.js",
    "worker": "node worker.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "amqplib": "^0.10.3",
    "uuid": "^9.0.0",
    "body-parser": "^1.20.2"
  }
}
```

Install dependencies:
```bash
npm install
```

## Configuration

**config/rabbitmq.js**
```javascript
module.exports = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost',
  queues: {
    orders: 'orders',
    notifications: 'notifications',
    orderStatus: 'order-status'
  },
  exchanges: {
    orderEvents: 'order-events'
  }
};
```

## Publisher Service

**services/orderPublisher.js**
```javascript
const amqp = require('amqplib');
const config = require('../config/rabbitmq');

class OrderPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(config.url);
      this.channel = await this.connection.createChannel();

      // Declare queues
      await this.channel.assertQueue(config.queues.orders, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000 // Max 10k messages
        }
      });

      await this.channel.assertQueue(config.queues.orderStatus, {
        durable: true
      });

      // Declare exchange for events
      await this.channel.assertExchange(config.exchanges.orderEvents, 'topic', {
        durable: true
      });

      this.isConnected = true;
      console.log('✓ Publisher connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('Connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('Connection closed');
        this.isConnected = false;
        setTimeout(() => this.connect(), 5000);
      });

    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishOrder(order) {
    if (!this.isConnected) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      const message = JSON.stringify(order);
      
      const sent = this.channel.sendToQueue(
        config.queues.orders,
        Buffer.from(message),
        {
          persistent: true,
          messageId: order.orderId,
          timestamp: Date.now(),
          correlationId: order.correlationId || order.orderId,
          headers: {
            'x-priority': order.priority || 0,
            'source': 'api-server'
          }
        }
      );

      if (sent) {
        console.log(`📤 Published order: ${order.orderId}`);
        return true;
      } else {
        console.warn('⚠️  Message buffer full, waiting...');
        // Wait for drain event
        await new Promise(resolve => this.channel.once('drain', resolve));
        return this.publishOrder(order);
      }
    } catch (error) {
      console.error('Failed to publish order:', error);
      throw error;
    }
  }

  async publishOrderEvent(eventType, orderData) {
    if (!this.isConnected) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      const message = JSON.stringify({
        eventType,
        data: orderData,
        timestamp: new Date().toISOString()
      });

      const routingKey = `order.${eventType}`; // e.g., order.created, order.completed

      this.channel.publish(
        config.exchanges.orderEvents,
        routingKey,
        Buffer.from(message),
        { persistent: true }
      );

      console.log(`📢 Published event: ${eventType} for order ${orderData.orderId}`);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  async getQueueStats() {
    if (!this.isConnected) {
      return null;
    }

    try {
      const queueInfo = await this.channel.checkQueue(config.queues.orders);
      return {
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }

  async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.isConnected = false;
      console.log('Publisher closed');
    } catch (error) {
      console.error('Error closing publisher:', error);
    }
  }
}

module.exports = new OrderPublisher();
```

## API Server

**api-server.js**
```javascript
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const orderPublisher = require('./services/orderPublisher');

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || `API-${process.pid}`;

app.use(bodyParser.json());

// Store for tracking order status (in production, use Redis or database)
const orderStatusCache = new Map();

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${INSTANCE_ID}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    instance: INSTANCE_ID,
    rabbitmq: orderPublisher.isConnected
  });
});

// Get queue statistics
app.get('/api/queue-stats', async (req, res) => {
  try {
    const stats = await orderPublisher.getQueueStats();
    res.json({
      success: true,
      instance: INSTANCE_ID,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new order (async processing)
app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, items, totalAmount, priority } = req.body;

    // Validation
    if (!customerId || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerId, items, totalAmount'
      });
    }

    const orderId = uuidv4();
    const order = {
      orderId,
      customerId,
      items,
      totalAmount,
      priority: priority || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: INSTANCE_ID
    };

    // Publish to RabbitMQ
    await orderPublisher.publishOrder(order);
    
    // Publish order created event
    await orderPublisher.publishOrderEvent('created', order);

    // Store initial status
    orderStatusCache.set(orderId, {
      status: 'pending',
      createdAt: order.createdAt
    });

    // Return immediately (async processing)
    res.status(202).json({
      success: true,
      message: 'Order received and queued for processing',
      orderId,
      status: 'pending',
      statusUrl: `/api/orders/${orderId}/status`
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
  }
});

// Bulk order creation
app.post('/api/orders/bulk', async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'orders must be a non-empty array'
      });
    }

    const results = [];

    for (const orderData of orders) {
      const orderId = uuidv4();
      const order = {
        orderId,
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: INSTANCE_ID
      };

      await orderPublisher.publishOrder(order);
      results.push({
        orderId,
        status: 'queued'
      });
    }

    res.status(202).json({
      success: true,
      message: `${results.length} orders queued for processing`,
      orders: results
    });

  } catch (error) {
    console.error('Error creating bulk orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk orders',
      details: error.message
    });
  }
});

// Get order status
app.get('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  
  const status = orderStatusCache.get(orderId);
  
  if (!status) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  res.json({
    success: true,
    orderId,
    ...status
  });
});

// Simulate high load endpoint
app.post('/api/stress-test', async (req, res) => {
  const { count = 100 } = req.body;
  
  try {
    const startTime = Date.now();
    const orders = [];

    for (let i = 0; i < count; i++) {
      const orderId = uuidv4();
      const order = {
        orderId,
        customerId: `CUST-${Math.floor(Math.random() * 1000)}`,
        items: [
          { product: 'Product A', quantity: Math.floor(Math.random() * 5) + 1 },
          { product: 'Product B', quantity: Math.floor(Math.random() * 3) + 1 }
        ],
        totalAmount: Math.floor(Math.random() * 1000) + 50,
        priority: Math.floor(Math.random() * 3),
        createdAt: new Date().toISOString(),
        createdBy: INSTANCE_ID
      };

      await orderPublisher.publishOrder(order);
      orders.push(orderId);
    }

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      message: `Created ${count} orders in ${duration}ms`,
      ordersPerSecond: Math.round((count / duration) * 1000),
      orderIds: orders.slice(0, 10) // Return first 10 order IDs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
async function startServer() {
  try {
    // Connect to RabbitMQ first
    await orderPublisher.connect();

    app.listen(PORT, () => {
      console.log(`\n🚀 API Server [${INSTANCE_ID}] running on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Create Order: POST http://localhost:${PORT}/api/orders`);
      console.log(`   Queue Stats: GET http://localhost:${PORT}/api/queue-stats\n`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down API server...');
  await orderPublisher.close();
  process.exit(0);
});

startServer();
```

## Consumer/Worker Service

**services/orderConsumer.js**
```javascript
const amqp = require('amqplib');
const config = require('../config/rabbitmq');

class OrderConsumer {
  constructor(instanceId) {
    this.instanceId = instanceId;
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.processedCount = 0;
    this.failedCount = 0;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(config.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(config.queues.orders, {
        durable: true
      });

      // Fair dispatch - only one message at a time per worker
      await this.channel.prefetch(1);

      this.isConnected = true;
      console.log(`✓ [${this.instanceId}] Consumer connected to RabbitMQ`);

      this.connection.on('error', (err) => {
        console.error(`[${this.instanceId}] Connection error:`, err.message);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log(`[${this.instanceId}] Connection closed, reconnecting...`);
        this.isConnected = false;
        setTimeout(() => this.connect(), 5000);
      });

    } catch (error) {
      console.error(`[${this.instanceId}] Failed to connect:`, error.message);
      this.isConnected = false;
      setTimeout(() => this.connect(), 5000);
    }
  }

  async startConsuming() {
    if (!this.isConnected) {
      throw new Error('Not connected to RabbitMQ');
    }

    console.log(`[${this.instanceId}] 👂 Waiting for orders...\n`);

    this.channel.consume(
      config.queues.orders,
      async (msg) => {
        if (msg === null) return;

        const order = JSON.parse(msg.content.toString());
        const startTime = Date.now();

        console.log(`[${this.instanceId}] 📦 Processing order: ${order.orderId}`);
        console.log(`   Customer: ${order.customerId}`);
        console.log(`   Amount: $${order.totalAmount}`);
        console.log(`   Items: ${order.items.length}`);

        try {
          await this.processOrder(order);
          
          // Acknowledge successful processing
          this.channel.ack(msg);
          this.processedCount++;
          
          const duration = Date.now() - startTime;
          console.log(`[${this.instanceId}] ✅ Completed order: ${order.orderId} (${duration}ms)`);
          console.log(`   Stats: ${this.processedCount} processed, ${this.failedCount} failed\n`);

        } catch (error) {
          this.failedCount++;
          console.error(`[${this.instanceId}] ❌ Failed to process order ${order.orderId}:`, error.message);
          
          // Check retry count
          const retryCount = (msg.properties.headers['x-retry-count'] || 0);
          
          if (retryCount < 3) {
            // Requeue with retry count
            console.log(`[${this.instanceId}] 🔄 Requeuing order ${order.orderId} (attempt ${retryCount + 1}/3)`);
            
            this.channel.nack(msg, false, false);
            
            // Republish with updated retry count
            this.channel.sendToQueue(
              config.queues.orders,
              msg.content,
              {
                ...msg.properties,
                headers: {
                  ...msg.properties.headers,
                  'x-retry-count': retryCount + 1
                }
              }
            );
          } else {
            // Max retries reached - move to dead letter or log
            console.log(`[${this.instanceId}] ☠️  Max retries reached for order ${order.orderId}`);
            this.channel.ack(msg); // Remove from queue
            // In production: send to dead letter queue or alert system
          }
        }
      },
      { noAck: false }
    );
  }

  async processOrder(order) {
    // Simulate different processing steps
    
    // 1. Validate order
    await this.delay(200);
    console.log(`[${this.instanceId}]    ▸ Order validated`);
    
    // 2. Check inventory
    await this.delay(300);
    console.log(`[${this.instanceId}]    ▸ Inventory checked`);
    
    // 3. Process payment
    await this.delay(500);
    
    // Simulate occasional payment failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Payment gateway timeout');
    }
    console.log(`[${this.instanceId}]    ▸ Payment processed`);
    
    // 4. Update inventory
    await this.delay(200);
    console.log(`[${this.instanceId}]    ▸ Inventory updated`);
    
    // 5. Send confirmation
    await this.delay(150);
    console.log(`[${this.instanceId}]    ▸ Confirmation sent`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      instanceId: this.instanceId,
      processed: this.processedCount,
      failed: this.failedCount,
      connected: this.isConnected
    };
  }

  async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.isConnected = false;
      console.log(`[${this.instanceId}] Consumer closed`);
    } catch (error) {
      console.error('Error closing consumer:', error);
    }
  }
}

module.exports = OrderConsumer;
```

**worker.js**
```javascript
const OrderConsumer = require('./services/orderConsumer');

const INSTANCE_ID = process.env.INSTANCE_ID || `WORKER-${process.pid}`;

async function startWorker() {
  const consumer = new OrderConsumer(INSTANCE_ID);
  
  await consumer.connect();
  await consumer.startConsuming();

  // Display stats every 30 seconds
  setInterval(() => {
    const stats = consumer.getStats();
    console.log(`\n📊 [${INSTANCE_ID}] Stats: ${stats.processed} processed, ${stats.failed} failed\n`);
  }, 30000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n🛑 [${INSTANCE_ID}] Shutting down worker...`);
    const stats = consumer.getStats();
    console.log(`   Final stats: ${stats.processed} processed, ${stats.failed} failed`);
    await consumer.close();
    process.exit(0);
  });
}

startWorker().catch(console.error);
```

## Running the System

### 1. Start RabbitMQ
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

Access management UI at: http://localhost:15672 (guest/guest)

### 2. Start Multiple API Servers (Load Balanced)
```bash
# Terminal 1
INSTANCE_ID=API-1 PORT=3001 node api-server.js

# Terminal 2
INSTANCE_ID=API-2 PORT=3002 node api-server.js

# Terminal 3
INSTANCE_ID=API-3 PORT=3003 node api-server.js
```

### 3. Start Multiple Workers
```bash
# Terminal 4
INSTANCE_ID=WORKER-1 node worker.js

# Terminal 5
INSTANCE_ID=WORKER-2 node worker.js

# Terminal 6
INSTANCE_ID=WORKER-3 node worker.js

# Terminal 7
INSTANCE_ID=WORKER-4 node worker.js

# Terminal 8
INSTANCE_ID=WORKER-5 node worker.js
```

## Testing the API

### Create a Single Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-123",
    "items": [
      {"product": "Laptop", "quantity": 1},
      {"product": "Mouse", "quantity": 2}
    ],
    "totalAmount": 1299.99,
    "priority": 1
  }'
```

Response:
```json
{
  "success": true,
  "message": "Order received and queued for processing",
  "orderId": "a1b2c3d4-...",
  "status": "pending",
  "statusUrl": "/api/orders/a1b2c3d4-.../status"
}
```

### Check Order Status
```bash
curl http://localhost:3001/api/orders/{orderId}/status
```

### Create Bulk Orders
```bash
curl -X POST http://localhost:3001/api/orders/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "orders": [
      {
        "customerId": "CUST-001",
        "items": [{"product": "ProductA", "quantity": 2}],
        "totalAmount": 50.00
      },
      {
        "customerId": "CUST-002",
        "items": [{"product": "ProductB", "quantity": 1}],
        "totalAmount": 75.00
      }
    ]
  }'
```

### Stress Test
```bash
curl -X POST http://localhost:3001/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'
```

### Check Queue Statistics
```bash
curl http://localhost:3001/api/queue-stats
```

## What You'll Observe

1. **Load Distribution**: Orders are automatically distributed across all workers
2. **Fault Tolerance**: Stop a worker - others pick up the load
3. **Scalability**: Add more workers to increase throughput
4. **Retry Logic**: Failed orders are retried up to 3 times
5. **Fair Distribution**: Each worker processes one order at a time (prefetch=1)
6. **Multiple API Instances**: All API servers publish to the same queue

## Production Enhancements

For production, consider adding:
- Redis for order status tracking
- Dead letter queue for failed messages
- Monitoring with Prometheus
- Distributed tracing
- Rate limiting
- Authentication/Authorization
- Database persistence
- Nginx load balancer for API servers

This gives you a complete, scalable order processing system using RabbitMQ!