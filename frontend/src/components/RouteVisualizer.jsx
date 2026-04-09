import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ShoppingBag } from 'lucide-react';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RouteVisualizer = ({ 
  shopLocation, 
  customerLocation, 
  routes, 
  selectedRouteType = 'shortest' 
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef({ shortest: null, eco: null });

  // Standardize coordinates to [lat, lng] for Leaflet
  const normalizeCoords = (coords) => {
    if (!coords) return null;
    
    // Handle { lat, lng } object format (Preferred)
    if (typeof coords === 'object' && !Array.isArray(coords)) {
      if (coords.lat !== undefined && coords.lng !== undefined) {
        return [coords.lat, coords.lng];
      }
    }
    
    // Handle [lat, lng] or [lng, lat] array format
    if (Array.isArray(coords) && coords.length >= 2) {
      // Heuristic: If first element is > 60 and second is < 35, it's [lng, lat] (GeoJSON for India)
      if (coords[0] > 60 && coords[1] < 35) {
        return [coords[1], coords[0]];
      }
      return [coords[0], coords[1]];
    }
    
    return null;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([17.3850, 78.4867], 13); // Default to Hyderabad

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    const map = mapInstanceRef.current;
    const sLoc = normalizeCoords(shopLocation);
    const cLoc = normalizeCoords(customerLocation);

    // Clear existing markers/polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    if (sLoc && cLoc) {
      // Add Shop Marker
      const shopIcon = L.divIcon({
        html: `<div class="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>`,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker(sLoc, { icon: shopIcon }).addTo(map).bindPopup('<b>Vendor Shop</b>');

      // Add Customer Marker
      const customerIcon = L.divIcon({
        html: `<div class="bg-green-600 p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker(cLoc, { icon: customerIcon }).addTo(map).bindPopup('<b>Delivery Point</b>');

      // Draw Routes
      if (routes) {
        // Shortest Route
        const shortestPoints = (routes.shortest.polyline || routes.shortest).map(p => normalizeCoords(p)).filter(p => p !== null);
        const shortestPoly = L.polyline(shortestPoints, {
          color: selectedRouteType === 'shortest' ? '#f59e0b' : '#94a3b8',
          weight: selectedRouteType === 'shortest' ? 6 : 4,
          opacity: selectedRouteType === 'shortest' ? 1 : 0.4,
          dashArray: selectedRouteType === 'shortest' ? null : '5, 10'
        }).addTo(map);

        // Eco Route
        const ecoPoints = (routes.eco.polyline || routes.eco).map(p => normalizeCoords(p)).filter(p => p !== null);
        const ecoPoly = L.polyline(ecoPoints, {
          color: selectedRouteType === 'eco' ? '#10b981' : '#94a3b8',
          weight: selectedRouteType === 'eco' ? 6 : 4,
          opacity: selectedRouteType === 'eco' ? 1 : 0.4,
          dashArray: selectedRouteType === 'eco' ? null : '5, 10'
        }).addTo(map);

        polylinesRef.current = { shortest: shortestPoly, eco: ecoPoly };

        // Fit bounds
        const group = new L.featureGroup([shortestPoly, ecoPoly]);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } else {
        // Just fit to markers
        const bounds = L.latLngBounds([sLoc, cLoc]);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [shopLocation, customerLocation, routes, selectedRouteType]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-border shadow-inner group">
      <div 
        ref={mapContainerRef} 
        style={{ height: '320px', width: '100%', zIndex: 1 }}
        className="bg-muted/30"
      />
      
      {/* Overlay Legend */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm border transition-all flex items-center gap-2 ${
          selectedRouteType === 'shortest' ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-border text-muted-foreground'
        }`}>
          <div className={`w-2 h-2 rounded-full ${selectedRouteType === 'shortest' ? 'bg-white' : 'bg-amber-500'}`} />
          Shortest Route
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm border transition-all flex items-center gap-2 ${
          selectedRouteType === 'eco' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-border text-muted-foreground'
        }`}>
          <div className={`w-2 h-2 rounded-full ${selectedRouteType === 'eco' ? 'bg-white' : 'bg-emerald-500'}`} />
          Eco-Smart Route
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000]">
         <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-border shadow-lg flex items-center gap-3">
            <div className="flex -space-x-2">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white"><ShoppingBag className="w-4 h-4 text-blue-600" /></div>
               <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-white"><MapPin className="w-4 h-4 text-green-600" /></div>
            </div>
            <div>
               <p className="text-[10px] font-extrabold text-muted-foreground uppercase leading-none">Mapping Progress</p>
               <p className="text-xs font-bold text-foreground mt-1">Shop to Customer Path</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RouteVisualizer;
