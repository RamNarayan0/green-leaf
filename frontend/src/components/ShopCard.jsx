import React from 'react';

const ShopCard = ({ shop, onClick, distance }) => {
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#28a745';
    if (rating >= 4.0) return '#20c997';
    if (rating >= 3.5) return '#ffc107';
    return '#6c757d';
  };

  return (
    <div className="shop-card" onClick={() => onClick && onClick(shop)}>
      <div className="shop-image">
        {shop.primaryImage ? (
          <img src={shop.primaryImage} alt={shop.name} loading="lazy" />
        ) : (
          <div className="no-shop-image">
            <span>🏪</span>
          </div>
        )}
        {shop.isOpen === false && (
          <div className="closed-overlay">
            <span>Closed</span>
          </div>
        )}
      </div>

      <div className="shop-info">
        <h3 className="shop-name">{shop.name}</h3>
        
        {shop.address && (
          <p className="shop-address">
            📍 {shop.address.city}, {shop.address.state}
          </p>
        )}

        <div className="shop-meta">
          {shop.rating && (
            <div className="shop-rating" style={{ color: getRatingColor(shop.rating) }}>
              <span className="star">★</span>
              <span className="rating-value">{shop.rating.toFixed(1)}</span>
              <span className="rating-count">({shop.totalRatings || 0})</span>
            </div>
          )}

          {distance !== undefined && (
            <div className="shop-distance">
              <span className="distance-icon">📏</span>
              <span className="distance-value">{distance.toFixed(1)} km</span>
            </div>
          )}

          {shop.deliveryTime && (
            <div className="shop-delivery-time">
              <span className="time-icon">⏱️</span>
              <span className="time-value">{shop.deliveryTime} min</span>
            </div>
          )}
        </div>

        {shop.categories && shop.categories.length > 0 && (
          <div className="shop-categories">
            {shop.categories.slice(0, 3).map((cat, index) => (
              <span key={index} className="category-tag">{cat}</span>
            ))}
          </div>
        )}

        <div className="shop-features">
          {shop.freeDelivery && (
            <span className="feature-badge free-delivery">🚚 Free Delivery</span>
          )}
          {shop.ecoFriendly && (
            <span className="feature-badge eco-friendly">🌱 Eco Friendly</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopCard;
