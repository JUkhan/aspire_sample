// Aspire provides connection string as ConnectionStrings__rabbitmq
const rabbitmqUrl = process.env.ConnectionStrings__rabbitmq ||
                    process.env.RABBITMQ_URL ||
                    'amqp://localhost';

module.exports = {
  url: rabbitmqUrl,
  queues: {
    orders: 'orders',
    notifications: 'notifications',
    orderStatus: 'order-status',
  },
  exchanges: {
    orderEvents: 'order-events',
  },
};
