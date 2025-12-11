const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => console.error('Redis error:', err));
    await this.client.connect();
    console.log('✓ Connected to Redis');
  }

  async setOrderStatus(orderId, statusData) {
    const key = `order:${orderId}:status`;
    await this.client.setEx(key, 86400, JSON.stringify(statusData)); // 24h TTL
  }

  async getOrderStatus(orderId) {
    const key = `order:${orderId}:status`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async close() {
    await this.client?.quit();
  }
}

module.exports = new RedisClient();
