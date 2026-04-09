import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { useThemeStore } from './state/themeStore';
import { useAuthStore } from './state/authStore';

// Fetch user on initial load if token exists
const token = localStorage.getItem('token');
if (token) {
  useAuthStore.getState().checkAuth();
}

// Initialize theme
useThemeStore.getState().initTheme();

const router = createBrowserRouter(
  [
    {
      path: '/*',
      element: <App />
    }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
