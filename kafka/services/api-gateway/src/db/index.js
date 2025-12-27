const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Order Operations
async function createOrder(order) {
  const query = `
    INSERT INTO orders (id, customer_id, customer_email, items, total, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [
    order.id,
    order.customerId,
    order.customerEmail,
    JSON.stringify(order.items),
    order.total,
    order.status || 'pending',
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getOrderById(orderId) {
  const query = 'SELECT * FROM orders WHERE id = $1';
  const result = await pool.query(query, [orderId]);
  return result.rows[0];
}

async function getAllOrders(limit = 100, offset = 0) {
  const query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2';
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
}

async function updateOrderStatus(orderId, status) {
  const query = `
    UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 RETURNING *
  `;
  const result = await pool.query(query, [status, orderId]);
  return result.rows[0];
}

async function getOrdersForReplay(days = 7) {
  const query = `
    SELECT * FROM orders
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    ORDER BY created_at ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

// Order Events Operations
async function saveOrderEvent(event) {
  const query = `
    INSERT INTO order_events (order_id, event_type, payload, service_name)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const values = [
    event.orderId,
    event.eventType,
    JSON.stringify(event.payload),
    event.serviceName,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getOrderEvents(orderId) {
  const query = `
    SELECT * FROM order_events
    WHERE order_id = $1
    ORDER BY created_at ASC
  `;
  const result = await pool.query(query, [orderId]);
  return result.rows;
}

// Inventory Operations
async function getInventory() {
  const query = 'SELECT * FROM inventory ORDER BY name';
  const result = await pool.query(query);
  return result.rows;
}

async function getInventoryItem(productId) {
  const query = 'SELECT * FROM inventory WHERE product_id = $1';
  const result = await pool.query(query, [productId]);
  return result.rows[0];
}

// Analytics Operations
async function getAnalytics() {
  const ordersQuery = `
    SELECT
      COUNT(*) as total_orders,
      SUM(total) as total_revenue,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'payment_failed' THEN 1 END) as failed_orders
    FROM orders
  `;

  const recentOrdersQuery = `
    SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total) as revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  const [ordersResult, recentResult] = await Promise.all([
    pool.query(ordersQuery),
    pool.query(recentOrdersQuery),
  ]);

  return {
    summary: ordersResult.rows[0],
    dailyOrders: recentResult.rows,
  };
}

module.exports = {
  pool,
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrdersForReplay,
  saveOrderEvent,
  getOrderEvents,
  getInventory,
  getInventoryItem,
  getAnalytics,
};
