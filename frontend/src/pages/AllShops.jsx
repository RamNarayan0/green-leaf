import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Store, Leaf, Star, Clock, Filter } from 'lucide-react';
import { shopsAPI } from '../services/api';
import { motion } from 'framer-motion';

const AllShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Grocery', 'Electronics', 'Pharmacy', 'Bakery', 'Organic', 'Supermarket'];

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const res = await shopsAPI.getAll();
        const data = res.data?.data?.shops || res.data?.shops || res.data?.data || [];
        setShops(data);
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShops();
  }, []);

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (shop.address?.street || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || shop.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Header Cover */}
      <div className="relative bg-primary/10 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.1),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-bold mb-6">
              <Store className="w-4 h-4" /> Discover GreenRoute Partners
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-4">
              All Partner <span className="text-primary">Stores</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Find premium eco-friendly stores near you and browse their fresh, sustainable catalogs.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-8 relative z-20">
        {/* Modern Search & Filter Bar */}
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-4 md:p-6 mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search stores by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 h-14 bg-muted/30 border border-border rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide shrink-0">
              <Filter className="w-5 h-5 text-muted-foreground mx-2 hidden md:block" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`whitespace-nowrap px-5 h-12 rounded-xl text-sm font-bold transition-all border ${
                    categoryFilter === cat 
                      ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                      : 'bg-background border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Shimmer / Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[260px] bg-muted animate-pulse rounded-3xl border border-border/50"></div>
            ))}
          </div>
        ) : filteredShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShops.map((shop, index) => (
              <motion.div
                key={shop._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link to={`/shop/${shop._id}`} className="block group h-full">
                  <div className="bg-card rounded-3xl p-6 border border-border shadow-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                    
                    {/* Decorative Blob */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-2xl shadow-inner border border-primary/10 group-hover:scale-105 transition-transform">
                        {shop.name.charAt(0)}
                      </div>
                      <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-yellow-500/20">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> 
                        {shop.rating?.toFixed(1) || 'NEW'}
                      </div>
                    </div>

                    <div className="flex-1 relative z-10">
                      <h3 className="text-xl font-extrabold text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-1">{shop.name}</h3>
                      <p className="text-sm font-semibold text-primary/80 mb-4">{shop.category || 'General Sustainability Store'}</p>
                      
                      <div className="space-y-2 mt-auto">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{shop.address?.street || shop.address?.city || 'Local Area'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{shop.openingHours || '8:00 AM - 10:00 PM'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border shadow-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">No stores found</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
              We couldn't find any stores matching your current search or category filter. Try adjusting your criteria.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-md"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllShops;
