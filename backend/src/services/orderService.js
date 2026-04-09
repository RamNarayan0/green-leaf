/**
 * Order Service
 * Business logic for order operations
 */

const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner'); // Assume exists
const routeOptimizer = require('./routeOptimizer');
const carbonCalculator = require('../emissions/carbonCalculator');

/**
 * Calculate delivery distance and carbon emissions
 */
async function calculateDeliveryEstimate(origin, destination, vehicleType = 'electric_scooter') {
  try {
    const distance = routeOptimizer.calculateDistance([origin.lng, origin.lat], [destination.lng, destination.lat]);
    
    const emission = carbonCalculator.calculateEmission(distance, vehicleType);
    
    const estimatedTime = Math.round((distance / 30) * 60); // 30km/h average
    
    return {
      distanceKm: distance,
      estimatedTimeMinutes: estimatedTime,
      carbonEmissionG: emission.carbonEmission,
      carbonSavedG: emission.carbonSaved,
      ecoScore: carbonCalculator.calculateEcoScore(emission.carbonSaved)
    };
  } catch (error) {
    throw new Error(`Delivery calculation failed: ${error.message}`);
  }
}

/**
 * Validate order items and calculate totals
 */
function validateItems(items) {
  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      throw new Error('Invalid item: productId and quantity required');
    }

    // Calculate subtotal
    const subtotalItem = item.price * item.quantity;
    subtotal += subtotalItem;

    validatedItems.push({
      ...item,
      subtotal: subtotalItem
    });
  }

  return {
    items: validatedItems,
    subtotal
  };
}

/**
 * Assign delivery partner to order
 */
async function assignDeliveryPartner(orderId) {
  try {
    const order = await Order.findById(orderId).populate('deliveryAddress');
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'confirmed') {
      throw new Error('Order not ready for assignment');
    }

    // Find nearest available partner
    const partner = await DeliveryPartner.findOne({
      status: 'available',
      isActive: true
    }).sort({ rating: -1 });

    if (!partner) {
      throw new Error('No delivery partners available');
    }

    order.deliveryPartner = partner._id;
    order.status.current = 'assigned';
    order.status.history.push({
      status: 'assigned',
      timestamp: new Date(),
      trackedBy: partner._id
    });

    await order.save();

    return order;
  } catch (error) {
    throw new Error(`Delivery assignment failed: ${error.message}`);
  }
}

module.exports = {
  calculateDeliveryEstimate,
  validateItems,
  assignDeliveryPartner
};

