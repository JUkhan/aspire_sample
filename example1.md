I'll create a complete Node.js example for the Order processing scenario with RabbitMQ.

## Setup

First, install the required package:
```bash
npm install amqplib
```

## Service A - Order API (Publisher)

**publisher.js**
```javascript
const amqp = require('amqplib');

class OrderPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = 'orders';
  }

  async connect() {
    try {
      // Connect to RabbitMQ
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Declare the queue (idempotent - safe to call multiple times)
      await this.channel.assertQueue(this.queueName, {
        durable: true // Queue survives broker restart
      });

      console.log(`[Publisher ${process.pid}] Connected to RabbitMQ`);
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  async publishOrder(order) {
    try {
      const message = JSON.stringify(order);
      
      this.channel.sendToQueue(
        this.queueName,
        Buffer.from(message),
        {
          persistent: true, // Message survives broker restart
          messageId: order.orderId,
          timestamp: Date.now()
        }
      );

      console.log(`[Publisher ${process.pid}] Published order:`, order.orderId);
      return true;
    } catch (error) {
      console.error('Failed to publish:', error);
      return false;
    }
  }

  async close() {
    await this.channel?.close();
    await this.connection?.close();
  }
}

// Example usage - simulating an API endpoint
async function main() {
  const publisher = new OrderPublisher();
  await publisher.connect();

  // Simulate receiving orders (e.g., from HTTP requests)
  const instanceId = process.env.INSTANCE_ID || Math.floor(Math.random() * 1000);
  
  let orderCounter = 0;
  const publishInterval = setInterval(async () => {
    const order = {
      orderId: `ORDER-${instanceId}-${orderCounter++}`,
      customerId: `CUST-${Math.floor(Math.random() * 100)}`,
      amount: Math.floor(Math.random() * 1000) + 10,
      items: ['item1', 'item2'],
      timestamp: new Date().toISOString()
    };

    await publisher.publishOrder(order);
  }, 2000); // Publish every 2 seconds

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Publisher] Shutting down...');
    clearInterval(publishInterval);
    await publisher.close();
    process.exit(0);
  });
}

main().catch(console.error);
```

## Service B - Order Processor (Consumer)

**consumer.js**
```javascript
const amqp = require('amqplib');

class OrderProcessor {
  constructor(instanceId) {
    this.instanceId = instanceId;
    this.connection = null;
    this.channel = null;
    this.queueName = 'orders';
    this.isProcessing = false;
  }

  async connect() {
    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Declare the queue
      await this.channel.assertQueue(this.queueName, {
        durable: true
      });

      // Set prefetch to 1 - only get one message at a time
      // This ensures fair distribution across consumers
      await this.channel.prefetch(1);

      console.log(`[Consumer ${this.instanceId}] Connected and waiting for orders...`);
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  async startConsuming() {
    this.isProcessing = true;

    this.channel.consume(
      this.queueName,
      async (msg) => {
        if (msg === null) {
          return;
        }

        const order = JSON.parse(msg.content.toString());
        console.log(`\n[Consumer ${this.instanceId}] Received order:`, order.orderId);

        try {
          // Process the order (simulate work)
          await this.processOrder(order);
          
          // Acknowledge the message - tells RabbitMQ we're done
          this.channel.ack(msg);
          console.log(`[Consumer ${this.instanceId}] ✓ Completed order:`, order.orderId);
        } catch (error) {
          console.error(`[Consumer ${this.instanceId}] ✗ Failed to process order:`, error);
          
          // Reject and requeue the message for another consumer
          // Set requeue to false if you want to move to dead letter queue instead
          this.channel.nack(msg, false, true);
        }
      },
      {
        noAck: false // Manual acknowledgment
      }
    );
  }

  async processOrder(order) {
    // Simulate processing time (database operations, external API calls, etc.)
    const processingTime = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
    
    console.log(`[Consumer ${this.instanceId}] Processing order ${order.orderId}...`);
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Random processing error');
    }

    // Here you would:
    // - Update database
    // - Call payment service
    // - Send confirmation email
    // - Update inventory
    // etc.
    
    console.log(`[Consumer ${this.instanceId}] Order ${order.orderId} processed in ${processingTime}ms`);
  }

  async close() {
    this.isProcessing = false;
    await this.channel?.close();
    await this.connection?.close();
  }
}

// Example usage
async function main() {
  const instanceId = process.env.INSTANCE_ID || `PROC-${Math.floor(Math.random() * 1000)}`;
  const processor = new OrderProcessor(instanceId);
  
  await processor.connect();
  await processor.startConsuming();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n[Consumer ${instanceId}] Shutting down...`);
    await processor.close();
    process.exit(0);
  });
}

