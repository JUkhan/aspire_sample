const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const db = require('../db');
const { publishEvent } = require('../kafka/producer');

// Event types and topics
const Topics = {
  ORDERS: 'orders',
  ORDERS_REPLAY: 'orders-replay',
};

const EventTypes = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
};

// Helper to create event
function createEvent(eventType, payload, correlationId = null) {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    timestamp: new Date().toISOString(),
    payload,
    metadata: {
      version: '1.0',
      source: 'api-gateway',
      correlationId: correlationId || uuidv4(),
    },
  };
}

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
  try {
    const { customerId, customerEmail, items } = req.body;

    // Validate request
    if (!customerId || !customerEmail || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'customerId, customerEmail, and items array are required',
      });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const order = {
      id: uuidv4(),
      customerId,
      customerEmail,
      items,
      total: parseFloat(total.toFixed(2)),
      status: 'pending',
    };

    // Save to database
    const savedOrder = await db.createOrder(order);

    // Create and publish ORDER_CREATED event
    const event = createEvent(EventTypes.ORDER_CREATED, {
      orderId: order.id,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      items: order.items,
      total: order.total,
      status: order.status,
    });

    await publishEvent(Topics.ORDERS, event, order.id);

    // Save event to database
    await db.saveOrderEvent({
      orderId: order.id,
      eventType: EventTypes.ORDER_CREATED,
      payload: event.payload,
      serviceName: 'api-gateway',
    });

    res.status(201).json({
      success: true,
      order: savedOrder,
      eventId: event.eventId,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/orders - Get all orders
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const orders = await db.getAllOrders(limit, offset);

    res.json({
      success: true,
      orders,
      pagination: {
        limit,
        offset,
        count: orders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/orders/:id/events - Get order event history
router.get('/:id/events', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Order not found',
      });
    }

    const events = await db.getOrderEvents(req.params.id);

    res.json({
      success: true,
      orderId: req.params.id,
      events,
    });
  } catch (error) {
    console.error('Error fetching order events:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /api/orders/:id/cancel - Cancel an order
router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Order not found',
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Order is already cancelled',
      });
    }

    // Update order status
    const updatedOrder = await db.updateOrderStatus(req.params.id, 'cancelled');

    // Create and publish ORDER_CANCELLED event
    const event = createEvent(EventTypes.ORDER_CANCELLED, {
      orderId: order.id,
      previousStatus: order.status,
      reason: req.body.reason || 'User requested cancellation',
    });

    await publishEvent(Topics.ORDERS, event, order.id);

    await db.saveOrderEvent({
      orderId: order.id,
      eventType: EventTypes.ORDER_CANCELLED,
      payload: event.payload,
      serviceName: 'api-gateway',
    });

    res.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /api/orders/replay - Replay orders for fraud detection testing
router.post('/replay', async (req, res) => {
  try {
    const days = parseInt(req.body.days) || 7;
    const targetTopic = req.body.topic || Topics.ORDERS_REPLAY;

    // Get orders from the last N days
    const orders = await db.getOrdersForReplay(days);

    if (orders.length === 0) {
      return res.json({
        success: true,
        message: 'No orders found for replay',
        replayed: 0,
      });
    }

    let replayedCount = 0;

    // Replay each order
    for (const order of orders) {
      const event = createEvent(EventTypes.ORDER_CREATED, {
        orderId: order.id,
        customerId: order.customer_id,
        customerEmail: order.customer_email,
        items: order.items,
        total: parseFloat(order.total),
        status: order.status,
        originalCreatedAt: order.created_at,
        isReplay: true,
      });

      await publishEvent(targetTopic, event, order.id);
      replayedCount++;
    }

    res.json({
      success: true,
      message: `Replayed ${replayedCount} orders to ${targetTopic}`,
      replayed: replayedCount,
      topic: targetTopic,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Error replaying orders:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
