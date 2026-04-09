/**
 * ShopOrders.jsx - Shopkeeper Orders View
 * Display orders received by the shop
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shopsAPI, ordersAPI } from '../../services/api';
import { useAuthStore } from '../../state/authStore';
import { 
  ShoppingBag, Package, Clock, CheckCircle, XCircle, 
  Truck, Search, Filter, ChevronLeft, ChevronRight,
  User, Phone, MapPin, AlertCircle
} from 'lucide-react';

const ShopOrders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shop, setShop] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersPerPage = 10;

  useEffect(() => {
    fetchShopAndOrders();
  }, [currentPage, statusFilter]);

  const fetchShopAndOrders = async () => {
    try {
      setLoading(true);
      setError('');

      // Get shopkeeper's shop
      const shopRes = await shopsAPI.getMyShop();
      if (shopRes.data.success && shopRes.data.shop) {
        const shopData = shopRes.data.shop;
        setShop(shopData);
        fetchOrders();
      } else {
        setError('No shop found. Please create a shop first.');
      }
    } catch (err) {
      console.error('Error fetching shop:', err);
      if (err.response?.status === 404) {
        setError('No shop found. Please create a shop first.');
      } else {
        setError('Failed to load shop information');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await shopsAPI.getMyShopOrders();
      
      if (response.data.success) {
        let allOrders = response.data.orders || [];
        
        // Apply status filter if any
        if (statusFilter !== 'all') {
          allOrders = allOrders.filter(order => order.status === statusFilter);
        }
        
        // Apply search filter if any
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          allOrders = allOrders.filter(order =>
            order.orderNumber?.toLowerCase().includes(searchLower) ||
            order._id.toLowerCase().includes(searchLower) ||
            order.customer?.name?.toLowerCase().includes(searchLower) ||
            order.customer?.phone?.includes(searchTerm)
          );
        }
        
        setOrders(allOrders);
        setTotalPages(Math.ceil(allOrders.length / ordersPerPage));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order status');
    }
  };

  // Filter orders by search term
  const filteredOrders = orders.filter(order => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order._id.toLowerCase().includes(searchLower) ||
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.customer?.phone?.includes(searchTerm)
      );
    }
    return true;
  });

  // Get status badge styles
  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
      preparing: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Package },
      ready: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: CheckCircle },
      picked_up: { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: Truck },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    };
    return styles[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Package };
  };

  // Check if user is shopkeeper
  if (user?.role !== 'shopkeeper' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only shopkeepers can view shop orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Shop Orders</h1>
              <p className="text-gray-500">Manage orders for {shop?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="picked_up">Picked Up</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Orders Found</h3>
            <p className="text-gray-500 mt-2">Orders will appear here when customers place them.</p>
          </div>
        ) : (
          <>
            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Items</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const statusStyle = getStatusBadge(order.status);
                      const StatusIcon = statusStyle.icon;
                      
                      return (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">
                              #{order.orderNumber || order._id.slice(-8)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">{order.customer?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{order.customer?.phone || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-600">
                              {order.items?.length || 0} items
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-800">₹{order.totalAmount?.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-green-600 hover:text-green-700 font-medium text-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Status Update */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    updateOrderStatus(selectedOrder._id, e.target.value);
                    setSelectedOrder({ ...selectedOrder, status: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.customer?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.customer?.phone || 'N/A'}</span>
                  </div>
                  {selectedOrder.deliveryAddress && (
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-800">{item.product?.name || item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 text-right">₹{item.price?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOrders;

