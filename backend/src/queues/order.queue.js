const { Queue } = require('bullmq');
const config = require('../config/env');

const isTestEnv = process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';

const redisConnection = {
  host: process.env.REDIS_HOST || config.redisHost || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || config.redisPort || 6379),
  password: process.env.REDIS_PASSWORD || config.redisPassword || undefined,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null // Stop aggressive reconnects when Redis is intentionally offline locally
};

let orderQueue;

if (isTestEnv) {
  // Stub queue in test mode to avoid Redis dependency
  orderQueue = {
    add: () => Promise.resolve({ id: 'test-job' }),
    close: () => Promise.resolve(true)
  };
} else {
  try {
    orderQueue = new Queue('order-processing', {
      connection: redisConnection
    });
    
    // Crucial: Catch async Redis connection drops so Node doesn't crash fatally
    orderQueue.on('error', (err) => {
      console.warn('BullMQ order queue redis connection failed (offline mode fallback).');
    });
  } catch (error) {
    console.error('Failed to initialize BullMQ order queue', error);
    orderQueue = {
      add: () => Promise.resolve({ id: 'noop-job' }),
      close: () => Promise.resolve(true)
    };
  }
}

module.exports = { orderQueue };
