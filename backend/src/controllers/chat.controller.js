/**
 * Chat Controller
 * Manages customer-delivery partner communication
 */

const Message = require('../models/Message');
const Order = require('../models/Order');
const socketService = require('../services/socket.service');

class ChatController {
  // Get messages for an order
  async getMessages(req, res, next) {
    try {
      const { orderId } = req.params;
      const messages = await Message.find({ order: orderId })
        .sort({ createdAt: 1 })
        .populate('sender', 'name avatar role');
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }

  // Send a message
  async sendMessage(req, res, next) {
    try {
      const { orderId } = req.params;
      const { content, recipientId } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const message = await Message.create({
        order: orderId,
        sender: req.user.id,
        recipient: recipientId,
        content
      });

      const populatedMessage = await message.populate('sender', 'name avatar role');

      // Emit via socket for real-time delivery
      socketService.emitToUser(recipientId, 'new_message', {
        orderId,
        message: populatedMessage
      });

      res.status(201).json({
        success: true,
        data: populatedMessage
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark messages as read
  async markAsRead(req, res, next) {
    try {
      const { orderId } = req.params;
      await Message.updateMany(
        { order: orderId, recipient: req.user.id, isRead: false },
        { isRead: true }
      );
      
      res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
