/**
 * ManageProducts.jsx - Shopkeeper Product Management
 * View, edit, delete and manage products for a shop
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../state/authStore';
import { 
  Plus, Search, Edit2, Trash2, Package, Image, 
  ChevronLeft, ChevronRight, Filter, Grid, List,
  AlertCircle, CheckCircle, XCircle, Eye
} from 'lucide-react';

const CATEGORIES = [
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'meat', label: 'Meat & Fish' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'household', label: 'Household' },
];

const ManageProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shopId, setShopId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });

  const productsPerPage = 12;

  useEffect(() => {
    fetchShopAndProducts();
  }, [currentPage, categoryFilter, statusFilter]);

  const fetchShopAndProducts = async () => {
    try {
      setLoading(true);
      setError('');

      // Get shopkeeper's shop
      const shopRes = await api.get('/shops/my-shop');
      if (shopRes.data.success && shopRes.data.shop) {
        const shop = shopRes.data.shop;
        setShopId(shop._id);
        fetchProducts(shop._id);
      } else {
        setError('No shop found. Please create a shop first.');
      }
    } catch (err) {
      console.error('Error fetching shop:', err);
      setError('Failed to load shop information');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (shopId) => {
    try {
      const params = {
        page: currentPage,
        limit: productsPerPage,
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter !== 'all' && { isAvailable: statusFilter === 'available' })
      };

      const response = await api.get(`/products/shop/${shopId}`, { params });
      
      if (response.data.success) {
        setProducts(response.data.data?.products || response.data.products || []);
        const total = response.data.data?.pagination?.total || response.data.total || 0;
        setTotalPages(Math.ceil(total / productsPerPage));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.product) return;

    try {
      await api.delete(`/products/${deleteModal.product._id}`);
      setProducts(products.filter(p => p._id !== deleteModal.product._id));
      setDeleteModal({ show: false, product: null });
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const toggleAvailability = async (product) => {
    try {
      const updatedProduct = { ...product, isAvailable: !product.isAvailable };
      await api.put(`/products/${product._id}`, updatedProduct);
      setProducts(products.map(p => p._id === product._id ? updatedProduct : p));
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product availability');
    }
  };

  const filteredProducts = products.filter(product => {
    if (searchTerm) {
      return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const getStockStatus = (product) => {
    if (product.stockQuantity === 0) return { label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' };
    if (product.stockQuantity < 10) return { label: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (user?.role !== 'shopkeeper' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only shopkeepers can manage products.</p>
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
              <h1 className="text-2xl font-bold text-gray-800">Manage Products</h1>
              <p className="text-gray-500">Manage your shop inventory</p>
            </div>
            <Link
              to="/add-product"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </Link>
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Products Found</h3>
            <p className="text-gray-500 mt-2">Start by adding your first product.</p>
            <Link
              to="/add-product"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => {
                const stockStatus = getStockStatus(product);
                return (
                  <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-100">
                      {product.primaryImage ? (
                        <img src={product.primaryImage} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {/* Availability Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-2">Stock: {product.stockQuantity} {product.unit}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        <Link
                          to={`/edit-product/${product._id}`}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => toggleAvailability(product)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                            product.isAvailable 
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {product.isAvailable ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          {product.isAvailable ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, product })}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
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
        ) : (
          /* List View */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(product => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            {product.primaryImage ? (
                              <img src={product.primaryImage} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{product.category}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{product.price}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                          {product.stockQuantity} {product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {product.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/edit-product/${product._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => toggleAvailability(product)}
                            className={`p-2 rounded-lg ${
                              product.isAvailable ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {product.isAvailable ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, product })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Product</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteModal.product?.name}</strong>? This will remove the product from your shop.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, product: null })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;

