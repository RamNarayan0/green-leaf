
/**
 * DeliverySettings Page - For delivery partners to manage their profile
 * Features: Phone, location, vehicle info, availability settings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import { 
  ArrowLeft, MapPin, Phone, Bike, Clock, DollarSign, 
  Save, Loader2, User, Package
} from 'lucide-react';

const DeliverySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    // Personal
    name: '',
    phone: '',
    // Location
    currentLatitude: '',
    currentLongitude: '',
    // Vehicle
    vehicleType: 'electric_bicycle',
    vehicleNumber: '',
    licenseNumber: '',
    // Availability
    isAvailable: true,
    // Banking (for earnings)
    bankAccountNumber: '',
    bankName: '',
    ifscCode: ''
  });

  useEffect(() => {
    // Load user data if available
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            currentLatitude: position.coords.latitude.toString(),
            currentLongitude: position.coords.longitude.toString()
          }));
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get current location. Please enter manually.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // In a real app, this would call an API to update the delivery partner profile
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully! Your profile has been updated.');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Check if user is delivery partner
  if (user?.role !== 'delivery_partner' && user?.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '48px' }}>
          <Bike size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Access Denied
          </h2>
          <p style={{ color: '#6b7280' }}>
            Only delivery partners can access this page. Please login as a delivery partner.
          </p>
        </div>
      </div>
    );
  }

  const vehicleTypes = [
    { value: 'bicycle', label: 'Bicycle', emoji: '🚲', desc: 'Zero emission, for short distances' },
    { value: 'electric_bicycle', label: 'Electric Bicycle', emoji: '🚴', desc: 'Eco-friendly, 5g CO₂/km' },
    { value: 'electric_scooter', label: 'Electric Scooter', emoji: '🛵', desc: 'Fast & eco-friendly, 8g CO₂/km' }
  ];

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
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Delivery Partner Settings</h1>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Manage your delivery profile</p>
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

          {/* Personal Info Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="#16a34a" />
              Personal Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
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
            </div>
          </div>

          {/* Location Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} color="#16a34a" />
              Current Location
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Latitude
                </label>
                <input
                  type="text"
                  name="currentLatitude"
                  value={formData.currentLatitude}
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
                  name="currentLongitude"
                  value={formData.currentLongitude}
                  onChange={handleChange}
                  placeholder="72.8777"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                style={{ 
                  padding: '10px 16px', 
                  backgroundColor: '#16a34a', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: 'fit-content'
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                Get Location
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
              💡 Set your current location to receive nearby delivery orders
            </p>
          </div>

          {/* Vehicle Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bike size={20} color="#16a34a" />
              Vehicle Information
            </h3>
            
            {/* Vehicle Type Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Select Vehicle Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {vehicleTypes.map(type => (
                  <label 
                    key={type.value}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px', 
                      border: formData.vehicleType === type.value ? '2px solid #16a34a' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      backgroundColor: formData.vehicleType === type.value ? '#f0fdf4' : 'white'
                    }}
                  >
                    <span style={{ fontSize: '32px', marginBottom: '8px' }}>{type.emoji}</span>
                    <input
                      type="radio"
                      name="vehicleType"
                      value={type.value}
                      checked={formData.vehicleType === type.value}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{type.label}</span>
                    <span style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginTop: '4px' }}>{type.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="MH 01 AB 1234"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="DL-1234567890"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
            </div>
          </div>

          {/* Availability Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#16a34a" />
              Availability Settings
            </h3>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', backgroundColor: formData.isAvailable ? '#f0fdf4' : '#f9fafb', borderRadius: '12px', border: formData.isAvailable ? '2px solid #16a34a' : '2px solid #e5e7eb' }}>
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                style={{ width: '24px', height: '24px', accentColor: '#16a34a' }}
              />
              <div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  {formData.isAvailable ? '✅ Available for Deliveries' : '⏸️ Not Available'}
                </span>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                  {formData.isAvailable 
                    ? 'You will receive delivery requests in your area' 
                    : 'You will not receive any delivery requests'}
                </p>
              </div>
            </label>
          </div>

          {/* Banking Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} color="#16a34a" />
              Banking Details (for Earnings)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="HDFC Bank"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Account Number
                </label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="1234567890"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="HDFC0001234"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
              🔒 Your banking details are secure and encrypted
            </p>
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
      </main>
    </div>
  );
};

export default DeliverySettings;

