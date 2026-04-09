/**
 * Delivery Controller
 * Handles delivery partner and order assignment operations
 */

const DeliveryPartner = require("../models/DeliveryPartner");
const Order = require("../models/Order");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const carbonCalculator = require("../emissions/carbonCalculator");
const distanceCalculator = require("../routing/distanceCalculator");
const { getIO, emitOrderStatus } = require("../services/socket.service");
const { normalizeToLatLng, formatForApi } = require("../utils/geo");

class DeliveryController {
  // Track delivery by order ID (authenticated users only)
  async trackDelivery(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId)
        .populate("shop", "name location")
        .populate("deliveryPartner", "currentLocation status")
        .populate("customer", "name phone");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Verify user has access to this order (customer, delivery partner, or admin)
      const userId = req.user.id.toString();
      const isCustomer = order.customer?._id?.toString() === userId;
      const isDeliveryPartner =
        order.deliveryPartner?.userId?.toString() === userId;
      const isAdmin = req.user.role === "admin";

      if (!isCustomer && !isDeliveryPartner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You are not authorized to track this order.",
        });
      }

      res.json({
        success: true,
        tracking: {
          orderId: order._id,
          status: order.status,
          location: order.currentLocation,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          partnerLocation: order.assignedPartner?.currentLocation,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Set availability for delivery partner
  async setAvailability(req, res) {
    try {
      const { available, currentLocation } = req.body;

      let update = { status: available ? "available" : "offline" };

      if (currentLocation) {
        update.currentLocation = {
          type: "Point",
          coordinates: [currentLocation.lng, currentLocation.lat],
        };
      }

      const partner = await DeliveryPartner.findOneAndUpdate(
        { userId: req.user.id },
        update,
        { new: true },
      );

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found",
        });
      }

      res.json({
        success: true,
        partner,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get nearby orders for delivery partner
  async getNearbyOrders(req, res) {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user.id });
      if (!partner) {
        return res.json({
          success: false,
          setupRequired: true,
          message: "Please complete your delivery partner profile first.",
        });
      }

      // Use current location or fall back to base location
      const location =
        partner.currentLocation?.coordinates?.length === 2 &&
        partner.currentLocation.coordinates[0] !== 0
          ? partner.currentLocation.coordinates
          : partner.address?.baseLocation?.coordinates || [78.4867, 17.385];

      // Step 1: Find all shops within 10km of the driver
      const nearbyShops = await require("../models/Shop")
        .find({
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: location,
              },
              $maxDistance: 10000, // 10km radius
            },
          },
        })
        .select("_id");

      const shopIds = nearbyShops.map((s) => s._id);

      // Step 2: Find orders from those shops that are 'ready'
      const orders = await Order.find({
        "status.current": "searching_driver",
        shop: { $in: shopIds },
      }).populate("shop");

      // Step 3: Calculate distance for each order relative to driver
      const enrichedOrders = orders.map((o) => {
        const orderShop = o.shop;
        const [sLat, sLng] = normalizeToLatLng(orderShop.location);
        const [pLat, pLng] = normalizeToLatLng({
          type: "Point",
          coordinates: location,
        });

        const distanceToShop = distanceCalculator.calculateDistance(
          pLat,
          pLng,
          sLat,
          sLng,
        );

        return {
          ...o.toObject(),
          distanceToShop: distanceToShop.toFixed(2),
          potentialEarning:
            o.deliveryFee ||
            (o.totalAmount * 0.1 > 30 ? (o.totalAmount * 0.1).toFixed(0) : 30),
        };
      });

      res.json({
        success: true,
        orders: enrichedOrders,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get delivery partner profile
  async getProfile(req, res) {
    try {
      const partner = await DeliveryPartner.findOne({
        userId: req.user.id,
      }).populate("userId", "name email phone avatar");

      if (!partner) {
        return res.json({
          success: false,
          setupRequired: true,
          message: "Profile not found. Onboarding required.",
        });
      }

      res.json({ success: true, data: partner });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update delivery partner profile
  async updateProfile(req, res) {
    try {
      const {
        vehicleType,
        vehicleNumber,
        licenseNumber,
        address,
        phone,
        email,
        paymentDetails,
      } = req.body;

      const updateData = {
        vehicleType,
        vehicleNumber,
        licenseNumber,
        phone,
        email,
        address,
        paymentDetails,
      };

      // If address includes location, update baseLocation too
      if (address?.location) {
        updateData.address.baseLocation = address.location;
      }

      const partner = await DeliveryPartner.findOneAndUpdate(
        { userId: req.user.id },
        { $set: updateData },
        { new: true, upsert: true },
      ).populate("userId", "name email phone avatar");

      res.json({ success: true, data: partner });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Accept an order
  async acceptOrder(req, res) {
    try {
      const { orderId } = req.params;

      const partner = await DeliveryPartner.findOne({ userId: req.user.id });

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found",
        });
      }

      if (partner.status !== "available") {
        return res.status(400).json({
          success: false,
          message: "Partner is not available",
        });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        logger.warn("Delivery assignment failed: order not found", {
          requestId: req.requestId || null,
          userId: req.user?.id || null,
          orderId,
          endpoint: "POST /api/delivery/accept/:orderId",
        });

        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (order.assignedPartner) {
        logger.warn("Delivery assignment failed: already assigned", {
          requestId: req.requestId || null,
          userId: req.user?.id || null,
          orderId,
          endpoint: "POST /api/delivery/accept/:orderId",
        });

        return res.status(400).json({
          success: false,
          message: "Order already assigned",
        });
      }

      // Calculate distance and emissions
      const shop = await require("../models/Shop").findById(order.shop);
      const [sLat, sLng] = normalizeToLatLng(shop.location);
      const [cLat, cLng] = normalizeToLatLng(order.deliveryAddress.location);

      const distance = distanceCalculator.calculateDistance(
        sLat,
        sLng,
        cLat,
        cLng,
      );

      const vehicleType = require("../models/Vehicle")
        .getAllVehicleTypes()
        .find((v) => v.type === partner.vehicleType);
      const emissionData = carbonCalculator.calculateEmission(
        distance,
        vehicleType,
      );

      // Update order
      order.deliveryPartner = partner._id;
      order.status.current = "assigned";
      order.status.history.push({
        status: "assigned",
        timestamp: new Date(),
        note: "Order assigned to delivery partner",
      });
      order.distanceKm = distance;
      order.emissionData = {
        vehicleType: partner.vehicleType,
        actualEmission: emissionData.emission,
        carbonSaved: emissionData.savings,
      };
      order.estimatedDeliveryTime = Math.ceil(
        (distance / (vehicleType?.average_speed || 25)) * 60,
      );

      await order.save();

      // Notify Customer via Socket
      emitOrderStatus(order._id, "assigned", {
        message: "A delivery partner has been assigned to your order!",
        partner: {
          name: req.user.name || partner.userId?.name || "Eco Captain",
          phone: partner.phone || partner.userId?.phone || "XXXXXXXXXX",
          avatar: partner.userId?.avatar || null,
          rating: partner.stats?.rating || 4.8,
          vehicle: {
            type: partner.vehicleType,
            number: partner.vehicleNumber || "KA-01-XXXX",
          },
        },
      });

      // ALSO Notify Shopkeeper (Rapido-style)
      const socketService = require("../services/socket.service");
      socketService
        .getIO()
        .to(`shop_${order.shop}`)
        .emit("delivery-partner-assigned", {
          orderId: order._id,
          status: "assigned",
          driver: {
            name: req.user.name || partner.userId?.name || "Eco Captain",
            phone: partner.phone || partner.userId?.phone || "XXXXXXXXXX",
            vehicle: `${partner.vehicleType} (${partner.vehicleNumber || "KA-01-XXXX"})`,
            rating: partner.stats?.rating || 4.8,
          },
        });

      await order.populate([
        { path: "shop", select: "name location address phone" },
        { path: "customer", select: "name phone" },
      ]);

      // Update partner
      partner.currentOrder = orderId;
      partner.status = "busy";
      await partner.save();

      logger.info("Delivery assigned to partner", {
        requestId: req.requestId || null,
        userId: req.user?.id || null,
        orderId,
        partnerId: partner._id.toString(),
        endpoint: "POST /api/delivery/accept/:orderId",
      });

      res.json({
        success: true,
        order,
        emissionData,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Reject an order
  async rejectOrder(req, res) {
    try {
      res.json({
        success: true,
        message: "Order rejected",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get delivery partner's deliveries
  async getMyDeliveries(req, res) {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user.id });

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found",
        });
      }

      const orders = await Order.find({ deliveryPartner: partner._id })
        .populate("shop", "name location")
        .populate("customer", "name phone address")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update driver location
  async updateDriverLocation(req, res, next) {
    try {
      const { driverId, lat, lng, orderId } = req.body;
      if (!driverId || !lat || !lng) {
        return res
          .status(400)
          .json({ success: false, message: "driverId, lat, lng are required" });
      }

      let io;
      try {
        io = getIO();
      } catch (socketError) {
        // If socket.io is not initialized (e.g. tests or server off), still continue with request
        io = null;
      }

      if (io) {
        io.emit("driverLocation", {
          driverId,
          lat,
          lng,
          orderId,
          updatedAt: new Date().toISOString(),
        });
      }

      return res.json({ success: true, message: "Driver location updated" });
    } catch (error) {
      next(error);
    }
  }

  // Update delivery status
  async updateStatus(req, res) {
    try {
      const { orderId, status } = req.body;

      const validStatuses = [
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order.status.current = status;
      order.status.history.push({
        status,
        timestamp: new Date(),
        note: `Order status updated to ${status}`,
      });

      if (status === "delivered") {
        order.deliveredAt = new Date();

        // 1. Update Delivery Partner Stats
        const partner = await DeliveryPartner.findOne({ userId: req.user.id });
        if (partner) {
          partner.status = "available";
          partner.currentOrder = null;
          partner.stats.totalDeliveries += 1;
          partner.stats.totalDistance += order.distance || 0;
          partner.stats.totalEmission += order.emissionData?.emission || 0;
          await partner.save();
        }

        // 2. Award Leaf Points to Customer
        const customer = await User.findById(order.customer);
        if (customer) {
          const carbonSaved = order.emissionData?.carbonSaved || 0; // in grams
          const pointsEarned =
            Math.floor(carbonSaved / 10) +
            5 +
            (order.routeType === "eco" ? 5 : 0);

          customer.leafPoints = (customer.leafPoints || 0) + pointsEarned;
          customer.totalCarbonSaved =
            (customer.totalCarbonSaved || 0) + carbonSaved;

          // Boost ecoScore slightly
          if (customer.ecoScore < 100) {
            customer.ecoScore = Math.min(100, (customer.ecoScore || 0) + 1);
          }

          await customer.save();

          // Add reward note to order history
          order.status.history.push({
            status: "delivered",
            timestamp: new Date(),
            note: `Awarded ${pointsEarned} Leaf Points to customer for saving ${carbonSaved}g CO2!`,
          });
        }
      }

      await order.save();

      // Notify Customer & Shop via Socket
      const statusMessages = {
        picked_up: "Order has been picked up from the shop!",
        out_for_delivery: "Your order is out for delivery! Get ready.",
        delivered: "Order delivered successfully! Hope you enjoy it.",
      };

      emitOrderStatus(order._id, status, {
        message: statusMessages[status] || `Order status: ${status}`,
      });

      res.json({
        success: true,
        order,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get delivery partner's earnings
  async getEarnings(req, res) {
    try {
      const { period = "month" } = req.query;

      let startDate = new Date();
      if (period === "day") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const partner = await DeliveryPartner.findOne({ userId: req.user.id });

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found",
        });
      }

      const deliveries = await Order.find({
        deliveryPartner: partner._id,
        "status.current": "delivered",
        deliveredAt: { $gte: startDate },
      });

      const earnings = deliveries.reduce(
        (total, order) => total + (order.deliveryFee || 30),
        0,
      );
      const totalDistance = deliveries.reduce(
        (total, order) => total + (order.distanceKm || 0),
        0,
      );
      const totalEmission = deliveries.reduce(
        (total, order) => total + (order.emissionData?.actualEmission || 0),
        0,
      );

      res.json({
        success: true,
        earnings: {
          total: earnings,
          deliveryCount: deliveries.length,
          totalDistance: totalDistance.toFixed(2),
          totalEmission: totalEmission.toFixed(2),
          period,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get delivery partner's stats
  async getStats(req, res) {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user.id });

      if (!partner) {
        return res.json({
          success: false,
          setupRequired: true,
          stats: {
            totalDeliveries: 0,
            totalDistance: 0,
            totalEmission: 0,
            earnings: 0,
          },
        });
      }

      res.json({
        success: true,
        stats: partner.stats,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get all delivery partners (admin)
  async getAllPartners(req, res) {
    try {
      const partners = await DeliveryPartner.find()
        .populate("userId", "name email phone")
        .sort({ "stats.totalDeliveries": -1 });

      res.json({
        success: true,
        partners,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get delivery partner details (admin)
  async getPartnerDetails(req, res) {
    try {
      const partner = await DeliveryPartner.findById(req.params.id)
        .populate("userId", "name email phone")
        .populate("currentOrder");

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found",
        });
      }

      res.json({
        success: true,
        partner,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get fleet statistics (admin)
  async getFleetStats(req, res) {
    try {
      const partners = await DeliveryPartner.find();

      const stats = {
        totalPartners: partners.length,
        available: partners.filter((p) => p.status === "available").length,
        busy: partners.filter((p) => p.status === "busy").length,
        offline: partners.filter((p) => p.status === "offline").length,
        totalDeliveries: partners.reduce(
          (sum, p) => sum + (p.stats?.totalDeliveries || 0),
          0,
        ),
        totalDistance: partners.reduce(
          (sum, p) => sum + (p.stats?.totalDistance || 0),
          0,
        ),
        totalEmission: partners.reduce(
          (sum, p) => sum + (p.stats?.totalEmission || 0),
          0,
        ),
      };

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get nearby delivery partners
  async getNearbyPartners(req, res) {
    try {
      const { lat, lng, radius = 5 } = req.query;

      const partners = await DeliveryPartner.find({
        status: "available",
        currentLocation: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: parseFloat(radius) * 1000,
          },
        },
      }).populate("userId", "name phone");

      res.json({
        success: true,
        partners,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Assign delivery partner to an order
  async assignPartner(req, res) {
    try {
      const { orderId, partnerId } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const partner = await DeliveryPartner.findById(partnerId);
      if (!partner || partner.status !== "available") {
        return res
          .status(400)
          .json({ success: false, message: "Partner not available" });
      }

      // Calculate route and emissions
      const shop = await require("../models/Shop").findById(order.shop);
      const [sLat, sLng] = normalizeToLatLng(shop.location);
      const [cLat, cLng] = normalizeToLatLng(order.deliveryAddress.location);

      const distance = distanceCalculator.calculateDistance(
        sLat,
        sLng,
        cLat,
        cLng,
      );

      const vehicleType = require("../models/Vehicle")
        .getAllVehicleTypes()
        .find((v) => v.type === partner.vehicleType);
      const emissionData = carbonCalculator.calculateEmission(
        distance,
        vehicleType,
      );

      // Update order
      order.deliveryPartner = partnerId;
      order.status.current = "assigned";
      order.status.history.push({
        status: "assigned",
        timestamp: new Date(),
        note: "Order assigned to delivery partner",
      });
      order.distanceKm = distance;
      order.emissionData = {
        vehicleType: partner.vehicleType,
        actualEmission: emissionData.emission,
        carbonSaved: emissionData.savings,
      };
      order.estimatedDeliveryTime = Math.ceil(
        (distance / (vehicleType?.average_speed || 25)) * 60,
      );

      await order.save();

      // Notify Customer via Socket
      emitOrderStatus(order._id, "assigned", {
        message: "A delivery partner has been assigned by Admin!",
        partner: {
          name: partner.userId?.name || "Partner",
        },
      });

      await order.populate([
        { path: "shop", select: "name location address phone" },
        { path: "customer", select: "name phone" },
      ]);

      // Update partner status
      partner.currentOrder = orderId;
      partner.status = "busy";
      await partner.save();

      res.json({
        success: true,
        order,
        emissionData,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get delivery partner's current delivery
  async getCurrentDelivery(req, res) {
    try {
      const partner = await DeliveryPartner.findOne({
        userId: req.user.id,
      }).populate({
        path: "currentOrder",
        populate: [
          { path: "shop" },
          { path: "customer", select: "name phone" },
        ],
      });

      if (!partner || !partner.currentOrder) {
        return res.json({
          success: true,
          order: null,
          message: "No active delivery found",
        });
      }

      res.json({
        success: true,
        order: partner.currentOrder,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update partner location
  async updateLocation(req, res) {
    try {
      const { lat, lng } = req.body;

      await DeliveryPartner.findOneAndUpdate(
        { userId: req.user.id },
        {
          currentLocation: {
            type: "Point",
            coordinates: [lng, lat],
          },
          lastLocationUpdate: new Date(),
        },
      );

      res.json({
        success: true,
        message: "Location updated",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DeliveryController();
