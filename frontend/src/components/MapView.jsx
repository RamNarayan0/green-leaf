/**
 * MapView Component
 * Displays Google Maps with customer and shop markers, route visualization
 */

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import useLocationStore from '../state/locationStore';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px'
};

const defaultCenter = {
  lat: 17.3850, // Hyderabad default
  lng: 78.4867
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const libraries = ['places', 'directions'];

export default function MapView({ shop, onRouteCalculated, height = '400px' }) {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [routeError, setRouteError] = useState(null);
  
  const { 
    customerLocation, 
    locationStatus, 
    getUserLocation,
    routeInfo,
    setRouteInfo
  } = useLocationStore();
  
  // Load Google Maps API
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-error" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: '12px', flexDirection: 'column', gap: '8px' }}>
        <MapPin className="w-8 h-8 text-red-500" />
        <p className="text-gray-600">Google Maps is not configured.</p>
        <p className="text-sm text-red-600">Set VITE_GOOGLE_MAPS_API_KEY in your frontend .env file.</p>
      </div>
    );
  }

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });
  
  // Get user location if not already available
  useEffect(() => {
    if (!customerLocation && locationStatus === 'idle') {
      getUserLocation().catch(err => console.log('Location error:', err));
    }
  }, [customerLocation, locationStatus, getUserLocation]);
  
  // Calculate route when both customer and shop locations are available
  useEffect(() => {
    if (customerLocation && shop?.location) {
      calculateRoute();
    }
  }, [customerLocation, shop]);
  
  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);
  
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);
  
  // Calculate route using Google Maps Directions Service
  const calculateRoute = useCallback(() => {
    if (!window.google || !customerLocation || !shop?.location) {
      return;
    }
    
    // Extract shop coordinates from GeoJSON or lat/lng
    let shopLat, shopLng;
    if (shop.location.coordinates) {
      [shopLng, shopLat] = shop.location.coordinates;
    } else if (shop.location.lat && shop.location.lng) {
      shopLat = shop.location.lat;
      shopLng = shop.location.lng;
    }
    
    if (!shopLat || !shopLng) {
      setRouteError('Shop location not available');
      return;
    }
    
    const origin = customerLocation;
    const destination = { lat: shopLat, lng: shopLng };
    
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        provideRouteAlternatives: false
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          setRouteError(null);
          
          // Extract distance and duration
          const route = result.routes[0];
          const leg = route.legs[0];
          
          const routeData = {
            distanceKm: leg.distance.value / 1000, // Convert meters to km
            distanceText: leg.distance.text,
            duration: leg.duration.text,
            durationValue: leg.duration.value, // in seconds
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            steps: leg.steps,
            overviewPath: route.overview_path
          };
          
          setRouteInfo(routeData);
          
          // Callback for parent component
          if (onRouteCalculated) {
            onRouteCalculated(routeData);
          }
        } else {
          setRouteError(`Could not calculate route: ${status}`);
          console.error('Directions error:', status);
        }
      }
    );
  }, [customerLocation, shop, setRouteInfo, onRouteCalculated]);
  
  // Handle manual route recalculation
  const handleRecalculate = () => {
    calculateRoute();
  };
  
  // Extract shop coordinates
  const getShopCoordinates = () => {
    if (!shop?.location) return defaultCenter;
    
    if (shop.location.coordinates) {
      const [lng, lat] = shop.location.coordinates;
      return { lat, lng };
    }
    
    if (shop.location.lat && shop.location.lng) {
      return { lat: shop.location.lat, lng: shop.location.lng };
    }
    
    return defaultCenter;
  };
  
  // Loading state
  if (loadError) {
    return (
      <div className="map-error" style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '12px',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <MapPin className="w-8 h-8 text-red-500" />
        <p className="text-gray-600">Failed to load Google Maps</p>
        <p className="text-sm text-gray-500">{loadError.message}</p>
      </div>
    );
  }
  
  if (!isLoaded) {
    return (
      <div className="map-loading" style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '12px',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <p className="text-gray-600">Loading maps...</p>
      </div>
    );
  }
  
  return (
    <div className="map-container" style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ ...mapContainerStyle, height }}
        center={customerLocation || getShopCoordinates()}
        zoom={customerLocation ? 14 : 12}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Customer Marker */}
        {customerLocation && (
          <Marker
            position={customerLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }}
            title="Your Location"
          />
        )}
        
        {/* Shop Marker */}
        {shop?.location && (
          <Marker
            position={getShopCoordinates()}
            icon={{
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 12,
              fillColor: '#22C55E',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }}
            title={shop.name || 'Shop'}
          />
        )}
        
        {/* Route Visualization */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#22C55E',
                strokeWeight: 4,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>
      
      {/* Route Info Panel */}
      {routeInfo && (
        <div className="route-info" style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="route-details">
            <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>
              {routeInfo.distanceText}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              {routeInfo.duration} away
            </p>
          </div>
          <div className="route-actions">
            <button
              onClick={handleRecalculate}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: '#22C55E'
              }}
              title="Recalculate route"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Location Status Warning */}
      {locationStatus === 'denied' && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          padding: '12px',
          color: '#92400E',
          fontSize: '14px'
        }}>
          ⚠️ Location access denied. Enable location in browser settings to see delivery routes.
        </div>
      )}
      
      {/* Route Error */}
      {routeError && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          backgroundColor: '#FEE2E2',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '12px',
          color: '#991B1B',
          fontSize: '14px'
        }}>
          ⚠️ {routeError}
        </div>
      )}
    </div>
  );
}

// Simple Map without route (for shop listing)
export function ShopMapView({ shops, selectedShop, onShopSelect, height = '300px' }) {
  const { customerLocation, locationStatus } = useLocationStore();
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });
  
  if (loadError) {
    return (
      <div style={{ height, backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-gray-500">Map unavailable</p>
      </div>
    );
  }
  
  if (!isLoaded) {
    return (
      <div style={{ height, backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }
  
  const center = customerLocation || defaultCenter;
  
  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height, borderRadius: '12px' }}
      center={center}
      zoom={13}
      options={mapOptions}
    >
      {/* Customer Location */}
      {customerLocation && (
        <Marker
          position={customerLocation}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }}
          title="Your Location"
        />
      )}
      
      {/* Shop Markers */}
      {shops?.map((shop, index) => {
        if (!shop.location?.coordinates) return null;
        const [lng, lat] = shop.location.coordinates;
        const isSelected = selectedShop?._id === shop._id;
        
        return (
          <Marker
            key={shop._id || index}
            position={{ lat, lng }}
            onClick={() => onShopSelect?.(shop)}
            icon={{
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: isSelected ? 14 : 10,
              fillColor: isSelected ? '#EF4444' : '#22C55E',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: isSelected ? 3 : 2
            }}
            title={shop.name}
          />
        );
      })}
    </GoogleMap>
  );
}

