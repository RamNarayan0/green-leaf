import React, { useEffect, useRef } from 'react';

const RadarMap = ({ orders, onAcceptOrder }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (!mapInstanceRef.current) {
        // Default center (Hyderabad)
        const center = [17.3850, 78.4867];
        
        mapInstanceRef.current = L.map(mapRef.current).setView(center, 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);
      }

      // Clear existing markers
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      const bounds = [];
      const orderIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="background-color: #22c55e; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #14532d; box-shadow: 0 0 15px rgba(34, 197, 94, 0.6); display: flex; align-items: center; justify-content: center; animation: pulse-ring 2s infinite;">
            <span style="font-size: 16px;">📦</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      orders.forEach(order => {
        if (order.status !== 'pending' && order.status !== 'confirmed') return;

        let shopCoords = null;
        if (order.shop?.location?.coordinates) {
          const coords = order.shop.location.coordinates;
          // Normalize: if [lng, lat] (India), swap to [lat, lng] for Leaflet
          if (coords[0] > 60 && coords[1] < 35) {
            shopCoords = [coords[1], coords[0]];
          } else {
            shopCoords = [coords[0], coords[1]];
          }
        } else {
          // Mock scattered coordinates if missing
          shopCoords = [17.3850 + (Math.random() - 0.5) * 0.1, 78.4867 + (Math.random() - 0.5) * 0.1];
        }

        if (shopCoords) {
          bounds.push(shopCoords);
          
          const popupContent = `
            <div style="min-width: 200px; padding: 4px;">
              <div style="font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; margin-bottom: 2px;">Order ID</div>
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px;">#${order._id.slice(-6)}</div>
              
              <div style="margin-bottom: 8px;">
                <span style="font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase;">From:</span>
                <span style="font-size: 12px; font-weight: 600;">${order.shop?.name || 'Local Store'}</span>
                ${order.distanceToShop ? `<div style="font-size: 10px; color: #9ca3af; font-weight: 600;">📍 ${order.distanceToShop} km away</div>` : ''}
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="font-size: 10px; font-weight: 800; color: #22c55e; text-transform: uppercase;">Earning:</span>
                <span style="font-size: 16px; font-weight: 800; color: #22c55e;">₹${order.deliveryFee || (order.totalAmount * 0.1).toFixed(0)}</span>
              </div>
              
              <button id="accept-btn-${order._id}" type="button" style="width: 100%; padding: 8px; background-color: #22c55e; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                Accept Order
              </button>
            </div>
          `;

          const marker = L.marker(shopCoords, { icon: orderIcon }).addTo(mapInstanceRef.current);
          marker.bindPopup(popupContent, { closeButton: false });

          // Add click event listener to the button after popup opens
          marker.on('popupopen', () => {
            const btn = document.getElementById(`accept-btn-${order._id}`);
            if (btn) {
              btn.addEventListener('click', () => {
                onAcceptOrder(order._id);
                marker.closePopup();
              });
            }
          });
        }
      });

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }

      // Add a cool radar sweep effect container
      const mapContainer = mapInstanceRef.current.getContainer();
      if (!mapContainer.querySelector('.radar-sweep')) {
        const sweep = document.createElement('div');
        sweep.className = 'radar-sweep pointer-events-none absolute inset-0 rounded-xl overflow-hidden z-[400]';
        sweep.innerHTML = `
          <div style="position: absolute; top: 50%; left: 50%; width: 200%; height: 200%; transform-origin: 0 0; background: conic-gradient(from 0deg, rgba(34, 197, 94, 0.2) 0deg, transparent 60deg); animation: spin 4s linear infinite;"></div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background-color: #22c55e; border-radius: 50%; box-shadow: 0 0 20px #22c55e;"></div>
          <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
        `;
        mapContainer.appendChild(sweep);
      }
    };

    initMap();
  }, [orders, onAcceptOrder]);

  return (
    <div className="w-full h-[500px] lg:h-[600px] rounded-2xl overflow-hidden border-2 border-[#1f2937] relative shadow-2xl relative bg-black">
      {/* Radar scanning text */}
      <div className="absolute top-6 left-6 z-[1000] bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-green-500/30 text-green-400 font-mono text-xs font-bold tracking-widest uppercase flex items-center gap-3 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Radar Scanning Active
      </div>
      
      <div ref={mapRef} className="w-full h-full z-0 font-sans"></div>

      <style>{`
        .leaflet-popup-content-wrapper {
          background-color: #1f2937;
          color: white;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .leaflet-popup-tip {
          background-color: #1f2937;
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </div>
  );
};

export default RadarMap;
