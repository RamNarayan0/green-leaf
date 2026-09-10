/**
 * Chat Routes
 * Handles messaging between users
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// AI Assistant routes
router.post('/assistant', chatController.askAiAssistant);
router.post('/recipe-to-cart', chatController.recipeToCart);
router.post('/carbon-audit', chatController.carbonAudit);

// Order chat routes
router.get('/:orderId/messages', authenticate, chatController.getMessages);
router.post('/:orderId/messages', authenticate, chatController.sendMessage);
router.put('/:orderId/read', authenticate, chatController.markAsRead);

module.exports = router;
