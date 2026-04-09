/**
 * Shop Model
 * Handles shop/store data for quick-commerce vendors
 */

const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  phone: String,
  email: String,
  images: [String],
  category: {
    type: String,
    default: 'general'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'busy', 'temporarily_closed'],
    default: 'open'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  minimumOrder: {
    type: Number,
    default: 0
  },
  deliveryRadius: {
    type: Number,
    default: 5
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  freeDeliveryThreshold: {
    type: Number,
    default: 0
  },
  isEcoFriendly: {
    type: Boolean,
    default: false
  },
  hasEcoPackaging: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

shopSchema.index({ location: '2dsphere' });
shopSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Shop', shopSchema);
