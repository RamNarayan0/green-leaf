/**
 * DeliveryDashboard.jsx - Delivery Partner Dashboard
 * View and manage delivery jobs
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../state/authStore';
import LiveDeliveryMap from '../../components/LiveDeliveryMap';
import { 
  Package, Truck, MapPin, Clock, CheckCircle, XCircle, 
  Navigation, Phone, DollarSign, Star, Menu, X, Eye
} from 'lucide-react';

const DeliveryDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('available');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    rating: 0,
    todayDeliveries: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch delivery partner's deliveries
      const response = await api.get('/analytics/my-deliveries');
      
      if (response.data.success) {
        const orders = response.data.orders || [];
        
        // Categorize orders
        const available = orders.filter(o => o.status === 'confirmed');
        const active = orders.filter(o => ['picked_up', 'out_for_delivery', 'accepted'].includes(o.status));
        const completed = orders.filter(o => o.status === 'delivered');
        
        setAvailableOrders(available);
        setActiveDeliveries(active);
        setCompletedDeliveries(completed);
        
        // Calculate stats
        const totalEarnings = completed.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
        setStats({
          totalDeliveries: completed.length,
          totalEarnings,
          rating: user?.rating || 4.8,
          todayDeliveries: completed.filter(o => 
            new Date(o.deliveredAt).toDateString() === new Date().toDateString()
          ).length
        });
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'accepted' });
      fetchData();
    } catch (err) {
      console.error('Error accepting order:', err);
      setError('Failed to accept order');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      accepted: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleViewMap = (order) => {
    setSelectedOrder(order);
    setShowMap(true);
  };

  const closeMap = () => {
    setShowMap(false);
    setSelectedOrder(null);
  };

  if (user?.role !== 'delivery_partner' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only delivery partners can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Delivery Dashboard</h1>
              <p className="text-gray-500">Manage your delivery jobs</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalDeliveries}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalEarnings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Deliveries</p>
                <p className="text-2xl font-bold text-gray-800">{stats.todayDeliveries}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-2xl font-bold text-gray-800 flex items-center gap-1">
                  {stats.rating}
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'available' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Package className="w-5 h-5" />
                Available ({availableOrders.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'active' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Truck className="w-5 h-5" />
                Active ({activeDeliveries.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'completed' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Completed ({completedDeliveries.length})
              </span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-3">Loading orders...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'available' && (
              availableOrders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">No Available Orders</h3>
                  <p className="text-gray-500 mt-2">Check back later for new delivery jobs.</p>
                </div>
              ) : (
                availableOrders.map(order => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    type="available"
                    onAccept={acceptOrder}
                    getStatusColor={getStatusColor}
                  />
                ))
              )
            )}

            {activeTab === 'active' && (
              activeDeliveries.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">No Active Deliveries</h3>
                  <p className="text-gray-500 mt-2">Accept a delivery to get started.</p>
                </div>
              ) : (
                activeDeliveries.map(order => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    type="active"
                    onStatusUpdate={updateOrderStatus}
                    onViewMap={handleViewMap}
                    getStatusColor={getStatusColor}
                  />
                ))
              )
            )}

            {activeTab === 'completed' && (
              completedDeliveries.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">No Completed Deliveries</h3>
                  <p className="text-gray-500 mt-2">Complete your first delivery to see it here.</p>
                </div>
              ) : (
                completedDeliveries.map(order => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    type="completed"
                    getStatusColor={getStatusColor}
                  />
                ))
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, type, onAccept, onStatusUpdate, getStatusColor }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800">Order #{order.orderNumber}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {order.shop?.name || 'Shop'} → {order.customer?.name || 'Customer'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-green-600">{formatCurrency(order.deliveryFee)}</p>
          <p className="text-xs text-gray-500">{order.distanceKm?.toFixed(1) || '-'} km</p>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <MapPin className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Pickup</p>
            <p className="text-xs text-gray-500">{order.shop?.address || 'Shop location'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 mt-2">
          <div className="mt-1">
            <Navigation className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Delivery</p>
            <p className="text-xs text-gray-500">{order.deliveryAddress || 'Customer location'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {type === 'available' && (
          <button
            onClick={() => onAccept(order._id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Accept Delivery
          </button>
        )}

        {type === 'active' && order.status === 'accepted' && (
          <button
            onClick={() => onStatusUpdate(order._id, 'picked_up')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="w-5 h-5" />
            Mark Picked Up
          </button>
        )}

        {type === 'active' && order.status === 'picked_up' && (
          <button
            onClick={() => onStatusUpdate(order._id, 'out_for_delivery')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Truck className="w-5 h-5" />
            Start Delivery
          </button>
        )}

        {type === 'active' && order.status === 'out_for_delivery' && (
          <button
            onClick={() => onStatusUpdate(order._id, 'delivered')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Mark Delivered
          </button>
        )}

        {type === 'active' && (
          <button 
            onClick={() => onViewMap(order)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            title="View on Map"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}

        <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
          <Navigation className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DeliveryDashboard;

