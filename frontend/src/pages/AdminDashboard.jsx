import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../state/authStore';
import { api } from '../services/api';
import socketService from '../services/socket';
import { TrendingUp, Truck, Store, MapPin, IndianRupee, Globe2, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const AdminDashboard = () => {
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState({ gmv: 0, orders: 0, shops: 0, activeAgents: 0, carbonSaved: 0 });
  const [activeDeliveries, setActiveDeliveries] = useState({});
  const [chartData, setChartData] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, shopsRes] = await Promise.all([
          api.get('/orders?limit=1000'),
          api.get('/shops')
        ]);
        
        const allOrders = ordersRes.data.data.orders;
        const allShops = shopsRes.data.shops;
        
        const delivered = allOrders.filter(o => o.status.current === 'delivered');
        const gmv = delivered.reduce((acc, o) => acc + o.totalAmount, 0);
        const carbonSaved = delivered.reduce((acc, o) => acc + (o.emissionData?.carbonSaved || 0), 0);
        
        setStats({
          gmv,
          orders: allOrders.length,
          shops: allShops.length,
          activeAgents: 0,
          carbonSaved: Math.round(carbonSaved / 100)
        });

        // Prepare chart data (last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString());
          return {
            name: dateStr,
            revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
            orders: dayOrders.length
          };
        }).reverse();
        
        setChartData(last7Days);

      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };
    fetchData();
  }, []);

  // Initialize God View Map
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (!mapInstanceRef.current) {
      // Default to India center
      mapInstanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }
  }, []);

  // Socket Tracking for ALL active agents
  useEffect(() => {
    if (token && mapInstanceRef.current) {
      socketService.connect(token);
      const socket = socketService.getSocket();
      
      if (socket) {
        socket.emit('join-admin-tracking');
        
        const handleGlobalUpdate = (data) => {
          const { deliveryPartnerId, latitude, longitude, orderId } = data;
          
          setActiveDeliveries(prev => {
            const next = { ...prev, [deliveryPartnerId]: { lat: latitude, lng: longitude, orderId } };
            setStats(s => ({ ...s, activeAgents: Object.keys(next).length }));
            return next;
          });

          // Update marker
          const coords = [latitude, longitude];
          if (!markersRef.current[deliveryPartnerId]) {
            const agentIcon = L.divIcon({
              className: 'custom-div-icon',
              html: '<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><span style="font-size: 8px;">🛵</span></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            });
            markersRef.current[deliveryPartnerId] = L.marker(coords, { icon: agentIcon, zIndexOffset: 1000 })
              .addTo(mapInstanceRef.current)
              .bindPopup(`Agent ID: ${deliveryPartnerId.slice(-4)}<br>Order: #${orderId.slice(-6)}`);
            
            // Pan to the first active agent loosely
            mapInstanceRef.current.setView(coords, 12);
          } else {
            markersRef.current[deliveryPartnerId].setLatLng(coords);
          }
        };

        socket.on('global-delivery-update', handleGlobalUpdate);

        return () => {
          socket.off('global-delivery-update', handleGlobalUpdate);
          // Optional cleanup of markers on unmount
          Object.values(markersRef.current).forEach(m => m.remove());
          markersRef.current = {};
        };
      }
    }
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
          <Globe2 className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Global Command Center</h1>
          <p className="text-muted-foreground mt-1">Platform-wide overview, fleet God-mode, and analytics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl border border-border/50 flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="p-3 bg-green-500/10 text-green-600 rounded-xl"><IndianRupee className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total GMV</p>
            <p className="text-3xl font-black text-foreground">₹{stats.gmv.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border border-border/50 flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl"><Truck className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Fleet</p>
            <p className="text-3xl font-black text-foreground">{stats.activeAgents}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Live tracking active</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border border-border/50 flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl"><Store className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Partner Shops</p>
            <p className="text-3xl font-black text-foreground">{stats.shops}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border border-border/50 flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Impact (Trees)</p>
            <p className="text-3xl font-black text-foreground">{stats.carbonSaved}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Offset via Eco-routes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* God View Map */}
        <div className="glass p-6 rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" /> Live Fleet God-Mode
          </h2>
          <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-border relative">
            <div ref={mapRef} className="w-full h-full z-0"></div>
            {stats.activeAgents === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-sm pointer-events-none">
                <div className="px-6 py-4 bg-background border border-border rounded-2xl shadow-xl flex items-center gap-4">
                  <Truck className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-bold text-foreground">Waiting for activity</h3>
                    <p className="text-sm text-muted-foreground">No active deliveries tracked</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="glass p-6 rounded-3xl border border-border/50 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Revenue & Order Trends
          </h2>
          <div className="flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#22c55e', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
