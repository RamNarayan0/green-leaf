import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, CheckCircle, PackageSearch, Loader, AlertCircle, ShoppingBag, User, Search, Award, TrendingUp, Zap, Leaf, Settings, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../state/authStore';
import { api, deliveryAPI } from '../services/api';
import socketService from '../services/socket';
import RadarMap from '../components/RadarMap';
import MapLocationPicker from '../components/MapLocationPicker';

const DeliveryDashboard = () => {
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('orders');
  const [viewMode, setViewMode] = useState('radar');
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [stats, setStats] = useState({
    totalDeliveries: 12,
    co2Saved: 450,
    rating: 4.8,
    todayEarnings: 850
  });
  const [profile, setProfile] = useState({
    vehicleType: 'electric_bicycle',
    vehicleNumber: '',
    licenseNumber: '',
    address: {
      street: '',
      landmark: '',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '',
      location: { type: 'Point', coordinates: [78.4867, 17.3850] }
    },
    phone: '',
    email: '',
    paymentDetails: {
      upiId: '',
      bankName: '',
      accountNumber: ''
    }
  });
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef(null);

  useEffect(() => {
    fetchAvailableOrders();

    const handleNewOrder = (newOrder) => {
      setAvailableOrders((prev) => {
        // Prevent duplicates
        if (prev.find(o => o._id === newOrder._id)) return prev;
        return [newOrder, ...prev];
      });
    };

    const unsub = socketService.on('new-order-available', handleNewOrder);
    
    // Rapido-style incoming request broadcast
    const handleIncomingRequest = (data) => {
      // data: { orderId, orderNumber, shopName, distance, earnings, pickupCoords }
      setIncomingRequest(data);
      // Play a sound or trigger haptic in future (vibration placeholder)
      if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
    };
    
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('searching-driver', handleIncomingRequest);
    }
    
    fetchProfile();
    fetchStats();
    fetchActiveOrder();
    
    return () => {
      unsub();
      if (socket) socket.off('searching-driver', handleIncomingRequest);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await deliveryAPI.getProfile();
      if (res.data?.success) {
        setProfile(res.data.data);
        setSetupRequired(false);
      } else if (res.data?.setupRequired) {
        setSetupRequired(true);
        setActiveTab('vehicle'); // Match the button ID
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await deliveryAPI.getStats();
      if (res.data?.success) {
        setStats(res.data.stats || res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchActiveOrder = async () => {
    try {
      const res = await deliveryAPI.getCurrentDelivery();
      if (res.data?.success && res.data.order) {
        setActiveOrder(res.data.order);
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error('Failed to fetch active order', err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.put('/delivery/profile', profile);
      if (res.data?.success) {
        setSuccess('Profile setup complete! You are now ready to deliver.');
        setSetupRequired(false);
        fetchProfile();
      } else {
        setError(res.data?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setIsTracking(false);
      setSuccess('Tracking paused');
    } else {
      if (!navigator.geolocation) {
        setError('Geolocation not supported by your browser');
        return;
      }

      setIsTracking(true);
      setSuccess('Live tracking active');
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Emit to socket for live tracking
          if (activeOrder) {
            socketService.updateLocation(activeOrder._id, latitude, longitude);
          }
          // Also update availability/last known position in backend periodically or on big move
          // For now, just socket is enough for live "Tracker" mentioned by user
        },
        (err) => {
          console.error(err);
          setIsTracking(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      const res = await deliveryAPI.getNearbyOrders();
      setAvailableOrders(res.data?.orders || []);
    } catch (err) {
      setError('Failed to fetch orders in your area.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await deliveryAPI.acceptOrder(orderId);
      if (response.data.success) {
        setSuccess('Order Accepted! Safe travels.');
        setActiveOrder(response.data.order);
        // Refresh feed to remove the accepted order
        fetchAvailableOrders();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept order.');
    }
  };

  const handleUpdateStatus = async (status) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await deliveryAPI.updateStatus(activeOrder._id, status);
      if (response.data.success) {
        setSuccess(`Status updated to ${status.replace('_', ' ')}`);
        if (status === 'delivered') {
          setActiveOrder(null);
          fetchStats(); // Update earnings
        } else {
          setActiveOrder(response.data.order);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Rapido-style Incoming Request Modal */}
      {incomingRequest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#1f2937] text-white w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center relative shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                 <Zap className="w-10 h-10 text-white animate-pulse" />
                 <div className="absolute inset-0 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
              
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-1 uppercase">New Request!</h2>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest">{incomingRequest.earnings ? `₹${incomingRequest.earnings} Earning` : 'High Priority Order'}</p>
              </div>

              <div className="w-full space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                   <div className="text-left">
                     <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-0.5">Pick-up At</p>
                     <p className="font-bold text-sm truncate max-w-[150px]">{incomingRequest.shopName}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-0.5">Distance</p>
                     <p className="font-bold text-sm">{incomingRequest.distance ? `${incomingRequest.distance} km` : 'Near you'}</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                 <button 
                  onClick={() => setIncomingRequest(null)}
                  className="py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                 >
                   Pass
                 </button>
                 <button 
                  onClick={() => {
                    handleAcceptOrder(incomingRequest.orderId);
                    setIncomingRequest(null);
                  }}
                  className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 font-black text-xs uppercase tracking-widest transition-all"
                 >
                   Accept
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-[#1f2937] rounded-2xl flex items-center justify-center">
          <Truck className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Delivery Hub</h1>
          <p className="text-muted-foreground mt-1">Accept and deliver orders in your local cluster.</p>
        </div>
      </div>

      {setupRequired && (
        <div className="mb-8 p-6 bg-orange-500/10 border-2 border-orange-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse shadow-sm">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Onboarding Required</h3>
              <p className="text-sm font-bold opacity-80 leading-tight">Complete your profile with vehicle and payout details to start receiving orders.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setActiveTab('vehicle')}
            className="px-8 py-3 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg"
          >
            Start Setup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'orders' ? 'bg-[#1f2937] text-white shadow-md' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <PackageSearch className="w-5 h-5" />
            Dispatch Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'stats' ? 'bg-[#1f2937] text-white shadow-md' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Award className="w-5 h-5" />
            Eco-Badges & Stats
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vehicle')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'vehicle' ? 'bg-[#1f2937] text-white shadow-md' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-5 h-5" />
            Profile & Vehicle
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-3">
          <div className="glass p-6 rounded-2xl border border-border/50">
            {error && (
              <div className="mb-6 bg-destructive/10 text-destructive px-4 py-3 rounded-xl flex items-center gap-3 font-medium text-sm">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-500/10 text-green-600 px-4 py-3 rounded-xl flex items-center gap-3 font-medium text-sm">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                  <h2 className="text-xl font-bold">Dispatch Feed</h2>
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search by area or ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm font-medium"
                    />
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live Dispatch
                  </span>
                </div>

                {/* Active Tracking Banner / Active Order View */}
                {activeOrder ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-[#1f2937] text-white rounded-3xl shadow-xl relative overflow-hidden border border-white/10">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Truck className="w-32 h-32" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-2 text-emerald-400">
                             <span className="relative flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                             </span>
                             <span className="text-xs font-black uppercase tracking-widest">Active Delivery</span>
                          </div>
                          
                          <div>
                            <p className="text-xs text-white/50 uppercase font-bold tracking-widest mb-1">Pick up From</p>
                            <h3 className="text-2xl font-black">{activeOrder.shop?.name || 'Local Shop'}</h3>
                            <p className="text-sm text-white/70">{activeOrder.shop?.address?.street || activeOrder.shop?.address?.city || 'Cluster A'}</p>
                          </div>

                          <div>
                            <p className="text-xs text-white/50 uppercase font-bold tracking-widest mb-1">Deliver To</p>
                            <h3 className="text-2xl font-black">{activeOrder.customer?.name || 'Customer'}</h3>
                            <p className="text-sm text-white/70">{activeOrder.deliveryAddress?.street || 'Site Location'}</p>
                          </div>
                        </div>

                        <div className="md:w-64 space-y-4">
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                              <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-2 text-center">Current Status</p>
                              <div className="py-2 px-4 bg-emerald-500 text-white rounded-xl text-center font-black text-sm uppercase tracking-widest">
                                {activeOrder.status?.current?.replace('_', ' ') || 'Assigned'}
                              </div>
                           </div>

                           <div className="flex flex-col gap-2">
                              {activeOrder.status?.current === 'assigned' && (
                                <button 
                                  onClick={() => handleUpdateStatus('picked_up')}
                                  className="w-full py-4 bg-white text-[#1f2937] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-lg"
                                >
                                  Mark as Picked Up
                                </button>
                              )}
                              {activeOrder.status?.current === 'picked_up' && (
                                <button 
                                  onClick={() => handleUpdateStatus('out_for_delivery')}
                                  className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
                                >
                                  Out For Delivery
                                </button>
                              )}
                              {activeOrder.status?.current === 'out_for_delivery' && (
                                <button 
                                  onClick={() => handleUpdateStatus('delivered')}
                                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                                >
                                  Confirm Delivery
                                </button>
                              )}
                              <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${activeOrder.deliveryAddress?.location?.coordinates?.[1] || 17.3850},${activeOrder.deliveryAddress?.location?.coordinates?.[0] || 78.4867}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-white/10 text-white border border-white/20 rounded-2xl font-extrabold text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                              >
                                <MapPin className="w-3.5 h-3.5" /> Open Navigation
                              </a>
                           </div>
                        </div>
                      </div>

                      {/* Tracker Info */}
                      <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${isTracking ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}>
                             <Zap className={`w-4 h-4 ${isTracking ? 'animate-pulse' : ''}`} />
                           </div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-white/70">
                             {isTracking ? '📡 Live Tracker Active' : '🔇 Tracker Offline - Enable in Profile'}
                           </p>
                         </div>
                         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/50">
                            <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {activeOrder.distanceKm || '2.4'} km</span>
                            <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5" /> {(activeOrder.distanceKm * 75).toFixed(0) || '180'}g Saved</span>
                         </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                  {availableOrders.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                      <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="font-bold text-lg text-foreground">Scanning for ready orders...</p>
                      <p className="mt-1">Orders will appear here once vendors mark them as packed.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-4 bg-muted/30 p-1.5 rounded-xl w-fit">
                        <button 
                          type="button"
                          onClick={() => setViewMode('radar')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'radar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Radar View
                        </button>
                        <button 
                          type="button"
                          onClick={() => setViewMode('list')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          List View
                        </button>
                      </div>

                      {viewMode === 'radar' ? (
                        <RadarMap 
                          orders={availableOrders} 
                          onAcceptOrder={handleAcceptOrder} 
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {availableOrders
                            .filter(o => 
                              o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              o.deliveryAddress?.street?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              o.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(order => (
                              <div key={order._id} className="border border-border rounded-2xl p-5 hover:border-primary/50 transition-all bg-background/50 relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block mb-1">Order ID</span>
                                    <span className="font-bold text-sm">#{(order.orderNumber || order._id || '').toString().slice(-6)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest block mb-1">Earning</span>
                                    <span className="font-bold text-sm text-primary">₹{order.deliveryFee || (order.totalAmount * 0.1).toFixed(0)}</span>
                                  </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                  <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      <div className="w-px h-full border-l-2 border-dashed border-border my-1"></div>
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                      <div>
                                        <p className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">Pick-up From</p>
                                        <p className="text-xs font-bold truncate">{order.shop?.name || 'Local Vendor'}</p>
                                        {order.distanceToShop && (
                                          <p className="text-[10px] font-black text-primary mt-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {order.distanceToShop} km away
                                          </p>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">Deliver To</p>
                                        <p className="text-sm font-bold truncate">{order.deliveryAddress?.street || 'Customer Address'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <button 
                                  onClick={() => handleAcceptOrder(order._id)}
                                  className="w-full bg-[#1f2937] hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Accept Order
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-bold mb-1">Performance & Impact</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Your Contribution to a Greener Planet</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col gap-2">
                    <Leaf className="w-6 h-6 text-emerald-500" />
                    <p className="text-2xl font-black text-emerald-700">{stats.co2Saved}g</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CO2 Emissions Prevented</p>
                  </div>
                  <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex flex-col gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                    <p className="text-2xl font-black text-blue-700">₹{stats.todayEarnings}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today's Dispatch Earnings</p>
                  </div>
                  <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-2">
                    <Award className="w-6 h-6 text-amber-500" />
                    <p className="text-2xl font-black text-amber-700">{stats.rating}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Experience Rating</p>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Active Badges</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="group relative">
                      <div className="aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-primary/20 hover:border-primary transition-all cursor-help relative overflow-hidden">
                        <Zap className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] font-black text-center mt-2 uppercase tracking-tighter">Eco-Warrior</p>
                    </div>
                    <div className="group relative opacity-40">
                      <div className="aspect-square bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-border relative overflow-hidden">
                        <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] font-black text-center mt-2 uppercase tracking-tighter">Iron Captain</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vehicle' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Profile & Logistics</h2>
                  <button type="submit" className="bg-[#1f2937] hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all">Save Changes</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/20 rounded-2xl border border-border/50">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Vehicle Mode</label>
                    <select 
                      value={profile.vehicleType}
                      onChange={(e) => setProfile({...profile, vehicleType: e.target.value})}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
                    >
                      <option value="electric_scooter">Electric Scooter</option>
                      <option value="electric_bicycle">Electric Bicycle</option>
                      <option value="bicycle">Bicycle</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Vehicle Number / ID</label>
                    <input 
                      type="text" 
                      value={profile.vehicleNumber || ''}
                      onChange={(e) => setProfile({...profile, vehicleNumber: e.target.value})}
                      placeholder="e.g. TS 09 EA 1234" 
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Personal Phone</label>
                    <input 
                      type="tel" 
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      placeholder="Your mobile number" 
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Email Contact</label>
                    <input 
                      type="email" 
                      value={profile.email || ''}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      placeholder="For payment reports" 
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Local Base Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Street & Locality</label>
                      <input 
                        type="text" 
                        value={profile.address?.street || ''}
                        onChange={(e) => setProfile({...profile, address: {...profile.address, street: e.target.value}})}
                        className="w-full px-4 py-3 bg-muted/30 border border-transparent rounded-xl focus:bg-background focus:border-primary transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">City</label>
                      <input 
                        type="text" 
                        value={profile.address?.city || ''}
                        onChange={(e) => setProfile({...profile, address: {...profile.address, city: e.target.value}})}
                        className="w-full px-4 py-3 bg-muted/30 border border-transparent rounded-xl focus:bg-background focus:border-primary transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Zip Code</label>
                      <input 
                        type="text" 
                        value={profile.address?.zipCode || ''}
                        onChange={(e) => setProfile({...profile, address: {...profile.address, zipCode: e.target.value}})}
                        className="w-full px-4 py-3 bg-muted/30 border border-transparent rounded-xl focus:bg-background focus:border-primary transition-all" 
                      />
                    </div>
                  </div>
                </div>

                {/* Map Location Picker */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Payout Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-foreground uppercase">UPI ID (VPA)</label>
                       <input 
                         type="text" 
                         value={profile.paymentDetails?.upiId || ''}
                         onChange={(e) => setProfile({...profile, paymentDetails: {...profile.paymentDetails, upiId: e.target.value}})}
                         placeholder="e.g. agent@paytm" 
                         className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-emerald-500 transition-all" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-foreground uppercase">Bank Name</label>
                       <input 
                         type="text" 
                         value={profile.paymentDetails?.bankName || ''}
                         onChange={(e) => setProfile({...profile, paymentDetails: {...profile.paymentDetails, bankName: e.target.value}})}
                         className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-emerald-500 transition-all" 
                       />
                    </div>
                  </div>
                </div>

                {/* Map Location Picker */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pin Your Base Location</h3>
                  <p className="text-xs text-muted-foreground">This helps us find the best orders near your home or preferred starting point.</p>
                  <MapLocationPicker 
                    initialLat={profile.address?.location?.coordinates[1] || 17.3850}
                    initialLng={profile.address?.location?.coordinates[0] || 78.4867}
                    onLocationSelect={(data) => {
                      setProfile({
                        ...profile,
                        address: {
                          ...profile.address,
                          location: {
                            type: 'Point',
                            coordinates: [data.lng, data.lat]
                          }
                        }
                      });
                    }}
                  />
                </div>

                <div className="pt-4 border-t border-border mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isTracking ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Live Location Tracking</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Enable to let customers track your position</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={toggleTracking}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      isTracking 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {isTracking ? 'Active' : 'Enable'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
