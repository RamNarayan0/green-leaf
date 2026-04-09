/**
 * AddProduct Page - For shopkeepers to add products
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuthStore } from '../state/authStore';
import { ArrowLeft, Package, Plus, Image as ImageIcon } from 'lucide-react';

// No longer using hardcoded CATEGORIES

const AddProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: 'grocery',
    stockQuantity: '',
    unit: 'piece',
    primaryImage: '',
    isAvailable: true,
    isFeatured: false,
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        const cats = response.data.data?.categories || [];
        setCategories(cats);
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, category: cats[0]._id }));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.shop && !user?.shopId) {
      setError('Your account is not linked to a shop yet. Please create your shop first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        category: formData.category,
        stockQuantity: parseInt(formData.stockQuantity, 10),
        unit: formData.unit,
        primaryImage: formData.primaryImage || undefined,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        shop: user?.shop || user?.shopId || undefined
      };
      const response = await productsAPI.create(productData);
      
      if (response.data.success) {
        setSuccess('Product added successfully!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          comparePrice: '',
          category: 'grocery',
          stockQuantity: '',
          unit: 'piece',
          primaryImage: '',
          isAvailable: true,
          isFeatured: false,
        });
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is shopkeeper
  if (user?.role !== 'shopkeeper' && user?.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '48px' }}>
          <Package size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Access Denied
          </h2>
          <p style={{ color: '#6b7280' }}>
            Only shopkeepers can add products. Please login as a shopkeeper.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', border: 'none', cursor: 'pointer' }}
            >
              <ArrowLeft size={20} color="#4b5563" />
            </button>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Add New Product</h1>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Create a new product listing</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {success}
            </div>
          )}

          {/* Product Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Organic Tomatoes"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe your product..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          {/* Price and Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Compare Price (₹)
              </label>
              <input
                type="number"
                name="comparePrice"
                value={formData.comparePrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                required
                min="0"
                placeholder="0"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Category and Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: 'white' }}
              >
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value="piece">Per Piece</option>
                <option value="kg">Per Kg</option>
                <option value="g">Per Gram</option>
                <option value="L">Per Liter</option>
                <option value="ml">Per ml</option>
                <option value="pack">Per Pack</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Image URL
            </label>
            <input
              type="url"
              name="primaryImage"
              value={formData.primaryImage}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Leave empty to use default image
            </p>
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Available for sale</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Featured product</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: loading ? '#9ca3af' : '#16a34a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px', 
              fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Plus size={20} />
                Add Product
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddProduct;

