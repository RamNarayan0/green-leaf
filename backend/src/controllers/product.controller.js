/**
 * Product Controller
 * Handles product operations
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../utils/logger');
const { getCache, setCache, deleteCache, deletePattern } = require('../services/cache.service');
const { indexProduct, deleteProduct: deleteFromSearch, searchProducts: tsSearch } = require('../services/search.service');
const StockAlert = require('../models/StockAlert');

const PRODUCT_CACHE_TTL_MS = 30 * 1000; // 30 seconds

class ProductController {
  // Get all products with filtering and pagination
  async getProducts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        shop,
        search,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        featured
      } = req.query;

      // Build query
      const query = { isAvailable: true };
      
      if (category) {
        // If it's a slug (contains non-hex chars or is short), find the category
        if (category.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(category)) {
          const catDoc = await Category.findOne({ slug: category });
          if (catDoc) {
            query.category = catDoc._id;
          } else {
            // If category not found by slug, it might be a name or just invalid
            query.category = null; 
          }
        } else {
          query.category = category;
        }
      }
      
      if (shop) {
        query.shop = shop;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
      
      if (featured === 'true') {
        query.isFeatured = true;
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Caching frequently requested product lists (Redis)
      const cacheKey = `products:${JSON.stringify({ query, page, limit, sortBy, sortOrder, featured })}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: cached
        });
      }

      // Execute query with pagination
      const products = await Product.find(query)
        .populate('category', 'name icon')
        .populate('shop', 'name rating')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const total = await Product.countDocuments(query);

      const responseData = {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

      await setCache(cacheKey, responseData, PRODUCT_CACHE_TTL_MS / 1000);

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single product
  async getProduct(req, res, next) {
    try {
      const product = await Product.findById(req.params.id)
        .populate('category', 'name icon description')
        .populate('shop', 'name rating phone email address');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: { product }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get products by shop
  async getProductsByShop(req, res, next) {
    try {
      const { shopId } = req.params;
      const { page = 1, limit = 20, category } = req.query;

      // Build query - handle both ObjectId and string shop IDs
      const query = { 
        $or: [
          { shop: shopId },
          { shop: req.params.shopId }
        ],
        isAvailable: true 
      };
      
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
        .populate('category', 'name icon slug')
        .populate('shop', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const total = await Product.countDocuments(query);

      res.json({
        success: true,
        data: {
          products,
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

  // Get featured products
  async getFeaturedProducts(req, res, next) {
    try {
      const products = await Product.find({ 
        isAvailable: true, 
        isFeatured: true 
      })
        .populate('category', 'name icon')
        .populate('shop', 'name')
        .limit(20);

      res.json({
        success: true,
        data: { products }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get products by category
  async getProductsByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const products = await Product.find({
        category: categoryId,
        isAvailable: true
      })
        .populate('shop', 'name rating')
        .sort({ price: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const total = await Product.countDocuments({
        category: categoryId,
        isAvailable: true
      });

      res.json({
        success: true,
        data: {
          products,
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

  // Search products
  async searchProducts(req, res, next) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      let products = [];
      let typesenseResults = null;

      try {
        typesenseResults = await tsSearch(q, { limit: Number(limit) });
      } catch (err) {
        console.warn('Typesense search failed, falling back to Mongo search', err.message);
      }

      if (typesenseResults && typesenseResults.hits && typesenseResults.hits.length > 0) {
        const ids = typesenseResults.hits.map(hit => hit.document.id);
        products = await Product.find({ _id: { $in: ids }, isAvailable: true })
          .populate('category', 'name icon')
          .populate('shop', 'name');

        // Preserve order from typesense results
        const productsById = products.reduce((acc, item) => {
          acc[item._id.toString()] = item;
          return acc;
        }, {});

        products = ids.map(id => productsById[id]).filter(Boolean);
      } else {
        // Fallback to MongoDB regex search
        products = await Product.find({
          $and: [
            { isAvailable: true },
            {
              $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
              ]
            }
          ]
        })
          .populate('category', 'name icon')
          .populate('shop', 'name')
          .limit(Number(limit));
      }

      res.json({
        success: true,
        data: { products }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all categories
  async getCategories(req, res, next) {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 });

      // Get product count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const count = await Product.countDocuments({
            category: cat._id,
            isAvailable: true
          });
          return {
            ...cat.toObject(),
            productCount: count
          };
        })
      );

      res.json({
        success: true,
        data: { categories: categoriesWithCount }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create product (shopkeeper only)
  async createProduct(req, res, next) {
    try {
      const shopOwnerId = req.user.shop || req.user.shopId;
      if (!shopOwnerId) {
        return res.status(400).json({
          success: false,
          message: 'Shop not assigned to user. Create or join a shop first.'
        });
      }

      const productData = {
        ...req.body,
        shop: shopOwnerId
      };

      // Handle category slug in creation
      if (typeof productData.category === 'string' && 
          (productData.category.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(productData.category))) {
        const catDoc = await Category.findOne({ slug: productData.category });
        if (catDoc) {
          productData.category = catDoc._id;
        } else {
          // If no category found, we could either error or use a default
          // For now, let's try to find 'grocery' or just fail if required
          const defaultCat = await Category.findOne({ slug: 'grocery' });
          if (defaultCat) productData.category = defaultCat._id;
        }
      }

      const product = await Product.create(productData);
      await deletePattern('products:*');
      await indexProduct(product);

      logger.info(`Product created: ${product.name}`);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update product
  async updateProduct(req, res, next) {
    try {
      const shopOwnerId = req.user.shop || req.user.shopId;
      const product = await Product.findOne({
        _id: req.params.id,
        shop: shopOwnerId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      Object.assign(product, req.body);
      await product.save();
      await deletePattern('products:*');
      await indexProduct(product);

      logger.info(`Product updated: ${product.name}`);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete product
  async deleteProduct(req, res, next) {
    try {
      const product = await Product.findOneAndDelete({
        _id: req.params.id,
        shop: req.user.shopId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await deletePattern('products:*');
      await deleteFromSearch(product._id.toString());
      logger.info(`Product deleted: ${product.name}`);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update stock
  async updateStock(req, res, next) {
    try {
      const { quantity } = req.body;
      const shopOwnerId = req.user.shop || req.user.shopId;

      const product = await Product.findOne({
        _id: req.params.id,
        shop: shopOwnerId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      product.stockQuantity = quantity;
      await product.save();
      await deletePattern('products:*');

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: { product }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get low stock products
  async getLowStockProducts(req, res, next) {
    try {
      const shopOwnerId = req.user.shop || req.user.shopId;
      const { threshold = 10 } = req.query;

      const products = await Product.find({
        shop: shopOwnerId,
        stockQuantity: { $lte: threshold },
        isAvailable: true
      }).sort({ stockQuantity: 1 });

      res.json({
        success: true,
        data: { products }
      });
    } catch (error) {
      next(error);
    }
  }

  // Subscribe to Back-in-Stock Alert (Mar 28 - Ultra Feature)
  async subscribeToStockAlert(req, res, next) {
    try {
      const { productId } = req.params;
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Check if alert already exists
      const existingAlert = await StockAlert.findOne({
        user: req.user.id,
        product: productId,
        isNotified: false
      });

      if (existingAlert) {
        return res.json({ success: true, message: 'You are already on the waitlist for this product.' });
      }

      await StockAlert.create({
        user: req.user.id,
        product: productId,
        shop: product.shop
      });

      res.status(201).json({
        success: true,
        message: 'Alert set! We will notify you when this item is back in stock.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
