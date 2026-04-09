/**
 * User Model
 * Handles user data with role-based access
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: false,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'shopkeeper', 'delivery_partner', 'admin'],
    default: 'customer'
  },
  avatar: {
    type: String,
    default: null
  },
  addresses: [addressSchema],
  
  // Cart - stores items temporarily
  cart: {
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
      image: String,
      shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }
    }],
    totalItems: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 }
  },
  
  // Customer-specific fields
  ecoScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalCarbonSaved: {
    type: Number,
    default: 0 // in grams
  },
  leafPoints: {
    type: Number,
    default: 0
  },
  
  // GreenPass Subscription (Mar 28 - Ultra Feature)
  isGreenPassMember: {
    type: Boolean,
    default: false
  },
  greenPassExpiry: {
    type: Date,
    default: null
  },
  
  // Delivery partner-specific fields
  vehicle: {
    type: {
      type: String,
      enum: ['bicycle', 'electric_bicycle', 'electric_scooter', 'petrol_scooter']
    },
    model: String,
    licenseNumber: String
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  earnings: {
    type: Number,
    default: 0
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  
  // Shopkeeper-specific fields
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  
  // Auth tokens
  refreshToken: {
    type: String,
    default: null
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Referral System (Mar 28 - Ultra Feature)
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ currentLocation: '2dsphere' });
userSchema.index({ addresses: { embed: 'location' } });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);
