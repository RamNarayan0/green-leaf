/**
 * Order Routes
 * Handles order-related endpoints
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const deliveryController = require('../controllers/delivery.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');
const { validate } = require('../middlewares/validate');

// Public routes (for tracking)
router.get('/track/:orderId', orderController.trackOrder);

// Route calculation (for delivery estimate before ordering)
router.post('/calculate-delivery', orderController.calculateDelivery);

// Customer routes (protected) - validation removed for testing
router.post('/', authenticate, orderController.createOrder);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/carbon-stats', authenticate, orderController.getCarbonStats);

// Delivery partner routes (placed before generic /:id to avoid collision)
router.get('/available-deliveries', authenticate, authorize('delivery_partner'), deliveryController.getNearbyOrders);

router.get('/:id', authenticate, orderController.getOrder);
router.patch('/:id/cancel', authenticate, orderController.cancelOrder);
router.post('/:id/review', authenticate, orderController.submitReview);

// Shopkeeper routes
router.patch('/:id/shop-accept', authenticate, authorize('shopkeeper'), orderController.shopAcceptOrder);
router.patch('/:id/shop-reject', authenticate, authorize('shopkeeper'), orderController.shopRejectOrder);
router.patch('/:id/preparing', authenticate, authorize('shopkeeper'), orderController.markAsPreparing);
router.patch('/:id/ready', authenticate, authorize('shopkeeper'), orderController.markAsReady);
router.patch('/:id/status', authenticate, authorize('shopkeeper'), orderController.updateOrderStatus);

// Delivery partner actions
router.patch('/:id/accept', authenticate, authorize('delivery_partner'), deliveryController.acceptOrder);
router.patch('/:id/pickup', authenticate, authorize('delivery_partner'), orderController.markAsPickedUp);
router.patch('/:id/deliver', authenticate, authorize('delivery_partner'), orderController.markAsDelivered);

// Admin routes
router.get('/', authenticate, authorize('admin'), orderController.getAllOrders);

module.exports = router;
