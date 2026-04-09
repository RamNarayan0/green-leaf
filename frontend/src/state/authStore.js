import { create } from 'zustand';
import { api } from '../services/api';
import socketService from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data.data || response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      socketService.connect(token);
      
      try {
        const userResponse = await api.get('/auth/me');
        const freshUser = userResponse.data.data?.user || userResponse.data.user;
        set({ 
          user: freshUser, 
          token, 
          refreshToken, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } catch (userError) {
        set({ 
          user, 
          token, 
          refreshToken, 
          isAuthenticated: true, 
          isLoading: false 
        });
      }
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },
  googleLogin: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/google', { token: credential });
      const { token, refreshToken, user } = response.data.data || response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      socketService.connect(token);
      
      try {
        const userResponse = await api.get('/auth/me');
        const freshUser = userResponse.data.data?.user || userResponse.data.user;
        set({ user: freshUser, token, refreshToken, isAuthenticated: true, isLoading: false });
      } catch (userError) {
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
      }
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', userData);
      const { token, refreshToken, user } = response.data.data || response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      socketService.connect(token);
      
      try {
        const userResponse = await api.get('/auth/me');
        const freshUser = userResponse.data.data?.user || userResponse.data.user;
        set({ 
          user: freshUser, 
          token, 
          refreshToken, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } catch (userError) {
        set({ 
          user, 
          token, 
          refreshToken, 
          isAuthenticated: true, 
          isLoading: false 
        });
      }
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    socketService.disconnect();
    set({ 
      user: null, 
      token: null, 
      refreshToken: null, 
      isAuthenticated: false 
    });
  },

  checkAuth: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      const currentUser = response.data.data?.user || response.data.user;
      if (currentUser) {
        set({ user: currentUser, isAuthenticated: true, isLoading: false });
        socketService.connect(token); // Ensure socket reconnects on checkAuth
      } else {
        get().logout();
      }
    } catch (error) {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData }
    }));
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/users/profile', data);
      const updatedUser = response.data.data?.user || response.data.user;
      set({ user: updatedUser, isLoading: false });
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null })
}));
