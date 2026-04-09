/**
 * Product Routes
 * Handles product-related endpoints
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/categories', productController.getCategories);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/shop/:shopId', productController.getProductsByShop);
router.get('/:id', productController.getProduct);
router.post('/:productId/notify', authenticate, productController.subscribeToStockAlert);

// Protected routes (shopkeeper/admin)
router.post('/', authenticate, authorize('shopkeeper', 'admin'), productController.createProduct);
router.put('/:id', authenticate, authorize('shopkeeper', 'admin'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('shopkeeper', 'admin'), productController.deleteProduct);
router.patch('/:id/stock', authenticate, authorize('shopkeeper', 'admin'), productController.updateStock);
router.get('/shop/:shopId/low-stock', authenticate, authorize('shopkeeper', 'admin'), productController.getLowStockProducts);

module.exports = router;
