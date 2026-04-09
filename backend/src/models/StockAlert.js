/**
 * StockAlert Model
 * Tracks users waiting for a product to be back in stock
 */

const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index to quickly find users to notify when stock changes
stockAlertSchema.index({ product: 1, isNotified: 1 });

module.exports = mongoose.model('StockAlert', stockAlertSchema);
