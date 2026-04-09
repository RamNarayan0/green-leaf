import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, Grid, List, X, ChevronDown, Star, Search 
} from 'lucide-react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const categories = [
  { id: 'all', name: 'All Products' },
  { id: 'fruits-vegetables', name: 'Fruits & Vegetables' },
  { id: 'groceries', name: 'Groceries' },
  { id: 'dairy-eggs', name: 'Dairy & Eggs' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'meat-fish', name: 'Meat & Fish' },
  { id: 'bakery', name: 'Bakery' },
  { id: 'household', name: 'Household' },
];

const sortOptions = [
  { id: 'popularity', name: 'Popularity' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'rating', name: 'Highest Rated' },
  { id: 'newest', name: 'Newest First' },
];

const priceRanges = [
  { id: 'all', name: 'All Prices' },
  { id: '0-100', name: 'Under ₹100' },
  { id: '100-250', name: '₹100 - ₹250' },
  { id: '250-500', name: '₹250 - ₹500' },
  { id: '500-1000', name: '₹500 - ₹1000' },
  { id: '1000+', name: 'Above ₹1000' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity');
  const [priceRange, setPriceRange] = useState('all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          category: category !== 'all' ? category : undefined,
          sortBy,
          search: search || undefined,
          minRating: minRating > 0 ? minRating : undefined,
          inStock: inStock || undefined,
        };
        
        const response = await productsAPI.getAll(params);
        let filteredProducts = response.data.data?.products || [];

        // Handle flash filter from Home.jsx
        if (searchParams.get('filter') === 'flash') {
          filteredProducts = filteredProducts.filter(p => {
            const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
            return discount >= 50;
          });
        }
        
        if (priceRange !== 'all') {
          // Handle '1000+' (no upper bound) and '100-250' ranges
          const hasPlus = priceRange.endsWith('+');
          const parts = priceRange.replace('+', '').split('-').map(Number);
          const [min, max] = parts;
          filteredProducts = filteredProducts.filter(p => {
            if (hasPlus) return p.price >= min;
            if (max !== undefined && !isNaN(max)) return p.price >= min && p.price <= max;
            return p.price >= min;
          });
        }
        
        setProducts(filteredProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [category, sortBy, priceRange, search, minRating, inStock]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    if (cat !== 'all') {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setCategory('all');
    setSortBy('popularity');
    setPriceRange('all');
    setSearch('');
    setMinRating(0);
    setInStock(false);
    setSearchParams({});
  };

  const activeFiltersCount = [
    category !== 'all',
    priceRange !== 'all',
    minRating > 0,
    inStock,
    search.length > 0,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-background pt-16 lg:pt-[72px]">
      {/* Sticky Filters Header */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border sticky top-16 lg:top-[72px] z-20 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search products by name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-transparent rounded-full focus:bg-background focus:border-border focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all placeholder:text-muted-foreground font-medium text-sm text-foreground"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-card border border-border rounded-full text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring/20 focus:border-primary focus:outline-none transition-colors cursor-pointer shadow-sm hover:border-primary/50"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full text-sm font-semibold shadow-sm text-foreground"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* View Toggle */}
              <div className="hidden sm:flex items-center bg-muted rounded-full p-1 border border-border/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Bubbles */}
          {activeFiltersCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap items-center gap-2 mt-4"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">Active filters:</span>
              
              {category !== 'all' && (
                <button onClick={() => handleCategoryChange('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full text-xs font-bold border border-primary/20">
                  {categories.find(c => c.id === category)?.name} <X className="w-3 h-3" />
                </button>
              )}
              {priceRange !== 'all' && (
                <button onClick={() => setPriceRange('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full text-xs font-bold border border-primary/20">
                  {priceRanges.find(p => p.id === priceRange)?.name} <X className="w-3 h-3" />
                </button>
              )}
              {minRating > 0 && (
                <button onClick={() => setMinRating(0)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full text-xs font-bold border border-primary/20">
                  {minRating}+ Stars <X className="w-3 h-3" />
                </button>
              )}
              {inStock && (
                <button onClick={() => setInStock(false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full text-xs font-bold border border-primary/20">
                  In Stock Only <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 hover:underline transition-colors"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex gap-8">
          
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-40 space-y-6">
              {/* Categories block */}
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Categories</h3>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        category === cat.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range block */}
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Price Range</h3>
                <div className="space-y-1">
                  {priceRanges.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setPriceRange(range.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        priceRange === range.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {range.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter block */}
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Rating</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        minRating === rating
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating ? 'text-secondary fill-secondary' : 'text-border'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs">& Above</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability block */}
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-border rounded bg-background peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                       <svg className={`w-3 h-3 text-primary-foreground pointer-events-none transition-opacity ${inStock ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">In Stock Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Mobile Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <div className="lg:hidden fixed inset-0 z-50">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-md" 
                  onClick={() => setShowFilters(false)} 
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-card border-l border-border overflow-y-auto shadow-2xl"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                      <h2 className="text-xl font-extrabold text-foreground">Filters</h2>
                      <button onClick={() => setShowFilters(false)} className="p-2 bg-muted rounded-full hover:bg-border transition-colors text-foreground">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Categories Mobile */}
                    <div className="mb-8">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Categories</h3>
                      <div className="space-y-1">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                              category === cat.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Mobile */}
                    <div className="mb-8">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Price Range</h3>
                      <div className="space-y-1">
                        {priceRanges.map((range) => (
                          <button
                            key={range.id}
                            onClick={() => setPriceRange(range.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                              priceRange === range.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            {range.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowFilters(false)} 
                      className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl shadow-eco hover:bg-primary/90 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="flex-1 w-full relative">
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-muted-foreground">
                {loading ? 'Searching environment...' : `Showing ${products.length} products`}
              </p>
            </div>

            {loading ? (
              <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse h-[320px]">
                    <div className="aspect-square bg-muted rounded-xl mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed mt-6">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
                <button 
                  onClick={clearFilters}
                  className="px-6 py-3 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors shadow-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {products.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Products;
