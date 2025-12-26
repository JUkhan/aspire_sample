import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Main Redis client for general operations
export const redis = new Redis(redisConfig);

// Separate client for blocking stream reads
export const streamReader = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export const STREAM_KEY = process.env.STREAM_KEY || 'audit:logs';
export const CONSUMER_GROUP = process.env.CONSUMER_GROUP || 'audit-consumers';

// Initialize consumer group if it doesn't exist
export async function initializeStream() {
  try {
    await redis.xgroup('CREATE', STREAM_KEY, CONSUMER_GROUP, '0', 'MKSTREAM');
    console.log(`Consumer group "${CONSUMER_GROUP}" created`);
  } catch (err) {
    if (err.message.includes('BUSYGROUP')) {
      console.log(`Consumer group "${CONSUMER_GROUP}" already exists`);
    } else {
      console.error('Error creating consumer group:', err);
    }
  }
}

export default redis;
