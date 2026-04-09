import React from 'react';

const OrderCard = ({ order, onTrack, onViewDetails }) => {
  const getStatusColor = (status) => {
    const colors = {
      created: '#ffc107',
      paid: '#17a2b8',
      assigned: '#6f42c1',
      preparing: '#fd7e14',
      picked_up: '#20c997',
      out_for_delivery: '#007bff',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      created: 'Order Created',
      paid: 'Payment Received',
      assigned: 'Partner Assigned',
      preparing: 'Preparing',
      picked_up: 'Picked Up',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const carbonSaved = order.emissionData?.carbonSaved || 0;
  const vehicleType = order.emissionData?.vehicleType || 'Unknown';

  return (
    <div className="order-card">
      <div className="order-header">
        <div className="order-info">
          <h3 className="order-number">#{order.orderNumber}</h3>
          <span className="order-date">{formatDate(order.createdAt)}</span>
        </div>
        <div 
          className="order-status"
          style={{ backgroundColor: getStatusColor(order.status?.current) }}
        >
          {getStatusText(order.status?.current)}
        </div>
      </div>

      <div className="order-shop">
        <span className="shop-label">Shop:</span>
        <span className="shop-name">{order.shop?.name || 'Unknown'}</span>
      </div>

      <div className="order-items">
        <span className="items-label">Items:</span>
        <span className="items-count">
          {order.items?.length || 0} item(s) - ₹{order.totalAmount?.toFixed(2) || '0.00'}
        </span>
      </div>

      {order.status?.current === 'out_for_delivery' && order.estimatedDeliveryTime && (
        <div className="delivery-eta">
          <span>🚴 Estimated delivery in {order.estimatedDeliveryTime} mins</span>
        </div>
      )}

      <div className="carbon-info">
        <div className="carbon-badge-compact">
          <span className="eco-icon">🌱</span>
          <span className="carbon-saved">{carbonSaved.toFixed(2)}g CO₂ saved</span>
        </div>
        <div className="vehicle-info">
          <span>🚲 Vehicle: {vehicleType}</span>
        </div>
      </div>

      <div className="order-actions">
        {['out_for_delivery', 'assigned', 'preparing'].includes(order.status?.current) && (
          <button className="track-btn" onClick={() => onTrack && onTrack(order._id)}>
            📍 Track Order
          </button>
        )}
        <button className="details-btn" onClick={() => onViewDetails && onViewDetails(order._id)}>
          View Details
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
