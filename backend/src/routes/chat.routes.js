/**
 * Chat Routes
 * Handles messaging between users
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All chat routes are protected
router.get('/:orderId/messages', authenticate, chatController.getMessages);
router.post('/:orderId/messages', authenticate, chatController.sendMessage);
router.put('/:orderId/read', authenticate, chatController.markAsRead);

module.exports = router;
