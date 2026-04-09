/**
 * OrderRouteMap.jsx
 * Shows delivery route between customer and shop with Leaflet
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Truck, Store, Loader2 } from 'lucide-react';

const OrderRouteMap = ({ 
  customerLocation,
  shopLocation,
  shopName = 'Shop',
  customerName = 'Customer',
  onRouteCalculated
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState(null);

  // Default center (Hyderabad)
  const defaultCenter = { lat: 17.3850, lng: 78.4867 };

  useEffect(() => {
    initMap();
  }, []);

  useEffect(() => {
    if (map && customerLocation && shopLocation) {
      calculateRoute();
    }
  }, [map, customerLocation, shopLocation]);

  const initMap = async () => {
    try {
      setLoading(true);
      
      // Dynamically import Leaflet
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Fix marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Create map
      const mapInstance = L.map(mapRef.current).setView(
        [defaultCenter.lat, defaultCenter.lng], 
        13
      );

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance);

      setMap(mapInstance);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to load map');
      setLoading(false);
    }
  };

  const calculateRoute = async () => {
    if (!map || !customerLocation || !shopLocation) return;

    try {
      setLoading(true);
      
      const L = await import('leaflet');

      // Clear existing layers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Get coordinates
      const customerLat = customerLocation.lat || customerLocation.latitude;
      const customerLng = customerLocation.lng || customerLocation.longitude;
      
      let shopLat, shopLng;
      if (shopLocation.coordinates) {
        [shopLng, shopLat] = shopLocation.coordinates;
      } else {
        shopLat = shopLocation.lat;
        shopLng = shopLocation.lng;
      }

      // Create custom icons
      const customerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:#3B82F6;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const shopIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:#22C55E;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Add markers
      L.marker([customerLat, customerLng], { icon: customerIcon })
        .bindPopup(`<b>${customerName}</b><br>Delivery Location`)
        .addTo(map);

      L.marker([shopLat, shopLng], { icon: shopIcon })
        .bindPopup(`<b>${shopName}</b><br>Pickup Location`)
        .addTo(map);

      // Calculate straight-line distance (Haversine formula)
      const R = 6371; // Earth's radius in km
      const dLat = toRad(shopLat - customerLat);
      const dLng = toRad(shopLng - customerLng);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(customerLat)) * Math.cos(toRad(shopLat)) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // Draw route line
      const routeLine = L.polyline(
        [[customerLat, customerLng], [shopLat, shopLng]],
        {
          color: '#22C55E',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10'
        }
      ).addTo(map);

      // Fit bounds
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

      // Calculate estimated duration (assuming avg 30 km/h in city)
      const durationMinutes = Math.round((distance / 30) * 60);

      const routeData = {
        distanceKm: distance.toFixed(2),
        durationMinutes,
        customerCoords: { lat: customerLat, lng: customerLng },
        shopCoords: { lat: shopLat, lng: shopLng }
      };

      setRouteInfo(routeData);
      
      if (onRouteCalculated) {
        onRouteCalculated(routeData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error calculating route:', err);
      setError('Failed to calculate route');
      setLoading(false);
    }
  };

  const toRad = (deg) => deg * (Math.PI / 180);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 14);
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  };

  if (error) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <MapPin className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-80 rounded-lg overflow-hidden"
        style={{ minHeight: '320px' }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Calculating route...</p>
          </div>
        </div>
      )}

      {/* Route Info Panel */}
      {routeInfo && !loading && (
        <div className="mt-4 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Pickup</span>
              </div>
              <div className="w-8 h-0.5 bg-green-300"></div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Delivery</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">{routeInfo.distanceKm} km</p>
              <p className="text-sm text-gray-500">~{routeInfo.durationMinutes} mins</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={getCurrentLocation}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <Navigation className="w-4 h-4" />
              My Location
            </button>
            <button
              onClick={() => calculateRoute()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <Truck className="w-4 h-4" />
              Navigate
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Shop</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Customer</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-0.5 bg-green-400 border-dashed border-t-2 border-green-400"></div>
          <span>Route</span>
        </div>
      </div>
    </div>
  );
};

export default OrderRouteMap;

