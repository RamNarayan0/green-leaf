/**
 * MapLocationPicker Component
 * Allows users to select a location on a Leaflet/OpenStreetMap
 * Leaflet is imported statically for Vite compatibility.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon broken by Webpack/Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapLocationPicker = ({ 
  onLocationSelect, 
  initialLat = 12.9716, 
  initialLng = 77.5946,
}) => {
  const [markerPosition, setMarkerPosition] = useState({ lat: initialLat, lng: initialLng });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map with a default zoom that feels right for a city
    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initial marker
    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

    // CRITICAL: Leaflet maps in animated containers (like the one in Checkout.jsx)
    // often fail to calculate dimensions correctly. invalidateSize fixes this.
    setTimeout(() => {
      map.invalidateSize();
      map.setView([initialLat, initialLng], 15);
    }, 100);

    // Click to move marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setMarkerPosition({ lat, lng });
      onLocationSelect && onLocationSelect({ lat, lng });
    });

    // Drag marker to move
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setMarkerPosition({ lat, lng });
      onLocationSelect && onLocationSelect({ lat, lng });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [initialLat, initialLng]); // Added dependencies to re-center if initial props change

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setMarkerPosition({ lat, lng });
          onLocationSelect && onLocationSelect({ lat, lng });
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
            markerRef.current.setLatLng([lat, lng]);
          }
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  };

  const handleManualUpdate = () => {
    const latInput = parseFloat(document.getElementById('map-lat-input')?.value);
    const lngInput = parseFloat(document.getElementById('map-lng-input')?.value);
    if (!isNaN(latInput) && !isNaN(lngInput)) {
      setMarkerPosition({ lat: latInput, lng: lngInput });
      onLocationSelect && onLocationSelect({ lat: latInput, lng: lngInput });
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([latInput, lngInput], 15);
        markerRef.current.setLatLng([latInput, lngInput]);
      }
    }
  };

  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        
        setMarkerPosition({ lat: newLat, lng: newLng });
        
        // Pass the display_name up if the parent wants to use the human readable address
        onLocationSelect && onLocationSelect({ lat: newLat, lng: newLng, address: display_name });
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 15);
          markerRef.current.setLatLng([newLat, newLng]);
        }
      } else {
        setSearchError('Location not found. Please try a different query.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchError('Error searching location.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Map Container */}
      <div 
        ref={mapContainerRef}
        style={{ height: '280px', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', zIndex: 1 }}
      />

      {/* Controls */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        
        {/* Search Bar */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Search Location</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. DLF Cyber City, Hyderabad"
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch(e)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <button 
              type="button"
              onClick={handleAddressSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </div>
          {searchError && <p className="text-xs text-red-500 mt-1 font-medium">{searchError}</p>}
        </div>

        <div className="flex items-center justify-between mb-3 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <MapPin className="w-5 h-5 text-green-600" />
            <span>Selected Location</span>
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Use My Location
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Latitude</label>
            <input
              id="map-lat-input"
              type="number"
              step="0.0001"
              value={markerPosition.lat}
              onChange={(e) => setMarkerPosition(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g., 12.9716"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Longitude</label>
            <input
              id="map-lng-input"
              type="number"
              step="0.0001"
              value={markerPosition.lng}
              onChange={(e) => setMarkerPosition(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g., 77.5946"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualUpdate}
          className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Update Map Pin
        </button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          📍 Click on the map or drag the pin to set location
        </p>
      </div>
    </div>
  );
};

export default MapLocationPicker;
