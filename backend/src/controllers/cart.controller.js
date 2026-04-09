/**
 * Cart Controller
 * Handles cart operations for customers (Rewritten for Simplicity & Stability)
 */

const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

class CartController {
  // Get user's cart
  getCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) throw new AppError('User not found', 404);

    res.json({
      success: true,
      data: {
        items: user.cart?.items || [],
        totalItems: user.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        totalPrice: user.cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
      }
    });
  });

  // Add item to cart
  addToCart = asyncHandler(async (req, res) => {
    const { productId, name, price, quantity = 1, image, shopId } = req.body;
    
    if (!productId) throw new AppError('Product ID is required', 400);

    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    if (!user.cart) {
      user.cart = { items: [], updatedAt: new Date() };
    }

    // Check if item already exists in cart
    const existingItemIndex = user.cart.items.findIndex(
      item => item.productId && item.productId.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
      // Update quantity
      user.cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      user.cart.items.push({
        productId,
        name: name || 'Product',
        price: Number(price) || 0,
        quantity: Number(quantity) || 1,
        image,
        shopId,
        addedAt: new Date()
      });
    }

    user.cart.totalItems = user.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    user.cart.totalPrice = user.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    user.cart.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Item added to cart',
      data: {
        items: user.cart.items,
        totalItems: user.cart.totalItems,
        totalPrice: user.cart.totalPrice
      }
    });
  });

  // Update cart item quantity
  updateCartItem = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    
    if (!productId) throw new AppError('Product ID is required', 400);

    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    if (!user.cart || !user.cart.items) {
      throw new AppError('Cart not found', 404);
    }

    const itemIndex = user.cart.items.findIndex(
      item => item.productId && item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      throw new AppError('Item not found in cart', 404);
    }

    if (quantity <= 0) {
      // Remove item from cart
      user.cart.items.splice(itemIndex, 1);
    } else {
      user.cart.items[itemIndex].quantity = quantity;
    }

    user.cart.totalItems = user.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    user.cart.totalPrice = user.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    user.cart.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Cart updated',
      data: {
        items: user.cart.items,
        totalItems: user.cart.totalItems,
        totalPrice: user.cart.totalPrice
      }
    });
  });

  // Remove item from cart
  removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    
    if (!productId) throw new AppError('Product ID is required in URL parameters', 400);

    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    if (!user.cart || !user.cart.items) {
      throw new AppError('Cart not found', 404);
    }

    user.cart.items = user.cart.items.filter(
      item => item.productId && item.productId.toString() !== productId.toString()
    );

    user.cart.totalItems = user.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    user.cart.totalPrice = user.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    user.cart.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        items: user.cart.items,
        totalItems: user.cart.totalItems,
        totalPrice: user.cart.totalPrice
      }
    });
  });

  // Clear cart
  clearCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    user.cart = { items: [], updatedAt: new Date() };
    await user.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      data: {
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    });
  });
}

module.exports = new CartController();
