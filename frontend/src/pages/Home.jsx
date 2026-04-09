import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ChevronLeft, ChevronRight, Clock, 
  Sparkles, TrendingUp, Leaf, Truck, Package 
} from 'lucide-react';
import { productsAPI, shopsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Badge from '../components/ui/Badge';

// Mock data for demo
const categories = [
  { name: 'Fruits & Vegetables', icon: '🥬', slug: 'fruits-vegetables', color: 'bg-green-100/50 text-green-700' },
  { name: 'Groceries', icon: '🛒', slug: 'groceries', color: 'bg-blue-100/50 text-blue-700' },
  { name: 'Dairy & Eggs', icon: '🥛', slug: 'dairy-eggs', color: 'bg-yellow-100/50 text-yellow-700' },
  { name: 'Beverages', icon: '🥤', slug: 'beverages', color: 'bg-purple-100/50 text-purple-700' },
  { name: 'Snacks', icon: '🍿', slug: 'snacks', color: 'bg-orange-100/50 text-orange-700' },
  { name: 'Meat & Fish', icon: '🥩', slug: 'meat-fish', color: 'bg-red-100/50 text-red-700' },
  { name: 'Bakery', icon: '🍞', slug: 'bakery', color: 'bg-amber-100/50 text-amber-700' },
  { name: 'Household', icon: '🧹', slug: 'household', color: 'bg-slate-100/50 text-slate-700' },
];

const flashDeals = [
  { id: 1, name: 'Fresh Apples', price: 149, originalPrice: 299, discount: 50, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400' },
  { id: 2, name: 'Organic Bananas', price: 49, originalPrice: 99, discount: 50, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
  { id: 3, name: 'Green Grapes', price: 179, originalPrice: 350, discount: 49, image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400' },
  { id: 4, name: 'Fresh Strawberries', price: 199, originalPrice: 399, discount: 50, image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400' },
];

const promotions = [
  {
    id: 1,
    title: 'Fresh Vegetables Sale',
    subtitle: 'Up to 50% Off',
    description: 'Get fresh vegetables at unbeatable prices directly from eco-friendly farms.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200',
    cta: 'Shop Now'
  },
  {
    id: 2,
    title: 'Organic Fruits',
    subtitle: 'Healthy Living',
    description: 'Premium organic fruits for your family. Zero pesticides, 100% natural.',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200',
    cta: 'Explore'
  },
];

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, shopsRes] = await Promise.allSettled([
          productsAPI.getAll({ limit: 12, sortBy: 'popularity' }),
          shopsAPI.getNearby(17.3850, 78.4867, 10)
        ]);
        
        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.data?.data?.products || []);
        }
        if (shopsRes.status === 'fulfilled') {
          setShops(shopsRes.value.data?.data?.shops || shopsRes.value.data?.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promotions.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % promotions.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + promotions.length) % promotions.length);

  return (
    <main className="min-h-screen pt-16 lg:pt-[72px] bg-background relative overflow-hidden">
      
      {/* Premium Hero Carousel */}
      <section className="relative h-[85vh] lg:h-[75vh] w-full overflow-hidden max-w-[1600px] mx-auto lg:p-6 pb-0">
        <div className="relative w-full h-full lg:rounded-3xl overflow-hidden shadow-card">
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {/* Overlay Gradient specific to Swift Eco Cart - Left side darkened for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
              <img 
                src={promotions[currentSlide].image} 
                alt={promotions[currentSlide].title}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 z-20 flex items-center">
                <div className="container mx-auto px-6 sm:px-12 lg:px-20 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="max-w-2xl"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary-foreground mb-6 text-sm font-semibold tracking-wide">
                      <Sparkles className="w-4 h-4" />
                      {promotions[currentSlide].subtitle}
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight text-glow">
                      {promotions[currentSlide].title}
                    </h1>
                    <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-lg font-medium leading-relaxed">
                      {promotions[currentSlide].description}
                    </p>
                    <button className="h-14 px-8 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-eco transition-all text-lg font-semibold group duration-300">
                      {promotions[currentSlide].cta}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Minimalist Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4 z-30 pointer-events-none">
            <button onClick={prevSlide} className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextSlide} className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {promotions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-primary w-10 shadow-eco' : 'bg-white/50 hover:bg-white/80 w-2'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid - Clean Style */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">Premium categories optimized for your eco-friendly lifestyle.</p>
            </div>
            <Link to="/products" className="group inline-flex items-center justify-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              See all categories <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/products?category=${category.slug}`}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-card-hover transition-all group h-full"
                >
                  <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}>
                    {category.icon}
                  </div>
                  <span className="text-sm font-semibold text-foreground text-center line-clamp-2 leading-tight">
                    {category.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Stores / Shop Discovery (Zepto/Zomato style) */}
      <section className="py-16 bg-green-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-2">
                <Leaf className="w-8 h-8 text-primary" />
                Local Eco-Stores Near You
              </h2>
              <p className="text-muted-foreground">Discover fresh products from certified sustainable sellers in your neighborhood.</p>
            </div>
            <Link to="/shops" className="group inline-flex items-center justify-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              See all stores <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-[200px] bg-muted animate-pulse rounded-2xl"></div>
              ))
            ) : shops.length > 0 ? (
              shops.map(shop => (
                <Link to={`/shop/${shop._id}`} key={shop._id} className="block group">
                  <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shadow-sm group-hover:scale-105 transition-transform">
                        {shop.name.charAt(0)}
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-bold">
                        ⭐ {shop.rating?.toFixed(1) || 'NEW'}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {shop.isEcoFriendly && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-800/50">
                          <Leaf className="w-3 h-3" /> Eco Partner
                        </div>
                      )}
                      {shop.hasEcoPackaging && (
                        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800/50">
                          <Package className="w-3 h-3" /> Green Pack
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{shop.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{shop.category || 'General Store'}</p>
                      
                      <div className="flex items-center gap-4 text-sm mt-auto border-t border-border/50 pt-4">
                        <span className="flex items-center text-muted-foreground">📍 {(shop.distance || 2.5).toFixed(1)} km</span>
                        <span className="flex items-center text-muted-foreground">🕒 {shop.openingHours || '8 AM - 10 PM'}</span>
                        <span className="flex items-center text-primary font-medium ml-auto">Free Delivery</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-card rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground">Connecting to nearby stores...</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-primary font-medium hover:underline text-sm">Refresh Location</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Flash Deals - Shadcn Glass style */}
      <section className="py-16 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-destructive animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">Flash Deals</h2>
                <p className="text-destructive font-semibold text-sm">Sale ends in 04:23:45</p>
              </div>
            </div>
            <Link to="/products?filter=flash" className="group inline-flex items-center justify-center h-10 px-6 rounded-full bg-card border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              View All Deals
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {flashDeals.map((deal, index) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/product/${deal.id}`} className="block group h-full">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 group-hover:shadow-card-hover transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img 
                        src={deal.image} 
                        alt={deal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                        -{deal.discount}%
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-foreground mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{deal.name}</h3>
                      <div className="flex flex-col justify-end">
                        <span className="text-xs text-muted-foreground line-through mb-1">₹{deal.originalPrice}</span>
                        <span className="text-2xl font-bold text-primary">₹{deal.price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">Trending Freshness</h2>
                <p className="text-muted-foreground">Most loved environmental choices from our community.</p>
              </div>
            </div>
            <Link to="/products?sort=popularity" className="group inline-flex items-center justify-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Explore catalog <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse h-[320px]">
                  <div className="w-full h-48 bg-muted rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.slice(0, 8).map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modern Eco-Friendly Banner */}
      <section className="py-12 lg:py-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-eco rounded-3xl p-8 lg:p-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative shadow-eco">
          <div className="absolute top-0 right-0 w-full h-full hidden lg:block pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent"></div>
          
          <div className="flex-1 text-center lg:text-left z-10 relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full font-bold text-sm mb-8 uppercase tracking-widest shadow-sm">
              <Leaf className="w-4 h-4 drop-shadow-sm" />
              100% Eco-Friendly Logistics
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-sm">
              Delivery with <br className="hidden lg:block"/> Zero Carbon
            </h2>
            <p className="text-white/90 text-lg mb-10 max-w-xl font-medium leading-relaxed">
              We're committed to sustainable delivery. Every order you place helps reduce carbon emissions with our electric fleet and biodegradable packaging.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="h-14 px-8 rounded-xl bg-white text-primary font-bold hover:bg-white/90 transition-colors shadow-sm text-lg">
                View Impact Report
              </button>
              <button className="h-14 px-8 rounded-xl bg-primary-foreground/10 border border-white/30 text-white font-bold hover:bg-white/20 backdrop-blur-md transition-colors text-lg">
                Join the Mission
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center z-10">
            <div className="relative w-64 h-64 lg:w-96 lg:h-96">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-2xl flex items-center justify-center animate-float">
                <Truck className="w-32 h-32 text-white drop-shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Download / Footer Hook */}
      <section className="py-24 bg-foreground relative overflow-hidden mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 justify-between">
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-background mb-6 tracking-tight">
                Unlock Green Leaf Premium
              </h2>
              <p className="text-muted text-lg lg:text-xl mb-10 font-medium">
                Download our app for exclusive eco-deals, ultra-fast ordering, and real-time sustainable delivery tracking. Join 500k+ eco-warriors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="h-16 px-8 bg-background text-foreground rounded-2xl font-bold hover:bg-background/90 transition-all flex items-center justify-center gap-3 text-lg hover:scale-105 active:scale-95 duration-200">
                  <span className="text-3xl">🍎</span>
                  App Store
                </button>
                <button className="h-16 px-8 bg-background text-foreground rounded-2xl font-bold hover:bg-background/90 transition-all flex items-center justify-center gap-3 text-lg hover:scale-105 active:scale-95 duration-200">
                  <span className="text-3xl">▶️</span>
                  Google Play
                </button>
              </div>
            </div>
            
            <div className="flex-none w-full lg:w-1/3 flex justify-center lg:justify-end">
              <div className="relative max-w-[300px] w-full">
                {/* Simulated Glass Phone */}
                <div className="aspect-[9/19] w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-[3rem] border-8 border-background/20 shadow-2xl overflow-hidden flex flex-col justify-end p-6">
                  <div className="w-full h-1/2 bg-primary/20 absolute blur-[80px] -top-1/4 -left-1/4 rounded-full"></div>
                  <div className="relative z-10 w-full h-full bg-card/10 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-6xl text-white">📱</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
