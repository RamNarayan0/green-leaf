/**
 * Joi Validation Middleware
 * Request payload validation for production hardening
 */

const Joi = require('joi');

// Validation schemas
const schemas = {
  // Register validation - made phone optional
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    phone: Joi.string().optional(),
    role: Joi.string().valid('customer', 'shopkeeper', 'delivery_partner', 'admin').default('customer')
  }),

  // Login validation - accept arbitrary string to allow controlled auth failure instead of framework validation
  login: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
  }),

  // Create order validation
  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required(),
    shopId: Joi.string().required(),
    deliveryAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string().required(),
      location: Joi.object({
        type: Joi.string().valid('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2)
      })
    }),
    selectedVehicle: Joi.string().valid('bicycle', 'electric_bicycle', 'electric_scooter', 'petrol_scooter')
  }),

  // Analytics filters validation
  analyticsFilters: Joi.object({
    period: Joi.string().valid('day', 'week', 'month'),
    status: Joi.string()
  })
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of the schema to use
 * @returns {Function} Express middleware
 */
const validate = (schemaName) => {
  const schema = schemas[schemaName];
  
  if (!schema) {
    throw new Error(`Validation schema '${schemaName}' not found`);
  }

  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

module.exports = { validate, schemas };
