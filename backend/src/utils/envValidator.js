const Joi = require('joi');
const logger = require('./logger');

const schema = Joi.object({
  MONGODB_URI: Joi.string().optional(),
  JWT_SECRET: Joi.string().min(10).optional().default('default_jwt_secret_key_for_greenleaf_dev_mode_32chars'),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
}).unknown();

const validateEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
      logger.error(`Missing required production environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
  }

  const { error } = schema.validate(process.env);
  if (error) {
    logger.error(`Environment validation error: ${error.message}`);
    process.exit(1);
  }

  const { error } = schema.validate(process.env);
  if (error) {
    logger.error(`Environment validation error: ${error.message}`);
    process.exit(1);
  }
  logger.info('✅ Environment validated with Joi');
};

module.exports = { validateEnvironment };

