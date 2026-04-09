import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Package, MapPin, Clock, Truck, Leaf, ChevronRight, ChevronDown, Search, Star, MessageSquare, X } from 'lucide-react';
import LiveRouteMap from '../components/LiveRouteMap';
import socketService from '../services/socket';
import { useAuthStore } from '../state/authStore';
import OrderStepper from '../components/OrderStepper';

const Orders = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'all' ? '/orders/my-orders' : `/orders/my-orders?status=${filter}`;
      const response = await api.get(endpoint);
      if (response.data.success) {
        const ordersData = response.data.data?.orders || response.data.orders || response.data.data || [];
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Real-time status updates
  useEffect(() => {
    if (token && user?._id) {
      socketService.connect(token);
      const socket = socketService.getSocket();
      
      if (socket) {
        // Join user room
        socket.emit('join-room', `user_${user._id}`);
        
        const handleStatusUpdate = (data) => {
          // data: { orderId, status, message }
          setOrders(prev => prev.map(o => 
            o._id === data.orderId 
              ? { ...o, status: data.status, deliveryPartner: data.deliveryPartner || o.deliveryPartner } 
              : o
          ));
        };
        
        socket.on('order-status', handleStatusUpdate);
        return () => socket.off('order-status', handleStatusUpdate);
      }
    }
  }, [token, user?._id]);

  const handleSubmitReview = async () => {
    if (!reviewOrderId) return;
    try {
      setSubmittingReview(true);
      const res = await api.post(`/orders/${reviewOrderId}/review`, { rating, comment });
      if (res.data.success) {
        setReviewOrderId(null);
        setRating(5);
        setComment('');
        loadOrders(); // Refresh to hide button
      }
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      preparing: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      ready: 'bg-green-500/10 text-green-600 border-green-500/20',
      searching_driver: 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse',
      assigned: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      picked_up: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      out_for_delivery: 'bg-blue-600/10 text-blue-700 border-blue-600/20',
      delivered: 'bg-primary/10 text-primary border-primary/20',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return colors[status] || 'bg-muted text-muted-foreground border-border';
  };

  const getStatusIcon = (status) => {
    const icons = {
      placed: '⏳',
      confirmed: '✅',
      preparing: '🥘',
      ready: '🍴',
      searching_driver: '🔍',
      assigned: '🛵',
      picked_up: '🚚',
      out_for_delivery: '🏠',
      delivered: '🎉',
      cancelled: '❌'
    };
    return icons[status] || '📋';
  };
  
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        loadOrders();
      }
    } catch (err) {
      console.error("Failed to cancel order", err);
      alert(err.response?.data?.message || "Failed to cancel order");
    }
  };

  const CancelOrderButton = ({ order }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    
    useEffect(() => {
      const calculateTime = () => {
        const now = new Date();
        const orderTime = new Date(order.createdAt);
        const diff = 60 - Math.floor((now - orderTime) / 1000);
        return Math.max(0, diff);
      };

      setTimeLeft(calculateTime());
      const interval = setInterval(() => {
        const remaining = calculateTime();
        setTimeLeft(remaining);
        if (remaining <= 0) clearInterval(interval);
      }, 1000);

      return () => clearInterval(interval);
    }, [order.createdAt]);

    if (order.status !== 'placed' || timeLeft <= 0) return null;

    return (
      <button
        onClick={() => handleCancelOrder(order._id)}
        className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition-all shadow-sm animate-in fade-in slide-in-from-right-4"
      >
        <X className="w-3.5 h-3.5" /> Cancel Order ({timeLeft}s)
      </button>
    );
  };

  const filteredOrders = orders.filter(order =>
    (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusFilters = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'out_for_delivery', label: 'In Transit' },
    { id: 'delivered', label: 'Delivered' }
  ];

  return (
    <div className="min-h-screen bg-background pt-16 lg:pt-[72px]">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-16 lg:top-[72px] z-10 transition-all">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Your Orders</h1>
                <p className="text-sm font-medium text-muted-foreground tracking-wide">Manage and track your deliveries</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search by order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 h-12 bg-muted/50 border border-transparent rounded-full focus:bg-background focus:border-border focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2 styled-scrollbar">
            {statusFilters.map((status) => (
              <button
                key={status.id}
                onClick={() => setFilter(status.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                  filter === status.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-eco'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden group hover:border-primary/30 transition-colors">
                {/* Order Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-2xl bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm border border-border/50">{getStatusIcon(order.status)}</span>
                      <h3 className="font-extrabold text-foreground text-lg">Order #{order.orderNumber || order._id?.slice(-8)}</h3>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground ml-11">{new Date(order.createdAt).toLocaleString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${getStatusColor(order.status)} self-start sm:self-auto shadow-sm`}>
                    {(order.status || 'pending').replace('_', ' ')}
                  </span>
                </div>

                <OrderStepper status={order.status} />

                {/* Order Details */}
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Items */}
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Items Summary</h4>
                      <div className="space-y-3">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 text-sm">
                            <span className="w-8 h-8 bg-muted text-foreground rounded-lg flex items-center justify-center text-xs font-bold border border-border">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold text-foreground">{item.productId?.name || item.name || 'Product'}</span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-sm font-semibold text-primary pl-11">+{order.items.length - 3} more items...</p>
                        )}
                        {(!order.items || order.items.length === 0) && (
                           <p className="text-sm font-semibold text-muted-foreground">Product details unavailable</p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="flex-1 md:border-l md:border-border md:pl-8">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Delivery Details</h4>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground leading-snug pt-1">{order.deliveryAddress?.street || order.deliveryAddress || 'Address not available'}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-semibold text-foreground pt-0.5">ETA: {order.estimatedDeliveryTime || '⏳ Calculating...'}</span>
                        </div>
                        {order.deliveryPartner && (
                          <div className="mt-4 p-3 bg-secondary/5 rounded-xl border border-secondary/20 animate-in fade-in zoom-in-95">
                            <h5 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Delivery Partner</h5>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary">
                                {order.deliveryPartner.name?.[0] || 'A'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{order.deliveryPartner.name || 'Assigned Partner'}</p>
                                <p className="text-[10px] font-medium text-muted-foreground">Rating: 4.8 ★ | {order.emissionData?.vehicleType || 'EV'}</p>
                              </div>
                            </div>
                            {order.deliveryPartner.phone && (
                               <a href={`tel:${order.deliveryPartner.phone}`} className="mt-3 flex items-center justify-center gap-2 w-full py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold">Call Partner</a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Environmental Impact Details */}
                  {order.emissionData && (
                    <div className="mt-8 p-5 bg-primary/5 rounded-2xl border border-primary/20">
                      <div className="flex items-center space-x-2 mb-4">
                        <Leaf className="w-5 h-5 text-primary" />
                        <span className="text-sm font-extrabold text-foreground uppercase tracking-wide">Eco Impact</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card rounded-xl p-3 border border-border shadow-sm text-center">
                          <p className="text-2xl font-extrabold text-destructive tracking-tight mb-1">{order.emissionData.emission?.toFixed(1) || 0}<span className="text-sm font-bold text-muted-foreground ml-0.5">g</span></p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CO₂ Footprint</p>
                        </div>
                        <div className="bg-card rounded-xl p-3 border border-border shadow-sm text-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-8 h-8 bg-primary/10 rounded-bl-full"></div>
                          <p className="text-2xl font-extrabold text-primary tracking-tight mb-1">{order.emissionData.savedEmission?.toFixed(1) || 0}<span className="text-sm font-bold text-muted-foreground ml-0.5">g</span></p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CO₂ Saved</p>
                        </div>
                        <div className="bg-card rounded-xl p-3 border border-border shadow-sm text-center">
                          <p className="text-2xl font-extrabold text-foreground tracking-tight mb-1">{order.distanceKm?.toFixed(1) || order.distance?.toFixed(1) || 0}<span className="text-sm font-bold text-muted-foreground ml-0.5">km</span></p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Distance</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                  {/* Searching Driver Banner */}
                  {order.status === 'searching_driver' && (
                    <div className="mt-8 p-6 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center relative">
                        <Search className="w-8 h-8 text-amber-600 animate-bounce" />
                        <div className="absolute inset-0 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin"></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-foreground">Finding your Eco-Captain...</h4>
                        <p className="text-sm font-semibold text-muted-foreground max-w-sm mx-auto">We're searching for the nearest available delivery partner to pick up your forest-fresh order.</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 rounded-full">
                         <div className="w-2 h-2 bg-amber-600 rounded-full animate-ping"></div>
                         <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Live Search Active</span>
                      </div>
                    </div>
                  )}

                  {/* Order Footer & Tracking Map */}
                  <div className="px-6 sm:px-8 py-5 border-t border-border bg-muted/10 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total Paid</p>
                        <p className="text-2xl font-extrabold text-foreground tracking-tight">₹{order.totalAmount || 0}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <CancelOrderButton order={order} />
                        {['searching_driver', 'out_for_delivery', 'picked_up', 'preparing', 'pending', 'confirmed'].includes(order.status) && (
                      <button 
                        onClick={() => setTrackingOrderId(trackingOrderId === order._id ? null : order._id)}
                        className={`h-10 sm:h-12 px-5 sm:px-6 rounded-xl text-sm font-bold transition-colors flex items-center space-x-2 shadow-sm ${
                          trackingOrderId === order._id 
                            ? 'bg-muted text-foreground border border-border'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        <span>{trackingOrderId === order._id ? 'Close Map' : 'Track Order'}</span>
                        {trackingOrderId === order._id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                    {order.status === 'delivered' && !order.review && (
                      <button 
                        onClick={() => {
                          setReviewOrderId(order._id);
                          setRating(5);
                          setComment('');
                        }}
                        className="h-10 sm:h-12 px-5 sm:px-6 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center space-x-2 shadow-eco animate-pulse"
                      >
                        <Star className="w-4 h-4 fill-current" />
                        <span>Rate Order</span>
                      </button>
                    )}
                  </div>
                </div>
                  
                  {/* The Live Map */}
                  <LiveRouteMap order={order} isExpanded={trackingOrderId === order._id} />

                  {/* Chat with Partner (Mar 28 - Ultra Feature) */}
                  {trackingOrderId === order._id && order.deliveryPartner && (
                    <ChatBubble 
                      orderId={order._id} 
                      recipientId={order.deliveryPartner._id || order.deliveryPartner}
                      recipientName={order.deliveryPartner.name}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card border border-border border-dashed rounded-3xl max-w-2xl mx-auto shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
               <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-3">No orders found</h2>
            <p className="text-muted-foreground mb-8 text-lg font-medium">
              {filter === 'all' ? "You haven't placed any orders yet. Start shopping to fill this up!" : `No ${filter.replace('_', ' ')} orders available right now.`}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="px-8 h-14 bg-primary text-primary-foreground rounded-xl font-extrabold text-lg hover:bg-primary/90 transition-all shadow-eco inline-flex items-center justify-center transform hover:-translate-y-0.5"
            >
              Start Shopping
            </button>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {reviewOrderId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-extrabold text-foreground">Rate Your Experience</h3>
                </div>
                <button onClick={() => setReviewOrderId(null)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">How was the service?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setRating(s)}
                        className={`p-1 transition-transform active:scale-90 ${s <= rating ? 'text-amber-400 scale-110' : 'text-muted/40 hover:text-muted/60'}`}
                      >
                        <Star className={`w-10 h-10 ${s <= rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <p className="text-xl font-black text-foreground">
                    {rating === 5 ? 'Excellent! 🌟' : rating === 4 ? 'Good! 👍' : rating === 3 ? 'Okay 😐' : rating === 2 ? 'Disappointed 🙁' : 'Very Poor 😠'}
                  </p>
                </div>

                {/* Comment Box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Add a Comment (Optional)
                  </label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked or how we can improve..."
                    className="w-full h-32 p-4 bg-muted/50 border border-border rounded-2xl focus:bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none font-medium text-sm"
                  />
                </div>

                <button 
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-extrabold text-lg shadow-eco hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {submittingReview ? (
                    <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Review
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
