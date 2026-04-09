/**
 * Order Controller
 * Handles order management with carbon tracking
 */

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const Shop = require('../models/Shop');
const Warehouse = require('../models/Warehouse');
const DeliveryZone = require('../models/DeliveryZone');
const carbonCalculator = require('../emissions/carbonCalculator');
const distanceCalculator = require('../routing/distanceCalculator');
const { orderQueue } = require('../queues/order.queue');
const config = require('../config/env');
const logger = require('../utils/logger');
const { normalizeToLatLng, formatForApi } = require('../utils/geo');
const socketService = require('../services/socket.service');
const { getSurgeMultiplier } = require('../utils/surgeCalculator');

// Predefined vehicle types for GreenRoute (two-wheelers only)
const VEHICLE_TYPES = [
  { type: 'bicycle', name: 'Bicycle', emission_factor: 0, average_speed: 15, operating_cost_per_km: 0.5 },
  { type: 'electric_bicycle', name: 'Electric Bicycle', emission_factor: 5, average_speed: 20, operating_cost_per_km: 1.0 },
  { type: 'electric_scooter', name: 'Electric Scooter', emission_factor: 8, average_speed: 30, operating_cost_per_km: 1.5 },
  { type: 'petrol_scooter', name: 'Petrol Scooter', emission_factor: 75, average_speed: 35, operating_cost_per_km: 2.5 }
];

class OrderController {
  // Create new order
  async createOrder(req, res, next) {
    try {
      const { items, shopId, deliveryAddress, selectedVehicle } = req.body;
      const userId = req.user.id;

      // Validate items
      if (!items || items.length === 0) {
        logger.warn('Order creation failed: empty items', {
          requestId: req.requestId || null,
          userId: userId || null,
          endpoint: 'POST /api/orders'
        });
        return res.status(400).json({
          success: false,
          message: 'Order must have at least one item'
        });
      }

      // Validate delivery address
      if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !(deliveryAddress.zipCode || deliveryAddress.pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required order fields: deliveryAddress.street/city/state/zipCode'
        });
      }

      // Validate delivery vehicle
      const vehicleInput = selectedVehicle || req.body.vehicle;
      if (!vehicleInput) {
        return res.status(400).json({
          success: false,
          message: 'Missing required order fields: vehicle'
        });
      }

      // Load shop to calculate route distance and ensure shop exists
      const shop = await Shop.findById(shopId);
      if (!shop) {
        logger.warn('Order creation failed: shop not found', {
          requestId: req.requestId || null,
          userId,
          shopId,
          endpoint: 'POST /api/orders'
        });

        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }

