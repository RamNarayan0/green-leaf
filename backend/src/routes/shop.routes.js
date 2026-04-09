/**
 * Shop Routes
 * Handles shop-related endpoints
 */

const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

// Public routes
router.get('/', shopController.getShops);
router.get('/nearby', shopController.getNearbyShops);
router.get('/featured', shopController.getFeaturedShops);
router.get('/search', shopController.searchShops);

// Shopkeeper-specific routes (must come before '/:id' to avoid route collisions)
router.get('/my-shop', authenticate, authorize('shopkeeper'), shopController.getMyShop);
router.get('/my-shop/orders', authenticate, authorize('shopkeeper'), shopController.getShopOrders);
router.get('/my-shop/stats', authenticate, authorize('shopkeeper'), shopController.getShopStats);

// Public entity-specific routes
router.get('/:id', shopController.getShop);
router.get('/:id/products', shopController.getShopProducts);
router.get('/:id/reviews', shopController.getShopReviews);

// Protected routes (shopkeeper/admin)
router.post('/', authenticate, authorize('shopkeeper', 'admin'), shopController.createShop);
router.put('/:id', authenticate, authorize('shopkeeper', 'admin'), shopController.updateShop);
router.delete('/:id', authenticate, authorize('shopkeeper', 'admin'), shopController.deleteShop);
router.patch('/:id/status', authenticate, authorize('shopkeeper', 'admin'), shopController.updateShopStatus);

// Shopkeeper management
router.get('/my-shop', authenticate, authorize('shopkeeper'), shopController.getMyShop);
router.get('/my-shop/orders', authenticate, authorize('shopkeeper'), shopController.getShopOrders);
router.get('/my-shop/stats', authenticate, authorize('shopkeeper'), shopController.getShopStats);

module.exports = router;           
