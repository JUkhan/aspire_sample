module.exports = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost',
  queues: {
    orders: 'orders',
    notifications: 'notifications',
    orderStatus: 'order-status',
  },
  exchanges: {
    orderEvents: 'order-events',
  },
};
