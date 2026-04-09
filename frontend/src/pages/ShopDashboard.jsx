import React, { useState, useEffect } from 'react';
import { Store, Package, Settings, Plus, TrendingUp, AlertCircle, Loader, ShoppingCart, Truck, ShieldCheck, Weight, Navigation, PieChart as PieChartIcon } from 'lucide-react';
import { useAuthStore } from '../state/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import socketService from '../services/socket';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ShopDashboard = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('shop-profile');
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stockQuantity: '',
    primaryImage: '',
    brand: '',
    weight: ''
  });
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Form States
  const [shopFormData, setShopFormData] = useState({
    name: '',
    phone: '',
    shopType: 'Grocery',
    street: '',
    city: '',
    zipCode: '',
    description: ''
  });

  useEffect(() => {
    fetchShopData();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      if (res.data?.success) {
        setAvailableCategories(res.data.data.categories || []);
        if (res.data.data.categories?.length > 0) {
          setProductFormData(prev => ({ ...prev, category: res.data.data.categories[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    if (shop?._id && token) {
      socketService.connect(token);
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('join-room', `shop_${shop._id}`);
        const handlePartnerAssigned = (data) => {
          setTrackingOrder(data);
          setOrders(prev => prev.map(o => o._id === data.orderId ? { ...o, status: { ...o.status, current: 'assigned' }, deliveryPartner: data.driver } : o));
        };
        socket.on('delivery-partner-assigned', handlePartnerAssigned);
        return () => socket.off('delivery-partner-assigned', handlePartnerAssigned);
      }
    }
  }, [shop?._id, token]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
const res = await api.get('/shops/my-shop');
      if (res.data?.shop) {
        setShop(res.data.shop);
        setShopFormData({
          name: res.data.shop.name || '',
          phone: res.data.shop.phone || '',
          shopType: res.data.shop.category || 'Grocery',
          street: res.data.shop.address?.street || '',
          city: res.data.shop.address?.city || '',
          zipCode: res.data.shop.address?.zipCode || '',
          description: res.data.shop.description || ''
        });
        
        // Fetch products for this shop
        const prodRes = await api.get(`/shops/${res.data.shop._id}/products`);
        setProducts(prodRes.data?.products || []);

        // Fetch orders for this shop
const orderRes = await api.get('/shops/my-shop/orders');
        setOrders(orderRes.data?.orders || []);
      } else {
        // No shop found for this user
        navigate('/shop-onboarding');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/shop-onboarding');
      } else {
        setError('Failed to load shop data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: shopFormData.name,
        phone: shopFormData.phone,
        shopType: shopFormData.shopType,
        description: shopFormData.description,
        address: {
          street: shopFormData.street,
          city: shopFormData.city,
          zipCode: shopFormData.zipCode
        }
      };

      if (shop) {
        await api.put(`/shops/${shop._id}`, payload);
        setSuccess('Shop updated successfully!');
      } else {
        const res = await api.post('/shops', payload);
        setShop(res.data.shop);
        setSuccess('Shop created successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save shop profile.');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...productFormData,
        price: Number(productFormData.price),
        stockQuantity: Number(productFormData.stockQuantity) || 0,
        comparePrice: Number(productFormData.price) * 1.2,
        shop: shop._id
      };
      
const res = await api.post('/products', payload);
      setProducts([res.data.data.product, ...products]);
      setShowProductModal(false);
      setSuccess('Product listed successfully!');
      setProductFormData({ name: '', description: '', price: '', category: availableCategories[0]?._id || '', stockQuantity: '', primaryImage: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product.');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/shop-accept`);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: { ...o.status, current: 'confirmed' } } : o));
      setSuccess('Order accepted!');
    } catch (err) {
      setError('Failed to accept order.');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/shop-reject`);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: { ...o.status, current: 'cancelled' } } : o));
      setSuccess('Order rejected.');
    } catch (err) {
      setError('Failed to reject order.');
    }
  };

  const handleStartPreparing = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/preparing`);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: { ...o.status, current: 'preparing' } } : o));
      setSuccess('Order is now being prepared!');
    } catch (err) {
      setError('Failed to update status.');
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/ready`);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: { ...o.status, current: 'ready' } } : o));
      setSuccess('Order marked as ready for pickup!');
    } catch (err) {
      setError('Failed to mark order as ready.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Store className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Shopkeeper Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your storefront, products, and incoming orders.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('shop-profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'shop-profile' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-5 h-5" />
            Shop Profile
          </button>
          <button
            onClick={() => setActiveTab('products')}
            disabled={!shop}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              !shop ? 'opacity-50 cursor-not-allowed' : activeTab === 'products' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-5 h-5" />
            Inventory {shop && `(${products.length})`}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            disabled={!shop}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              !shop ? 'opacity-50 cursor-not-allowed' : activeTab === 'orders' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Order Requests {orders.filter(o => !['delivered', 'cancelled'].includes(o.status.current)).length > 0 && `(${orders.filter(o => !['delivered', 'cancelled'].includes(o.status.current)).length})`}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            disabled={!shop}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              !shop ? 'opacity-50 cursor-not-allowed' : activeTab === 'analytics' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <PieChartIcon className="w-5 h-5" />
            Analytics & Reports
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-3 pb-24">
          <div className="glass p-6 sm:p-8 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden">
            {error && (
              <div className="mb-6 bg-destructive/10 text-destructive px-4 py-3 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 block shrink-0" />
                <p className="font-medium text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-500/10 text-green-600 px-4 py-3 rounded-xl flex items-center gap-3">
                <Store className="w-5 h-5 block shrink-0" />
                <p className="font-medium text-sm">{success}</p>
              </div>
            )}

            {activeTab === 'shop-profile' && (
              <form onSubmit={handleShopSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">{shop ? 'Edit Shop Profile' : 'Create Your Shop'}</h2>
                  <p className="text-sm text-muted-foreground mb-6">Enter your business details below to be discovered by local customers.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Shop Name</label>
                    <input required type="text" value={shopFormData.name} onChange={(e) => setShopFormData({...shopFormData, name: e.target.value})} placeholder="e.g. Green Leaf Koramangala" className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Contact Phone</label>
                    <input required type="text" value={shopFormData.phone} onChange={(e) => setShopFormData({...shopFormData, phone: e.target.value})} placeholder="e.g. 9876543210" className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Shop Type</label>
                    <select required value={shopFormData.shopType} onChange={(e) => setShopFormData({...shopFormData, shopType: e.target.value})} className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none">
                      {['Grocery', 'Vegetables & Fruits', 'Dairy', 'Bakery', 'General Store', 'Pharmacy', 'Meat & Seafood', 'Sweets & Snacks', 'Organic Store'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-foreground">Description</label>
                    <textarea value={shopFormData.description} onChange={(e) => setShopFormData({...shopFormData, description: e.target.value})} placeholder="Describe what you sell..." className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Street Address</label>
                    <input required type="text" value={shopFormData.street} onChange={(e) => setShopFormData({...shopFormData, street: e.target.value})} placeholder="e.g. 100 Outer Ring Road" className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">City</label>
                      <input required type="text" value={shopFormData.city} onChange={(e) => setShopFormData({...shopFormData, city: e.target.value})} placeholder="e.g. Bangalore" className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Zip Code</label>
                      <input required type="text" value={shopFormData.zipCode} onChange={(e) => setShopFormData({...shopFormData, zipCode: e.target.value})} placeholder="e.g. 560034" className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold shadow-eco transition-all w-full md:w-auto">
                    {shop ? 'Save Changes' : 'Create Shop'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-border">
                  <h2 className="text-xl font-bold">Product Inventory</h2>
                  <button onClick={() => setShowProductModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
                
                {products.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-lg text-foreground">No products listed</p>
                    <p className="mt-1">Click "Add Product" to list your first item.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(p => (
                      <div key={p._id} className="border border-border bg-background/50 rounded-xl p-4 hover:border-primary/50 transition-colors">
                        <img src={p.primaryImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                        <h4 className="font-bold text-foreground truncate">{p.name}</h4>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-bold text-primary">₹{p.price}</span>
                          <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md tracking-wider uppercase">Stock: {p.stockQuantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-border">
                  <h2 className="text-xl font-bold">New & Active Orders</h2>
                  <div className="flex gap-2">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Zepto Style Dispatch</span>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-lg text-foreground">No orders yet</p>
                    <p className="mt-1">Orders from customers will appear here in real-time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order._id} className="border border-border bg-background/30 rounded-2xl p-4 sm:p-6 hover:border-primary/30 transition-all group overflow-hidden relative">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              #{order.orderNumber.slice(-4)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">{order.customer?.name || 'Customer'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()} • {order.items.length} items</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                            order.status.current === 'delivered' ? 'bg-green-500/10 text-green-500' :
                            order.status.current === 'picked_up' ? 'bg-blue-500/10 text-blue-500' :
                            order.status.current === 'preparing' ? 'bg-orange-500/10 text-orange-500' :
                            'bg-primary/10 text-primary animate-pulse'
                          }`}>
                            {order.status.current.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-medium">
                              <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                              <span className="text-foreground">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-border flex justify-between font-bold text-sm">
                            <span>Total Bill</span>
                            <span className="text-primary">₹{order.totalAmount}</span>
                          </div>
                        </div>

                        {/* Action - Correct Workflow */}
                        <div className="flex gap-2">
                          {order.status.current === 'placed' && (
                            <>
                              <button 
                                onClick={() => handleAcceptOrder(order._id)}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl text-xs font-bold shadow-eco transition-all"
                              >
                                Accept Order
                              </button>
                              <button 
                                onClick={() => handleRejectOrder(order._id)}
                                className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive py-2.5 rounded-xl text-xs font-bold transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {order.status.current === 'confirmed' && (
                            <button 
                              onClick={() => handleStartPreparing(order._id)}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status.current === 'preparing' && (
                            <button 
                              onClick={() => handleMarkReady(order._id)}
                              className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
                            >
                              Mark Ready for Pickup
                            </button>
                          )}
                          {order.status.current === 'ready' && (
                            <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-muted text-muted-foreground rounded-xl text-xs font-bold border border-dashed border-muted-foreground/30">
                              <Loader className="w-3 h-3 animate-spin" />
                              Waiting for Delivery Agent
                            </div>
                          )}
                          {order.status.current === 'assigned' && (
                            <div className="w-full space-y-3">
                              <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-500/5 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/10 animate-pulse">
                                <Truck className="w-3.5 h-3.5" />
                                Agent Assigned & En-Route
                              </div>
                              <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 border border-indigo-200">
                                  {order.deliveryPartner?.name?.[0] || 'A'}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-black text-foreground">{order.deliveryPartner?.name || 'Eco Captain'}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                    {order.deliveryPartner?.vehicle || 'Electric Bike'}
                                  </p>
                                </div>
                                {order.deliveryPartner?.phone && (
                                  <a href={`tel:${order.deliveryPartner.phone}`} className="p-2 bg-indigo-500 text-white rounded-lg shadow-sm">
                                    <Truck className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {order.status.current === 'picked_up' && (
                            <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500/10 text-blue-600 rounded-xl text-xs font-bold">
                              <truck className="w-4 h-4" />
                              Out for Delivery
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-bold">Store Performance</h2>
                    <p className="text-xs text-muted-foreground">Based on {orders.filter(o => o.status.current === 'delivered').length} completed orders</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-2xl font-black text-primary">₹{orders.filter(o => o.status.current === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Avg Order Value</p>
                    <p className="text-2xl font-black">₹{orders.filter(o => o.status.current === 'delivered').length ? Math.round(orders.filter(o => o.status.current === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0) / orders.filter(o => o.status.current === 'delivered').length) : 0}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Items Sold</p>
                    <p className="text-2xl font-black">{orders.filter(o => o.status.current === 'delivered').reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Revenue Chart */}
                  <div className="p-6 border border-border rounded-3xl bg-background/50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Revenue by Order (Recent)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={orders.filter(o => o.status.current === 'delivered').slice(0, 7).map((o, i) => ({ name: `Order ${i+1}`, revenue: o.totalAmount }))}>
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                          <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Products Pie */}
                  <div className="p-6 border border-border rounded-3xl bg-background/50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Top Selling Items</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {(() => {
                            const productCounts = {};
                            orders.filter(o => o.status.current === 'delivered').forEach(o => {
                              o.items.forEach(item => {
                                productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
                              });
                            });
                            let pieData = Object.entries(productCounts).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value - a.value).slice(0, 5);
                            if (pieData.length === 0) pieData = [{ name: 'No Data', value: 1 }];
                            const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                            return (
                              <>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                              </>
                            );
                          })()}
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {showProductModal && (
              <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm px-6 py-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Add New Product</h2>
                  <button onClick={() => setShowProductModal(false)} className="px-3 py-1 bg-muted hover:bg-border rounded-lg text-sm font-bold transition-colors">Cancel</button>
                </div>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Product Name</label>
                      <input required type="text" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Category</label>
                      <select required value={productFormData.category} onChange={e => setProductFormData({...productFormData, category: e.target.value})} className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none">
                        {availableCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Price (₹)</label>
                      <input required type="number" min="0" value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Stock Available</label>
                      <input required type="number" min="0" value={productFormData.stockQuantity} onChange={e => setProductFormData({...productFormData, stockQuantity: e.target.value})} className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Brand / Manufacturer</label>
                      <input type="text" value={productFormData.brand} onChange={e => setProductFormData({...productFormData, brand: e.target.value})} placeholder="e.g. GreenLife Organic" className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-primary" /> Weight (grams)</label>
                      <input type="number" value={productFormData.weight} onChange={e => setProductFormData({...productFormData, weight: e.target.value})} placeholder="e.g. 500" className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Image URL</label>
                      <input required type="url" placeholder="https://unsplash.com/..." value={productFormData.primaryImage} onChange={e => setProductFormData({...productFormData, primaryImage: e.target.value})} className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Description</label>
                      <textarea value={productFormData.description} onChange={e => setProductFormData({...productFormData, description: e.target.value})} className="w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[80px]" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold shadow-eco transition-all mt-4">
                    List Product to Public
                  </button>
                </form>
              </div>
            )}

            {trackingOrder && (
              <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-background w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-200">
                  <div className="p-6 bg-primary text-primary-foreground text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <Truck className="w-12 h-12 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-xl font-black tracking-tight mb-1">Agent Assigned!</h3>
                    <p className="text-primary-foreground/80 text-sm font-medium">Head to the front desk</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-border">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Order ID</span>
                        <span className="font-bold text-foreground">#{trackingOrder.orderId?.slice(-6) || 'N/A'}</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20 shrink-0">
                           <span className="text-lg font-black">{trackingOrder.driver?.name?.[0] || 'A'}</span>
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-lg">{trackingOrder.driver?.name}</p>
                          <p className="text-sm font-medium text-muted-foreground">{trackingOrder.driver?.vehicle}</p>
                        </div>
                      </div>
                      {trackingOrder.driver?.phone && (
                        <div className="pt-2">
                           <a href={`tel:${trackingOrder.driver.phone}`} className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-500/10 text-blue-600 rounded-xl font-bold">Call Agent</a>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setTrackingOrder(null)} className="mt-6 w-full py-3 bg-muted hover:bg-border transition-colors text-foreground rounded-xl font-bold">Accept & Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;
