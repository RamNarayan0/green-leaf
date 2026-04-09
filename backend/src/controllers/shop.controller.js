const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Category = require('../models/Category');

class ShopController {
  // Get all shops with optional filtering
  async getShops(req, res) {
    try {
      const { category, search, page = 1, limit = 20 } = req.query;
      
      let query = { isActive: true };
      
      if (category && category !== 'all') {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const shops = await Shop.find(query)
        .populate('owner', 'name email phone')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ rating: -1 });

      const total = await Shop.countDocuments(query);

      res.json({
        success: true,
        shops,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get shop by ID
  async getShop(req, res) {
    try {
      const shop = await Shop.findById(req.params.id)
        .populate('owner', 'name email phone');

      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found' });
      }

      res.json({ success: true, data: { shop } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Create new shop
  async createShop(req, res) {
    try {
      const {
        name,
        description,
        category,
        address,
        phone,
        openingHours,
        latitude,
        longitude,
        minimumOrder,
        deliveryRadius,
        deliveryFee
      } = req.body;

      const shopData = {
        name,
        description,
        category,
        address,
        phone,
        openingHours,
        owner: req.user.id,
        minimumOrder: minimumOrder || 0,
        deliveryRadius: deliveryRadius || 5,
        deliveryFee: deliveryFee || 0
      };

      if (latitude && longitude) {
        shopData.location = {
          type: "Point",
          coordinates: [
            parseFloat(longitude),
            parseFloat(latitude)
          ]
        };
      }

      const shop = new Shop(shopData);
      await shop.save();

      // Link shopkeeper/user to this shop
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, { shop: shop._id }, { new: true });

      res.status(201).json({
        success: true,
        data: { shop }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update shop
  async updateShop(req, res) {
    try {
      const updates = req.body;
      updates.updatedAt = Date.now();

      const shop = await Shop.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.id },
        updates,
        { new: true }
      );

      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found or unauthorized' });
      }

      res.json({ success: true, shop });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete shop
  async deleteShop(req, res) {
    try {
      const shop = await Shop.findOneAndDelete({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found or unauthorized' });
      }

      res.json({ success: true, message: 'Shop deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get shop inventory
  async getInventory(req, res) {
    try {
      const products = await Product.find({ shop: req.params.id })
        .sort({ name: 1 });

      res.json({
        success: true,
        products
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update inventory
  async updateInventory(req, res) {
    try {
      const { products } = req.body;

      for (const productUpdate of products) {
        await Product.findOneAndUpdate(
          { _id: productUpdate.productId, shop: req.params.id },
          { $set: { stock: productUpdate.stock } }
        );
      }

      res.json({ success: true, message: 'Inventory updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get nearby shops
  async getNearbyShops(req, res) {
    try {
      const { lat, lng, radius = 5 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ 
          success: false, 
          message: 'Latitude and longitude are required' 
        });
      }

      const shops = await Shop.find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseFloat(radius) * 1000
          }
        }
      }).populate('owner', 'name email phone');

      res.json({ success: true, shops });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get featured shops
  async getFeaturedShops(req, res) {
    try {
      const shops = await Shop.find({ isActive: true, isFeatured: true })
        .populate('owner', 'name email phone')
        .limit(10)
        .sort({ rating: -1 });

      res.json({ success: true, shops });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Search shops
  async searchShops(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query is required' 
        });
      }

      const shops = await Shop.find({
        isActive: true,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      })
        .populate('owner', 'name email phone')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ rating: -1 });

      const total = await Shop.countDocuments({
        isActive: true,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      });

      res.json({
        success: true,
        shops,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get shop products
  async getShopProducts(req, res) {
    try {
      const { page = 1, limit = 20, category } = req.query;
      
      let query = { shop: req.params.id, isAvailable: true };
      
      if (category) {
        // If it's a slug, find the category
        if (category.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(category)) {
          const catDoc = await Category.findOne({ slug: category });
          if (catDoc) {
            query.category = catDoc._id;
          } else {
            query.category = null;
          }
        } else {
          query.category = category;
        }
      }

      const products = await Product.find(query)
        .populate('category')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await Product.countDocuments(query);

      res.json({
        success: true,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get shop reviews
  async getShopReviews(req, res) {
    try {
      res.json({ success: true, reviews: [] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update shop status
  async updateShopStatus(req, res) {
    try {
      const { isOpen } = req.body;
      
      const shop = await Shop.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.id },
        { isOpen },
        { new: true }
      );

      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found or unauthorized' });
      }

      res.json({ success: true, shop });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get my shop (for shopkeeper)
  async getMyShop(req, res) {
    try {
      const shop = await Shop.findOne({ owner: req.user.id })
        .populate('owner', 'name email phone');

      if (!shop) {
        return res.json({ success: true, shop: null });
      }

      res.json({ success: true, shop });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get shop orders (for shopkeeper)
  async getShopOrders(req, res) {
    try {
      const Order = require('../models/Order');
      const shop = await Shop.findOne({ owner: req.user.id });
      
      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found' });
      }

      const orders = await Order.find({ shop: shop._id })
        .populate('customer', 'name email phone')
        .populate({
          path: 'deliveryPartner',
          populate: { path: 'userId', select: 'name email avatar phone' }
        })
        .sort({ createdAt: -1 });

      res.json({ success: true, orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get shop stats (for shopkeeper)
  async getShopStats(req, res) {
    try {
      const Order = require('../models/Order');
      const shop = await Shop.findOne({ owner: req.user.id });
      
      if (!shop) {
        return res.status(404).json({ success: false, message: 'Shop not found' });
      }

      const orders = await Order.find({ shop: shop._id });
      
      const totalOrders = orders.length;
      const totalRevenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      
      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
      const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

      res.json({
        success: true,
        stats: {
          totalOrders,
          totalRevenue,
          pendingOrders,
          deliveredOrders,
          rating: shop.rating,
          totalRatings: shop.totalRatings
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ShopController();
