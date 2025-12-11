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
          'x-max-length': 10000, // Max 10k messages
        },
      });

      await this.channel.assertQueue(config.queues.orderStatus, {
        durable: true,
      });

      // Declare exchange for events
      await this.channel.assertExchange(config.exchanges.orderEvents, 'topic', {
        durable: true,
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
            source: 'api-server',
          },
        }
      );

      if (sent) {
        console.log(`📤 Published order: ${order.orderId}`);
        return true;
      } else {
        console.warn('⚠️  Message buffer full, waiting...');
        // Wait for drain event
        await new Promise((resolve) => this.channel.once('drain', resolve));
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
        timestamp: new Date().toISOString(),
      });

      const routingKey = `order.${eventType}`; // e.g., order.created, order.completed

      this.channel.publish(
        config.exchanges.orderEvents,
        routingKey,
        Buffer.from(message),
        { persistent: true }
      );

      console.log(
        `📢 Published event: ${eventType} for order ${orderData.orderId}`
      );
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
        consumerCount: queueInfo.consumerCount,
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }

  async subscribeToStatusUpdates(callback) {
    if (!this.isConnected) {
      throw new Error('Not connected to RabbitMQ');
    }

    // Bind to status updates queue
    const statusQueue = `${config.queues.orderStatus}-${process.pid}`;

    await this.channel.assertQueue(statusQueue, {
      durable: false,
      autoDelete: true, // Delete when API server disconnects
    });

    // Bind to order events exchange
    await this.channel.bindQueue(
      statusQueue,
      config.exchanges.orderEvents,
      'order.status.*' // Listen to order.status.completed, order.status.failed, etc.
    );

    this.channel.consume(statusQueue, (msg) => {
      if (msg) {
        const statusUpdate = JSON.parse(msg.content.toString());
        callback(statusUpdate);
        this.channel.ack(msg);
      }
    });

    console.log('✓ Subscribed to order status updates');
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
