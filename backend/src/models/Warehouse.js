const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  serviceRadiusKm: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
  inventory: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    stockQuantity: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

warehouseSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Warehouse', warehouseSchema);
