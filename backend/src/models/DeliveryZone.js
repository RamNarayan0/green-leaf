const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  polygon: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
  isActive: { type: Boolean, default: true },
  minOrderValue: { type: Number, default: 0 },
  maxDeliveryDistanceKm: { type: Number, default: 10 }
}, {
  timestamps: true
});

deliveryZoneSchema.index({ polygon: '2dsphere' });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
