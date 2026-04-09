/**
 * Analytics Controller
 * Handles all analytics and reporting endpoints
 */

const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

class AnalyticsController {
  // Get customer environmental impact
  async getCustomerImpact(req, res) {
    try {
      const customerId = req.user.id;

      const orders = await Order.find({ customer: customerId, 'status.current': 'delivered' });

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      const totalEmission = orders.reduce((sum, order) => {
        return sum + (order.emissionData?.actualEmission || 0);
      }, 0);

      const baselineEmission = orders.reduce((sum, order) => {
        return sum + ((order.distanceKm || 0) * 75);
      }, 0);

      const emissionSaved = baselineEmission - totalEmission;

      const ecoScore = totalOrders > 0 
        ? Math.min(100, Math.round((emissionSaved / (totalOrders * 5)) * 100))
        : 0;

      res.json({
        success: true,
        data: {
          totalOrders,
          totalSpent,
          totalEmission: totalEmission.toFixed(2),
          emissionSaved: emissionSaved.toFixed(2),
          ecoScore,
          treesEquivalent: (emissionSaved / 21.77).toFixed(2)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get customer orders analytics
  async getCustomerOrdersAnalytics(req, res) {
    try {
      const customerId = req.user.id;
      
      const orders = await Order.find({ customer: customerId })
        .populate('shop', 'name')
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({
        success: true,
        data: { orders }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get shop performance
  async getShopPerformance(req, res) {
    try {
      const shop = await Shop.findOne({ owner: req.user.id });
      
      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found' });
      }

      const orders = await Order.find({ shop: shop._id });
      
      const totalOrders = orders.length;
      const deliveredOrders = orders.filter(o => o.status?.current === 'delivered');
      const pendingOrders = orders.filter(o => ['created', 'paid', 'confirmed', 'assigned'].includes(o.status?.current));
      
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalEmission = deliveredOrders.reduce((sum, o) => sum + (o.emissionData?.actualEmission || 0), 0);

      res.json({
        success: true,
        data: {
          totalOrders,
          deliveredOrders: deliveredOrders.length,
          pendingOrders: pendingOrders.length,
          totalRevenue,
          totalEmission: totalEmission.toFixed(2),
          rating: shop.rating || 0,
          totalRatings: shop.totalRatings || 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get inventory analytics
  async getInventoryAnalytics(req, res) {
    try {
      const shop = await Shop.findOne({ owner: req.user.id });
      
      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found' });
      }

      const products = await Product.find({ shop: shop._id });
      
      const lowStock = products.filter(p => (p.stockQuantity || 0) < 10).length;
      const outOfStock = products.filter(p => (p.stockQuantity || 0) === 0).length;
      const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stockQuantity || 0)), 0);

      res.json({
        success: true,
        data: {
          totalProducts: products.length,
          lowStock,
          outOfStock,
          totalValue: totalValue.toFixed(2),
          products
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get delivery partner performance
  async getDeliveryPartnerPerformance(req, res) {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user.id });
      
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Delivery partner not found' });
      }

      const orders = await Order.find({ 
        deliveryPartner: partner.userId,
        'status.current': 'delivered'
      });

      const totalDeliveries = orders.length;
      const earnings = orders.reduce((sum, order) => sum + (order.deliveryFee || 30), 0);
      const totalDistance = orders.reduce((sum, order) => sum + (order.distanceKm || 0), 0);
      const totalEmission = orders.reduce((sum, order) => sum + (order.emissionData?.actualEmission || 0), 0);

      res.json({
        success: true,
        data: {
          totalDeliveries,
          earnings,
          totalDistance: totalDistance.toFixed(2),
          totalEmission: totalEmission.toFixed(2),
          vehicleType: partner.vehicleType,
          rating: partner.stats?.rating || 0,
          status: partner.status
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get city overview (admin)
  async getCityOverview(req, res) {
    try {
      const { period = 'month' } = req.query;

      let startDate = new Date();
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const orders = await Order.find({
        createdAt: { $gte: startDate }
      });

      const deliveredOrders = orders.filter(o => o.status?.current === 'delivered');
      
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalEmission = deliveredOrders.reduce((sum, o) => sum + (o.emissionData?.actualEmission || 0), 0);
      const baselineEmission = deliveredOrders.reduce((sum, o) => sum + ((o.distanceKm || 0) * 75), 0);

      const activeUsers = await User.countDocuments({ isActive: true, role: 'customer' });
      const activePartners = await DeliveryPartner.countDocuments({ status: 'available' });
      const totalShops = await Shop.countDocuments({ isActive: true });

      res.json({
        success: true,
        data: {
          totalOrders: orders.length,
          deliveredOrders: deliveredOrders.length,
          totalRevenue,
          totalEmission: totalEmission.toFixed(2),
          emissionSaved: (baselineEmission - totalEmission).toFixed(2),
          activeUsers,
          activePartners,
          totalShops,
          period
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get emissions analytics (admin)
  async getEmissionsAnalytics(req, res) {
    try {
      const { period = 'month' } = req.query;

      let startDate = new Date();
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const orders = await Order.find({
        createdAt: { $gte: startDate },
        'status.current': 'delivered'
      });

      const emissionsByVehicle = {};
      orders.forEach(order => {
        const vehicle = order.emissionData?.vehicleType || 'Unknown';
        if (!emissionsByVehicle[vehicle]) {
          emissionsByVehicle[vehicle] = { emission: 0, distance: 0, orders: 0 };
        }
        emissionsByVehicle[vehicle].emission += order.emissionData?.actualEmission || 0;
        emissionsByVehicle[vehicle].distance += order.distanceKm || 0;
        emissionsByVehicle[vehicle].orders += 1;
      });

      const totalEmission = orders.reduce((sum, o) => sum + (o.emissionData?.actualEmission || 0), 0);
      const baselineEmission = orders.reduce((sum, o) => sum + ((o.distanceKm || 0) * 75), 0);

      res.json({
        success: true,
        data: {
          totalEmission: totalEmission.toFixed(2),
          baselineEmission: baselineEmission.toFixed(2),
          emissionSaved: (baselineEmission - totalEmission).toFixed(2),
          byVehicle: emissionsByVehicle,
          period
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get revenue analytics (admin)
  async getRevenueAnalytics(req, res) {
    try {
      const { period = 'month' } = req.query;

      let startDate = new Date();
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const orders = await Order.find({
        createdAt: { $gte: startDate },
        'status.current': 'delivered'
      });

      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const deliveryFees = orders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

      res.json({
        success: true,
        data: {
          totalRevenue,
          deliveryFees,
          orderCount: orders.length,
          averageOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
          period
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get user analytics (admin)
  async getUserAnalytics(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const customers = await User.countDocuments({ role: 'customer' });
      const shopkeepers = await User.countDocuments({ role: 'shopkeeper' });
      const deliveryPartners = await User.countDocuments({ role: 'delivery_partner' });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          customers,
          shopkeepers,
          deliveryPartners
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get fleet analytics (admin)
  async getFleetAnalytics(req, res) {
    try {
      const partners = await DeliveryPartner.find();
      
      const vehicleDistribution = {};
      partners.forEach(p => {
        const vehicle = p.vehicleType || 'Unknown';
        if (!vehicleDistribution[vehicle]) {
          vehicleDistribution[vehicle] = 0;
        }
        vehicleDistribution[vehicle] += 1;
      });

      const statusDistribution = {
        available: partners.filter(p => p.status === 'available').length,
        busy: partners.filter(p => p.status === 'busy').length,
        offline: partners.filter(p => p.status === 'offline').length
      };

      res.json({
        success: true,
        data: {
          totalPartners: partners.length,
          vehicleDistribution,
          statusDistribution,
          totalDeliveries: partners.reduce((sum, p) => sum + (p.stats?.totalDeliveries || 0), 0),
          totalDistance: partners.reduce((sum, p) => sum + (p.stats?.totalDistance || 0), 0)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get order analytics (admin)
  async getOrderAnalytics(req, res) {
    try {
      const { period = 'month' } = req.query;

      let startDate = new Date();
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const orders = await Order.find({ createdAt: { $gte: startDate } });

      const statusDistribution = {};
      orders.forEach(order => {
        const status = order.status?.current || 'unknown';
        if (!statusDistribution[status]) {
          statusDistribution[status] = 0;
        }
        statusDistribution[status] += 1;
      });

      res.json({
        success: true,
        data: {
          total: orders.length,
          statusDistribution,
          period
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get dashboard stats (admin)
  async getDashboardStats(req, res) {
    try {
      const totalOrders = await Order.countDocuments();
      const deliveredOrders = await Order.countDocuments({ 'status.current': 'delivered' });
      const pendingOrders = await Order.countDocuments({ 'status.current': { $in: ['created', 'paid', 'confirmed'] } });
      
      const delivered = await Order.find({ 'status.current': 'delivered' });
      const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalEmission = delivered.reduce((sum, o) => sum + (o.emissionData?.actualEmission || 0), 0);

      const totalUsers = await User.countDocuments();
      const totalShops = await Shop.countDocuments({ isActive: true });
      const totalPartners = await DeliveryPartner.countDocuments();

      res.json({
        success: true,
        data: {
          orders: {
            total: totalOrders,
            delivered: deliveredOrders,
            pending: pendingOrders
          },
          revenue: {
            total: totalRevenue
          },
          emissions: {
            total: totalEmission.toFixed(2)
          },
          users: totalUsers,
          shops: totalShops,
          deliveryPartners: totalPartners
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get unified dashboard based on user role
  async getDashboard(req, res) {
    try {
      const user = req.user;
      const role = user.role;

      let data = {
        user: {
          name: user.name,
          email: user.email,
          role: role,
          ecoScore: user.ecoScore || 0,
          totalCarbonSaved: user.totalCarbonSaved || 0
        },
        stats: {}
      };

      if (role === 'customer') {
        const orders = await Order.find({ customer: user._id, 'status.current': 'delivered' });
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        const totalEmission = orders.reduce((sum, order) => {
          return sum + (order.emissionData?.actualEmission || 0);
        }, 0);

        const baselineEmission = orders.reduce((sum, order) => {
          return sum + ((order.distanceKm || 0) * 75);
        }, 0);

        const emissionSaved = baselineEmission - totalEmission;

        data.stats = {
          totalOrders,
          totalSpent,
          totalEmission: totalEmission.toFixed(2),
          emissionSaved: emissionSaved.toFixed(2),
          ecoScore: user.ecoScore || 0
        };

      } else if (role === 'shopkeeper') {
        const shop = await Shop.findOne({ owner: user._id });
        if (shop) {
          const orders = await Order.find({ shop: shop._id });
          const totalOrders = orders.length;
          const deliveredOrders = orders.filter(o => o.status?.current === 'delivered');
          const pendingOrders = orders.filter(o => ['created', 'paid', 'confirmed'].includes(o.status?.current));
          
          const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          const totalEmission = deliveredOrders.reduce((sum, o) => sum + (o.emissionData?.actualEmission || 0), 0);

          data.stats = {
            shopName: shop.name,
            totalOrders,
            deliveredOrders: deliveredOrders.length,
            pendingOrders: pendingOrders.length,
            totalRevenue,
            totalEmission: totalEmission.toFixed(2)
          };
        }

      } else if (role === 'delivery_partner') {
        const orders = await Order.find({ 
          deliveryPartner: user._id,
          'status.current': 'delivered'
        });

        const totalDeliveries = orders.length;
        const earnings = orders.reduce((sum, order) => sum + (order.deliveryFee || 30), 0);
        const totalDistance = orders.reduce((sum, order) => sum + (order.distanceKm || 0), 0);
        const totalEmission = orders.reduce((sum, order) => sum + (order.emissionData?.actualEmission || 0), 0);

        data.stats = {
          totalDeliveries,
          earnings,
          totalDistance: totalDistance.toFixed(2),
          totalEmission: totalEmission.toFixed(2),
          vehicleType: user.vehicle?.type || 'Not assigned',
          isAvailable: user.isAvailable
        };

      } else if (role === 'admin') {
        const totalOrders = await Order.countDocuments();
        const deliveredOrders = await Order.countDocuments({ 'status.current': 'delivered' });
        const pendingOrders = await Order.countDocuments({ 'status.current': { $in: ['created', 'paid', 'confirmed'] } });
        
        const delivered = await Order.find({ 'status.current': 'delivered' });
        const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalEmission = delivered.reduce((sum, o) => sum + (o.emissionData?.actualEmission || 0), 0);

        const baselineEmission = delivered.reduce((sum, o) => sum + ((o.distanceKm || 0) * 75), 0);
        const emissionSaved = baselineEmission - totalEmission;

        const totalUsers = await User.countDocuments();
        const totalShops = await Shop.countDocuments({ isActive: true });

        data.stats = {
          totalOrders,
          deliveredOrders,
          pendingOrders,
          totalRevenue,
          totalEmission: totalEmission.toFixed(2),
          emissionSaved: emissionSaved.toFixed(2),
          totalUsers,
          totalShops
        };
      }

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get orders assigned to delivery partner
  async getMyOrders(req, res) {
    try {
      const orders = await Order.find({ deliveryPartner: req.user._id })
        .populate('customer', 'name phone')
        .populate('shop', 'name address')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: { orders } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get pending orders for shopkeeper
  async getShopOrders(req, res) {
    try {
      const shop = await Shop.findOne({ owner: req.user._id });
      
      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found' });
      }

      const orders = await Order.find({ shop: shop._id })
        .populate('customer', 'name phone deliveryAddress')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: { orders } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Legacy methods for backward compatibility
  async getCustomerAnalytics(req, res) {
    return this.getCustomerImpact(req, res);
  }

  async getShopAnalytics(req, res) {
    return this.getShopPerformance(req, res);
  }

  async getAdminAnalytics(req, res) {
    return this.getDashboardStats(req, res);
  }

  async getDeliveryAnalytics(req, res) {
    return this.getDeliveryPartnerPerformance(req, res);
  }

  async getCityEmissions(req, res) {
    return this.getEmissionsAnalytics(req, res);
  }
}

module.exports = new AnalyticsController();
