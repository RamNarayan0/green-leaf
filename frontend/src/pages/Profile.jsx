import React, { useState } from 'react';
import { useAuthStore } from '../state/authStore';
import { User, Mail, Phone, MapPin, Award, Leaf, Package } from 'lucide-react';

const Profile = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-semibold">Please login to view profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 lg:pt-[72px] pb-12">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background shadow-sm flex-shrink-0">
              <span className="text-4xl font-extrabold text-primary uppercase tracking-tight">
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="text-center sm:text-left pt-2">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-1">{user.name || 'User'}</h1>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{user.role || 'Customer'}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-bold shadow-sm">
                <Award className="w-4 h-4" />
                <span>Eco Score: {user.ecoScore || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 mb-8">
          <h2 className="text-xl font-extrabold text-foreground mb-6 pb-4 border-b border-border tracking-tight">Profile Details</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0">
                <Mail className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0 border-b border-border/50 pb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-base font-bold text-foreground truncate">{user.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0">
                <Phone className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0 border-b border-border/50 pb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-base font-bold text-foreground truncate">{user.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0">
                <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Saved Addresses</p>
                <p className="text-base font-bold text-foreground">
                  {user.addresses?.length > 0 
                    ? `${user.addresses.length} address(es) saved` 
                    : 'No addresses saved'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Impact Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            <h3 className="text-xl font-extrabold text-foreground mb-6 pb-4 border-b border-border tracking-tight">Your Impact Snapshot</h3>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20 hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-sm">
                    <Leaf className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Carbon Saved</span>
                </div>
                <p className="text-3xl font-extrabold text-primary tracking-tight">{(user.totalCarbonSaved / 1000)?.toFixed(1) || 0}<span className="text-lg font-bold text-primary/70 ml-1">kg</span></p>
              </div>
              
              <div className="bg-secondary/10 rounded-2xl p-5 border border-secondary/20 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-sm">
                    <Package className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  <span className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">Total Orders</span>
                </div>
                <p className="text-3xl font-extrabold text-foreground tracking-tight">{user.totalOrders || 0}</p>
              </div>
            </div>
          </div>

      </div>
    </div>
  );
};

export default Profile;
