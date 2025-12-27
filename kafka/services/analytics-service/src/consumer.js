const { Kafka, logLevel, Partitioners } = require('kafkajs');

// Silence KafkaJS partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';
const { Pool } = require('pg');
const { broadcastEvent, broadcastStats } = require('./websocket');

const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const consumer = kafka.consumer({
  groupId: 'analytics-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Real-time statistics
const stats = {
  totalEvents: 0,
  eventCounts: {},
  ordersCreated: 0,
  paymentsProcessed: 0,
  paymentsFailed: 0,
  inventoryReserved: 0,
  shipmentsCreated: 0,
  shipmentsDelivered: 0,
  recentEvents: [],
  startTime: new Date().toISOString(),
};

const MAX_RECENT_EVENTS = 50;

async function connect() {
  await consumer.connect();
  console.log('Analytics Service: Kafka consumer connected');
}

async function subscribe(topics) {
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
    console.log(`Analytics Service: Subscribed to topic: ${topic}`);
  }
}

function updateStats(event) {
  stats.totalEvents++;

  // Count by event type
  const eventType = event.eventType;
  stats.eventCounts[eventType] = (stats.eventCounts[eventType] || 0) + 1;

  // Update specific counters
  switch (eventType) {
    case 'ORDER_CREATED':
      stats.ordersCreated++;
      break;
    case 'PAYMENT_PROCESSED':
      stats.paymentsProcessed++;
      break;
    case 'PAYMENT_FAILED':
      stats.paymentsFailed++;
      break;
    case 'INVENTORY_RESERVED':
      stats.inventoryReserved++;
      break;
    case 'SHIPMENT_CREATED':
      stats.shipmentsCreated++;
      break;
    case 'SHIPMENT_DELIVERED':
      stats.shipmentsDelivered++;
      break;
  }

  // Add to recent events
  stats.recentEvents.unshift({
    eventType: event.eventType,
    orderId: event.payload?.orderId,
    timestamp: event.timestamp,
    source: event.metadata?.source,
  });

  // Keep only last N events
  if (stats.recentEvents.length > MAX_RECENT_EVENTS) {
    stats.recentEvents = stats.recentEvents.slice(0, MAX_RECENT_EVENTS);
  }
}

async function startConsuming() {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log(`Analytics Service: Received ${event.eventType} from ${topic}`);

        // Update statistics
        updateStats(event);

        // Broadcast event to WebSocket clients
        broadcastEvent(event);

        // Broadcast updated stats every 5 events
        if (stats.totalEvents % 5 === 0) {
          broadcastStats(getStats());
        }
      } catch (error) {
        console.error('Analytics Service: Error processing message:', error);
      }
    },
  });
}

async function disconnect() {
  await consumer.disconnect();
  await pool.end();
  console.log('Analytics Service: Kafka connection closed');
}

function getStats() {
  return {
    ...stats,
    uptime: Math.floor((Date.now() - new Date(stats.startTime).getTime()) / 1000),
  };
}

// Get analytics from database
async function getAnalyticsFromDB() {
  const ordersQuery = `
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'payment_failed' THEN 1 END) as failed_orders,
      COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders
    FROM orders
  `;

  const dailyQuery = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as orders,
      COALESCE(SUM(total), 0) as revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  const hourlyQuery = `
    SELECT
      DATE_TRUNC('hour', created_at) as hour,
      COUNT(*) as orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY DATE_TRUNC('hour', created_at)
    ORDER BY hour
  `;

  const [ordersResult, dailyResult, hourlyResult] = await Promise.all([
    pool.query(ordersQuery),
    pool.query(dailyQuery),
    pool.query(hourlyQuery),
  ]);

  return {
    summary: ordersResult.rows[0],
    dailyOrders: dailyResult.rows,
    hourlyOrders: hourlyResult.rows,
    realTimeStats: getStats(),
  };
}

module.exports = {
  connect,
  subscribe,
  startConsuming,
  disconnect,
  getStats,
  getAnalyticsFromDB,
  pool,
};
