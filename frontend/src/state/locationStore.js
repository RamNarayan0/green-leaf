/**
 * Location Store - Zustand
 * Manages user location state for delivery routing
 */

import { create } from 'zustand';

const useLocationStore = create((set, get) => ({
  // User location
  customerLocation: null,
  customerLatitude: null,
  customerLongitude: null,
  
  // Location status
  locationStatus: 'idle', // idle, loading, success, error, denied
  locationError: null,
  
  // Selected shop for route calculation
  selectedShop: null,
  routeInfo: null, // distance, duration, path
  
  // Get user location using browser geolocation
  getUserLocation: () => {
    return new Promise((resolve, reject) => {
      set({ locationStatus: 'loading', locationError: null });
      
      if (!navigator.geolocation) {
        set({ 
          locationStatus: 'error', 
          locationError: 'Geolocation is not supported by your browser' 
        });
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          set({
            customerLatitude: latitude,
            customerLongitude: longitude,
            customerLocation: {
              lat: latitude,
              lng: longitude
            },
            locationStatus: 'success',
            locationError: null
          });
          resolve({ lat: latitude, lng: longitude });
        },
        (error) => {
          let errorMessage = 'Unknown error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              set({ locationStatus: 'denied' });
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              set({ locationStatus: 'error' });
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              set({ locationStatus: 'error' });
              break;
            default:
              set({ locationStatus: 'error' });
          }
          set({ locationError: errorMessage });
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  },
  
  // Set selected shop for route calculation
  setSelectedShop: (shop) => {
    set({ selectedShop: shop, routeInfo: null });
  },
  
  // Set route information after calculating
  setRouteInfo: (routeInfo) => {
    set({ routeInfo });
  },
  
  // Clear route info
  clearRouteInfo: () => {
    set({ routeInfo: null, selectedShop: null });
  },
  
  // Reset location state
  resetLocation: () => {
    set({
      customerLocation: null,
      customerLatitude: null,
      customerLongitude: null,
      locationStatus: 'idle',
      locationError: null,
      selectedShop: null,
      routeInfo: null
    });
  }
}));

export default useLocationStore;

// Helper function to calculate distance using Haversine formula (fallback)
export const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

