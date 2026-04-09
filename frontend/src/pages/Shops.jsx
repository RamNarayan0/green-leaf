/**
 * Shops Page - Simple Version with inline styles
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Package, Leaf, Bike, Zap, Battery } from 'lucide-react';

// Demo shops - always available
const DEMO_SHOPS = [
  {
    _id: '1',
    name: 'Green Grocer',
    description: 'Fresh organic vegetables and fruits',
    rating: 4.5,
    deliveryTime: '15-25',
    distance: 1.2,
    productCount: 120,
    category: 'vegetables'
  },
  {
    _id: '2',
    name: 'Daily Mart',
    description: 'Your neighborhood grocery store',
    rating: 4.2,
    deliveryTime: '20-30',
    distance: 2.5,
    productCount: 250,
    category: 'grocery'
  },
  {
    _id: '3',
    name: 'Fresh Dairy',
    description: 'Milk, cheese and dairy products',
    rating: 4.7,
    deliveryTime: '10-20',
    distance: 0.8,
    productCount: 80,
    category: 'dairy'
  },
  {
    _id: '4',
    name: 'Organic Basket',
    description: '100% organic produce',
    rating: 4.6,
    deliveryTime: '25-35',
    distance: 3.1,
    productCount: 95,
    category: 'fruits'
  },
  {
    _id: '5',
    name: 'Bakery Fresh',
    description: 'Fresh breads and pastries',
    rating: 4.4,
    deliveryTime: '15-20',
    distance: 1.5,
    productCount: 60,
    category: 'bakery'
  },
  {
    _id: '6',
    name: 'Meat & Fish Market',
    description: 'Fresh meats and seafood',
    rating: 4.3,
    deliveryTime: '20-30',
    distance: 2.0,
    productCount: 75,
    category: 'meat'
  },
  {
    _id: '7',
    name: 'Pharma Quick',
    description: 'Medicines and health products',
    rating: 4.8,
    deliveryTime: '15-25',
    distance: 1.0,
    productCount: 200,
    category: 'pharmacy'
  },
  {
    _id: '8',
    name: 'Fruit Paradise',
    description: 'Exotic fruits from around the world',
    rating: 4.5,
    deliveryTime: '20-30',
    distance: 2.8,
    productCount: 90,
    category: 'fruits'
  }
];

const Shops = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'grocery', name: 'Grocery' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'fruits', name: 'Fruits' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'bakery', name: 'Bakery' },
    { id: 'meat', name: 'Meat' },
    { id: 'pharmacy', name: 'Pharmacy' }
  ];

  // Filter shops
  const filteredShops = DEMO_SHOPS.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewShop = (shopId) => {
    navigate(`/shop/${shopId}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={24} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Green Leaf</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Climate-Optimized Delivery</div>
              </div>
            </div>
            <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
              Demo Mode
            </span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Search for shops, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', backgroundColor: '#f3f4f6', fontSize: '14px' }}
            />
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === cat.id ? '#16a34a' : '#f3f4f6',
                  color: selectedCategory === cat.id ? 'white' : '#4b5563'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
          <span>{filteredShops.length} shops near you</span>
          {selectedCategory !== 'all' && (
            <button 
              onClick={() => setSelectedCategory('all')}
              style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Shops Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredShops.map(shop => (
            <div key={shop._id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ height: '128px', background: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Leaf size={48} color="#86efac" />
                <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '4px 12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16a34a' }}>
                  <Leaf size={12} color="#16a34a" />
                  Eco
                </div>
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '9999px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  {shop.distance} km
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{shop.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fefce8', padding: '2px 8px', borderRadius: '9999px' }}>
                    <Star size={12} fill="#eab308" color="#eab308" />
                    <span style={{ fontSize: '12px', color: '#a16207' }}>{shop.rating}</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{shop.description}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {shop.deliveryTime} min
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={12} />
                    {shop.productCount}+ items
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280' }}>
                  <span>Delivers via:</span>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bike size={12} color="#16a34a" />
                  </div>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Battery size={12} color="#2563eb" />
                  </div>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={12} color="#9333ea" />
                  </div>
                </div>
                <button 
                  onClick={() => handleViewShop(shop._id)}
                  style={{ width: '100%', marginTop: '16px', padding: '10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  View Shop
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredShops.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px' }}>
            <Package size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#4b5563', marginBottom: '8px' }}>No shops found</h3>
            <p style={{ color: '#9ca3af', marginBottom: '16px' }}>Try adjusting your search or filters</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedCategory('all');}}
              style={{ padding: '12px 24px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Shops;
