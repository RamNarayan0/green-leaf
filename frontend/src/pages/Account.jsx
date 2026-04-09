import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersAPI, authAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import { useAuthStore } from '../state/authStore';
import {
  User, Mail, Phone, MapPin, Shield, LogOut,
  Plus, Edit2, Trash2, ChevronRight, Package, Heart
} from 'lucide-react';

export default function Account() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    (async () => {
      try {
        setLoadingAddresses(true);
        const res = await usersAPI.getAddresses();
        setAddresses(res.data?.data?.addresses || res.data?.addresses || []);
      } catch (error) {
        console.error('Failed to load addresses:', error);
      } finally {
        setLoadingAddresses(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: Package },
  ];

  return (
    <main className="min-h-screen bg-background pt-16 lg:pt-[72px]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-5xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">My Account</h1>
              <p className="text-sm text-muted-foreground font-medium">{user?.email || 'Not logged in'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6">
                <h2 className="text-xl font-extrabold text-foreground">Personal Information</h2>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{user?.name || '—'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{user?.email || '—'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{user?.phone || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Role</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground capitalize">{user?.role || 'customer'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    To update your profile details, please contact support or use the profile settings in your dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-extrabold text-foreground">Saved Addresses</h2>
                  <Link
                    to="/checkout"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </Link>
                </div>

                {loadingAddresses ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                    <p className="font-bold text-foreground mb-2">No saved addresses</p>
                    <p className="text-sm text-muted-foreground">Add an address during checkout.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address._id} className="flex items-start justify-between p-5 border border-border rounded-2xl hover:border-primary/30 transition-colors bg-background/50">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-secondary text-secondary-foreground mb-1">
                              {address.label || 'Home'}
                            </span>
                            <p className="font-bold text-foreground">{address.street}</p>
                            <p className="text-sm text-muted-foreground">{address.city}, {address.state} {address.zipCode}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-primary/30" />
                <h2 className="text-xl font-extrabold text-foreground mb-2">Order History</h2>
                <p className="text-muted-foreground mb-6">View all your past and current orders.</p>
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-eco"
                >
                  View My Orders <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
