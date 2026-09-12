const Joi = require('joi');
const logger = require('./logger');

const schema = Joi.object({
  MONGODB_URI: Joi.string().optional().default('mongodb://127.0.0.1:27017/greenroute'),
  JWT_SECRET: Joi.string().optional().default('default_jwt_secret_key_for_greenleaf_dev_mode_32chars'),
  JWT_REFRESH_SECRET: Joi.string().optional().default('default_jwt_refresh_secret_key_32chars'),
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
}).unknown();

const validateEnvironment = () => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'default_jwt_secret_key_for_greenleaf_dev_mode_32chars';
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'default_jwt_refresh_secret_key_32chars';
  }

  const { error } = schema.validate(process.env);
  if (error) {
    logger.warn(`Environment validation warning: ${error.message}`);
  } else {
    logger.info('✅ Environment validated successfully');
  }
};

module.exports = { validateEnvironment };
