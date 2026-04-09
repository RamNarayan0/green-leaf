/**
 * VehicleSelector Component
 * Two-wheeler only vehicle selection for eco-friendly delivery
 * Premium UI similar to Blinkit/Zepto
 */

import React from 'react';
import { Bike, Zap, BatteryCharging, Fuel } from 'lucide-react';

const VEHICLES = [
  {
    id: 'bicycle',
    name: 'Bicycle',
    icon: Bike,
    emission: 0,
    emissionLabel: 'Zero Emission',
    description: 'Best for < 3km',
    color: '#10B981',
    bgColor: '#D1FAE5'
  },
  {
    id: 'electric_bicycle',
    name: 'E-Bicycle',
    icon: BatteryCharging,
    emission: 5,
    emissionLabel: '5 gCO₂/km',
    description: 'Best for < 5km',
    color: '#3B82F6',
    bgColor: '#DBEAFE'
  },
  {
    id: 'electric_scooter',
    name: 'E-Scooter',
    icon: Zap,
    emission: 8,
    emissionLabel: '8 gCO₂/km',
    description: 'Best for < 10km',
    color: '#8B5CF6',
    bgColor: '#EDE9FE'
  },
  {
    id: 'petrol_scooter',
    name: 'Petrol Scooter',
    icon: Fuel,
    emission: 75,
    emissionLabel: '75 gCO₂/km',
    description: 'Emergency only',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    disabled: true,
    disabledReason: 'High emissions - not recommended'
  }
];

const VehicleSelector = ({ selectedVehicle, onSelect, showEmission = true }) => {
  const handleSelect = (vehicle) => {
    if (vehicle.disabled) return;
    onSelect(vehicle.id);
  };

  return (
    <div className="vehicle-selector">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Select Delivery Vehicle
        </h3>
        {showEmission && (
          <span className="badge badge-eco">
            🌱 Eco-Friendly Only
          </span>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🌍</span>
          </div>
          <div>
            <p className="font-medium text-green-800">Climate-Optimized Delivery</p>
            <p className="text-sm text-green-600 mt-1">
              We automatically select the lowest-emission vehicle for your delivery.
              Choosing green vehicles helps reduce carbon footprint!
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Options Grid */}
      <div className="grid grid-cols-2 gap-4">
        {VEHICLES.map((vehicle) => {
          const Icon = vehicle.icon;
          const isSelected = selectedVehicle === vehicle.id;
          const isDisabled = vehicle.disabled;

          return (
            <button
              key={vehicle.id}
              onClick={() => handleSelect(vehicle)}
              disabled={isDisabled}
              className={`
                vehicle-option relative overflow-hidden
                ${isSelected ? 'selected' : ''}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{
                borderColor: isSelected ? vehicle.color : undefined,
                background: isSelected ? vehicle.bgColor : undefined
              }}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div 
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: vehicle.color }}
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Vehicle Icon */}
              <div 
                className="vehicle-icon"
                style={{ 
                  backgroundColor: isSelected ? vehicle.color : '#F3F4F6',
                  color: isSelected ? 'white' : vehicle.color
                }}
              >
                <Icon size={20} />
              </div>

              {/* Vehicle Info */}
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{vehicle.name}</span>
                  {vehicle.emission === 0 && (
                    <span className="badge" style={{ 
                      backgroundColor: vehicle.bgColor, 
                      color: vehicle.color,
                      fontSize: '10px',
                      padding: '2px 6px'
                    }}>
                      ZERO
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{vehicle.description}</p>
                <p 
                  className="text-xs font-medium mt-1"
                  style={{ color: vehicle.color }}
                >
                  {vehicle.emissionLabel}
                </p>
              </div>

              {/* Disabled Reason */}
              {isDisabled && vehicle.disabledReason && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-50 text-red-600 text-xs p-2">
                  {vehicle.disabledReason}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Carbon Comparison */}
      {selectedVehicle && selectedVehicle !== 'petrol_scooter' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium text-gray-700 mb-3">Carbon Savings vs Petrol Scooter</h4>
          <div className="space-y-2">
            {VEHICLES.filter(v => !v.disabled).map((vehicle) => {
              const savings = 75 - vehicle.emission;
              const percentage = Math.round((savings / 75) * 100);
              const isSelected = selectedVehicle === vehicle.id;

              return (
                <div 
                  key={vehicle.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${isSelected ? 'bg-white shadow-sm' : ''}`}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: vehicle.color }}
                  />
                  <span className="text-sm text-gray-600 flex-1">{vehicle.name}</span>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: savings > 0 ? '#10B981' : '#EF4444' }}
                  >
                    {savings > 0 ? `-${savings}g CO₂` : `${savings}g CO₂`}
                  </span>
                  <span className="text-xs text-gray-400">({percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
