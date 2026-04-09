import React from 'react';

const DeliveryPartnerCard = ({ partner, onAccept, onDecline }) => {
  const getVehicleEmoji = (type) => {
    const vehicles = {
      bicycle: '🚲',
      electric_bicycle: '⚡🚲',
      electric_scooter: '🛴',
      petrol_scooter: '⛽'
    };
    return vehicles[type] || '🚶';
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#28a745',
      busy: '#ffc107',
      offline: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="partner-card">
      <div className="partner-header">
        <div className="partner-avatar">
          {partner.avatar ? (
            <img src={partner.avatar} alt={partner.name} />
          ) : (
            <span className="avatar-placeholder">
              {partner.name?.charAt(0).toUpperCase() || 'D'}
            </span>
          )}
        </div>
        <div className="partner-info">
          <h4 className="partner-name">{partner.name}</h4>
          <div className="partner-status" style={{ color: getStatusColor(partner.status) }}>
            <span className="status-dot" style={{ backgroundColor: getStatusColor(partner.status) }}></span>
            {partner.status || 'Available'}
          </div>
        </div>
      </div>

      <div className="partner-details">
        <div className="detail-item">
          <span className="label">Vehicle:</span>
          <span className="value">
            {getVehicleEmoji(partner.vehicle?.type)}
            {partner.vehicle?.name || partner.vehicleType || 'Not specified'}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="label">Rating:</span>
          <span className="value">
            ⭐ {partner.rating?.toFixed(1) || 'New'}
          </span>
        </div>

        <div className="detail-item">
          <span className="label">Total Deliveries:</span>
          <span className="value">{partner.totalDeliveries || 0}</span>
        </div>

        {partner.distance !== undefined && (
          <div className="detail-item">
            <span className="label">Distance:</span>
            <span className="value">{partner.distance.toFixed(1)} km</span>
          </div>
        )}

        {partner.estimatedArrival && (
          <div className="detail-item">
            <span className="label">ETA:</span>
            <span className="value">{partner.estimatedArrival} min</span>
          </div>
        )}
      </div>

      {partner.carbonSaved !== undefined && (
        <div className="partner-carbon">
          <span className="carbon-icon">🌱</span>
          <span className="carbon-value">{partner.carbonSaved.toFixed(2)}g CO₂ saved</span>
        </div>
      )}

      {(onAccept || onDecline) && (
        <div className="partner-actions">
          {onAccept && (
            <button className="accept-btn" onClick={() => onAccept(partner)}>
              Accept
            </button>
          )}
          {onDecline && (
            <button className="decline-btn" onClick={() => onDecline(partner)}>
              Decline
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryPartnerCard;
