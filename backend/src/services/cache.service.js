const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis;
let memoryCache = {};

const isTestEnv = process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';

if (!isTestEnv && process.env.REDIS_HOST) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  });

  redis.on('error', (err) => {
    logger.error('Redis error', err);
  });
  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });
} else {
  logger.warn('Redis unavailable, using in-memory cache.');
}

const getCache = async (key) => {
  try {
    if (!redis) {
      return memoryCache[key] || null;
    }
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn('Redis getCache failed', err.message);
    return memoryCache[key] || null;
  }
};

const setCache = async (key, value, ttl = 60) => {
  try {
    if (!redis) {
      memoryCache[key] = value;
      setTimeout(() => delete memoryCache[key], ttl * 1000);
      return;
    }
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.warn('Redis setCache failed', err.message);
    memoryCache[key] = value;
    setTimeout(() => delete memoryCache[key], ttl * 1000);
  }
};

const deleteCache = async (key) => {
  try {
    if (!redis) {
      delete memoryCache[key];
      return;
    }
    await redis.del(key);
  } catch (err) {
    logger.warn('Redis deleteCache failed', err.message);
    delete memoryCache[key];
  }
};

const deletePattern = async (pattern) => {
  if (!redis) {
    Object.keys(memoryCache).forEach((key) => {
      if (key.match(new RegExp(pattern.replace('*', '.*')))) {
        delete memoryCache[key];
      }
    });
    return;
  }
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
};

module.exports = {
  redis,
  getCache,
  setCache,
  deleteCache,
  deletePattern
};