const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const EventTypes = {
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  INVENTORY_RESERVED: 'INVENTORY_RESERVED',
  SHIPMENT_CREATED: 'SHIPMENT_CREATED',
  SHIPMENT_DISPATCHED: 'SHIPMENT_DISPATCHED',
  SHIPMENT_DELIVERED: 'SHIPMENT_DELIVERED',
};

const Topics = {
  SHIPPING: 'shipping',
};

const CARRIERS = ['FedEx', 'UPS', 'USPS', 'DHL'];

// Create event helper
function createEvent(eventType, payload, correlationId) {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    timestamp: new Date().toISOString(),
    payload,
    metadata: {
      version: '1.0',
      source: 'shipping-service',
      correlationId,
    },
  };
}

// Generate tracking number
function generateTrackingNumber(carrier) {
  const prefix = carrier.substring(0, 2).toUpperCase();
  const number = Math.random().toString().substring(2, 14);
  return `${prefix}${number}`;
}

// Track order readiness for shipping
const orderReadiness = new Map();

// Check if order is ready for shipping
function checkReadyForShipping(orderId) {
  const status = orderReadiness.get(orderId);
  if (!status) return false;
  return status.paymentProcessed && status.inventoryReserved;
}

// Update order readiness
function updateOrderReadiness(orderId, field) {
  if (!orderReadiness.has(orderId)) {
    orderReadiness.set(orderId, {
      paymentProcessed: false,
      inventoryReserved: false,
    });
  }
  const status = orderReadiness.get(orderId);
  status[field] = true;
  return status;
}

// Create shipment record
async function createShipment(orderId) {
  const carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
  const trackingNumber = generateTrackingNumber(carrier);

  const query = `
    INSERT INTO shipments (id, order_id, status, tracking_number, carrier)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [uuidv4(), orderId, 'created', trackingNumber, carrier];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Update shipment status
async function updateShipmentStatus(orderId, status) {
  const query = `
    UPDATE shipments
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    ${status === 'dispatched' ? ', shipped_at = CURRENT_TIMESTAMP' : ''}
    ${status === 'delivered' ? ', delivered_at = CURRENT_TIMESTAMP' : ''}
    WHERE order_id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [status, orderId]);
  return result.rows[0];
}

// Get shipment by order ID
async function getShipmentByOrderId(orderId) {
  const query = 'SELECT * FROM shipments WHERE order_id = $1';
  const result = await pool.query(query, [orderId]);
  return result.rows[0];
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
    VALUES ($1, $2, $3, 'shipping-service')
  `;
  await pool.query(query, [orderId, eventType, JSON.stringify(payload)]);
}

// Check if shipment already created (idempotency)
async function isShipmentCreated(orderId) {
  const query = 'SELECT * FROM shipments WHERE order_id = $1';
  const result = await pool.query(query, [orderId]);
  return result.rows.length > 0;
}

// Simulate shipping dispatch (would be triggered by warehouse system in real scenario)
async function simulateDispatch(orderId, publishEvent, correlationId) {
  // Simulate dispatch delay
  setTimeout(async () => {
    try {
      const shipment = await updateShipmentStatus(orderId, 'dispatched');
      await updateOrderStatus(orderId, 'shipped');

      const event = createEvent(EventTypes.SHIPMENT_DISPATCHED, {
        orderId,
        trackingNumber: shipment.tracking_number,
        carrier: shipment.carrier,
        shippedAt: shipment.shipped_at,
      }, correlationId);

      await publishEvent(Topics.SHIPPING, event, orderId);
      await saveOrderEvent(orderId, EventTypes.SHIPMENT_DISPATCHED, event.payload);

      console.log(`Shipping Service: Order ${orderId} dispatched`);

      // Simulate delivery after dispatch
      simulateDelivery(orderId, publishEvent, correlationId);
    } catch (error) {
      console.error(`Shipping Service: Error dispatching order ${orderId}:`, error);
    }
  }, 5000 + Math.random() * 5000); // 5-10 seconds delay
}

// Simulate delivery
async function simulateDelivery(orderId, publishEvent, correlationId) {
  setTimeout(async () => {
    try {
      const shipment = await updateShipmentStatus(orderId, 'delivered');
      await updateOrderStatus(orderId, 'completed');

      const event = createEvent(EventTypes.SHIPMENT_DELIVERED, {
        orderId,
        trackingNumber: shipment.tracking_number,
        carrier: shipment.carrier,
        deliveredAt: shipment.delivered_at,
      }, correlationId);

      await publishEvent(Topics.SHIPPING, event, orderId);
      await saveOrderEvent(orderId, EventTypes.SHIPMENT_DELIVERED, event.payload);

      // Cleanup readiness tracking
      orderReadiness.delete(orderId);

      console.log(`Shipping Service: Order ${orderId} delivered`);
    } catch (error) {
      console.error(`Shipping Service: Error delivering order ${orderId}:`, error);
    }
  }, 10000 + Math.random() * 10000); // 10-20 seconds delay
}

// Main event handler
async function handleEvent(event, publishEvent) {
  const { eventType, payload, metadata } = event;
  const orderId = payload.orderId;

  // Handle PAYMENT_PROCESSED
  if (eventType === EventTypes.PAYMENT_PROCESSED) {
    console.log(`Shipping Service: Payment processed for order: ${orderId}`);
    updateOrderReadiness(orderId, 'paymentProcessed');
  }

  // Handle INVENTORY_RESERVED
  if (eventType === EventTypes.INVENTORY_RESERVED) {
    console.log(`Shipping Service: Inventory reserved for order: ${orderId}`);
    updateOrderReadiness(orderId, 'inventoryReserved');
  }

  // Check if ready for shipping after either event
  if (eventType === EventTypes.PAYMENT_PROCESSED || eventType === EventTypes.INVENTORY_RESERVED) {
    if (checkReadyForShipping(orderId)) {
      // Idempotency check
      if (await isShipmentCreated(orderId)) {
        console.log(`Shipping Service: Shipment already created for order: ${orderId}`);
        return;
      }

      console.log(`Shipping Service: Creating shipment for order: ${orderId}`);

      // Create shipment
      const shipment = await createShipment(orderId);

      const shipmentEvent = createEvent(EventTypes.SHIPMENT_CREATED, {
        orderId,
        shipmentId: shipment.id,
        trackingNumber: shipment.tracking_number,
        carrier: shipment.carrier,
        status: shipment.status,
      }, metadata.correlationId);

      await publishEvent(Topics.SHIPPING, shipmentEvent, orderId);
      await saveOrderEvent(orderId, EventTypes.SHIPMENT_CREATED, shipmentEvent.payload);

      console.log(`Shipping Service: Shipment created for order: ${orderId}`);

      // Simulate dispatch and delivery
      simulateDispatch(orderId, publishEvent, metadata.correlationId);
    }
  }
}

module.exports = {
  handleEvent,
  pool,
};
