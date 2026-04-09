/**
 * Product Model
 * 
 * Represents products/items available in shops
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Category - store as ObjectId ref
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: { type: String },
  tags: [String],
  
  // Shop relationship - use Mixed to allow both ObjectId and string for demo
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: { type: Number },
  discountPercentage: { type: Number, default: 0, max: [100, 'Discount cannot exceed 100%'] },
  currency: { type: String, default: 'INR' },
  mrp: { type: Number },
  
  // Inventory
  stockQuantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  isAvailable: { type: Boolean, default: true },
  trackInventory: { type: Boolean, default: true },
  
  // Measurements
  unit: {
    type: String,
    enum: ['kg', 'g', 'liter', 'ml', 'piece', 'dozen', 'pack'],
    default: 'piece'
  },
  quantityPerUnit: { type: Number, default: 1 },
  
  // Images
  images: [{
    url: String,
    altText: String
  }],
  primaryImage: { type: String },
  
  // Product attributes
  attributes: {
    color: [String],
    size: [String],
    flavor: [String],
    brand: [String]
  },
  weightGrams: { type: Number },
  
  // Eco-rating
  ecoRating: { type: Number, min: [1, 'Minimum eco rating is 1'], max: [5, 'Maximum eco rating is 5'] },
  isOrganic: { type: Boolean, default: false },
  isLocal: { type: Boolean, default: false },
  ecoLabels: [String],
  
  // Rating and reviews
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  
  // Display settings
  sortOrder: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  // Additional
  gtin: { type: String }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ shop: 1 });
productSchema.index({ price: -1 });

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discountPercentage > 0) {
    return this.price * (1 - this.discountPercentage / 100);
  }
  return this.price;
});

// Check if stock is low
productSchema.methods.isLowStock = function() {
  return this.stockQuantity <= this.lowStockThreshold;
};

// Get availability status
productSchema.methods.getAvailability = function() {
  if (!this.isActive) return false;
  if (!this.isAvailable) return false;
  if (this.trackInventory && this.stockQuantity <= 0) return false;
  return true;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