main().catch(console.error);
```

## Running the Example

### 1. Start RabbitMQ (using Docker)
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 2. Start Multiple Publisher Instances
```bash
# Terminal 1
INSTANCE_ID=PUB1 node publisher.js

# Terminal 2
INSTANCE_ID=PUB2 node publisher.js

# Terminal 3
INSTANCE_ID=PUB3 node publisher.js
```

### 3. Start Multiple Consumer Instances
```bash
# Terminal 4
INSTANCE_ID=CONS1 node consumer.js

# Terminal 5
INSTANCE_ID=CONS2 node consumer.js

# Terminal 6
INSTANCE_ID=CONS3 node consumer.js

# Terminal 7
INSTANCE_ID=CONS4 node consumer.js

# Terminal 8
INSTANCE_ID=CONS5 node consumer.js
```

## What You'll See

You'll observe:
- All 3 publishers sending orders to the queue
- Orders being distributed across all 5 consumers
- Each order processed by only ONE consumer
- If you stop a consumer, others pick up the load
- Occasional failed orders being retried by different consumers

## Enhanced Version with Connection Resilience

**enhanced-consumer.js** (with reconnection logic)
```javascript
const amqp = require('amqplib');

class ResilientOrderProcessor {
  constructor(instanceId) {
    this.instanceId = instanceId;
    this.connection = null;
    this.channel = null;
    this.queueName = 'orders';
    this.isShuttingDown = false;
  }

  async connect() {
    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertQueue(this.queueName, { durable: true });
      await this.channel.prefetch(1);

      // Handle connection errors
      this.connection.on('error', (err) => {
        if (!this.isShuttingDown) {
          console.error(`[Consumer ${this.instanceId}] Connection error:`, err.message);
        }
      });

      this.connection.on('close', () => {
        if (!this.isShuttingDown) {
          console.log(`[Consumer ${this.instanceId}] Connection closed. Reconnecting...`);
          setTimeout(() => this.connect(), 5000);
        }
      });

      console.log(`[Consumer ${this.instanceId}] Connected successfully`);
      await this.startConsuming();
    } catch (error) {
      console.error(`[Consumer ${this.instanceId}] Connection failed:`, error.message);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async startConsuming() {
    this.channel.consume(
      this.queueName,
      async (msg) => {
        if (msg === null) return;

        const order = JSON.parse(msg.content.toString());
        console.log(`[Consumer ${this.instanceId}] 📦 Received: ${order.orderId}`);

        try {
          await this.processOrder(order);
          this.channel.ack(msg);
          console.log(`[Consumer ${this.instanceId}] ✓ Completed: ${order.orderId}`);
        } catch (error) {
          console.error(`[Consumer ${this.instanceId}] ✗ Failed: ${order.orderId}`);
          this.channel.nack(msg, false, true);
        }
      },
      { noAck: false }
    );
  }

  async processOrder(order) {
    const processingTime = Math.floor(Math.random() * 3000) + 1000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    if (Math.random() < 0.05) {
      throw new Error('Processing failed');
    }
  }

  async close() {
    this.isShuttingDown = true;
    await this.channel?.close();
    await this.connection?.close();
  }
}

async function main() {
  const instanceId = process.env.INSTANCE_ID || `PROC-${process.pid}`;
  const processor = new ResilientOrderProcessor(instanceId);
  
  await processor.connect();

  process.on('SIGINT', async () => {
    console.log(`\n[Consumer ${instanceId}] Shutting down gracefully...`);
    await processor.close();
    process.exit(0);
  });
}

main().catch(console.error);
```

This example demonstrates:
- Load balancing across multiple consumers
- Fault tolerance (consumers can crash and recover)
- Message acknowledgment
- Graceful shutdown
- Connection resilience

You can experiment by stopping/starting instances to see how RabbitMQ redistributes the load!