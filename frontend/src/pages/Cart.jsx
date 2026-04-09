import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, 
  Tag, Truck, Shield, Leaf as EcoLeaf, Sparkles, PlusCircle
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { api, productsAPI } from '../services/api';
import { useEffect } from 'react';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, addItem } = useAppStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const items = cart?.items || [];
  
  // Multi-Stop "Greenest Order" Logic (Mar 28 - Ultra Feature)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (items.length > 0) {
        try {
          // Get products from the same shop to encourage one-trip orders
          const firstItemShopId = items[0].shopId || items[0].shop?._id || items[0].shop;
          if (firstItemShopId) {
            const res = await productsAPI.getByShop(firstItemShopId);
            if (res.data?.success) {
               // Filter out items already in cart
               const cartProductIds = items.map(i => i.productId);
               const filtered = res.data.data.products
                 .filter(p => !cartProductIds.includes(p._id))
                 .slice(0, 3);
               setSuggestions(filtered);
            }
          }
        } catch (err) {
          console.error("Failed to fetch suggestions", err);
        }
      }
    };
    fetchSuggestions();
  }, [items.length]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 299 ? 0 : 29;
  const discount = appliedCoupon ? subtotal * (appliedCoupon.discount / 100) : 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'GREEN50') {
      setAppliedCoupon({ code: 'GREEN50', discount: 50 });
      setCouponCode('');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-16 lg:pt-[72px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8 text-lg font-medium">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products">
              <button className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-eco transition-all text-lg font-bold group">
                Start Shopping
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-16 lg:pt-[72px]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-8 tracking-tight">Shopping Cart <span className="text-muted-foreground text-2xl font-semibold">({items.length} items)</span></h1>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, scale: 0.95 }}
                  className="bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-sm group hover:border-primary/40 transition-colors"
                >
                  <div className="flex gap-4 sm:gap-6">
                    {/* Product Image */}
                    <Link to={`/product/${item.productId}`} className="flex-shrink-0">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-xl bg-cover bg-center overflow-hidden border border-border/50">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1 opacity-90">{item.category || 'Grocery'}</p>
                          <Link to={`/product/${item.productId}`} className="text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {item.name}
                          </Link>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-2.5 bg-muted/50 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-muted/50 border border-border rounded-xl p-1 shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-2 text-foreground hover:bg-background rounded-lg transition-colors shadow-sm"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-bold text-foreground text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-2 text-foreground hover:bg-background rounded-lg transition-colors shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">₹{item.price * item.quantity}</p>
                          {item.originalPrice && (
                            <p className="text-xs sm:text-sm font-semibold text-muted-foreground line-through decoration-muted-foreground/50">₹{item.originalPrice * item.quantity}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear Cart */}
            <div className="flex justify-start pt-2">
              <button
                onClick={clearCart}
                className="text-sm font-bold text-muted-foreground hover:text-destructive hover:underline transition-colors px-2 py-1"
              >
                Clear entire cart
              </button>
            </div>

            {/* AI-Powered "Greenest Order" Suggestions (Mar 28 - Ultra Feature) */}
            {suggestions.length > 0 && (
              <div className="mt-12 bg-primary/5 rounded-[2rem] p-8 border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <EcoLeaf className="w-32 h-32 text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary text-primary-foreground rounded-lg">
                       <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground leading-tight">Complete your store trip</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">AI-Powered Suggestions for a Greenest Order</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-6">
                    {suggestions.map((product) => (
                      <motion.div 
                        key={product._id}
                        whileHover={{ y: -5 }}
                        className="bg-card p-4 rounded-2xl border border-border flex flex-col items-center text-center group"
                      >
                        <div className="w-20 h-20 bg-muted rounded-xl mb-4 overflow-hidden relative">
                           <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                           <button 
                             onClick={() => addItem(product)}
                             className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-primary-foreground transition-opacity"
                           >
                             <PlusCircle className="w-8 h-8" />
                           </button>
                        </div>
                        <h4 className="text-xs font-black text-foreground line-clamp-1 mb-1">{product.name}</h4>
                        <p className="text-sm font-black text-primary">₹{product.price}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-border/50 text-center">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Ordering together from the same shop reduces CO2 emissions by up to 40%</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 lg:p-8 border border-border shadow-card sticky top-28">
              <h2 className="text-xl font-extrabold text-foreground mb-6 uppercase tracking-tight">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Apply Coupon</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="w-full pl-10 pr-4 h-12 bg-muted/50 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground"
                    />
                  </div>
                  <button onClick={handleApplyCoupon} className="h-12 px-6 bg-secondary text-secondary-foreground font-extrabold rounded-xl hover:bg-secondary/90 transition-colors shadow-sm text-sm">
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-3 flex items-center justify-between p-3 border border-primary/20 bg-primary/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded-md shadow-sm">
                        {appliedCoupon.code}
                      </div>
                      <span className="text-sm font-bold text-primary">{appliedCoupon.discount}% OFF</span>
                    </div>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-xs font-bold text-muted-foreground hover:text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 border-t border-border pt-6 mb-8">
                <div className="flex justify-between font-semibold text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full">FREE</span> : <span className="text-foreground">₹{deliveryFee}</span>}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-bold text-primary">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t border-border">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none">Total</span>
                  <span className="text-3xl font-extrabold text-foreground tracking-tight leading-none">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Free Delivery Banner */}
              {subtotal < 299 && (
                <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 mb-8">
                  <p className="text-sm text-foreground font-medium mb-2">
                    Add <span className="font-extrabold text-primary">₹{(299 - subtotal).toFixed(2)}</span> more for <strong>FREE delivery</strong>
                  </p>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(subtotal / 299) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <button 
                onClick={handleCheckout} 
                className="w-full h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-3 font-extrabold text-lg shadow-eco hover:bg-primary/90 hover:-translate-y-0.5 transition-all group"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-3 gap-2 pt-6 border-t border-border/50">
                <div className="text-center group">
                  <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                    <Truck className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fast Delivery</p>
                </div>
                <div className="text-center group">
                  <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                    <Shield className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Secure Payment</p>
                </div>
                <div className="text-center group">
                  <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                    <EcoLeaf className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Eco-Friendly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cart;
