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
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000, // max queue size
        },
      });

      // Ensure exchange exists
      await this.channel.assertExchange(config.exchanges.orderEvents, 'topic', {
        durable: true,
      });

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

  // NEW: Publish status updates
  async publishStatusUpdate(orderId, status, additionalData = {}) {
    try {
      const statusUpdate = {
        orderId,
        status,
        processedBy: this.instanceId,
        completedAt: new Date().toISOString(),
        ...additionalData,
      };

      const message = JSON.stringify({
        eventType: `status.${status}`,
        data: statusUpdate,
        timestamp: new Date().toISOString(),
      });

      this.channel.publish(
        config.exchanges.orderEvents,
        `order.status.${status}`,
        Buffer.from(message),
        { persistent: true }
      );

      console.log(
        `[${this.instanceId}] 📤 Published status: ${orderId} -> ${status}`
      );
    } catch (error) {
      console.error(`[${this.instanceId}] Failed to publish status:`, error);
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

        console.log(
          `[${this.instanceId}] 📦 Processing order: ${order.orderId}`
        );

        try {
          // Update status to 'processing'
          await this.publishStatusUpdate(order.orderId, 'processing');

          // Process the order
          await this.processOrder(order);

          // Acknowledge successful processing
          this.channel.ack(msg);
          this.processedCount++;

          const duration = Date.now() - startTime;

          // Update status to 'completed'
          await this.publishStatusUpdate(order.orderId, 'completed', {
            processingTime: duration,
          });

          console.log(
            `[${this.instanceId}] ✅ Completed order: ${order.orderId} (${duration}ms)\n`
          );
        } catch (error) {
          this.failedCount++;
          console.error(
            `[${this.instanceId}] ❌ Failed: ${order.orderId}:`,
            error.message
          );

          const retryCount = msg.properties.headers['x-retry-count'] || 0;

          if (retryCount < 3) {
            console.log(
              `[${this.instanceId}] 🔄 Requeuing (attempt ${retryCount + 1}/3)`
            );

            // Update status to 'retrying'
            await this.publishStatusUpdate(order.orderId, 'retrying', {
              error: error.message,
              retryCount: retryCount + 1,
            });

            this.channel.nack(msg, false, false);
            this.channel.sendToQueue(config.queues.orders, msg.content, {
              ...msg.properties,
              headers: {
                ...msg.properties.headers,
                'x-retry-count': retryCount + 1,
              },
            });
          } else {
            console.log(`[${this.instanceId}] ☠️  Max retries reached`);

            // Update status to 'failed'
            await this.publishStatusUpdate(order.orderId, 'failed', {
              error: error.message,
              retryCount: retryCount,
            });

            this.channel.ack(msg);
          }
        }
      },
      { noAck: false }
    );
  }

  async processOrder(order) {
    // Simulate processing steps
    await this.delay(200);
    console.log(`[${this.instanceId}]    ▸ Order validated`);

    await this.delay(300);
    console.log(`[${this.instanceId}]    ▸ Inventory checked`);

    await this.delay(500);
    if (Math.random() < 0.05) {
      throw new Error('Payment gateway timeout');
    }
    console.log(`[${this.instanceId}]    ▸ Payment processed`);

    await this.delay(200);
    console.log(`[${this.instanceId}]    ▸ Inventory updated`);

    await this.delay(150);
    console.log(`[${this.instanceId}]    ▸ Confirmation sent`);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      instanceId: this.instanceId,
      processed: this.processedCount,
      failed: this.failedCount,
      connected: this.isConnected,
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
