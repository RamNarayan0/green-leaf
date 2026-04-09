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
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground font-medium text-lg">Sign in to continue to your dashboard</p>
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
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-14 pr-14 h-14 bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground placeholder:text-muted-foreground font-semibold shadow-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-border rounded bg-card peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                     <svg className="w-3 h-3 text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <span className="ml-3 text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:text-primary/80 font-bold transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary rounded-xl text-primary-foreground font-extrabold text-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-eco disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-muted/30 text-muted-foreground font-bold tracking-wider uppercase text-xs">or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex flex-col gap-4 w-full">
            <div className="w-full flex justify-center items-center overflow-hidden rounded-xl">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setLoading(true);
                  setError('');
                  try {
                    const result = await useAuthStore.getState().googleLogin(credentialResponse.credential);
                    if (result.success) {
                      const currentUser = useAuthStore.getState().user;
                      navigate(getRoleRedirect(currentUser?.role));
                    } else {
                      setError(result.error || 'Google login failed. Please verify your account role.');
                    }
                  } catch (err) {
                    console.error('Google Auth Error:', err);
                    setError('Google login failed. If you see "Origin Mismatch", please authorize http://localhost:5173 in your Google Cloud Console.');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => setError('Google Login Failed. Check your browser console for Origin Errors.')}
                useOneTap
                size="large"
                shape="rectangular"
                theme="outline"
              />
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="mt-10 text-center text-muted-foreground font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-extrabold inline-flex items-center gap-1.5 transition-colors group">
              Create account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
