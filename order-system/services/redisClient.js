const redis = require('redis');

// Aspire provides connection string as "host:port,password=xxx" format
// Node redis client expects "redis://:password@host:port" format
function getRedisUrl() {
  const aspireConnection = process.env.ConnectionStrings__cache;
  if (aspireConnection) {
    // Parse Aspire format: "localhost:6379,password=abc123"
    const parts = aspireConnection.split(',');
    const hostPort = parts[0];
    let password = null;

    for (const part of parts.slice(1)) {
      const [key, value] = part.split('=');
      if (key.trim().toLowerCase() === 'password') {
        password = value;
      }
    }

    if (password) {
      return `redis://:${password}@${hostPort}`;
    }
    return `redis://${hostPort}`;
  }
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

const redisUrl = getRedisUrl();

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    console.log(`Connecting to Redis: ${redisUrl}`);
    this.client = redis.createClient({
      url: redisUrl,
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
