/**
 * Payment Controller - Razorpay Integration
 * Handles payment order creation and verification
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay - keys validated by env.js
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order for payment
 * POST /api/payments/create-order
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Convert amount to paise (Razorpay uses paise)
    const amountInPaise = Math.round(amount * 100);

    // Create order in Razorpay
    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `order_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
      notes: {
        userId: req.user?.id || 'guest',
        type: 'order_payment'
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (error) {
    logger.error('Error creating payment order:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
};

/**
 * Verify payment signature from Razorpay
 * POST /api/payments/verify-payment
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Payment verified successfully
    // Now create the order in database
    const Order = require('../models/Order');

    const orderNumber = `GR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const newOrder = new Order({
      orderNumber,
      user: req.user?.id,
      items: orderData?.items || [],
      shop: orderData?.shopId,
      totalAmount: orderData?.total || 0,
      deliveryFee: orderData?.deliveryFee || 29,
      platformFee: orderData?.platformFee || 2,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      deliveryAddress: orderData?.deliveryAddress,
      selectedVehicle: orderData?.selectedVehicle,
      status: 'confirmed',
      distanceKm: orderData?.distanceKm || 3
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified and order created',
      data: {
        orderId: newOrder._id,
        orderNumber: newOrder.orderNumber,
        paymentId: razorpay_payment_id
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

/**
 * Get payment details
 * GET /api/payments/:orderId
 */
const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await razorpay.payments.fetch(orderId);

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error fetching payment:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details'
    });
  }
};

/**
 * Refund payment
 * POST /api/payments/refund
 */
const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const refundOptions = {
      payment_id: paymentId
    };

    // Partial refund if amount specified
    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }

    if (reason) {
      refundOptions.notes = { reason };
    }

    const refund = await razorpay.refunds.create(refundOptions);

    // Update order status
    const Order = require('../models/Order');
    await Order.findOneAndUpdate(
      { paymentId },
      { 
        paymentStatus: 'refunded',
        refundId: refund.id,
        refundAmount: refund.amount / 100,
        refundStatus: 'processed'
      }
    );

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: refund
    });
  } catch (error) {
    logger.error('Error processing refund:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
};

const logger = require('../utils/logger');

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment
};

