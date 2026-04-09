import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../state/authStore';
import { api } from '../services/api';
import { 
  Leaf, Package, MapPin, TrendingUp, Clock, Truck, Award, 
  DollarSign, ShoppingBag, CheckCircle, XCircle, Navigation
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user?.role]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Load dashboard data based on role
      const dashboardRes = await api.get('/analytics/dashboard');
      if (dashboardRes.data.success) {
        setData(dashboardRes.data.data);
      }

      // Load orders based on role
      let ordersEndpoint = '/orders/my-orders';
      if (user?.role === 'delivery_partner') {
        ordersEndpoint = '/analytics/my-deliveries';
      } else if (user?.role === 'shopkeeper') {
        ordersEndpoint = '/analytics/shop-orders';
      }
      
      const ordersRes = await api.get(ordersEndpoint);
      // Handle different response formats
      if (ordersRes.data.success) {
        const ordersData = ordersRes.data.data?.orders || ordersRes.data.orders || ordersRes.data.data || [];
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Set empty data to prevent crashes
      setData({ user, stats: {} });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      picked: 'bg-indigo-100 text-indigo-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Customer Dashboard
  if (user?.role === 'customer') {
    return <CustomerDashboard data={data} orders={orders} loading={loading} onRefresh={loadDashboard} getStatusColor={getStatusColor} formatCurrency={formatCurrency} />;
  }
  
  // Delivery Partner Dashboard
  if (user?.role === 'delivery_partner') {
    return <DeliveryPartnerDashboard data={data} orders={orders} loading={loading} onRefresh={loadDashboard} getStatusColor={getStatusColor} formatCurrency={formatCurrency} />;
  }
  
  // Shopkeeper Dashboard
  if (user?.role === 'shopkeeper') {
    return <ShopkeeperDashboard data={data} orders={orders} loading={loading} onRefresh={loadDashboard} getStatusColor={getStatusColor} formatCurrency={formatCurrency} />;
  }
  
  // Admin Dashboard
  return <AdminDashboard data={data} orders={orders} loading={loading} onRefresh={loadDashboard} getStatusColor={getStatusColor} formatCurrency={formatCurrency} />;
};

// Customer Dashboard Component
const CustomerDashboard = ({ data, orders, loading, getStatusColor, formatCurrency }) => {
  const stats = data?.stats || {};
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Green Leaf</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Eco Score: {data?.user?.ecoScore || 0}</span>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {data?.user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Carbon Saved</p>
                <p className="text-2xl font-bold text-green-600">{(stats.emissionSaved / 1000)?.toFixed(2) || 0} kg</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Eco Score</p>
                <p className="text-2xl font-bold text-emerald-600">{data?.user?.ecoScore || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">My Orders</h2>
          </div>
          <div className="p-6">
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-800">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-sm text-gray-500">{order.distanceKm?.toFixed(1) || '-'} km</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
                <button 
                  onClick={() => window.location.href = '/shops'}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Environmental Impact Banner */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Your Environmental Impact</h2>
              <p className="text-green-100">
                By choosing Green Leaf, you've helped reduce {(stats.emissionSaved / 1000)?.toFixed(2) || 0} kg of carbon emissions!
                Every delivery uses eco-friendly vehicles.
              </p>
            </div>
            <div className="text-6xl">🌍</div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Delivery Partner Dashboard Component
const DeliveryPartnerDashboard = ({ data, orders, loading, getStatusColor, formatCurrency }) => {
  const stats = data?.stats || {};
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Green Leaf Deliveries</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${stats.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              <span className={`w-2 h-2 rounded-full ${stats.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-sm font-medium">{stats.isAvailable ? 'Online' : 'Offline'}</span>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {data?.user?.name?.charAt(0) || 'D'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalDeliveries || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.earnings)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Distance Travelled</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalDistance || 0} km</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="text-lg font-bold text-gray-800 capitalize">{stats.vehicleType?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">My Deliveries</h2>
          </div>
          <div className="p-6">
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div key={order._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-800">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {order.customer?.name || 'Customer'} • {order.shop?.name || 'Shop'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{order.distanceKm?.toFixed(1) || '-'} km</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Navigation className="w-4 h-4" />
                          <span className="capitalize">{order.emissionData?.vehicleType?.replace('_', ' ') || '-'}</span>
                        </div>
                      </div>
                      
                      {order.status === 'confirmed' && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                          Accept Delivery
                        </button>
                      )}
                      {order.status === 'picked_up' && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                          Start Delivery
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No deliveries yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Shopkeeper Dashboard Component
const ShopkeeperDashboard = ({ data, orders, loading, getStatusColor, formatCurrency }) => {
  const stats = data?.stats || {};
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">{stats.shopName || 'My Shop'}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Shopkeeper Dashboard</span>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {data?.user?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Shop Orders</h2>
          </div>
          <div className="p-6">
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div key={order._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-800">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {order.customer?.name || 'Customer'} • {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{order.items?.length || 0} items</span>
                        <span className="mx-2">•</span>
                        <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      
                      {order.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                            <XCircle className="w-4 h-4 inline mr-1" />
                            Reject
                          </button>
                          <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Accept
                          </button>
                        </div>
                      )}
                      {order.status === 'confirmed' && (
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                          Ready for Pickup
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ data, orders, loading, getStatusColor, formatCurrency }) => {
  const stats = data?.stats || {};
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Green Leaf Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Admin Dashboard</span>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {data?.user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Carbon Saved</p>
                <p className="text-2xl font-bold text-green-600">{(stats.emissionSaved / 1000)?.toFixed(2) || 0} kg</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold text-gray-800">{stats.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Shops</span>
                <span className="font-semibold text-gray-800">{stats.totalShops || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivered Orders</span>
                <span className="font-semibold text-green-600">{stats.deliveredOrders || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Environmental Impact</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Emissions</span>
                <span className="font-semibold text-gray-800">{(stats.totalEmission / 1000)?.toFixed(2) || 0} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Emission Saved</span>
                <span className="font-semibold text-green-600">{(stats.emissionSaved / 1000)?.toFixed(2) || 0} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reduction</span>
                <span className="font-semibold text-green-600">
                  {stats.totalEmission > 0 ? ((stats.emissionSaved / stats.totalEmission) * 100)?.toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
