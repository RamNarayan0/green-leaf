
/**
 * ShopSettings Page - For shopkeepers to manage their shop details
 * Features: Location, phone, address, operating hours, delivery settings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopsAPI } from '../services/api';
import { useAuthStore } from '../state/authStore';
import { 
  ArrowLeft, MapPin, Phone, Mail, Clock, Truck, 
  Package, Save, Loader2, Building
} from 'lucide-react';

const ShopSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shop, setShop] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    // Address
    street: '',
    city: '',
    state: '',
    zipCode: '',
    // Location coordinates
    latitude: '',
    longitude: '',
    // Operating hours
    operatingHours: {
      monday: { open: '09:00', close: '21:00', isOpen: true },
      tuesday: { open: '09:00', close: '21:00', isOpen: true },
      wednesday: { open: '09:00', close: '21:00', isOpen: true },
      thursday: { open: '09:00', close: '21:00', isOpen: true },
      friday: { open: '09:00', close: '21:00', isOpen: true },
      saturday: { open: '09:00', close: '21:00', isOpen: true },
      sunday: { open: '09:00', close: '21:00', isOpen: false }
    },
    // Delivery settings
    minimumOrder: 0,
    deliveryRadius: 5,
    deliveryFee: 0,
    freeDeliveryThreshold: 500,
    // Additional
    isEcoFriendly: false,
    hasEcoPackaging: false
  });

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    setLoading(true);
    try {
      // Try to get shop - first try the API
      const response = await shopsAPI.getAll({ limit: 100 });
      if (response.data.success && response.data.shops) {
        // Find shop owned by current user
        const myShop = response.data.shops.find(s => s.owner?._id === user?._id || s.owner === user?._id);
        if (myShop) {
          setShop(myShop);
          populateForm(myShop);
        }
      }
    } catch (err) {
      setIsNewShop(true);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (shopData) => {
    const address = shopData.address || {};
    const location = shopData.location?.coordinates || [0, 0];
    const hours = shopData.operatingHours || formData.operatingHours;

    setFormData(prev => ({
      ...prev,
      name: shopData.name || '',
      description: shopData.description || '',
      phone: shopData.phone || '',
      email: shopData.email || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      latitude: location[1] ? location[1].toString() : '',
      longitude: location[0] ? location[0].toString() : '',
      operatingHours: {
        monday: hours.monday || { open: '09:00', close: '21:00', isOpen: true },
        tuesday: hours.tuesday || { open: '09:00', close: '21:00', isOpen: true },
        wednesday: hours.wednesday || { open: '09:00', close: '21:00', isOpen: true },
        thursday: hours.thursday || { open: '09:00', close: '21:00', isOpen: true },
        friday: hours.friday || { open: '09:00', close: '21:00', isOpen: true },
        saturday: hours.saturday || { open: '09:00', close: '21:00', isOpen: true },
        sunday: hours.sunday || { open: '09:00', close: '21:00', isOpen: false }
      },
      minimumOrder: shopData.minimumOrder || 0,
      deliveryRadius: shopData.deliveryRadius || 5,
      deliveryFee: shopData.deliveryFee || 0,
      freeDeliveryThreshold: shopData.freeDeliveryThreshold || 500,
      isEcoFriendly: shopData.isEcoFriendly || false,
      hasEcoPackaging: shopData.hasEcoPackaging || false
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: field === 'isOpen' ? value : value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const shopData = {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(formData.longitude) || 0,
            parseFloat(formData.latitude) || 0
          ]
        },
        operatingHours: formData.operatingHours,
        minimumOrder: parseFloat(formData.minimumOrder),
        deliveryRadius: parseFloat(formData.deliveryRadius),
        deliveryFee: parseFloat(formData.deliveryFee),
        freeDeliveryThreshold: parseFloat(formData.freeDeliveryThreshold),
        isEcoFriendly: formData.isEcoFriendly,
        hasEcoPackaging: formData.hasEcoPackaging
      };

      let response;
      if (shop?._id) {
        // Update existing shop
        response = await shopsAPI.update(shop._id, shopData);
      } else {
        // Create new shop
        response = await shopsAPI.create(shopData);
      }

      if (response.data.success) {
        setSuccess('Shop settings saved successfully!');
        setShop(response.data.shop);
      }
    } catch (err) {
      console.error('Error saving shop:', err);
      setError(err.response?.data?.message || 'Failed to save shop settings');
    } finally {
      setSaving(false);
    }
  };

  // Check if user is shopkeeper
  if (user?.role !== 'shopkeeper' && user?.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '48px' }}>
          <Building size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Access Denied
          </h2>
          <p style={{ color: '#6b7280' }}>
            Only shopkeepers can access this page. Please login as a shopkeeper.
          </p>
        </div>
      </div>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', border: 'none', cursor: 'pointer' }}
            >
              <ArrowLeft size={20} color="#4b5563" />
            </button>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Shop Settings</h1>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Manage your shop details</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Loader2 size={32} color="#16a34a" className="animate-spin" />
            <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading shop settings...</p>
          </div>
        ) : (
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

            {/* Basic Info Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={20} color="#16a34a" />
                Basic Information
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Green Grocer"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe your shop..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={20} color="#16a34a" />
                Contact Details
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="shop@example.com"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} color="#16a34a" />
                Address
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="123 Main Street, Area Name"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      PIN Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="400001"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Location Coordinates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Latitude
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="19.0760"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Longitude
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="72.8777"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  💡 Tip: Enter your shop's GPS coordinates for accurate delivery distance calculation
                </p>
              </div>
            </div>

            {/* Operating Hours Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#16a34a" />
                Operating Hours
              </h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {days.map(day => (
                  <div key={day} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 40px', gap: '12px', alignItems: 'center', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', textTransform: 'capitalize' }}>
                      {day}
                    </label>
                    <input
                      type="time"
                      value={formData.operatingHours[day].open}
                      onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                      disabled={!formData.operatingHours[day].isOpen}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                    <input
                      type="time"
                      value={formData.operatingHours[day].close}
                      onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                      disabled={!formData.operatingHours[day].isOpen}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={formData.operatingHours[day].isOpen}
                        onChange={(e) => handleHoursChange(day, 'isOpen', e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Settings Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="#16a34a" />
                Delivery Settings
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Minimum Order (₹)
                  </label>
                  <input
                    type="number"
                    name="minimumOrder"
                    value={formData.minimumOrder}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    name="deliveryRadius"
                    value={formData.deliveryRadius}
                    onChange={handleChange}
                    min="1"
                    placeholder="5"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    name="deliveryFee"
                    value={formData.deliveryFee}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Free Delivery Above (₹)
                  </label>
                  <input
                    type="number"
                    name="freeDeliveryThreshold"
                    value={formData.freeDeliveryThreshold}
                    onChange={handleChange}
                    min="0"
                    placeholder="500"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>

            {/* Eco Settings */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="#16a34a" />
                Eco-Friendly Options
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    name="isEcoFriendly"
                    checked={formData.isEcoFriendly}
                    onChange={handleChange}
                    style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
                  />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Eco-Friendly Shop</span>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Use electric vehicles for delivery</p>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    name="hasEcoPackaging"
                    checked={formData.hasEcoPackaging}
                    onChange={handleChange}
                    style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
                  />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Eco Packaging</span>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Use biodegradable/eco-friendly packaging</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              style={{ 
                width: '100%', 
                padding: '14px', 
                backgroundColor: saving ? '#9ca3af' : '#16a34a', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px', 
                fontWeight: '600', 
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Settings
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default ShopSettings;

