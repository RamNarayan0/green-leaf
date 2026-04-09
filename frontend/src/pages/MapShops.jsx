/**
 * MapShops Page
 * Displays nearby shops on an interactive map for customers to discover stores
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShopMapView } from '../components/MapView';
import { MapPin, Navigation, Filter, Loader2, Store } from 'lucide-react';

const MapShops = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(5);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyShops();
    }
  }, [userLocation, radius]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error('Location error:', err);
          setError('Unable to get your location. Please enable location services.');
          // Default to Hyderabad
          setUserLocation({ lat: 17.3850, lng: 78.4867 });
        }
      );
    } else {
      setUserLocation({ lat: 17.3850, lng: 78.4867 });
    }
  };

  const fetchNearbyShops = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/shops/nearby`, {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: radius
        }
      });
      
      if (response.data.success) {
        setShops(response.data.shops || []);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
      // Try to get all shops as fallback
      try {
        const response = await api.get('/shops');
        if (response.data.success) {
          setShops(response.data.shops || []);
        }
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
  };

  const handleShopClick = (shopId) => {
    navigate(`/shops/${shopId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Nearby Shops</h1>
                <p className="text-sm text-gray-500">
                  {shops.length} shops within {radius}km
                </p>
              </div>
            </div>
            
            {/* Radius Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={1}>1 km</option>
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Map Section */}
        <div className="flex-1 lg:w-2/3">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Finding nearby shops...</p>
              </div>
            </div>
          ) : (
            <ShopMapView
              shops={shops}
              selectedShop={selectedShop}
              onShopSelect={handleShopSelect}
              height="100%"
            />
          )}
          
          {error && (
            <div className="absolute top-20 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              {error}
            </div>
          )}
        </div>

        {/* Shop List Sidebar */}
        <div className="w-full lg:w-1/3 bg-white border-l overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-800 mb-4">
              {selectedShop ? 'Selected Shop' : 'Nearby Stores'}
            </h2>

            {selectedShop ? (
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{selectedShop.name}</h3>
                    <p className="text-sm text-gray-600">{selectedShop.category}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                    <span className="text-green-700 font-semibold">{selectedShop.rating || '0'}</span>
                    <span className="text-green-600 text-sm">★</span>
                  </div>
                </div>
                
                {selectedShop.description && (
                  <p className="text-sm text-gray-600 mb-3">{selectedShop.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedShop.minimumOrder > 0 && (
                    <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                      Min: ₹{selectedShop.minimumOrder}
                    </span>
                  )}
                  {selectedShop.deliveryRadius && (
                    <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                      {selectedShop.deliveryRadius}km delivery
                    </span>
                  )}
                  {selectedShop.deliveryFee > 0 && (
                    <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                      ₹{selectedShop.deliveryFee} delivery
                    </span>
                  )}
                  {selectedShop.isEcoFriendly && (
                    <span className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-700">
                      🌱 Eco-Friendly
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShopClick(selectedShop._id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    View Shop
                  </button>
                  <button
                    onClick={() => setSelectedShop(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                Click on a shop marker to view details
              </p>
            )}

            {/* Shop List */}
            <div className="space-y-3">
              {shops.map((shop) => (
                <div
                  key={shop._id}
                  onClick={() => handleShopSelect(shop)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedShop?._id === shop._id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-800 truncate">{shop.name}</h3>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm text-gray-600">{shop.rating || '0'}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{shop.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {shop.distanceKm?.toFixed(1) || '-'} km away
                        </span>
                        {shop.deliveryFee === 0 && (
                          <span className="text-xs text-green-600 font-medium">Free Delivery</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {shops.length === 0 && !loading && (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No shops found nearby</p>
                <p className="text-sm text-gray-400">Try increasing the search radius</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapShops;

