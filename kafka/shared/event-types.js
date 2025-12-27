/**
 * Kafka Event Types for E-commerce Order Processing
 */

const EventTypes = {
  // Order Events
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',

  // Payment Events
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',

  // Inventory Events
  INVENTORY_RESERVED: 'INVENTORY_RESERVED',
  INVENTORY_RELEASED: 'INVENTORY_RELEASED',
  INVENTORY_FAILED: 'INVENTORY_FAILED',
  INVENTORY_UPDATED: 'INVENTORY_UPDATED',

  // Shipping Events
  SHIPMENT_CREATED: 'SHIPMENT_CREATED',
  SHIPMENT_DISPATCHED: 'SHIPMENT_DISPATCHED',
  SHIPMENT_IN_TRANSIT: 'SHIPMENT_IN_TRANSIT',
  SHIPMENT_DELIVERED: 'SHIPMENT_DELIVERED',
  SHIPMENT_FAILED: 'SHIPMENT_FAILED',
};

const Topics = {
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  INVENTORY: 'inventory',
  SHIPPING: 'shipping',
  ORDERS_REPLAY: 'orders-replay', // For fraud detection testing
};

const OrderStatus = {
  PENDING: 'pending',
  PAYMENT_PROCESSING: 'payment_processing',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  INVENTORY_RESERVED: 'inventory_reserved',
  INVENTORY_FAILED: 'inventory_failed',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

/**
 * Create a standardized event message
 */
function createEvent(eventType, payload, metadata = {}) {
  return {
    eventId: generateEventId(),
    eventType,
    timestamp: new Date().toISOString(),
    payload,
    metadata: {
      version: '1.0',
      source: metadata.source || 'unknown',
      correlationId: metadata.correlationId || generateEventId(),
      ...metadata,
    },
  };
}

/**
 * Generate a unique event ID
 */
function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  EventTypes,
  Topics,
  OrderStatus,
  createEvent,
  generateEventId,
};
