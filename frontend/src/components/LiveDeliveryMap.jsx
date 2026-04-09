



import React from 'react';
import { Truck, MapPin, Clock, Phone, Navigation } from 'lucide-react';

const LiveDeliveryMap = ({ order, shopLocation, customerLocation }) => {
  const orderNumber = order?.orderNumber || 'N/A';
  const status = order?.status || 'unknown';
  const eta = order?.estimatedDeliveryTime || 'Calculating...';

  return (
    <div>
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-gray-600">Map will load here</p>
        </div>
      </div>
      <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Delivery in Progress</h3>
              <p className="text-sm text-gray-600">
                {order?.deliveryPartner?.name || 'Delivery partner on the way'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{eta}</p>
            <p className="text-xs text-gray-500">mins away</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Navigation className="w-4 h-4" />
            My Location
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Phone className="w-4 h-4" />
            Call
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>Order #{orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDeliveryMap;
