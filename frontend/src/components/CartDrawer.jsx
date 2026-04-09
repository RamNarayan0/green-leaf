import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

const CartDrawer = () => {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart } = useAppStore();
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isCartOpen) closeCart();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen]);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-background shadow-2xl z-[101] flex flex-col border-l border-border/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <ShoppingBag className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    My Cart
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {cart?.totalItems || cart?.items?.length || 0} items
                    </span>
                  </h2>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/10">
              {cart?.items?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-12 h-12 opacity-50" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Your cart is empty</h3>
                  <p className="max-w-[250px]">Looks like you haven't added anything to your cart yet.</p>
                  <button 
                    onClick={closeCart}
                    className="mt-6 px-6 py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.items.map((item) => (
                  <motion.div 
                    layout
                    key={item.productId || item.product?._id}
                    className="bg-card p-4 rounded-2xl border border-border flex gap-4 shadow-sm"
                  >
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-muted rounded-xl shrink-0 overflow-hidden relative">
                      {item.image ? (
                        <img 
                          src={item.image.startsWith('http') ? item.image : `http://localhost:5003${item.image}`} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-foreground line-clamp-2 leading-tight">
                            {item.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.category || item.product?.category?.name || 'Item'}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.productId || item.product?._id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="font-bold text-lg text-foreground">
                          ${(item.price || item.product?.price || 0).toFixed(2)}
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 bg-muted px-2 py-1.5 rounded-xl border border-border/50">
                          <button
                            onClick={() => updateQuantity(item.productId || item.product?._id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-background rounded-lg text-foreground shadow-sm hover:text-destructive transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId || item.product?._id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {cart?.items?.length > 0 && (
              <div className="p-5 bg-card border-t border-border shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between mb-2 text-muted-foreground font-medium">
                  <span>Subtotal</span>
                  <span>${(cart.totalPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4 text-lg font-bold text-foreground">
                  <span>Total Due</span>
                  <span>${(cart.totalPrice || 0).toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md group"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <span className="text-lg">Proceed to Checkout</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    ${(cart.totalPrice || 0).toFixed(2)}
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </span>
                </button>
                <div className="mt-4 text-center text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-primary" />
                  Checking out guarantees an eco-friendly delivery.
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
