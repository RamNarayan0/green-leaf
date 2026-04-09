import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, ArrowLeft, Search, Filter, Leaf as EcoLeaf, Package, Bell } from 'lucide-react';
import { shopsAPI, productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const ShopView = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState(['All']);
  const [notificationLoading, setNotificationLoading] = useState(null);

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        setLoading(true);
        // Fetch shop info and products concurrently
        const [shopRes, prodRes] = await Promise.all([
          shopsAPI.getById(id),
          productsAPI.getByShop(id)
        ]);
        
        if (shopRes.data?.data?.shop) {
          setShop(shopRes.data.data.shop);
        }
        if (prodRes.data?.data?.products) {
          setProducts(prodRes.data.data.products);
        }
      } catch (error) {
        console.error('Error fetching shop details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const res = await productsAPI.getCategories();
        if (res.data?.data?.categories) {
          const catNames = res.data.data.categories.map(c => c.name);
          setCategories(['All', ...catNames]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchShopDetails();
    fetchCategories();
  }, [id]);

  const handleNotifyMe = async (productId) => {
    try {
      setNotificationLoading(productId);
      const res = await productsAPI.notify(productId);
      if (res.data?.success) {
        alert('You will be notified when this product is back in stock!');
      }
    } catch (err) {
      console.error("Failed to set alert", err);
      alert("Failed to set alert");
    } finally {
      setNotificationLoading(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = categoryFilter === 'All' || p.category?.name?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen pt-24 px-4 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Shop not found</h2>
        <Link to="/" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Shop Header Cover */}
      <div className="relative h-[30vh] md:h-[40vh] bg-green-900 w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80" 
          alt="Store Cover" 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute top-6 left-6 z-20">
          <Link to="/" className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 z-20">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-lg border-4 border-white/20">
                  <span className="text-4xl text-primary font-extrabold">{shop.name.charAt(0)}</span>
                </div>
                <div className="text-white">
                  <h1 className="text-3xl md:text-5xl font-bold mb-2 shadow-sm">{shop.name}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/90">
                    <span className="flex items-center gap-1 bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded border border-yellow-500/50 text-yellow-300">
                      <Star className="w-4 h-4 fill-current" /> {shop.rating?.toFixed(1) || 'NEW'}
                    </span>
                    {shop.isEcoFriendly && (
                      <span className="flex items-center gap-1 bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded border border-green-500/50 text-green-300">
                        <EcoLeaf className="w-4 h-4" /> Eco Partner
                      </span>
                    )}
                    {shop.hasEcoPackaging && (
                      <span className="flex items-center gap-1 bg-blue-500/20 backdrop-blur-sm px-2 py-1 rounded border border-blue-500/50 text-blue-300">
                        <Package className="w-4 h-4" /> Green Pack
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {shop.address?.city || 'Local Store'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {shop.openingHours || '8 AM - 10 PM'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Bar */}
        <div className="sticky top-[72px] z-30 bg-background/80 backdrop-blur-xl py-4 mb-8 border-b border-border/50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder={`Search in ${shop.name}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide shrink-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    categoryFilter === cat 
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                      : 'bg-card border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            {categoryFilter === 'All' ? 'All Products' : `${categoryFilter} Products`}
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {filteredProducts.length}
            </span>
          </h2>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-muted/20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No products found</h3>
              <p className="text-muted-foreground">Try selecting a different category or clear filters.</p>
              <button 
                onClick={() => setCategoryFilter('All')}
                className="mt-4 text-primary font-medium hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopView;
