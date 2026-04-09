/**
 * CarbonImpactCard Component
 * Displays carbon emission savings for eco-friendly deliveries
 */

import React from 'react';
import { Leaf, Truck, Zap, Recycle } from 'lucide-react';

const CarbonImpactCard = ({ 
  vehicleType = 'electric_bicycle',
  distanceKm = 0,
  emissionSaved = 0,
  showDetails = true 
}) => {
  // Calculate emissions for different vehicle types (grams CO2 per km)
  const vehicleEmissions = {
    petrol_scooter: 85,      // Petrol scooter
    electric_scooter: 15,    // Electric scooter
    electric_bicycle: 0,     // Electric bicycle
    ev_car: 53,             // Electric car
    petrol_car: 120,        // Petrol car
    diesel_vehicle: 150      // Diesel vehicle
  };

  // Get baseline emission (petrol scooter)
  const baselineEmission = vehicleEmissions['petrol_scooter'] || 85;
  const vehicleEmission = vehicleEmissions[vehicleType] || 15;
  
  // Calculate actual savings
  const actualSavings = (baselineEmission - vehicleEmission) * distanceKm;
  const savingsKg = (actualSavings / 1000).toFixed(2);
  
  // Alternative calculation from backend data
  const displaySavings = emissionSaved > 0 ? emissionSaved : actualSavings;

  const getVehicleIcon = () => {
    switch(vehicleType) {
      case 'electric_bicycle':
        return <Recycle className="w-6 h-6" />;
      case 'electric_scooter':
        return <Zap className="w-6 h-6" />;
      case 'ev_car':
        return <Truck className="w-6 h-6" />;
      default:
        return <Leaf className="w-6 h-6" />;
    }
  };

  const getVehicleLabel = () => {
    switch(vehicleType) {
      case 'electric_bicycle':
        return 'Electric Bicycle';
      case 'electric_scooter':
        return 'Electric Scooter';
      case 'ev_car':
        return 'EV Car';
      case 'petrol_scooter':
        return 'Petrol Scooter';
      default:
        return 'Delivery Vehicle';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            {getVehicleIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Eco-Friendly Delivery</h3>
            <p className="text-xs text-gray-500">{getVehicleLabel()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">
            {displaySavings > 0 ? `${(displaySavings / 1000).toFixed(2)}` : '0'}
          </p>
          <p className="text-xs text-gray-500">kg CO₂</p>
        </div>
      </div>

      {/* Main Impact Display */}
      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Carbon Saved</span>
          <span className="text-lg font-bold text-green-600">
            {displaySavings > 1000 
              ? `${(displaySavings / 1000).toFixed(1)} kg` 
              : `${Math.round(displaySavings)}g`}
          </span>
        </div>
      </div>

      {/* Comparison */}
      {showDetails && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span>vs. Petrol Scooter</span>
            <span className="font-medium">
              -{Math.round(baselineEmission - vehicleEmission)}g/km
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Distance</span>
            <span className="font-medium">{distanceKm.toFixed(1)} km</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Vehicle Emission</span>
            <span className="font-medium">{vehicleEmission}g/km</span>
          </div>
        </div>
      )}

      {/* Eco Badge */}
      <div className="mt-3 pt-3 border-t border-green-100">
        <div className="flex items-center justify-center gap-1 text-green-700">
          <Leaf className="w-4 h-4" />
          <span className="text-sm font-medium">You're helping the environment!</span>
        </div>
      </div>
    </div>
  );
};

// Compact version for cart/checkout
export const CompactCarbonImpact = ({ emissionSaved = 0 }) => {
  if (emissionSaved <= 0) return null;

  return (
    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
      <Leaf className="w-5 h-5 text-green-600" />
      <span className="text-sm text-green-700">
        <strong>Carbon Saved:</strong> {(emissionSaved / 1000).toFixed(2)} kg CO₂
      </span>
    </div>
  );
};

// Badge version for small displays
export const CarbonBadge = ({ emissionSaved = 0, size = 'md' }) => {
  const isSmall = size === 'sm';
  
  if (emissionSaved <= 0) return null;

  return (
    <div className={`flex items-center gap-1 bg-green-100 text-green-700 rounded-full ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      <Leaf className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className="font-medium">
        {emissionSaved > 1000 
          ? `${(emissionSaved / 1000).toFixed(1)}kg` 
          : `${Math.round(emissionSaved)}g`}
      </span>
      <span className={isSmall ? 'text-xs' : 'text-sm'}>CO₂</span>
    </div>
  );
};

export default CarbonImpactCard;

