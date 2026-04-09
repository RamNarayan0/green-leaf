/**
 * Payment Routes - Razorpay Integration
 * Handles payment-related endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment
} = require('../controllers/payment.controller');

// All payment routes require authentication
router.use(authenticate);

// Create Razorpay order
router.post('/create-order', createPaymentOrder);

// Verify payment and create order
router.post('/verify-payment', verifyPayment);

// Get payment details
router.get('/:orderId', getPaymentDetails);

// Refund payment (admin only - can be extended)
router.post('/refund', refundPayment);

module.exports = router;

