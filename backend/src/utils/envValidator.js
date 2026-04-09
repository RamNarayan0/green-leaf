const Joi = require('joi');
const logger = require('./logger');

const schema = Joi.object({
  MONGODB_URI: Joi.string().optional(),
  JWT_SECRET: Joi.string().min(10).required(),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
}).unknown();

const validateEnvironment = () => {
  const { error } = schema.validate(process.env);
  if (error) {
    logger.error(`Environment validation error: ${error.message}`);
    process.exit(1);
  }
  logger.info('✅ Environment validated with Joi');
};

module.exports = { validateEnvironment };

