import { create } from 'zustand';
import { cartAPI } from '../services/api';

const useAppStore = create((set, get) => ({
  cart: {
    items: [],
    totalQuantity: 0,
    totalPrice: 0
  },
  shops: [],
  products: [],
  selectedShop: null,
  selectedProduct: null,
  loading: false,
  error: null,

  setCart: (cart) => set({ 
    cart: {
      items: cart.items || [],
      totalQuantity: cart.totalItems || 0,
      totalPrice: cart.totalPrice || 0
    }
  }),

  fetchCart: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    set({ loading: true });
    try {
      const { data } = await cartAPI.getCart();
      if (data.success) {
        get().setCart(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (product, quantity = 1) => {
    const token = localStorage.getItem('token');
    const productId = String(product._id || product.productId);

    // Optimistic Update
    set((state) => {
      const existing = state.cart.items.find((item) => String(item.productId) === productId);
      let items;
      if (existing) {
        items = state.cart.items.map((item) => 
          String(item.productId) === productId ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        items = [...state.cart.items, { 
          productId: productId,
          name: product.name,
          price: product.price,
          image: product.primaryImage || product.image,
          quantity 
        }];
      }
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { cart: { items, totalQuantity, totalPrice } };
    });

    if (token) {
      try {
        const { data } = await cartAPI.addToCart({
          productId,
          name: product.name,
          price: product.price,
          quantity,
          image: product.primaryImage || product.image,
          shopId: product.shop?._id || product.shop
        });
        if (data.success) {
          get().setCart(data.data);
        }
      } catch (error) {
        console.error('Failed to sync addToCart:', error);
      }
    }
  },

  removeFromCart: async (targetId) => {
    const token = localStorage.getItem('token');
    const productId = String(targetId);

    // Optimistic Update
    set((state) => {
      const items = state.cart.items.filter((item) => String(item.productId) !== productId);
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { cart: { items, totalQuantity, totalPrice } };
    });

    if (token) {
      try {
        const { data } = await cartAPI.removeFromCart(productId);
        if (data.success) {
          get().setCart(data.data);
        }
      } catch (error) {
        console.error('Failed to sync removeFromCart:', error);
      }
    }
  },

  updateQuantity: async (targetId, quantity) => {
    const token = localStorage.getItem('token');
    const productId = String(targetId);

    // Optimistic Update
    set((state) => {
      let items;
      if (quantity <= 0) {
        items = state.cart.items.filter((item) => String(item.productId) !== productId);
      } else {
        items = state.cart.items.map((item) => 
          String(item.productId) === productId ? { ...item, quantity } : item
        );
      }
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { cart: { items, totalQuantity, totalPrice } };
    });

    if (token) {
      try {
        const { data } = await cartAPI.updateCartItem({ productId, quantity });
        if (data.success) {
          get().setCart(data.data);
        }
      } catch (error) {
        console.error('Failed to sync updateQuantity:', error);
      }
    }
  },

  clearCart: async () => {
    const token = localStorage.getItem('token');
    set({ cart: { items: [], totalQuantity: 0, totalPrice: 0 } });

    if (token) {
      try {
        await cartAPI.clearCart();
      } catch (error) {
        console.error('Failed to sync clearCart:', error);
      }
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default useAppStore;

