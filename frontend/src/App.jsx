import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Account from './pages/Account';
import Profile from './pages/Profile';
import AllShops from './pages/AllShops';
import ShopView from './pages/ShopView';
import Login from './pages/Login';
import Register from './pages/Register';
import Wishlist from './pages/Wishlist';
import useAppStore from './store/useAppStore';
import { useAuthStore } from './state/authStore';
import { Toaster, toast } from 'sonner';
import socketService from './services/socket';

// Route-based code splitting for heavy pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ShopDashboard = lazy(() => import('./pages/ShopDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const ShopOnboarding = lazy(() => import('./pages/ShopOnboarding'));
const AddProduct = lazy(() => import('./pages/AddProduct'));
const MapShops = lazy(() => import('./pages/MapShops'));
const ShopSettings = lazy(() => import('./pages/ShopSettings'));
const DeliverySettings = lazy(() => import('./pages/DeliverySettings'));
const ManageProducts = lazy(() => import('./pages/shopkeeper/ManageProducts'));
const EditProduct = lazy(() => import('./pages/shopkeeper/EditProduct'));
const ShopOrders = lazy(() => import('./pages/shopkeeper/ShopOrders'));
const ReferralHub = lazy(() => import('./pages/ReferralHub'));
const Rewards = lazy(() => import('./pages/Rewards'));

function PageLoader() {
  return (
    <div className="flex justify-center items-center h-64 bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function PrivateRoute({ children, roles }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const { checkAuth, token } = useAuthStore();
  const { fetchCart } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (token) {
      fetchCart();
      socketService.connect(token);
      
      const unsubscribe = socketService.on('order-status', (data) => {
        toast.success(data.message || `Order status: ${data.status}`, {
          description: `Order #${data.orderId.slice(-6)}`,
          duration: 5000,
          position: 'top-right',
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [token, fetchCart]);

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/shops" element={<AllShops />} />
            <Route path="/map-shops" element={<MapShops />} />
            <Route path="/shop/:id" element={<ShopView />} />
            <Route path="/product/:id" element={<Product />} />

            <Route path="/rewards" element={<Rewards />} />
            <Route path="/wishlist" element={<Wishlist />} />

            <Route path="/cart" element={
              <PrivateRoute>
                <Cart />
              </PrivateRoute>
            } />

            <Route path="/checkout" element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            } />

            <Route path="/orders" element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            } />

            <Route path="/account" element={
              <PrivateRoute>
                <Account />
              </PrivateRoute>
            } />

            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />

            <Route path="/referrals" element={
              <PrivateRoute>
                <ReferralHub />
              </PrivateRoute>
            } />

            <Route path="/admin" element={
              <PrivateRoute roles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />

            <Route path="/shop-dashboard" element={
              <PrivateRoute roles={['shopkeeper']}>
                <ShopDashboard />
              </PrivateRoute>
            } />

            <Route path="/shop-settings" element={
              <PrivateRoute roles={['shopkeeper']}>
                <ShopSettings />
              </PrivateRoute>
            } />

            <Route path="/manage-products" element={
              <PrivateRoute roles={['shopkeeper']}>
                <ManageProducts />
              </PrivateRoute>
            } />

            <Route path="/edit-product/:id" element={
              <PrivateRoute roles={['shopkeeper']}>
                <EditProduct />
              </PrivateRoute>
            } />

            <Route path="/shop-orders" element={
              <PrivateRoute roles={['shopkeeper']}>
                <ShopOrders />
              </PrivateRoute>
            } />

            <Route path="/delivery-dashboard" element={
              <PrivateRoute roles={['delivery_partner']}>
                <DeliveryDashboard />
              </PrivateRoute>
            } />

            <Route path="/delivery-settings" element={
              <PrivateRoute roles={['delivery_partner']}>
                <DeliverySettings />
              </PrivateRoute>
            } />

            <Route path="/shop-onboarding" element={
              <PrivateRoute roles={['shopkeeper']}>
                <ShopOnboarding />
              </PrivateRoute>
            } />

            <Route path="/add-product" element={
              <PrivateRoute roles={['shopkeeper']}>
                <AddProduct />
              </PrivateRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster richColors closeButton />
    </>
  );
}

export default App;
