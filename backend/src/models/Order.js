/**
 * Order Model
 * 
 * Represents orders in the GreenRoute platform with full carbon tracking
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  name: String,
  image: String,
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: { type: Number, required: true },
  discountedPrice: { type: Number },
  subtotal: { type: Number, required: false }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: { type: String, unique: true },
  
  // Customer and shop relationships
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  
  // Items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  surgeMultiplier: { type: Number, default: 1 },
  isGreenPassUsed: { type: Boolean, default: false },
  tipAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Delivery vehicle (for carbon tracking)
  vehicle: {
    type: String,
    enum: ['bicycle', 'electric_bicycle', 'electric_scooter', 'petrol_scooter'],
    required: true
  },
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentTransactionId: String,
  
  // Delivery address
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      addressString: String
    }
  },
  
  // Route and distance information
  distanceKm: { type: Number, min: 0 },
  routePolyline: String,
  estimatedDeliveryTime: { type: Number }, // in minutes
  
  // Carbon emission data
  emissionData: {
    vehicleType: {
      type: String,
      enum: ['bicycle', 'electric_bicycle', 'electric_scooter', 'petrol_scooter']
    },
    emissionFactor: { type: Number }, // gCO2 per km
    actualEmission: { type: Number }, // gCO2
    baselineEmission: { type: Number }, // gCO2 (petrol scooter baseline)
    carbonSaved: { type: Number }, // gCO2
    emissionComparison: { message: String }
  },
  
  // Order status
  status: {
    current: {
      type: String,
      enum: ['placed', 'confirmed', 'preparing', 'ready', 'searching_driver', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'refund_requested'],
      default: 'placed'
    },
    history: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      trackedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  },
  
  // Timeline timestamps
  orderedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  preparedAt: Date,
  assignedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  
  // Delivery partner assignment
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner'
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  
  // Shop processing notes
  notes: String,
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
orderSchema.index({ customer: -1 });
orderSchema.index({ shop: -1 });
orderSchema.index({ 'status.current': -1 });
orderSchema.index({ deliveryPartner: -1 });
orderSchema.index({ orderNumber: -1 }, { unique: true });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = this._id.toString().slice(-4).toUpperCase();
    this.orderNumber = `GR-${timestamp}-${random}`;
  }
  next();
});

// Virtual for profit calculation
orderSchema.virtual('profit').get(function() {
  return this.totalAmount - this.subtotal - this.deliveryFee;
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, userId = null) {
  const validTransitions = {
    'placed': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['searching_driver', 'cancelled'],
    'searching_driver': ['assigned', 'cancelled'],
    'assigned': ['picked_up', 'cancelled'],
    'picked_up': ['out_for_delivery'],
    'out_for_delivery': ['delivered', 'cancelled']
  };
  
  if (!validTransitions[this.status.current]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status.current} to ${newStatus}`);
  }
  
  this.status.current = newStatus;
  this.status.history.push({
    status: newStatus,
    timestamp: new Date(),
    trackedBy: userId ? new mongoose.Types.ObjectId(userId) : null
  });
};

// Calculate carbon savings compared to baseline (petrol scooter)
const VEHICLE_EMISSION_FACTORS = {
  'bicycle': 0,
  'electric_bicycle': 5,
  'electric_scooter': 8,
  'petrol_scooter': 75
};

orderSchema.methods.calculateCarbonSavings = function() {
  if (this.emissionData && this.distanceKm > 0) {
    const baselineEmission = 75 * this.distanceKm; // petrol scooter baseline gCO2/km
    const actualEmission = (VEHICLE_EMISSION_FACTORS[this.emissionData.vehicleType] || 75) * this.distanceKm;
    
    this.emissionData.baselineEmission = baselineEmission;
    this.emissionData.carbonSaved = Math.round(baselineEmission - actualEmission);
  }
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
