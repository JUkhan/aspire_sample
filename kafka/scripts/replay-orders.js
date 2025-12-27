#!/usr/bin/env node

/**
 * Order Replay Script
 *
 * This script replays historical orders to a test topic for fraud detection testing.
 * Usage: node scripts/replay-orders.js [days] [topic]
 *
 * Examples:
 *   node scripts/replay-orders.js              # Replay last 7 days to 'orders-replay'
 *   node scripts/replay-orders.js 14           # Replay last 14 days
 *   node scripts/replay-orders.js 7 fraud-test # Replay to custom topic
 */

const { Kafka, logLevel, Partitioners } = require('kafkajs');

// Silence KafkaJS partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';
const { Pool } = require('pg');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const DEFAULT_DAYS = 7;
const DEFAULT_TOPIC = 'orders-replay';

const kafka = new Kafka({
  clientId: 'replay-script',
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.WARN,
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

function createEvent(order) {
  return {
    eventId: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType: 'ORDER_CREATED',
    timestamp: new Date().toISOString(),
    payload: {
      orderId: order.id,
      customerId: order.customer_id,
      customerEmail: order.customer_email,
      items: order.items,
      total: parseFloat(order.total),
      status: order.status,
      originalCreatedAt: order.created_at,
      isReplay: true, // Flag to identify replayed orders
    },
    metadata: {
      version: '1.0',
      source: 'replay-script',
      correlationId: `replay_${order.id}`,
      originalOrderId: order.id,
    },
  };
}

async function getOrdersForReplay(days) {
  console.log(`Fetching orders from the last ${days} days...`);

  const query = `
    SELECT * FROM orders
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    ORDER BY created_at ASC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function replayOrders(days, targetTopic) {
  const producer = kafka.producer({ allowAutoTopicCreation: true });

  try {
    console.log('Connecting to Kafka...');
    await producer.connect();
    console.log('Connected to Kafka');

    const orders = await getOrdersForReplay(days);

    if (orders.length === 0) {
      console.log('No orders found for the specified period.');
      return;
    }

    console.log(`Found ${orders.length} orders to replay`);
    console.log(`Target topic: ${targetTopic}`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        const event = createEvent(order);

        await producer.send({
          topic: targetTopic,
          messages: [
            {
              key: order.id,
              value: JSON.stringify(event),
              headers: {
                'event-type': 'ORDER_CREATED',
                'is-replay': 'true',
                'original-timestamp': order.created_at.toISOString(),
              },
            },
          ],
        });

        successCount++;
        process.stdout.write(`\rReplayed: ${successCount}/${orders.length}`);

        // Add small delay to avoid overwhelming Kafka
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        errorCount++;
        console.error(`\nError replaying order ${order.id}:`, error.message);
      }
    }

    console.log('\n');
    console.log('='.repeat(50));
    console.log('Replay Complete!');
    console.log('='.repeat(50));
    console.log(`Total orders: ${orders.length}`);
    console.log(`Successfully replayed: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Target topic: ${targetTopic}`);
    console.log('');
    console.log('Fraud detection services can now consume from this topic.');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    await producer.disconnect();
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const days = parseInt(args[0]) || DEFAULT_DAYS;
const topic = args[1] || DEFAULT_TOPIC;

console.log('='.repeat(50));
console.log('Order Replay Script for Fraud Detection Testing');
console.log('='.repeat(50));
console.log('');

replayOrders(days, topic)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Replay failed:', error);
    process.exit(1);
  });
