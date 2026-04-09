import React, { useEffect, useRef, useState } from 'react';
import socketService from '../services/socket';

const LiveRouteMap = ({ order, isExpanded }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const [partnerLocation, setPartnerLocation] = useState(null);

  // Standardize coordinates to [lat, lng] for Leaflet
  const normalizeCoords = (coords) => {
    if (!coords) return null;
    if (typeof coords === 'object' && !Array.isArray(coords)) {
      if (coords.lat !== undefined && coords.lng !== undefined) return [coords.lat, coords.lng];
    }
    if (Array.isArray(coords) && coords.length >= 2) {
      if (coords[0] > 60 && coords[1] < 35) return [coords[1], coords[0]];
      return [coords[0], coords[1]];
    }
    return null;
  };

  // Initialize Map
  useEffect(() => {
    if (!isExpanded || !mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (!mapInstanceRef.current) {
        const customerPoints = order.deliveryAddress?.location?.coordinates || [17.3850, 78.4867];
        const customerCoords = normalizeCoords(customerPoints);
        
        const shopPoints = order.shop?.location?.coordinates || [customerCoords[0] - 0.02, customerCoords[1] - 0.02];
        const shopCoords = normalizeCoords(shopPoints);

        mapInstanceRef.current = L.map(mapRef.current).setView(customerCoords, 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);

        // Customer Marker
        const customerIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        L.marker(customerCoords, { icon: customerIcon }).addTo(mapInstanceRef.current).bindPopup('Delivery Location');

        // Shop Marker
        const shopIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background-color: #22c55e; width: 16px; height: 16px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.marker(shopCoords, { icon: shopIcon }).addTo(mapInstanceRef.current).bindPopup('Store');

        // Delivery Partner Marker (Initial position at Shop)
        const deliveryIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><span style="font-size: 10px;">🛵</span></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        deliveryMarkerRef.current = L.marker(shopCoords, { icon: deliveryIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current).bindPopup('Delivery Partner');

        // Fit bounds to show both initially
        const bounds = L.latLngBounds([customerCoords, shopCoords]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });

        // Fetch Route Geometries
        try {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${shopCoords[1]},${shopCoords[0]};${customerCoords[1]},${customerCoords[0]}?overview=full&geometries=geojson&alternatives=true`;
          const res = await fetch(osrmUrl);
          const data = await res.json();
          
          if (data.routes && data.routes.length > 0) {
            const shortestRoute = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            
            // Draw Shortest Route (Gray, Dashed)
            L.polyline(shortestRoute, {
              color: '#9ca3af',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.8
            }).addTo(mapInstanceRef.current);
            
            // Draw Eco Route (Green, Solid)
            let ecoRouteCoords;
            if (data.routes.length > 1) {
              ecoRouteCoords = data.routes[1].geometry.coordinates.map(c => [c[1], c[0]]);
            } else {
              // Simulate Eco Route by adding an offset midpoint
              const midLat = (shopCoords[0] + customerCoords[0]) / 2 + 0.003;
              const midLng = (shopCoords[1] + customerCoords[1]) / 2 + 0.003;
              ecoRouteCoords = [shopCoords, [midLat, midLng], customerCoords];
            }
            
            const ecoPolyline = L.polyline(ecoRouteCoords, {
              color: '#22c55e',
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(mapInstanceRef.current);

            // Add Eco label at center
            const centerIdx = Math.floor(ecoRouteCoords.length / 2);
            L.marker(ecoRouteCoords[centerIdx], {
              icon: L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="background: rgba(255,255,255,0.9); padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; color: #166534; border: 1px solid #22c55e; white-space: nowrap; transform: translate(-50%, -50%); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">🌿 Eco Route</div>',
                iconSize: [0, 0]
              })
            }).addTo(mapInstanceRef.current);

            // Refit bounds perfectly to route
            mapInstanceRef.current.fitBounds(ecoPolyline.getBounds(), { padding: [50, 50] });
          }
        } catch (e) {
          console.error('Failed to fetch route geometries:', e);
        }
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isExpanded, order]);

  // WebSocket Subscription
  useEffect(() => {
    if (!isExpanded) return;

    socketService.joinOrderRoom(order._id);

    const onLocationUpdate = (data) => {
      if (data.orderId === order._id && mapInstanceRef.current && deliveryMarkerRef.current) {
        const newLatLng = [data.latitude, data.longitude];
        deliveryMarkerRef.current.setLatLng(newLatLng);
        setPartnerLocation(newLatLng);
        mapInstanceRef.current.panTo(newLatLng);
      }
    };

    const unsub = socketService.on('delivery-update', onLocationUpdate);

    return () => {
      unsub();
      socketService.leaveOrderRoom(order._id);
    };
  }, [isExpanded, order._id]);

  if (!isExpanded) return null;

  return (
    <div className="w-full h-64 lg:h-80 rounded-xl overflow-hidden border border-border mt-4 relative shadow-inner">
      <div ref={mapRef} className="w-full h-full z-0"></div>
      
      {/* Overlay Info */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-border text-sm font-semibold flex items-center gap-2 animate-fade-in">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
        Live Tracking Active
      </div>
    </div>
  );
};

export default LiveRouteMap;
