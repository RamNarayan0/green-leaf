import React from 'react';

const CarbonBadge = ({ carbonSaved, vehicleType, size = 'normal' }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'carbon-badge-small';
      case 'large': return 'carbon-badge-large';
      default: return 'carbon-badge-normal';
    }
  };

  const getVehicleEmoji = () => {
    const emojis = {
      'bicycle': '🚲',
      'electric_bicycle': '⚡🚲',
      'electric_scooter': '🛴',
      'petrol_scooter': '⛽'
    };
    return emojis[vehicleType] || '🚶';
  };

  const getEcoScore = () => {
    if (carbonSaved > 1000) return { label: 'Eco Warrior', color: '#28a745' };
    if (carbonSaved > 500) return { label: 'Green Champion', color: '#20c997' };
    if (carbonSaved > 100) return { label: 'Eco Friendly', color: '#17a2b8' };
    if (carbonSaved > 50) return { label: 'Starting Out', color: '#ffc107' };
    return { label: 'Newcomer', color: '#6c757d' };
  };

  const ecoScore = getEcoScore();

  return (
    <div className={`carbon-badge-component ${getSizeClass()}`}>
      <div className="carbon-icon">
        <span className="leaf-icon">🌱</span>
      </div>
      <div className="carbon-details">
        <div className="carbon-saved-amount">
          <span className="amount">{carbonSaved?.toFixed(2) || '0.00'}</span>
          <span className="unit">g CO₂</span>
        </div>
        <div className="carbon-label">Carbon Saved</div>
      </div>
      {vehicleType && (
        <div className="vehicle-type">
          <span className="vehicle-emoji">{getVehicleEmoji()}</span>
          <span className="vehicle-name">{vehicleType?.replace('_', ' ')}</span>
        </div>
      )}
      <div className="eco-score" style={{ backgroundColor: ecoScore.color }}>
        {ecoScore.label}
      </div>
    </div>
  );
};

export default CarbonBadge;
