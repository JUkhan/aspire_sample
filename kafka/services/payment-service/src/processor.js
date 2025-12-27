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
  ORDER_CREATED: 'ORDER_CREATED',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
};

const Topics = {
  PAYMENTS: 'payments',
};

// Simulated payment processing
async function processPayment(orderId, amount, customerEmail) {
  // Simulate payment gateway latency
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Simulate 90% success rate
  const isSuccessful = Math.random() > 0.1;

  if (isSuccessful) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Payment processed successfully',
    };
  } else {
    return {
      success: false,
      transactionId: null,
      message: 'Payment declined by processor',
      errorCode: 'PAYMENT_DECLINED',
    };
  }
}

// Create event helper
function createEvent(eventType, payload, correlationId) {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    timestamp: new Date().toISOString(),
    payload,
    metadata: {
      version: '1.0',
      source: 'payment-service',
      correlationId,
    },
  };
}

// Save payment to database
async function savePayment(orderId, amount, status, transactionId = null) {
  const query = `
    INSERT INTO payments (id, order_id, amount, status, transaction_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [uuidv4(), orderId, amount, status, transactionId];
  const result = await pool.query(query, values);
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
    VALUES ($1, $2, $3, 'payment-service')
  `;
  await pool.query(query, [orderId, eventType, JSON.stringify(payload)]);
}

// Check if payment already processed (idempotency)
async function isPaymentProcessed(orderId) {
  const query = 'SELECT * FROM payments WHERE order_id = $1';
  const result = await pool.query(query, [orderId]);
  return result.rows.length > 0;
}

// Main event handler
async function handleEvent(event, publishEvent) {
  const { eventType, payload, metadata } = event;

  // Only process ORDER_CREATED events
  if (eventType !== EventTypes.ORDER_CREATED) {
    console.log(`Payment Service: Ignoring event type: ${eventType}`);
    return;
  }

  // Skip replay events (fraud detection testing)
  if (payload.isReplay) {
    console.log(`Payment Service: Skipping replay event for order: ${payload.orderId}`);
    return;
  }

  const { orderId, total, customerEmail } = payload;

  // Idempotency check
  if (await isPaymentProcessed(orderId)) {
    console.log(`Payment Service: Payment already processed for order: ${orderId}`);
    return;
  }

  console.log(`Payment Service: Processing payment for order: ${orderId}, amount: $${total}`);

  // Publish PAYMENT_PROCESSING event
  const processingEvent = createEvent(EventTypes.PAYMENT_PROCESSING, {
    orderId,
    amount: total,
  }, metadata.correlationId);

  await publishEvent(Topics.PAYMENTS, processingEvent, orderId);
  await updateOrderStatus(orderId, 'payment_processing');
  await saveOrderEvent(orderId, EventTypes.PAYMENT_PROCESSING, processingEvent.payload);

  // Process payment
  const result = await processPayment(orderId, total, customerEmail);

  if (result.success) {
    // Save successful payment
    await savePayment(orderId, total, 'completed', result.transactionId);
    await updateOrderStatus(orderId, 'payment_completed');

    // Publish PAYMENT_PROCESSED event
    const successEvent = createEvent(EventTypes.PAYMENT_PROCESSED, {
      orderId,
      amount: total,
      transactionId: result.transactionId,
      message: result.message,
    }, metadata.correlationId);

    await publishEvent(Topics.PAYMENTS, successEvent, orderId);
    await saveOrderEvent(orderId, EventTypes.PAYMENT_PROCESSED, successEvent.payload);

    console.log(`Payment Service: Payment successful for order: ${orderId}`);
  } else {
    // Save failed payment
    await savePayment(orderId, total, 'failed', null);
    await updateOrderStatus(orderId, 'payment_failed');

    // Publish PAYMENT_FAILED event
    const failedEvent = createEvent(EventTypes.PAYMENT_FAILED, {
      orderId,
      amount: total,
      errorCode: result.errorCode,
      message: result.message,
    }, metadata.correlationId);

    await publishEvent(Topics.PAYMENTS, failedEvent, orderId);
    await saveOrderEvent(orderId, EventTypes.PAYMENT_FAILED, failedEvent.payload);

    console.log(`Payment Service: Payment failed for order: ${orderId}`);
  }
}

module.exports = {
  handleEvent,
  pool,
};
