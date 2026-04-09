import React from 'react';
import { Leaf, Truck, MapPin, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

const CarbonImpactDisplay = ({ 
  emissionData, 
  distance, 
  vehicleType, 
  carbonEmission, 
  carbonSaved, 
  ecoRating,
  showDetails = true,
  compact = false 
}) => {
  // Get eco rating color and label
  const getEcoRatingInfo = (rating) => {
    const ratings = {
      'A+': { label: 'Excellent', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
      'A': { label: 'Great', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
      'B': { label: 'Good', color: '#84cc16', bg: '#ecfccb', icon: Leaf },
      'C': { label: 'Moderate', color: '#f59e0b', bg: '#fef3c7', icon: AlertTriangle },
      'D': { label: 'High', color: '#f97316', bg: '#ffedd5', icon: AlertTriangle },
      'E': { label: 'Very High', color: '#ef4444', bg: '#fee2e2', icon: AlertTriangle },
      'N/A': { label: 'Not Assigned', color: '#6b7280', bg: '#f3f4f6', icon: Truck }
    };
    return ratings[rating] || ratings['N/A'];
  };

  // Get vehicle emoji
  const getVehicleEmoji = (type) => {
    if (!type) return '🚶';
    const emojis = {
      'bicycle': '🚲',
      'electric_bicycle': '⚡🚲',
      'electric_scooter': '🛵',
      'electric_scooter_ather_450x': '⚡🛵',
      'electric_scooter_ola_s1': '⚡🛵',
      'petrol_scooter': '⛽',
      'petrol_bike': '🏍️'
    };
    return emojis[type] || '🚶';
  };

  // Format vehicle name
  const formatVehicleName = (type) => {
    if (!type) return 'Not Assigned';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const ratingInfo = getEcoRatingInfo(ecoRating);
  const RatingIcon = ratingInfo.icon;

  // Compact version for cards
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: ratingInfo.bg, color: ratingInfo.color }}
        >
          <RatingIcon className="w-3 h-3" />
          <span>{ecoRating || 'N/A'}</span>
        </div>
        {carbonSaved > 0 && (
          <span className="text-xs text-green-600 font-medium">
            🌱 {carbonSaved.toFixed(0)}g saved
          </span>
        )}
      </div>
    );
  }

  // Full version for detail pages
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
      <div className="flex items-center gap-2 mb-3">
        <Leaf className="w-5 h-5 text-green-600" />
        <h4 className="font-semibold text-gray-800">Carbon Impact</h4>
      </div>

      {/* Eco Rating Badge */}
      <div 
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
        style={{ backgroundColor: ratingInfo.bg }}
      >
        <RatingIcon className="w-5 h-5" style={{ color: ratingInfo.color }} />
        <span className="font-semibold" style={{ color: ratingInfo.color }}>
          Eco Rating: {ecoRating || 'N/A'}
        </span>
        <span className="text-sm" style={{ color: ratingInfo.color }}>
          ({ratingInfo.label})
        </span>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-3">
          {/* Distance */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-xs">Distance</span>
            </div>
            <p className="font-semibold text-gray-800">
              {distance ? `${distance.toFixed(1)} km` : 'N/A'}
            </p>
          </div>

          {/* Vehicle */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Truck className="w-4 h-4" />
              <span className="text-xs">Vehicle</span>
            </div>
            <p className="font-semibold text-gray-800 flex items-center gap-1">
              <span>{getVehicleEmoji(vehicleType)}</span>
              <span className="text-sm">{formatVehicleName(vehicleType)}</span>
            </p>
          </div>

          {/* Carbon Emission */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Emission</span>
            </div>
            <p className="font-semibold text-gray-800">
              {carbonEmission ? `${carbonEmission.toFixed(1)} g` : 'N/A'}
            </p>
          </div>

          {/* Carbon Saved */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Leaf className="w-4 h-4" />
              <span className="text-xs">Saved</span>
            </div>
            <p className={`font-semibold ${carbonSaved > 0 ? 'text-green-600' : 'text-gray-800'}`}>
              {carbonSaved ? `${carbonSaved.toFixed(1)} g` : '0 g'}
            </p>
          </div>
      )}

      {/* Carbon Savings Message */}
      {carbonSaved > 0 && (
        <div className="mt-3 p-2 bg-green-100 rounded-lg text-center">
          <p className="text-sm text-green-700 font-medium">
            🌱 You saved <strong>{carbonSaved.toFixed(0)}g CO₂</strong> by choosing eco-friendly delivery!
          </p>
        </div>
      )}

      {/* High Emission Warning */}
      {carbonEmission > 200 && (
        <div className="mt-3 p-2 bg-yellow-100 rounded-lg text-center">
          <p className="text-sm text-yellow-700">
            ⚠️ Consider choosing electric vehicles for lower emissions
          </p>
        </div>
      )}
    </div>
  );
};

export default CarbonImpactDisplay;
