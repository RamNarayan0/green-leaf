const { Worker } = require('bullmq');
const config = require('../config/env');
const logger = require('../utils/logger');

const isTestEnv = process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';

const redisConnection = {
  host: process.env.REDIS_HOST || config.redisHost || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || config.redisPort || 6379),
  password: process.env.REDIS_PASSWORD || config.redisPassword || undefined
};

if (isTestEnv) {
  return;
}

const worker = new Worker(
  'order-processing',
  async (job) => {
    const { orderId } = job.data;
    logger.info('[order.worker] Processing order:', { orderId });

    try {
      const Order = require('../models/Order');
      const User = require('../models/User');

      const order = await Order.findById(orderId);
      if (order && order.status.current === 'paid') {
        const partner = await User.findOne({ role: 'delivery', isActive: true });
        if (partner) {
          order.deliveryPartner = partner._id;
        }
        order.updateStatus('assigned');
        await order.save();
        
        // Optimization: Transition to preparing immediately after assignment for smoother demo flow
        // In a real production system, this would be triggered by the shopkeeper manual action
        order.updateStatus('preparing');
        await order.save();
        logger.info('[order.worker] Order moved to preparing status', { orderId });
      }
    } catch (err) {
      logger.error('[order.worker] DB processing failed', err);
    }

    return { processedAt: new Date().toISOString(), orderId };
  },
  {
    connection: redisConnection,
    autorun: true
  }
);

worker.on('completed', (job) => {
  logger.info('[order.worker] Order job completed', { jobId: job.id, orderId: job.data.orderId });
});

worker.on('failed', (job, error) => {
  logger.error('[order.worker] Order job failed', { jobId: job?.id, orderId: job?.data?.orderId, error: error.message });
});

worker.on('error', (error) => {
  logger.error('[order.worker] Worker error', { error: error.message });
});
