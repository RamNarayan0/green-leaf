const Joi = require('joi');
const logger = require('./logger');

const schema = Joi.object({
  MONGODB_URI: Joi.string().uri().optional(),
  JWT_SECRET: Joi.string().min(16).optional(),
  JWT_REFRESH_SECRET: Joi.string().min(16).optional(),
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
}).unknown();

const validateEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, these env vars are MANDATORY — refuse to start without them
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
      const msg = `FATAL: Missing required production environment variables: ${missing.join(', ')}. ` +
        'Set them in the Render dashboard (or equivalent), not in code.';
      logger.error(msg);
      throw new Error(msg);
    }
    logger.info('✅ Environment validated with Joi (production mode)');
  } else {
    // Development-only defaults — never used in production
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'default_jwt_secret_key_for_greenleaf_dev_mode_32chars';
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      process.env.JWT_REFRESH_SECRET = 'default_jwt_refresh_secret_key_32chars';
    }
  }

  const { error } = schema.validate(process.env);
  if (error) {
    logger.warn(`Environment validation warning: ${error.message}`);
  } else {
    logger.info('✅ Environment validated successfully');
  }
};

module.exports = { validateEnvironment };
