import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ordersAPI, usersAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import { ArrowRight, MapPin, CreditCard, ShieldCheck, Truck, AlertCircle, Compass, Leaf, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VehicleSelector from '../components/VehicleSelector';
import MapLocationPicker from '../components/MapLocationPicker';
import RouteVisualizer from '../components/RouteVisualizer';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, loading: storeLoading } = useAppStore();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [selectedVehicle, setSelectedVehicle] = useState('bicycle');
  const [selectedRouteType, setSelectedRouteType] = useState('shortest');
  const [showMap, setShowMap] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    street: '',
    landmark: '',
    city: 'Hyderabad',
    state: 'Telangana',
    zipCode: '',
    location: { type: 'Point', coordinates: [78.4867, 17.385] }
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingAddresses, setFetchingAddresses] = useState(true);
  const [fetchingEstimate, setFetchingEstimate] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [error, setError] = useState('');

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Dynamic Fee Calculation matching backend: ₹20 (Base) + (₹10 * Distance) + ₹5 (Handling)
  const [deliveryFee, setDeliveryFee] = useState(25); // Initial placeholder
  const [total, setTotal] = useState(subtotal + 25);

  useEffect(() => {
    const cartSubtotal = subtotal;
    const handlingFee = 5;
    const platformFee = cartSubtotal * 0.05;
    const gstAmount = cartSubtotal * 0.05;
    
    let baseDelivery = deliveryFee;
    if (deliveryEstimate?.distance) {
      baseDelivery = deliveryEstimate.vehicles?.find(v => v.type === selectedVehicle)?.cost || 20;
      setDeliveryFee(baseDelivery);
    }
    
    // Total calculation with float precision then round to 2
    const calculatedTotal = cartSubtotal + baseDelivery + handlingFee + platformFee + gstAmount;
    setTotal(calculatedTotal);
  }, [deliveryEstimate, subtotal, deliveryFee, selectedVehicle]);

  useEffect(() => {
    // Redirect if cart is empty and not loading
    if (!storeLoading && items.length === 0) {
      navigate('/cart');
      return;
    }

    const fetchAddresses = async () => {
      try {
        setFetchingAddresses(true);
        const res = await usersAPI.getAddresses();
        const userAddresses = res.data?.data?.addresses || [];
        setAddresses(userAddresses);
        if (userAddresses.length > 0) {
          setSelectedAddress(userAddresses[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
        setError('Failed to load your delivery addresses.');
      } finally {
        setFetchingAddresses(false);
      }
    };

    fetchAddresses();
  }, [items.length, navigate]);
  
  // Fetch delivery estimate (distance/emissions) when selections change
  useEffect(() => {
    if (!selectedAddress || items.length === 0) return;
    
    const fetchEstimate = async () => {
      try {
        setFetchingEstimate(true);
        const isManual = selectedAddress === 'manual' || selectedAddress === 'temp';
        const targetAddress = isManual ? manualAddress : addresses.find(a => a._id === selectedAddress);
        
        if (!targetAddress) {
          console.warn('No target address found for estimate calculation');
          return;
        }
        
        const shopId = cart.shopId || items[0]?.shopId || items[0]?.shop?._id || items[0]?.shop;
        if (!shopId) {
           console.warn('No shop ID found for estimate calculation');
           return;
        }

        const res = await ordersAPI.calculateDeliveryEstimate({
          shopId,
          deliveryAddress: {
            street: targetAddress.street || 'Selected Location',
            location: targetAddress.location || { type: 'Point', coordinates: [78.4867, 17.3850] }
          },
          routeType: selectedRouteType
        });
        
        if (res.data?.success) {
          setDeliveryEstimate(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch delivery estimate:', err);
      } finally {
        setFetchingEstimate(false);
      }
    };

    fetchEstimate();
  }, [selectedAddress, items.length, addresses, cart.shopId, selectedVehicle, selectedRouteType, manualAddress]); // Re-run on any relevant change

  const handlePlaceOrder = async () => {
    setError('');
    
    const isManual = selectedAddress === 'manual';
    const targetAddress = isManual ? manualAddress : addresses.find((a) => a._id === selectedAddress);
    
    if (!targetAddress || (isManual && !targetAddress.street)) {
      setError(isManual ? 'Please enter your street address.' : 'Invalid delivery address selected.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Derive shopId from cart items
      const shopId = cart.shopId || items[0]?.shopId || items[0]?.shop?._id || items[0]?.shop;
      
      if (!shopId) {
        throw new Error('Your cart items are missing shop information. Please clear your cart and add items again.');
      }

      // Build address with location
      const addressLocation = targetAddress.location || {
        type: 'Point',
        coordinates: [78.4867, 17.3850]
      };

      const payload = {
        items: items.map((item) => ({ 
          productId: item.productId, 
          quantity: item.quantity,
          name: item.name,
          price: item.price
        })),
        shopId: shopId,
        deliveryAddress: {
          street: targetAddress.street,
          landmark: targetAddress.landmark || '',
          city: targetAddress.city || 'Hyderabad',
          state: targetAddress.state || 'Telangana',
          zipCode: targetAddress.zipCode || targetAddress.pincode || '500001',
          country: targetAddress.country || 'India',
          location: addressLocation
        },
        selectedVehicle: selectedVehicle,
        paymentMethod: paymentMethod,
        routeType: selectedRouteType
      };

      const response = await ordersAPI.create(payload);
      
      if (response.data && response.data.success) {
        clearCart();
        navigate('/orders', { 
          state: { message: 'Order placed successfully! We are preparing it now.' }
        });
      } else {
        setError('Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-16 lg:pt-[72px] pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">Secure Checkout</h1>
          <p className="text-muted-foreground mt-2 font-medium">Complete your eco-friendly order.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive font-bold">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
          
          {/* Main Checkout Form Left Side */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Address Selection Section */}
            <div className="bg-card rounded-2xl p-6 lg:p-8 border border-border shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Delivery Address</h2>
              </div>
              
              {fetchingAddresses ? (
                <div className="p-10 text-center bg-muted/50 rounded-2xl border border-border animate-pulse">
                  <p className="text-muted-foreground font-semibold">Loading your addresses...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {addresses.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <label 
                          key={address._id} 
                          className={`relative block p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                            selectedAddress === address._id 
                              ? 'border-primary bg-primary/5 shadow-md' 
                              : 'border-border hover:border-primary/40 hover:bg-muted/30'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="address" 
                            value={address._id} 
                            checked={selectedAddress === address._id} 
                            onChange={() => {
                              setSelectedAddress(address._id);
                              setShowMap(false);
                            }} 
                            className="absolute right-5 top-5 w-5 h-5 text-primary focus:ring-primary border-muted-foreground/30 rounded-full" 
                          />
                          <div className="pr-10">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-secondary text-secondary-foreground mb-3">
                              {address.label || 'Home'}
                            </span>
                            <p className="text-base font-bold text-foreground mb-1 leading-snug">{address.street}</p>
                            <p className="text-sm font-medium text-muted-foreground">{address.city}, {address.state} {address.zipCode}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <button 
                      onClick={() => {
                        setShowMap(!showMap);
                        setSelectedAddress(showMap ? (addresses[0]?._id || null) : 'manual');
                      }}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        showMap ? 'bg-primary text-primary-foreground shadow-eco' : 'bg-muted text-foreground hover:bg-border'
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                      {showMap ? 'Use Saved Address' : 'Pin New Location on Map'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showMap && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 pt-6"
                      >
                        <div className="rounded-2xl overflow-hidden border-2 border-border min-h-[300px]">
                          <MapLocationPicker 
                            initialLat={17.385}
                            initialLng={78.4867}
                            onLocationSelect={(coords) => setManualAddress(prev => ({
                              ...prev,
                              location: { type: 'Point', coordinates: [coords.lng, coords.lat] }
                            }))}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            placeholder="Street Address / Room No"
                            value={manualAddress.street}
                            onChange={(e) => setManualAddress({...manualAddress, street: e.target.value})}
                            className="w-full px-5 py-3 h-14 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                          />
                          <input 
                            type="text" 
                            placeholder="Landmark (Optional)"
                            value={manualAddress.landmark}
                            onChange={(e) => setManualAddress({...manualAddress, landmark: e.target.value})}
                            className="w-full px-5 py-3 h-14 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            {/* Vehicle Selection Section */}
            <div className="bg-card rounded-2xl p-6 lg:p-8 border border-border shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Delivery Vehicle</h2>
              </div>
              
              <VehicleSelector 
                selectedVehicle={selectedVehicle} 
                onSelect={(id) => setSelectedVehicle(id)} 
              />
            </div>

            <motion.div 
              layout
              className="bg-card rounded-2xl p-6 lg:p-8 border border-border shadow-sm overflow-hidden relative"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Compass className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Route Optimization</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">AI-Powered Carbon Routing</p>
                </div>
              </div>

              {/* Route Visualizer Map (Mar 23 - Phase 10) */}
              <div className="mb-8">
                {deliveryEstimate && deliveryEstimate.routes ? (
                  <RouteVisualizer 
                    shopLocation={deliveryEstimate.shopLocation}
                    customerLocation={deliveryEstimate.customerLocation}
                    routes={deliveryEstimate.routes}
                    selectedRouteType={selectedRouteType}
                  />
                ) : (
                  <div className="h-[320px] w-full bg-muted/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-border gap-3 text-muted-foreground">
                    <Compass className="w-10 h-10 animate-pulse" />
                    <p className="font-bold text-sm">Select an address to visualize route</p>
                  </div>
                )}
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <motion.label 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                    selectedRouteType === 'shortest' 
                      ? 'border-amber-500 bg-amber-50/50 shadow-md ring-1 ring-amber-500/20' 
                      : 'border-border hover:border-amber-400/40'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="routeType" 
                    value="shortest" 
                    checked={selectedRouteType === 'shortest'} 
                    onChange={() => setSelectedRouteType('shortest')} 
                    className="w-5 h-5 text-amber-500 focus:ring-amber-500 border-muted-foreground/30 rounded-full" 
                  />
                  <div className="ml-5 flex-1">
                    <span className="block font-bold text-foreground mb-0.5">Shortest Path</span>
                    <span className="block text-xs font-semibold text-muted-foreground">Priority on speed</span>
                  </div>
                  {selectedRouteType === 'shortest' && (
                    <motion.div layoutId="route-glow" className="absolute inset-0 rounded-2xl bg-amber-500/5 -z-10" />
                  )}
                </motion.label>

                <motion.label 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                    selectedRouteType === 'eco' 
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-1 ring-emerald-500/20' 
                      : 'border-border hover:border-emerald-400/40'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="routeType" 
                    value="eco" 
                    checked={selectedRouteType === 'eco'} 
                    onChange={() => setSelectedRouteType('eco')} 
                    className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 border-muted-foreground/30 rounded-full" 
                  />
                  <div className="ml-5 flex-1">
                    <div className="flex items-center gap-2">
                       <span className="block font-bold text-foreground mb-0.5 whitespace-nowrap">Eco-Smart Route</span>
                       <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="block text-xs font-semibold text-muted-foreground">Optimized for planet</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg transform rotate-3">MAX SAVINGS</div>
                  {selectedRouteType === 'eco' && (
                    <motion.div layoutId="route-glow" className="absolute inset-0 rounded-2xl bg-emerald-500/5 -z-10" />
                  )}
                </motion.label>
              </div>

              <AnimatePresence mode="wait">
                {selectedRouteType === 'eco' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <p className="text-sm font-bold text-emerald-800">Great choice! This route avoids high-traffic zones to reduce idling emissions by ~18%.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Payment Selection Section */}
            <div className="bg-card rounded-2xl p-6 lg:p-8 border border-border shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Payment Method</h2>
              </div>
              
              <div className="space-y-4">
                <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod" 
                    checked={paymentMethod === 'cod'} 
                    onChange={() => setPaymentMethod('cod')} 
                    className="w-5 h-5 text-primary focus:ring-primary border-muted-foreground/30 rounded-full" 
                  />
                  <div className="ml-5 flex-1 flex items-center justify-between">
                    <div>
                      <span className="block font-bold text-foreground text-lg mb-0.5">Cash on Delivery (COD)</span>
                      <span className="block text-sm font-medium text-muted-foreground">Pay when your order arrives</span>
                    </div>
                    <span className="text-3xl opacity-80">💵</span>
                  </div>
                </label>

                <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-primary bg-primary/5 shadow-md' : 'border-border opacity-60'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={() => setPaymentMethod('card')} 
                    className="w-5 h-5 text-primary focus:ring-primary border-muted-foreground/30 rounded-full" 
                    disabled // Temporarily disable card payments for MVP simplification
                  />
                  <div className="ml-5 flex-1 flex items-center justify-between">
                    <div>
                      <span className="block font-bold text-foreground text-lg mb-0.5">Credit/Debit Card (Coming Soon)</span>
                      <span className="block text-sm font-medium text-muted-foreground">Razorpay integration pending</span>
                    </div>
                    <span className="text-3xl opacity-80">💳</span>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Side - Order Summary Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 lg:p-8 border border-border shadow-card sticky top-28">
              <h3 className="text-xl font-extrabold text-foreground mb-6 uppercase tracking-tight">Order Summary</h3>
              
              {/* Surge Warning (Mar 28 - Ultra Feature) */}
              {deliveryEstimate?.surgeMultiplier > 1 && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">
                    High Demand: ₹{(deliveryFee - (deliveryFee/deliveryEstimate.surgeMultiplier)).toFixed(0)} surge fee applied
                  </p>
                </div>
              )}

              {/* GreenPass Benefit (Mar 28 - Ultra Feature) */}
              {deliveryEstimate?.isGreenPass && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 animate-bounce-subtle shadow-sm">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-[11px] font-bold text-primary-foreground bg-primary px-2 py-1 rounded upercase tracking-tighter">
                    GREENPASS: FREE DELIVERY APPLIED
                  </p>
                </div>
              )}

              {/* Item List Compact View */}
              <div className="max-h-[300px] overflow-y-auto mb-6 pr-3 space-y-4 styled-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-muted rounded-xl border border-border overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=200'} 
                        alt={item.name}
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{item.name}</h4>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-extrabold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-4 border-t border-border pt-6 mb-8">
                <div className="flex justify-between font-semibold text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryEstimate?.distance || !fetchingEstimate ? (
                      deliveryEstimate?.isGreenPass ? (
                        <span className="text-primary font-black line-through opacity-50 mr-2">₹{(deliveryFee || 25).toFixed(2)}</span>
                      ) : (
                        <span className="text-foreground">₹{deliveryFee.toFixed(2)}</span>
                      )
                    ) : (
                      <span className="text-xs italic text-amber-600 animate-pulse">Calculating...</span>
                    )}
                    {deliveryEstimate?.isGreenPass && <span className="text-primary font-black ml-1">FREE</span>}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-muted-foreground">
                  <span>Handling Fee</span>
                  <span className="text-foreground">₹5.00</span>
                </div>
                <div className="flex justify-between font-semibold text-muted-foreground">
                  <span>Platform Fee (5%)</span>
                  <span className="text-foreground">₹{(subtotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-muted-foreground">
                  <span>GST (5%)</span>
                  <span className="text-foreground">₹{(subtotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-5 border-t border-border">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none">Total</span>
                  <span className="text-3xl font-extrabold text-primary tracking-tight leading-none">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Carbon Impact Calculation */}
              {deliveryEstimate && (
                <div className="mb-8 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-eco">
                      <Leaf className="w-5 h-5 text-emerald-50" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-900 leading-none">Carbon Impact</h4>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Real-time Calculation</p>
                    </div>
                  </div>
                  
                  {/* Ecological Impact Card */}
                  <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-extrabold text-foreground">Your Eco-Smart Impact</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card p-4 rounded-xl border border-border">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">CO2 Potential Savings</p>
                        <p className="text-2xl font-black text-primary">{(deliveryEstimate?.recommended?.carbonSaved / 1000).toFixed(2)}kg</p>
                      </div>
                      <div className="bg-card p-4 rounded-xl border border-border">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Ecological Equivalent</p>
                        <p className="text-2xl font-black text-secondary">
                          {Math.max(1, Math.round(deliveryEstimate?.recommended?.carbonSaved / 20))}
                          <span className="text-xs font-bold ml-1 text-muted-foreground">Trees-days</span>
                        </p>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-sm font-medium text-muted-foreground italic">
                      "By choosing this route consistently for a year, you would have the same impact as planting 2 trees."
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 p-3 rounded-xl border border-emerald-100/50 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mb-1">Estimated CO2</p>
                        <p className="text-lg font-black text-emerald-700">
                          {(deliveryEstimate.vehicles?.find(v => v.type === selectedVehicle)?.carbonEmitted || 0).toFixed(1)}g
                        </p>
                      </div>
                      <div className="bg-white/60 p-3 rounded-xl border border-emerald-100/50 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mb-1">Carbon Saved</p>
                        <p className="text-lg font-black text-emerald-600">
                          {(deliveryEstimate.vehicles?.find(v => v.type === selectedVehicle)?.carbonSaved || 0).toFixed(1)}g
                        </p>
                      </div>
                  </div>

                  {/* Ecological Equivalent (Mar 23 - User Request) */}
                  <div className="pt-2 border-t border-emerald-200/50">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-xs font-bold text-emerald-800">Environmental Impact</span>
                       <div className="flex-1 h-px bg-emerald-200/50" />
                    </div>
                    <div className="flex items-center gap-3 text-emerald-700">
                       <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                          <span className="text-sm">🌳</span>
                       </div>
                         <p className="text-[10px] font-bold leading-tight">
                           By choosing <span className="text-emerald-900">{selectedRouteType === 'eco' ? 'Eco-Smart' : 'Green'}</span> routing, you are saving the equivalent of <span className="text-emerald-900">{((deliveryEstimate.vehicles?.find(v => v.type === selectedVehicle)?.carbonSaved || 0) * 52 / 1000).toFixed(2)}kg</span> of CO2 annually.
                         </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-2 flex-1 bg-emerald-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: selectedRouteType === 'eco' ? '98%' : '75%' }}></div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700">{selectedRouteType === 'eco' ? '98%' : '75%'} ECO</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                onClick={handlePlaceOrder} 
                disabled={loading || items.length === 0 || !selectedAddress}
                className="w-full h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-3 font-extrabold text-lg shadow-eco hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-primary transition-all group relative overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    Confirm Order
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>

              {/* Security & Values Badges */}
              <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between px-2">
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold group-hover:text-primary transition-colors">Secure</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Truck className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold group-hover:text-primary transition-colors">Fast</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">🌱</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold group-hover:text-primary transition-colors">Eco</span>
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
