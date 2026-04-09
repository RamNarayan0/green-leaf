/**
 * Analytics Routes
 * Handles analytics and reporting endpoints
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

// Unified dashboard endpoint (works for all roles)
router.get('/dashboard', authenticate, analyticsController.getDashboard);

// Customer analytics
router.get('/my-impact', authenticate, authorize('customer'), analyticsController.getCustomerImpact);
router.get('/my-orders', authenticate, authorize('customer'), analyticsController.getCustomerOrdersAnalytics);

// Shopkeeper analytics
router.get('/shop-performance', authenticate, authorize('shopkeeper'), analyticsController.getShopPerformance);
router.get('/shop-orders', authenticate, authorize('shopkeeper'), analyticsController.getShopOrders);
router.get('/inventory', authenticate, authorize('shopkeeper'), analyticsController.getInventoryAnalytics);

// Delivery partner analytics
router.get('/my-performance', authenticate, authorize('delivery_partner'), analyticsController.getDeliveryPartnerPerformance);
router.get('/my-deliveries', authenticate, authorize('delivery_partner'), analyticsController.getMyOrders);

// Admin analytics (all protected by admin role)
router.get('/city-overview', authenticate, authorize('admin'), analyticsController.getCityOverview);
router.get('/emissions', authenticate, authorize('admin'), analyticsController.getEmissionsAnalytics);
router.get('/revenue', authenticate, authorize('admin'), analyticsController.getRevenueAnalytics);
router.get('/users', authenticate, authorize('admin'), analyticsController.getUserAnalytics);
router.get('/fleet', authenticate, authorize('admin'), analyticsController.getFleetAnalytics);
router.get('/orders', authenticate, authorize('admin'), analyticsController.getOrderAnalytics);

module.exports = router;
