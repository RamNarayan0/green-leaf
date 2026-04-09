/**
 * Environment Configuration
 * 
 * Centralized configuration management using environment variables
 * with validation and default fallbacks for GreenRoute Commerce
 */

require('dotenv').config();

const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  API_VERSION: Joi.string().default('v1'),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow(''),
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),
  MAX_DELIVERY_RADIUS_KM: Joi.number().default(10),
  DEFAULT_DELIVERY_FEE: Joi.number().default(30),
  FREE_DELIVERY_THRESHOLD: Joi.number().default(500),
  VEHICLE_TYPES: Joi.string().default('bicycle,electric_bicycle,electric_scooter'),
  DEFAULT_VEHICLE: Joi.string().default('electric_scooter'),
  CARBON_FACTOR_BICYCLE: Joi.number().default(0),
  CARBON_FACTOR_ELECTRIC_BICYCLE: Joi.number().default(5),
  CARBON_FACTOR_ELECTRIC_SCOOTER: Joi.number().default(8),
  TYPESENSE_HOST: Joi.string().default('localhost'),
  TYPESENSE_PORT: Joi.number().default(8108),
  TYPESENSE_PROTOCOL: Joi.string().default('http'),
  TYPESENSE_API_KEY: Joi.string().required(),
  LOG_LEVEL: Joi.string().default('info'),
  RAZORPAY_KEY_ID: Joi.string().required(),
  RAZORPAY_KEY_SECRET: Joi.string().required()
}).unknown();

const { error, value: config } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  console.error('Environment validation failed!');
  if (error.details) {
    error.details.forEach(d => console.error(` - ${d.message}`));
  } else {
    console.error(error.message);
  }
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== undefined) {
    process.exit(1);
  }
}

module.exports = config;

/**
 * Validates required environment variables in production mode.
 */
function validateConfig() {
  if (config.nodeEnv === 'production') {
    const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
    }
  }
  return true;
}

module.exports = { ...config, validateConfig };
