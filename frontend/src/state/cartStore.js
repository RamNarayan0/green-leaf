import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      shopId: null,
      shopName: null,

      addItem: (product, quantity = 1) => {
        console.log('cartStore addItem called:', { product, quantity });
        const { items, shopId, shopName } = get();
        
        // Handle different product formats
        const productId = product._id || product.productId;
        const itemShopId = product.shopId || product.shop?._id;
        const itemShopName = product.shopName || product.shop?.name;
        
        // Check if adding from different shop
        if (shopId && itemShopId && String(shopId) !== String(itemShopId)) {
          set({
            items: [{
              productId: productId,
              name: product.name,
              price: product.price,
              image: product.image || product.primaryImage,
              quantity: quantity || 1,
              shopId: itemShopId,
              shopName: itemShopName
            }],
            shopId: itemShopId,
            shopName: itemShopName || 'Unknown Shop'
          });
          return;
        }

        const existingItem = items.find(item => String(item.productId) === String(productId));
        
        if (existingItem) {
          set({
            items: items.map(item =>
              String(item.productId) === String(productId)
                ? { ...item, quantity: item.quantity + (quantity || 1) }
                : item
            ),
            shopId: itemShopId || shopId,
            shopName: itemShopName || shopName
          });
        } else {
          set({
            items: [...items, {
              productId: productId,
              name: product.name,
              price: product.price,
              image: product.image || product.primaryImage,
              quantity: quantity || 1,
              shopId: itemShopId,
              shopName: itemShopName
            }],
            shopId: itemShopId || shopId,
            shopName: itemShopName || shopName
          });
        }
        
        console.log('Cart after add:', get().items);
      },

      removeItem: (productId) => {
        const { items } = get();
        const newItems = items.filter(item => String(item.productId) !== String(productId));
        
        if (newItems.length === 0) {
          set({ items: [], shopId: null, shopName: null });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get();
        
        if (quantity <= 0) {
          const newItems = items.filter(item => String(item.productId) !== String(productId));
          if (newItems.length === 0) {
            set({ items: [], shopId: null, shopName: null });
          } else {
            set({ items: newItems });
          }
        } else {
          set({
            items: items.map(item =>
              String(item.productId) === String(productId)
                ? { ...item, quantity }
                : item
            )
          });
        }
      },

      clearCart: () => {
        set({ items: [], shopId: null, shopName: null });
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getCartItems: () => {
        return get().items;
      }
    }),
    {
      name: 'greenroute-cart'
    }
  )
);

export default useCartStore;
