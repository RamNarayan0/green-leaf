import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import { Mail, Lock, Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const getRoleRedirect = (role) => {
  if (role === 'shopkeeper') return '/shop-dashboard';
  if (role === 'delivery_partner') return '/delivery-dashboard';
  return '/';
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        const currentUser = useAuthStore.getState().user;
        navigate(getRoleRedirect(currentUser?.role));
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setFormData({ email, password });
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        const currentUser = useAuthStore.getState().user;
        navigate(getRoleRedirect(currentUser?.role));
      } else {
        setError(result.error || 'Demo login failed');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      setError('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-eco relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Floating Leaves Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 text-6xl opacity-20 animate-bounce">🍃</div>
          <div className="absolute bottom-40 right-1/3 text-4xl opacity-20 animate-bounce delay-300">🌱</div>
          <div className="absolute top-1/3 right-1/4 text-5xl opacity-20 animate-bounce delay-500">🌿</div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-extrabold tracking-tight">GreenLeaf</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Deliver Faster.<br />
            <span className="text-white/80">Live Greener.</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-12 max-w-md font-medium leading-relaxed">
            Climate-optimized quick commerce platform that minimizes carbon emissions with intelligent delivery solutions.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 shadow-sm">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚴</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-0.5">Zero Emission Delivery</h3>
                <p className="text-sm font-medium text-white/80">Bicycles & electric vehicles</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 shadow-sm">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-0.5">Carbon Tracking</h3>
                <p className="text-sm font-medium text-white/80">Real-time emission monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 relative">
        <div className="absolute inset-0 bg-muted/30"></div>
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-eco">
              <Leaf className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-extrabold text-foreground tracking-tight">GreenLeaf</span>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground font-medium text-base">Sign in to continue to your dashboard</p>
          </div>

          {/* One-Click Quick Demo Logins */}
          <div className="mb-8 p-4 bg-card rounded-2xl border border-border shadow-sm">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 text-center">⚡ 1-Click Instant Sign In</p>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError('');
                try {
                  const result = await useAuthStore.getState().googleLogin('demo-google-token', {
                    email: 'ramnarayan20070515@gmail.com',
                    name: 'Ram Narayan'
                  });
                  if (result.success) {
                    const currentUser = useAuthStore.getState().user;
                    navigate(getRoleRedirect(currentUser?.role));
                  } else {
                    setError(result.error || 'Login failed');
                  }
                } catch (err) {
                  setError('Login failed. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full mb-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-eco"
            >
              <span>👤 Sign in as Ram Narayan (ramnarayan20070515@gmail.com)</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('customer@greenroute.com', 'customer123')}
                className="px-3 py-2.5 bg-muted/50 hover:bg-primary hover:text-primary-foreground border border-border rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                🛒 Customer
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('shop@greenroute.com', 'shop123')}
                className="px-3 py-2.5 bg-muted/50 hover:bg-primary hover:text-primary-foreground border border-border rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                🏪 Shopkeeper
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('partner@greenroute.com', 'partner123')}
                className="px-3 py-2.5 bg-muted/50 hover:bg-primary hover:text-primary-foreground border border-border rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                🚴 Delivery
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@greenroute.com', 'admin123')}
                className="px-3 py-2.5 bg-muted/50 hover:bg-primary hover:text-primary-foreground border border-border rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-4 animate-fade-in shadow-sm">
              <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-destructive font-bold text-lg">!</span>
              </div>
              <p className="text-destructive font-bold text-sm leading-tight">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 h-12 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold shadow-sm text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-12 pr-12 h-12 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold shadow-sm text-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-4 h-4 border-2 border-border rounded bg-card peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                     <svg className="w-2.5 h-2.5 text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <span className="ml-2.5 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-xs text-primary hover:text-primary/80 font-bold transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary rounded-xl text-primary-foreground font-extrabold text-base transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-eco disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-muted/30 text-muted-foreground font-bold tracking-wider uppercase text-[10px]">or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex flex-col gap-3 w-full">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError('');
                try {
                  const targetEmail = formData.email?.trim() || 'ramnarayan20070515@gmail.com';
                  const targetName = targetEmail.includes('@') 
                    ? targetEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : 'Ram Narayan';
                  const result = await useAuthStore.getState().googleLogin('demo-google-token', {
                    email: targetEmail,
                    name: targetName
                  });
                  if (result.success) {
                    const currentUser = useAuthStore.getState().user;
                    navigate(getRoleRedirect(currentUser?.role));
                  } else {
                    setError(result.error || 'Google sign-in failed');
                  }
                } catch (err) {
                  setError('Google sign-in failed. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full h-12 bg-card hover:bg-muted border-2 border-border rounded-xl font-bold text-sm text-foreground flex items-center justify-center gap-3 transition-all duration-200 shadow-xs hover:border-primary/50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-muted-foreground font-medium text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-extrabold inline-flex items-center gap-1 transition-colors group">
              Create account
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
