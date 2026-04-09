/**
 * Delivery Partner Model
 * Represents delivery partners in the system
 */

const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  vehicleType: {
    type: String,
    enum: ['bicycle', 'electric_bicycle', 'electric_scooter'],
    default: 'electric_bicycle'
  },
  vehicleNumber: String,
  licenseNumber: String,
  address: {
    street: String,
    landmark: String,
    city: String,
    state: String,
    zipCode: String,
    baseLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [78.4867, 17.3850] // Default to Hyderabad Lng, Lat
      }
    }
  },
  phone: String,
  email: String,
  paymentDetails: {
    upiId: String,
    bankName: String,
    accountNumber: String
  },
  identityVerified: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  earnings: {
    total: { type: Number, default: 0 },
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 }
  },
  stats: {
    totalDeliveries: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    totalEmission: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    totalRatings: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLocationUpdate: Date,
  availableFrom: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
deliveryPartnerSchema.index({ 'address.baseLocation': '2dsphere' });
deliveryPartnerSchema.index({ status: 1 });

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);

module.exports = DeliveryPartner;
