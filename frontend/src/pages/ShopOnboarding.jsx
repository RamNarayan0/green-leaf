import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import { shopsAPI } from '../services/api';
import MapLocationPicker from '../components/MapLocationPicker';
import { Store, MapPin, Tag, Clock, ArrowRight, Check, Info, Sparkles, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ShopOnboarding = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'grocery',
        phone: user?.phone || '',
        email: user?.email || '',
        address: {
            street: '',
            landmark: '',
            city: 'Hyderabad',
            state: 'Telangana',
            zipCode: '',
        },
        location: {
            type: 'Point',
            coordinates: [78.4867, 17.385] // Default Hyderabad
        }
    });

    const handleLocationSelect = (coords) => {
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                coordinates: [coords.lng, coords.lat]
            }
        }));
    };

    const handleNext = () => {
        if (step === 1 && !formData.name) {
            setError('Please enter your shop name');
            return;
        }
        setError('');
        setStep(step + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await shopsAPI.createShop(formData);
            if (res.data?.success) {
                // Update user state with new shopId
                const shopId = res.data.data.shop._id;
                await updateUser({ ...user, shopId });
                navigate('/shop-dashboard', { state: { message: 'Shop created successfully! Welcome aboard.' } });
            }
        } catch (err) {
            console.error('Onboarding error:', err);
            setError(err.response?.data?.message || 'Failed to create shop. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'grocery', name: 'Grocery', icon: '🍋' },
        { id: 'pharmacy', name: 'Pharmacy', icon: '💊' },
        { id: 'electronics', name: 'Electronics', icon: '⚡' },
        { id: 'fashions', name: 'Fashion', icon: '👗' },
        { id: 'home', name: 'Home & Decor', icon: '🏠' },
        { id: 'other', name: 'Other', icon: '📦' }
    ];

    return (
        <div className="min-h-screen bg-background pt-24 pb-20 overflow-hidden relative">
            {/* Animated Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-1/2 -right-24 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Merchant Onboarding
                    </motion.div>
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-4">
                        Set Up Your <span className="text-primary underline decoration-primary/20 underline-offset-8">Green Shop</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto">
                        Complete your profile to start reaching thousands of eco-conscious customers in your area.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-12 relative flex justify-between max-w-md mx-auto">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 -z-10"></div>
                    <div className={`absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10 transition-all duration-500`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
                    
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= s ? 'bg-primary text-primary-foreground shadow-eco scale-110' : 'bg-card border-2 border-border text-muted-foreground'}`}>
                            {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                    ))}
                </div>

                {/* Form Container */}
                <div className="bg-card/40 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl overflow-hidden">
                    <div className="p-8 lg:p-12">
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3">
                                <Info className="w-5 h-5 text-destructive" />
                                <p className="text-destructive font-bold text-sm">{error}</p>
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                            <Store className="w-6 h-6 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Basic Information</h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Shop Name</label>
                                            <input 
                                                type="text" 
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="w-full h-14 px-6 bg-background/50 border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-foreground transition-all"
                                                placeholder="e.g. GreenRoute Fresh Market"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Tagline/Description</label>
                                            <textarea 
                                                value={formData.description}
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                className="w-full px-6 py-4 bg-background/50 border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-foreground transition-all min-h-[100px]"
                                                placeholder="Briefly describe your shop's eco-mission..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Business Phone</label>
                                            <input 
                                                type="text" 
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                className="w-full h-14 px-6 bg-background/50 border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-foreground transition-all"
                                                placeholder="+91 XXXXX XXXXX"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Shop Category</label>
                                            <select 
                                                value={formData.category}
                                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                className="w-full h-14 px-6 bg-background/50 border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-foreground transition-all appearance-none cursor-pointer"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                            <MapPin className="w-6 h-6 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Location & Address</h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Selection Precise Location</label>
                                            <div className="rounded-2xl overflow-hidden border-2 border-border group transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 min-h-[400px]">
                                                <MapLocationPicker 
                                                    initialLat={formData.location.coordinates[1]}
                                                    initialLng={formData.location.coordinates[0]}
                                                    onLocationSelect={handleLocationSelect}
                                                />
                                            </div>
                                            <p className="text-xs font-bold text-muted-foreground mt-2 flex items-center gap-1.5 ml-1">
                                                <Info className="w-3.5 h-3.5" />
                                                Drag map or click to set your exact shop coordinate.
                                            </p>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Street Address</label>
                                            <input 
                                                type="text" 
                                                value={formData.address.street}
                                                onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                                                className="w-full h-14 px-6 bg-background/50 border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-foreground transition-all"
                                                placeholder="Plot No, Building Name, Street"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Nearby Landmark</label>
                                            <div className="relative">
                                              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                              <input 
                                                  type="text" 
                                                  value={formData.address.landmark}
                                                  onChange={(e) => setFormData({...formData, address: {...formData.address, landmark: e.target.value}})}
                                                  className="w-full h-14 pl-14 pr-6 bg-background/50 border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-foreground transition-all"
                                                  placeholder="Opposite to..."
                                              />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Pincode</label>
                                            <input 
                                                type="text" 
                                                value={formData.address.zipCode}
                                                onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})}
                                                className="w-full h-14 px-6 bg-background/50 border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-foreground transition-all"
                                                placeholder="500001"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                            <Check className="w-6 h-6 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Review & Confirm</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-6 bg-background/60 rounded-3xl border border-border">
                                            <div className="flex justify-between items-start mb-6 pb-4 border-b border-border">
                                                <div>
                                                    <h3 className="text-2xl font-black text-foreground">{formData.name}</h3>
                                                    <p className="text-primary font-bold uppercase text-[11px] tracking-widest mt-1">{formData.category}</p>
                                                </div>
                                                <button onClick={() => setStep(1)} className="text-xs font-black text-primary hover:underline">EDIT</button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                                                    <p className="text-sm font-bold text-foreground">{formData.address.street}</p>
                                                    <p className="text-xs font-medium text-muted-foreground">Nearby: {formData.address.landmark}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Coordinates</p>
                                                    <p className="text-sm font-bold text-foreground">{formData.location.coordinates[1].toFixed(4)}, {formData.location.coordinates[0].toFixed(4)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm font-medium text-muted-foreground px-4 text-center">
                                            By clicking confirm, you agree to our merchant terms and commit to using sustainable packaging for all GreenRoute orders.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
                            {step > 1 ? (
                                <button 
                                    onClick={() => setStep(step - 1)}
                                    className="px-8 h-14 font-extrabold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Back
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {step < 3 ? (
                                <button 
                                    onClick={handleNext}
                                    className="px-10 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center gap-3 font-extrabold text-lg shadow-eco hover:-translate-y-0.5 transition-all group"
                                >
                                    Next Step
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-10 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center gap-3 font-extrabold text-lg shadow-eco hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Opening Store...' : 'Launch Shop'}
                                    <Sparkles className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-40grayscale hover:opacity-100 transition-opacity">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center mb-2">
                           <span className="text-xl">🏪</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verified Merchant</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center mb-2">
                           <span className="text-xl">🛡️</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secure Payments</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center mb-2">
                           <span className="text-xl">🌿</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Eco-Impact</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopOnboarding;
