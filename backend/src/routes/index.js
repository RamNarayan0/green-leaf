/**
 * API Routes
 * 
 * Main router configuration for all API endpoints
 * GreenRoute Commerce Backend
 */

const express = require('express');
const router = express.Router();


const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const shopRoutes = require('./shop.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const deliveryRoutes = require('./delivery.routes');
const analyticsRoutes = require('./analytics.routes');
const emissionRoutes = require('./emission.routes');
const paymentRoutes = require('./payment.routes');
const vehicleRoutes = require('./vehicle.routes');
const warehouseRoutes = require('./warehouse.routes');
const zoneRoutes = require('./zone.routes');
const uploadRoutes = require('./upload.routes');
const cartRoutes = require('./cart.routes');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/shops', shopRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/zones', zoneRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);
router.use('/cart', cartRoutes);
router.use('/emissions', emissionRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
