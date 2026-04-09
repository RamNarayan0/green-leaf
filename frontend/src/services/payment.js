/**
 * Payment Service - Razorpay Integration
 * Handles payment processing on the frontend
 */

import { api } from './api';

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
};

// Create payment order on backend
export const createPaymentOrder = async (amount) => {
  try {
    const response = await api.post('/payments/create-order', {
      amount,
      currency: 'INR'
    });
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

// Verify payment on backend
export const verifyPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/verify-payment', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Initialize Razorpay checkout
export const initializeRazorpay = (options) => {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay not loaded'));
      return;
    }

    const rzp = new window.Razorpay({
      key: process.env.VITE_RAZORPAY_KEY_ID || options.key,
      amount: options.amount,
      currency: options.currency || 'INR',
      name: options.name || 'GreenRoute',
      description: options.description || 'Order Payment',
      order_id: options.orderId,
      handler: (response) => {
        resolve({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        });
      },
      prefill: {
        name: options.userName || '',
        email: options.userEmail || '',
        contact: options.userPhone || ''
      },
      theme: {
        color: '#10b981' // Green color to match GreenRoute
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled'));
        }
      }
    });

    rzp.open();
  });
};

// Complete payment flow
export const processPayment = async (amount, userDetails, orderData) => {
  try {
    // Load Razorpay script
    await loadRazorpayScript();

    // Create order on backend
    const orderResponse = await createPaymentOrder(amount);

    if (!orderResponse.success) {
      throw new Error(orderResponse.message || 'Failed to create payment order');
    }

    // Initialize Razorpay
    const paymentResponse = await initializeRazorpay({
      key: process.env.VITE_RAZORPAY_KEY_ID,
      amount: orderResponse.data.amount,
      orderId: orderResponse.data.orderId,
      userName: userDetails.name,
      userEmail: userDetails.email,
      userPhone: userDetails.phone,
      name: 'GreenRoute',
      description: 'Order Payment'
    });

    // Verify payment on backend
    const verificationResponse = await verifyPayment({
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      orderData
    });

    return verificationResponse;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};

export default {
  loadRazorpayScript,
  createPaymentOrder,
  verifyPayment,
  initializeRazorpay,
  processPayment
};

