import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import { Mail, Lock, Eye, EyeOff, User, Phone, Leaf, ArrowRight, Check } from 'lucide-react';

const getRoleRedirect = (role) => {
  if (role === 'shopkeeper') return '/shop-dashboard';
  if (role === 'delivery_partner') return '/delivery-dashboard';
  return '/';
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role
      });
      
      if (result.success) {
        const currentUser = useAuthStore.getState().user;
        navigate(getRoleRedirect(currentUser?.role));
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'customer', label: 'Customer', desc: 'Shop and order products', icon: '🛒' },
    { value: 'shopkeeper', label: 'Shopkeeper', desc: 'Manage your store', icon: '🏪' },
    { value: 'delivery_partner', label: 'Delivery Partner', desc: 'Deliver orders', icon: '🚴' }
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 relative lg:border-r border-border">
        <div className="absolute inset-0 bg-muted/20 pointer-events-none"></div>
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-eco">
              <Leaf className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-extrabold text-foreground tracking-tight">GreenLeaf</span>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">Create Account</h2>
            <p className="text-muted-foreground font-medium text-lg">Join us in making delivery eco-friendly</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-4 animate-fade-in shadow-sm">
              <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-destructive font-bold text-lg">!</span>
              </div>
              <p className="text-destructive font-bold text-sm leading-tight">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-14 pr-5 h-14 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold shadow-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-14 pr-5 h-14 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold shadow-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-14 pr-5 h-14 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold shadow-sm"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="pt-2 pb-2">
              <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                I want to join as
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all text-center ${
                      formData.role === role.value
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="sr-only"
                    />
                    <span className="text-3xl block mb-2">{role.icon}</span>
                    <span className={`text-[11px] uppercase tracking-wider font-bold block ${
                      formData.role === role.value ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {role.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Password Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-10 h-14 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold shadow-sm"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Confirm
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-11 pr-4 h-14 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold shadow-sm"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input type="checkbox" required className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-border rounded bg-card peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                     <svg className="w-3 h-3 text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <span className="text-sm font-semibold text-muted-foreground leading-snug">
                  I agree to the <a href="#" className="text-primary hover:text-primary/80 font-bold transition-colors">Terms of Service</a> and <a href="#" className="text-primary hover:text-primary/80 font-bold transition-colors">Privacy Policy</a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-primary-foreground font-extrabold text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-eco disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-10 text-center text-muted-foreground font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-extrabold inline-flex items-center gap-1.5 transition-colors group">
              Sign in
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-eco relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-40 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Floating Leaves Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 text-6xl opacity-20 animate-bounce">🍃</div>
          <div className="absolute bottom-40 right-1/3 text-4xl opacity-20 animate-bounce delay-300">🌱</div>
          <div className="absolute top-1/3 right-1/4 text-5xl opacity-20 animate-bounce delay-500">🌿</div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-extrabold tracking-tight">GreenLeaf</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Start Your<br />
            <span className="text-white/80">Eco Journey.</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-12 max-w-md font-medium leading-relaxed">
            Join thousands of users who are making a difference by choosing sustainable delivery options.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: '🌱', title: 'Plant Trees', desc: 'Earn eco-points for every order' },
              { icon: '📦', title: 'Green Delivery', desc: 'Choose zero-emission vehicles' },
              { icon: '🎁', title: 'Exclusive Deals', desc: 'Get special offers for eco-friendly choices' }
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 shadow-sm">
                <span className="text-3xl w-12 text-center">{benefit.icon}</span>
                <div>
                  <h3 className="font-bold text-lg mb-0.5">{benefit.title}</h3>
                  <p className="text-sm font-medium text-white/80">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
