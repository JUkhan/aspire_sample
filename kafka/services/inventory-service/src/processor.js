const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const EventTypes = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  INVENTORY_RESERVED: 'INVENTORY_RESERVED',
  INVENTORY_RELEASED: 'INVENTORY_RELEASED',
  INVENTORY_FAILED: 'INVENTORY_FAILED',
};

const Topics = {
  INVENTORY: 'inventory',
};

// Create event helper
function createEvent(eventType, payload, correlationId) {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    timestamp: new Date().toISOString(),
    payload,
    metadata: {
      version: '1.0',
      source: 'inventory-service',
      correlationId,
    },
  };
}

// Check inventory availability
async function checkInventory(items) {
  const unavailable = [];

  for (const item of items) {
    const query = 'SELECT * FROM inventory WHERE product_id = $1';
    const result = await pool.query(query, [item.productId]);

    if (result.rows.length === 0) {
      unavailable.push({
        productId: item.productId,
        reason: 'Product not found',
      });
    } else {
      const product = result.rows[0];
      const available = product.quantity - product.reserved;

      if (available < item.quantity) {
        unavailable.push({
          productId: item.productId,
          requested: item.quantity,
          available,
          reason: 'Insufficient stock',
        });
      }
    }
  }

  return unavailable;
}

// Reserve inventory for an order
async function reserveInventory(orderId, items) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of items) {
      const updateQuery = `
        UPDATE inventory
        SET reserved = reserved + $1, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2 AND (quantity - reserved) >= $1
        RETURNING *
      `;
      const result = await client.query(updateQuery, [item.quantity, item.productId]);

      if (result.rows.length === 0) {
        throw new Error(`Failed to reserve ${item.productId}`);
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Release reserved inventory
async function releaseInventory(items) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of items) {
      const updateQuery = `
        UPDATE inventory
        SET reserved = GREATEST(0, reserved - $1), updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2
      `;
      await client.query(updateQuery, [item.quantity, item.productId]);
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Update order status
async function updateOrderStatus(orderId, status) {
  const query = `
    UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;
  await pool.query(query, [status, orderId]);
}

// Save order event
async function saveOrderEvent(orderId, eventType, payload) {
  const query = `
    INSERT INTO order_events (order_id, event_type, payload, service_name)
    VALUES ($1, $2, $3, 'inventory-service')
  `;
  await pool.query(query, [orderId, eventType, JSON.stringify(payload)]);
}

// Check if inventory already reserved (idempotency)
async function isInventoryReserved(orderId) {
  const query = `
    SELECT * FROM order_events
    WHERE order_id = $1 AND event_type = $2 AND service_name = 'inventory-service'
  `;
  const result = await pool.query(query, [orderId, EventTypes.INVENTORY_RESERVED]);
  return result.rows.length > 0;
}

// Main event handler
async function handleEvent(event, publishEvent) {
  const { eventType, payload, metadata } = event;

  // Handle ORDER_CREATED
  if (eventType === EventTypes.ORDER_CREATED) {
    // Skip replay events
    if (payload.isReplay) {
      console.log(`Inventory Service: Skipping replay event for order: ${payload.orderId}`);
      return;
    }

    const { orderId, items } = payload;

    // Idempotency check
    if (await isInventoryReserved(orderId)) {
      console.log(`Inventory Service: Inventory already reserved for order: ${orderId}`);
      return;
    }

    console.log(`Inventory Service: Checking inventory for order: ${orderId}`);

    // Check availability
    const unavailable = await checkInventory(items);

    if (unavailable.length > 0) {
      // Inventory check failed
      await updateOrderStatus(orderId, 'inventory_failed');

      const failedEvent = createEvent(EventTypes.INVENTORY_FAILED, {
        orderId,
        unavailableItems: unavailable,
        message: 'Some items are not available',
      }, metadata.correlationId);

      await publishEvent(Topics.INVENTORY, failedEvent, orderId);
      await saveOrderEvent(orderId, EventTypes.INVENTORY_FAILED, failedEvent.payload);

      console.log(`Inventory Service: Inventory check failed for order: ${orderId}`);
      return;
    }

    try {
      // Reserve inventory
      await reserveInventory(orderId, items);
      await updateOrderStatus(orderId, 'inventory_reserved');

      const successEvent = createEvent(EventTypes.INVENTORY_RESERVED, {
        orderId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        message: 'Inventory reserved successfully',
      }, metadata.correlationId);

      await publishEvent(Topics.INVENTORY, successEvent, orderId);
      await saveOrderEvent(orderId, EventTypes.INVENTORY_RESERVED, successEvent.payload);

      console.log(`Inventory Service: Inventory reserved for order: ${orderId}`);
    } catch (error) {
      console.error(`Inventory Service: Error reserving inventory:`, error);

      await updateOrderStatus(orderId, 'inventory_failed');

      const failedEvent = createEvent(EventTypes.INVENTORY_FAILED, {
        orderId,
        message: error.message,
      }, metadata.correlationId);

      await publishEvent(Topics.INVENTORY, failedEvent, orderId);
      await saveOrderEvent(orderId, EventTypes.INVENTORY_FAILED, failedEvent.payload);
    }
  }

  // Handle ORDER_CANCELLED - release inventory
  if (eventType === EventTypes.ORDER_CANCELLED) {
    const { orderId } = payload;

    console.log(`Inventory Service: Releasing inventory for cancelled order: ${orderId}`);

    // Get order items
    const orderQuery = 'SELECT items FROM orders WHERE id = $1';
    const orderResult = await pool.query(orderQuery, [orderId]);

    if (orderResult.rows.length > 0) {
      const items = orderResult.rows[0].items;
      await releaseInventory(items);

      const releaseEvent = createEvent(EventTypes.INVENTORY_RELEASED, {
        orderId,
        items,
        message: 'Inventory released due to order cancellation',
      }, metadata.correlationId);

      await publishEvent(Topics.INVENTORY, releaseEvent, orderId);
      await saveOrderEvent(orderId, EventTypes.INVENTORY_RELEASED, releaseEvent.payload);

      console.log(`Inventory Service: Inventory released for order: ${orderId}`);
    }
  }
}

module.exports = {
  handleEvent,
  pool,
};
