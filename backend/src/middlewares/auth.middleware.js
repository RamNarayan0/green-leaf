/**
 * Authentication Middleware
 * 
 * Handles JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Verify JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }
};

/**
 * Require specific roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Role-specific middleware
 */
const requireAdmin = requireRole('admin');
const requireCustomer = requireRole('customer');
const requireDeliveryPartner = requireRole('delivery_partner');
const requireShopkeeper = requireRole('shopkeeper');
const requireShopOwner = requireRole('shopkeeper', 'admin');
const requireShopOwnerOrAdmin = requireRole('shopkeeper', 'admin');
const requireDeliveryPartnerOrAdmin = requireRole('delivery_partner', 'admin');

module.exports = {
  verifyToken,
  authenticate: verifyToken,
  authorize: requireRole,
  requireRole,
  requireAdmin,
  requireCustomer,
  requireDeliveryPartner,
  requireShopkeeper,
  requireShopOwner,
  requireShopOwnerOrAdmin,
  requireDeliveryPartnerOrAdmin
};