      // Validate product IDs in order items
      const productIds = items.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more products in the order are invalid or unavailable'
        });
      }

      // Ensure we have delivery location coordinates
      const deliveryLocationCoordinates = deliveryAddress?.location?.coordinates;

      if (!deliveryLocationCoordinates || !Array.isArray(deliveryLocationCoordinates) || deliveryLocationCoordinates.length !== 2) {
        return res.status(400).json({
          success: false,
          message: 'Delivery address location is required'
        });
      }

      // Check delivery zone availability
      const point = {
        type: 'Point',
        coordinates: [deliveryLocationCoordinates[0], deliveryLocationCoordinates[1]]
      };

      const activeZoneCount = await DeliveryZone.countDocuments({ isActive: true });
      if (activeZoneCount > 0) {
        const zone = await DeliveryZone.findOne({
          isActive: true,
          polygon: {
            $geoIntersects: {
              $geometry: point
            }
          }
        });

        if (!zone) {
          return res.status(400).json({
            success: false,
            message: 'Delivery not available in your area'
          });
        }
      }

      // Find nearest active warehouse to delivery location
      const nearestWarehouse = await Warehouse.findOne({
        isActive: true,
        location: {
          $near: {
            $geometry: point,
            $maxDistance: 10000
          }
        }
      });

      // Calculate order total - use demo product data directly
      let subtotal = 0;
      const orderItems = items.map(item => {
        const itemSubtotal = (item.price || 10) * (item.quantity || 1);
        subtotal += itemSubtotal;
        return {
          product: item.productId || 'demo',
          shop: shopId,
          name: item.name || 'Demo Product',
          image: item.image,
          price: item.price || 10,
          quantity: item.quantity || 1,
          subtotal: itemSubtotal
        };
      });

      // Calculate delivery distance
      const user = await User.findById(userId);
      const deliveryLocation = deliveryAddress?.location || user?.addresses?.[0]?.location;

      let distance = 0;
      if (deliveryLocation && shop.location && Array.isArray(shop.location.coordinates) && shop.location.coordinates.length === 2 && Array.isArray(deliveryLocation.coordinates) && deliveryLocation.coordinates.length === 2) {
        try {
          distance = distanceCalculator.calculateDistance(
            shop.location.coordinates[1],
            shop.location.coordinates[0],
            deliveryLocation.coordinates[1],
            deliveryLocation.coordinates[0]
          );
        } catch (e) {
          distance = Math.random() * 5 + 1;
        }
      } else {
        // Default distance for demo
        distance = Math.random() * 5 + 1; // 1-6 km
      }

      // Ensure we have a delivery address object for order schema
      const safeDeliveryAddress = {
        street: deliveryAddress?.street || user?.addresses?.[0]?.street || 'Unknown Street',
        city: deliveryAddress?.city || user?.addresses?.[0]?.city || 'Unknown City',
        state: deliveryAddress?.state || user?.addresses?.[0]?.state || 'Unknown',
        zipCode: deliveryAddress?.zipCode || deliveryAddress?.pincode || user?.addresses?.[0]?.zipCode || '000000',
        country: deliveryAddress?.country || user?.addresses?.[0]?.country || 'India',
        location: deliveryLocation || {
          type: 'Point',
          coordinates: [shop.location?.coordinates?.[0] || 0, shop.location?.coordinates?.[1] || 0]
        }
      };

      // Select best vehicle (lowest emission for GreenRoute)
      const ecoVehicles = VEHICLE_TYPES.filter(v => v.type !== 'petrol_scooter');
      const bestVehicle = carbonCalculator.selectBestVehicle(ecoVehicles, distance);

      // Use selected vehicle if provided and allowed
      let vehicle = bestVehicle;
      if (vehicleInput) {
        const selected = VEHICLE_TYPES.find(v => v.type === vehicleInput);
        if (!selected) {
          return res.status(400).json({
            success: false,
            message: 'Invalid vehicle type provided'
          });
        }

        if (selected.type === 'petrol_scooter') {
          return res.status(400).json({
            success: false,
            message: 'Petrol scooter is not allowed for carbon-efficient delivery'
          });
        }

        vehicle = selected;
      }

      // Calculate carbon emission
      const carbonData = carbonCalculator.calculateEmission(distance, vehicle);

      // Calculate delivery fee: ₹20 (Base) + (₹10 * Distance) + ₹5 (Handling)
      // Check for GreenPass (Mar 28 - Ultra Feature)
      const isGreenPass = req.user.isGreenPassMember && (!req.user.greenPassExpiry || req.user.greenPassExpiry > new Date());
      
      const baseFee = 25;
      const perKmRate = 12;
      const cleaningFee = 5; // Eco-cleaning/Handling
      
      // Apply Surge Pricing (Rain, High Demand)
      const surgeMultiplier = await getSurgeMultiplier();
      let deliveryFee = Math.round((baseFee + (distance * perKmRate) + cleaningFee) * 100) / 100;
      
      if (isGreenPass) {
        deliveryFee = 0; // Free delivery for GreenPass members
      } else {
        deliveryFee = Math.round(deliveryFee * surgeMultiplier * 100) / 100;
      }
      
      const platformFee = Math.round(subtotal * 0.03 * 100) / 100; // 3% Platform Fee
      const gstAmount = Math.round((subtotal + deliveryFee) * 0.05 * 100) / 100; // 5% GST
      const total = Math.round((subtotal + deliveryFee + platformFee + gstAmount) * 100) / 100;

      // Create order - use shopId directly
      const order = await Order.create({
        customer: userId,
        shop: shopId,
        warehouse: nearestWarehouse?._id || null,
        items: orderItems,
        deliveryAddress: safeDeliveryAddress,
        vehicle: vehicle.type,
        subtotal,
        deliveryFee,
        surgeMultiplier: isGreenPass ? 1 : surgeMultiplier,
        isGreenPassUsed: isGreenPass,
        tipAmount: 0,
        taxAmount: gstAmount + platformFee,
        totalDiscount: 0,
        totalAmount: total,
        distanceKm: Math.round(distance * 100) / 100,
        emissionData: {
          vehicleType: vehicle.type,
          emissionFactor: vehicle.emission_factor,
          actualEmission: carbonData.emission,
          carbonSaved: carbonData.savings
        },
        status: {
          current: 'placed',
          history: [{ status: 'placed', timestamp: new Date() }]
        },
        orderedAt: new Date(),
        paymentMethod: 'cash',
        paymentStatus: 'pending'
      });

      // 3. Update Inventory (Zepto-style Real-time Sync)
      for (const item of orderItems) {
        if (item.product !== 'demo') {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stockQuantity: -item.quantity }
          });
        }
      }

      // 4. Notify Shopkeeper Instantly via Socket
      socketService.getIO().to(`shop:${shopId}`).emit('new-order', {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          items: order.items,
          totalAmount: order.totalAmount,
          status: 'placed',
          createdAt: order.createdAt
        }
      });

      logger.info(`Order created: ${order._id}, Carbon: ${carbonData.emission}g`, {
        requestId: req.requestId || null,
        userId,
        orderId: order._id.toString(),
        endpoint: 'POST /api/orders'
      });

      try {
        await orderQueue.add('process-order', {
          orderId: order._id.toString(),
          userId,
          shopId,
          createdAt: new Date().toISOString()
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 }
        });

        logger.info(`Order queue job published for order: ${order._id}`);
      } catch (queueError) {
        logger.error('Failed to enqueue order job', {
          requestId: req.requestId || null,
          orderId: order._id.toString(),
          error: queueError.message
        });
      }

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            items: order.items,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            totalAmount: order.totalAmount,
            distanceKm: order.distanceKm,
            emissionData: order.emissionData,
            status: order.status.current,
            estimatedDeliveryTime: Math.ceil(distance / vehicle.average_speed * 60)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's orders
  async getMyOrders(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      const query = { customer: req.user.id };
      if (status) {
        query['status.current'] = status;
      }

      const orders = await Order.find(query)
        .populate('shop', 'name phone address')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders: orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            items: order.items,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            totalAmount: order.totalAmount,
            status: order.status.current,
            distanceKm: order.distanceKm,
            emissionData: order.emissionData,
            createdAt: order.createdAt,
            deliveryAddress: order.deliveryAddress
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single order
  async getOrder(req, res, next) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        customer: req.user.id
      }).populate('shop', 'name phone email address')
      .populate({
        path: 'deliveryPartner',
        populate: { path: 'userId', select: 'name email avatar phone' }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel order
  async cancelOrder(req, res, next) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        customer: req.user.id
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const now = new Date();
      const orderTime = new Date(order.createdAt);
      const secondsSinceOrder = (now - orderTime) / 1000;

      if (order.status.current === 'placed' && secondsSinceOrder > 60) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel order after the 60-second grace period.'
        });
      }

      if (!['created', 'paid', 'placed'].includes(order.status.current)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel order in current status'
        });
      }

      order.status.current = 'cancelled';
      order.status.history.push({
        status: 'cancelled',
        timestamp: new Date()
      });
      order.cancelledAt = new Date();
      await order.save();

      logger.info(`Order cancelled: ${order._id}`);

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Calculate delivery estimate
  async calculateDelivery(req, res, next) {
    try {
      const { shopId, deliveryAddress } = req.body;

      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }

      const deliveryLocation = deliveryAddress?.location;
      
      const [sLat, sLng] = normalizeToLatLng(shop.location);
      const [cLat, cLng] = normalizeToLatLng(deliveryLocation);
      
      let distance = 0;
      if (deliveryLocation && shop.location) {
        try {
          distance = distanceCalculator.calculateDistance(sLat, sLng, cLat, cLng);
        } catch (e) {
          distance = Math.random() * 5 + 1;
        }
      } else {
        distance = Math.random() * 5 + 1;
      }

      const ecoVehicles = VEHICLE_TYPES.filter(v => v.type !== 'petrol_scooter');
      const vehicleOptions = ecoVehicles.map(v => {
        const carbonData = carbonCalculator.calculateEmission(distance, v);
        const baseFee = 25;
        const perKmRate = 12;
        const cleaningFee = 5;
        const deliveryFee = Math.round((baseFee + (distance * perKmRate) + cleaningFee) * 100) / 100;
        
        return {
          type: v.type,
          name: v.name,
          emission_factor: v.emission_factor,
          average_speed: v.average_speed,
          estimatedTime: Math.ceil(distance / v.average_speed * 60) + 10, // +10 mins prep
          cost: deliveryFee,
          carbonEmitted: carbonData.emission,
          carbonSaved: carbonData.savings
        };
      });

      vehicleOptions.sort((a, b) => a.carbonEmitted - b.carbonEmitted);

      const surgeMultiplier = await getSurgeMultiplier();
      const isGreenPass = req.user?.isGreenPassMember && (!req.user?.greenPassExpiry || req.user?.greenPassExpiry > new Date());
      
      res.json({
        success: true,
        data: {
          distance: Math.round(distance * 100) / 100,
          surgeMultiplier,
          isGreenPass,
          vehicles: vehicleOptions.map(v => ({
            ...v,
            cost: isGreenPass ? 0 : Math.round(v.cost * surgeMultiplier * 100) / 100
          })),
          recommended: vehicleOptions[0],
          shopLocation: { lat: sLat, lng: sLng },
          customerLocation: { lat: cLat, lng: cLng },
          routes: {
            shortest: {
              polyline: [
                { lat: sLat, lng: sLng }, 
                { lat: cLat, lng: cLng }
              ],
              distance: distance
            },
            eco: {
              polyline: [
                { lat: sLat, lng: sLng }, 
                { lat: sLat + 0.002, lng: sLng + 0.002 }, 
                { lat: cLat, lng: cLng }
              ],
              distance: distance * 1.1,
              co2Saving: 15
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get carbon stats for user
  async getCarbonStats(req, res, next) {
    try {
      const userId = req.user.id;

      const stats = await Order.aggregate([
        { $match: { customer: userId, 'status.current': { $in: ['delivered'] } } },
        {
          $group: {
            _id: null,
            totalCarbonEmitted: { $sum: '$emissionData.actualEmission' },
            totalCarbonSaved: { $sum: '$emissionData.carbonSaved' },
            totalOrders: { $sum: 1 },
            totalDistance: { $sum: '$distanceKm' }
          }
        }
      ]);

      const user = await User.findById(userId);
      
      const ecoScore = stats[0] 
        ? Math.floor(stats[0].totalCarbonSaved / 100) 
        : 0;

      res.json({
        success: true,
        data: {
          stats: stats[0] || {
            totalCarbonEmitted: 0,
            totalCarbonSaved: 0,
            totalOrders: 0,
            totalDistance: 0
          },
          ecoScore,
          carbonSaved: user?.totalCarbonSaved || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Track order (public)
  async trackOrder(req, res, next) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({ orderNumber: orderId })
        .select('orderNumber status status.history estimatedDeliveryTime')
        .populate('shop', 'name');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

   // Accept order (shopkeeper)
  async shopAcceptOrder(req, res, next) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        shop: req.user.shopId || req.user.id // Allow for both models depending on auth structure
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.status.current = 'confirmed';
      order.status.history.push({
        status: 'confirmed',
        timestamp: new Date(),
        trackedBy: req.user.id
      });
      order.confirmedAt = new Date();
      await order.save();

      // Notify Customer via Socket
      socketService.emitOrderStatus(order._id, 'confirmed', { message: 'Shop has confirmed your order!' });

      res.json({ success: true, message: 'Order confirmed by shop', data: { order } });
    } catch (error) {
      next(error);
    }
  }

  // Reject order (shopkeeper)
  async shopRejectOrder(req, res, next) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        shop: req.user.shopId || req.user.id
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.status.current = 'cancelled';
      order.status.history.push({
        status: 'cancelled',
        timestamp: new Date(),
        trackedBy: req.user.id,
        note: 'Order rejected by shop'
      });
      order.cancelledAt = new Date();
      await order.save();

      res.json({ success: true, message: 'Order rejected/cancelled' });
    } catch (error) {
      next(error);
    }
  }

  // Mark as preparing (shopkeeper)
  async markAsPreparing(req, res, next) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        shop: req.user.shopId || req.user.id
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.status.current = 'preparing';
      order.status.history.push({
        status: 'preparing',
        timestamp: new Date(),
        trackedBy: req.user.id
      });
      order.preparedAt = new Date();
      await order.save();

      // Notify Customer
      socketService.emitOrderStatus(order._id, 'preparing', { message: 'Your order is being prepared!' });

      res.json({ success: true, message: 'Order is being prepared', data: { order } });
    } catch (error) {
      next(error);
    }
  }

  // Get all orders (admin)
  async getAllOrders(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      
      const query = {};
      if (status) {
        query['status.current'] = status;
      }

      const orders = await Order.find(query)
        .populate('customer', 'name phone email')
        .populate('shop', 'name')
        .populate({
          path: 'deliveryPartner',
          populate: { path: 'userId', select: 'name email avatar phone' }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update order status (shopkeeper)
  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;

      const order = await Order.findOne({
        _id: req.params.id,
        shop: req.user.shopId
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      order.status.current = status;
      order.status.history.push({
        status,
        timestamp: new Date(),
        trackedBy: req.user.id
      });
      await order.save();

      logger.info(`Order status updated: ${order._id} to ${status}`);

      res.json({
        success: true,
        message: 'Order status updated',
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark order as ready (shopkeeper)
  async markAsReady(req, res, next) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        shop: req.user.shopId
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      order.status.current = 'searching_driver';
      order.status.history.push({
        status: 'searching_driver',
        timestamp: new Date(),
        note: 'Shop marked as ready, searching for a driver near the shop.'
      });
      await order.save();

      // Notify Customer
      socketService.emitOrderStatus(order._id, 'ready', { message: 'Order is ready for pickup!' });
      
      // Notify nearby delivery partners (Room: delivery-agents)
      socketService.getIO().to('delivery-agents').emit('new-order-available', {
        orderId: order._id,
        shopName: order.shop?.name || 'Local Shop',
        distance: order.distanceKm
      });

      res.json({
        success: true,
        message: 'Order marked as ready',
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark order as picked up (delivery partner)
  async markAsPickedUp(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      order.status.current = 'picked_up';
      order.status.history.push({
        status: 'picked_up',
        timestamp: new Date(),
        note: 'Order picked up by delivery partner'
      });
      order.pickedUpAt = new Date();
      order.deliveryPartner = req.user.id;
      await order.save();

      res.json({
        success: true,
        message: 'Order marked as picked up',
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark order as delivered (delivery partner)
  async markAsDelivered(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      order.status.current = 'delivered';
      order.status.history.push({
        status: 'delivered',
        timestamp: new Date(),
        note: 'Order delivered successfully'
      });
      order.deliveredAt = new Date();
      await order.save();

      res.json({
        success: true,
        message: 'Order marked as delivered',
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

  // Submit a review for an order
  async submitReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment, images } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
      }

      if (order.status.current !== 'delivered') {
        return res.status(400).json({ success: false, message: 'Only delivered orders can be reviewed' });
      }

      if (order.review) {
        return res.status(400).json({ success: false, message: 'Review already submitted for this order' });
      }

      const review = new Review({
        order: id,
        customer: req.user.id,
        shop: order.shop,
        deliveryPartner: order.deliveryPartner,
        rating,
        comment,
        images: images || []
      });

      await review.save();

      order.review = review._id;
      await order.save();

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OrderController();
