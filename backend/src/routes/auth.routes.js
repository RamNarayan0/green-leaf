/**
 * Auth Routes
 * Handles authentication endpoints with rate limiting and validation
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validate');

// Public routes with rate limiting and validation
router.post('/register', authLimiter, validate('register'), authController.register);
router.post('/login', authLimiter, validate('login'), authController.login);
router.post('/refresh', authLimiter, authController.refreshToken);
router.post('/refresh-token', authLimiter, authController.refreshToken);

// Google OAuth routes
router.post('/google', authLimiter, authController.googleLogin);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);
router.post('/purchase-greenpass', authenticate, authController.purchaseGreenPass);

module.exports = router;
