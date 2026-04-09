/**
 * ShopDashboard.jsx - Shopkeeper Dashboard
 * Shows overview of shop performance: products, orders, revenue, pending orders
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, shopsAPI, productsAPI } from '../../services/api';
import { useAuthStore } from '../../state/authStore';
import ShopAnalyticsCharts from '../../components/ShopAnalyticsCharts';
import { 
  Package, ShoppingBag, DollarSign, Clock, 
  TrendingUp, ArrowRight, Store, AlertCircle
} from 'lucide-react';

const ShopDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get shopkeeper's shop using the correct API
      const shopRes = await shopsAPI.getMyShop();
      
      if (shopRes.data.success && shopRes.data.shop) {
        const shopData = shopRes.data.shop;
        setShop(shopData);
        
        // Get shop stats
        const statsRes = await shopsAPI.getMyShopStats();
        
        // Get products count
        const productsRes = await productsAPI.getByShop(shopData._id);
        
        // Get orders
        const ordersRes = await shopsAPI.getMyShopOrders();
        
        if (ordersRes.data.success) {
          const orders = ordersRes.data.orders || [];
          const pendingOrders = orders.filter(o => 
            o.status === 'pending' || o.status === 'confirmed'
          );
          
          setStats({
            totalProducts: productsRes.data.data?.products?.length || productsRes.data.products?.length || 0,
            totalOrders: statsRes.data.stats?.totalOrders || orders.length,
            totalRevenue: statsRes.data.stats?.totalRevenue || 0,
            pendingOrders: statsRes.data.stats?.pendingOrders || pendingOrders.length,
            recentOrders: orders.slice(0, 5)
          });
        }
      } else {
        // No shop found - prompt to create one
        setError('No shop found. Please create your shop first.');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response?.status === 404) {
        setError('No shop found. Please create your shop first.');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user is shopkeeper
  if (user?.role !== 'shopkeeper' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only shopkeepers can view this dashboard.</p>
        </div>
      </div>
    );
  }

  // Show error if no shop
  if (error && !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Welcome, {user?.name}!</h2>
          <p className="text-gray-500 mt-2 mb-6">{error}</p>
          <button
            onClick={() => navigate('/shop-settings')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Store className="w-5 h-5" />
            Create Your Shop
          </button>
        </div>
      </div>
    );
  }

  // Stat card component
  const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <Link 
      to={link}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Link>
  );

  // Order status badge
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-purple-100 text-purple-700',
      ready: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Shop Dashboard</h1>
              <p className="text-gray-500">Welcome back, {user?.name}</p>
            </div>
            <Link
              to="/add-product"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Package className="w-5 h-5" />
              Add Product
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Shop Info */}
        {shop && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <Store className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{shop.name}</h2>
                <p className="text-sm text-gray-500">{shop.address?.street}, {shop.address?.city}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Products" 
              value={stats.totalProducts} 
              icon={Package} 
              color="bg-blue-100 text-blue-600"
              link="/manage-products"
            />
            <StatCard 
              title="Total Orders" 
              value={stats.totalOrders} 
              icon={ShoppingBag} 
              color="bg-purple-100 text-purple-600"
              link="/shop-orders"
            />
            <StatCard 
              title="Total Revenue" 
              value={`₹${(stats.totalRevenue || 0).toFixed(2)}`} 
              icon={DollarSign} 
              color="bg-green-100 text-green-600"
              link="/shop-orders"
            />
            <StatCard 
              title="Pending Orders" 
              value={stats.pendingOrders} 
              icon={Clock} 
              color="bg-yellow-100 text-yellow-600"
              link="/shop-orders"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link 
            to="/manage-products"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">Manage Products</h3>
              <p className="text-sm text-gray-500">View and edit your products</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link 
            to="/shop-orders"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">Shop Orders</h3>
              <p className="text-sm text-gray-500">View incoming orders</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link 
            to="/shop-settings"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">Shop Settings</h3>
              <p className="text-sm text-gray-500">Update your shop details</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>

        {/* Analytics Charts */}
        {!loading && stats.totalOrders > 0 && (
          <ShopAnalyticsCharts orders={stats.recentOrders} />
        )}

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
          </div>
          
          {stats.recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentOrders.map((order) => (
                <div key={order._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">Order #{order.orderNumber || (order._id || '').toString().slice(-6)}</p>
                    <p className="text-sm text-gray-500">
                      {order.items?.length || 0} items • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₹{order.totalAmount?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {stats.totalOrders > 5 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <Link 
                to="/shop-orders" 
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
              >
                View all orders
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ShopDashboard;

