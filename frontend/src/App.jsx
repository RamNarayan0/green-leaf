import React from 'react';
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
import AdminDashboard from './pages/AdminDashboard';
import ShopDashboard from './pages/ShopDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import ShopOnboarding from './pages/ShopOnboarding';
import AddProduct from './pages/AddProduct';
import AllShops from './pages/AllShops';
import ShopView from './pages/ShopView';
import Login from './pages/Login';
import Register from './pages/Register';
import ReferralHub from './pages/ReferralHub';
import Rewards from './pages/Rewards';
import Wishlist from './pages/Wishlist';
import MapShops from './pages/MapShops';
import ShopSettings from './pages/ShopSettings';
import DeliverySettings from './pages/DeliverySettings';
import ManageProducts from './pages/shopkeeper/ManageProducts';
import EditProduct from './pages/shopkeeper/EditProduct';
import ShopOrders from './pages/shopkeeper/ShopOrders';
import useAppStore from './store/useAppStore';
import { useAuthStore } from './state/authStore';
import { Toaster, toast } from 'sonner';
import socketService from './services/socket';

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

import { useEffect } from 'react';

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
      <Toaster richColors closeButton />
    </>
  );
}

export default App;
