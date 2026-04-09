import axios from 'axios';

// Always use relative path - Vite proxy handles /api to backend
const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }

      return new Promise(function(resolve, reject) {
        api.post('/auth/refresh', { refreshToken })
          .then(({ data }) => {
            const resData = data.data || data;
            const token = resData.accessToken || resData.token;
            const newRefreshToken = resData.refreshToken;
            localStorage.setItem('token', token);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            processQueue(null, token);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }
    
    if (!error.response || error.response.status >= 500) {
      console.error('Network or Server error detected. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  googleLogin: (token) => api.post('/auth/google', { token }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`)
};

export const shopsAPI = {
  getAll: (params) => api.get('/shops', { params }),
  getById: (id) => api.get(`/shops/${id}`),
  create: (data) => api.post('/shops', data),
  createShop: (data) => api.post('/shops', data), // Alias for onboarding
  delete: (id) => api.delete(`/shops/${id}`),
  getNearby: (lat, lng, radius) => api.get('/shops/nearby', { params: { lng, lat, radius } }),
  // Shopkeeper specific
  getMyShop: () => api.get('/shops/my-shop'),
  getMyShopOrders: () => api.get('/shops/my-shop/orders'),
  getMyShopStats: () => api.get('/shops/my-shop/stats')
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByShop: (shopId) => api.get(`/products/shop/${shopId}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  search: (query) => api.get('/products/search', { params: { q: query } }),
  getCategories: () => api.get('/products/categories')
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getMyOrders: () => api.get('/orders/my-orders'),
  getCarbonStats: () => api.get('/orders/carbon-stats'),
  calculateDeliveryEstimate: (data) => api.post('/orders/calculate-delivery', data),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
  trackOrder: (orderId) => api.get(`/orders/track/${orderId}`),
  getByCustomer: (customerId) => api.get(`/orders/customer/${customerId}`),
  getByShop: (shopId) => api.get(`/orders/shop/${shopId}`)
};

export const emissionsAPI = {
  getVehicleTypes: () => api.get('/emissions/vehicles'),
  calculate: (distance, vehicleType) => api.post('/emissions/calculate', { distanceKm: distance, vehicleType }),
  compare: (distance) => api.get('/emissions/compare', { params: { distanceKm: distance } }),
  getFactors: () => api.get('/emissions/factors')
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMyImpact: () => api.get('/analytics/my-impact'),
  getMyOrders: () => api.get('/analytics/my-orders'),
  getShopPerformance: () => api.get('/analytics/shop-performance'),
  getShopOrders: () => api.get('/analytics/shop-orders'),
  getInventory: () => api.get('/analytics/inventory'),
  getMyPerformance: () => api.get('/analytics/my-performance'),
  getMyDeliveries: () => api.get('/analytics/my-deliveries'),
  getCityOverview: (period) => api.get('/analytics/city-overview', { params: { period } }),
  getEmissions: (period) => api.get('/analytics/emissions', { params: { period } }),
  getRevenue: (period) => api.get('/analytics/revenue', { params: { period } }),
  getUsers: () => api.get('/analytics/users'),
  getFleet: () => api.get('/analytics/fleet'),
  getOrderAnalytics: (period) => api.get('/analytics/orders', { params: { period } })
};

export const deliveryAPI = {
  // Delivery partner settings
  getProfile: () => api.get('/delivery/profile'),
  updateProfile: (data) => api.put('/delivery/profile', data),
  updateLocation: (lat, lng) => api.post('/delivery/location', { lat, lng }),
  setAvailability: (available) => api.put('/delivery/availability', { available }),
  getNearbyOrders: () => api.get('/delivery/nearby-orders'),
  getMyDeliveries: () => api.get('/delivery/my-deliveries'),
  getEarnings: (period) => api.get('/delivery/earnings', { params: { period } }),
  getStats: () => api.get('/delivery/stats'),
  getCurrentDelivery: () => api.get('/delivery/current-delivery'),
  acceptOrder: (orderId) => api.post(`/delivery/accept/${orderId}`),
  updateStatus: (orderId, status) => api.patch('/delivery/status', { orderId, status })
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateCartItem: (data) => api.put('/cart/update', data),
  removeFromCart: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear')
};

export default api;
