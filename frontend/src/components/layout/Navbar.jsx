import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, User, Menu, X, MapPin, 
  Heart, Package, LogOut, ChevronDown, LayoutDashboard, ShieldCheck, Truck, Leaf as EcoLeaf, Moon, Sun, Mic, MicOff 
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { useAuthStore } from '../../state/authStore';
import { useThemeStore } from '../../state/themeStore';

const categories = [
  { name: 'Fruits & Vegetables', icon: '🥬', slug: 'fruits-vegetables' },
  { name: 'Groceries', icon: '🛒', slug: 'groceries' },
  { name: 'Dairy & Eggs', icon: '🥛', slug: 'dairy-eggs' },
  { name: 'Beverages', icon: '🥤', slug: 'beverages' },
  { name: 'Snacks', icon: '🍿', slug: 'snacks' },
  { name: 'Meat & Fish', icon: '🥩', slug: 'meat-fish' },
  { name: 'Bakery', icon: '🍞', slug: 'bakery' },
  { name: 'Household', icon: '🧹', slug: 'household' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  
  const navigate = useNavigate();
  const { cart } = useAppStore();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const cartQuantity = cart?.totalQuantity || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      navigate(`/products?search=${encodeURIComponent(transcript)}`);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Mock search results - in production, call API
      setSearchResults([
        { id: 1, name: 'Fresh Apples', category: 'Fruits' },
        { id: 2, name: 'Organic Bananas', category: 'Fruits' },
        { id: 3, name: 'Green Vegetables', category: 'Vegetables' },
      ].filter(item => item.name.toLowerCase().includes(query.toLowerCase())));
    } else {
      setSearchResults([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 dark:bg-gray-900/95 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navbar */}
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              Green<span className="text-green-600">Leaf</span>
            </span>
          </Link>

          {/* Location Selector - Desktop */}
          <button className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <MapPin className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="text-xs text-gray-500">Deliver to</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hyderabad</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 mx-8">
            <NavLink to="/products" className={({isActive}) => `text-sm font-bold transition-colors ${isActive ? 'text-green-600' : 'text-gray-600 dark:text-gray-400 hover:text-green-600'}`}>Products</NavLink>
            <NavLink to="/shops" className={({isActive}) => `text-sm font-bold transition-colors ${isActive ? 'text-green-600' : 'text-gray-600 dark:text-gray-400 hover:text-green-600'}`}>Stores</NavLink>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:block flex-1 max-w-xl mx-8" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-gray-700 focus:border-green-500 dark:text-white focus:outline-none transition-all"
              />
              <button 
                onClick={handleVoiceSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400'}`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchOpen && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          navigate(`/products?search=${result.name}`);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                      >
                        <Search className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{result.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{result.category}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Wishlist - Desktop */}
            <NavLink to="/wishlist" className="hidden lg:flex p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </NavLink>

            {/* Eco Loyalty Points */}
            {user && (
              <NavLink to="/rewards" className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 rounded-full border border-green-100 dark:border-green-800 hover:border-green-300 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-green-400/5 group-hover:bg-green-400/10 transition-colors" />
                <EcoLeaf className="w-4 h-4 text-green-600 animate-pulse" />
                <span className="text-sm font-black text-green-700 dark:text-green-400 relative z-10">{user.leafPoints || 0}</span>
                <span className="text-[10px] font-bold text-green-600/70 uppercase tracking-tighter relative z-10">Pts</span>
              </NavLink>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Cart */}
            <NavLink to="/cart" className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {cartQuantity > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartQuantity}
                </span>
              )}
            </NavLink>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="hidden lg:flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    {user ? (
                      <>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <NavLink to="/orders" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <Package className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">My Orders</span>
                          </NavLink>
                           <NavLink to="/account" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <User className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">My Account</span>
                          </NavLink>

                          {user.role === 'admin' && (
                            <NavLink to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400">
                              <ShieldCheck className="w-5 h-5" />
                              <span className="font-medium">Admin Panel</span>
                            </NavLink>
                          )}

                          {user.role === 'shopkeeper' && (
                            <NavLink to="/shop-dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400">
                              <LayoutDashboard className="w-5 h-5" />
                              <span className="font-medium">My Shop Dashboard</span>
                            </NavLink>
                          )}

                          {user.role === 'delivery_partner' && (
                            <NavLink to="/delivery-dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-orange-600 dark:text-orange-400">
                              <Truck className="w-5 h-5 text-orange-500" />
                              <span className="font-medium">Delivery Hub</span>
                            </NavLink>
                          )}
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                          >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2">
                        <NavLink 
                          to="/login" 
                          className="block px-4 py-3 text-center bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Sign In
                        </NavLink>
                        <NavLink 
                          to="/register" 
                          className="block px-4 py-3 text-center text-green-600 dark:text-green-400 font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Create Account
                        </NavLink>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Categories Bar - Desktop */}
        <div className="hidden lg:flex items-center gap-1 py-2 overflow-x-auto hide-scrollbar">
          {categories.map((category) => (
            <NavLink
              key={category.slug}
              to={`/products?category=${category.slug}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <span>{category.icon}</span>
              {category.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:bg-white dark:focus:bg-gray-700 focus:border-green-500 dark:text-white focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <nav className="p-4 space-y-2 bg-white dark:bg-gray-900">
              <NavLink 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                Home
              </NavLink>
              {user && (
                <NavLink 
                  to="/rewards" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-700 dark:text-green-400 font-bold border border-green-100 dark:border-green-800"
                >
                  <div className="flex items-center gap-2">
                    <EcoLeaf className="w-5 h-5 text-green-600" />
                    <span>My Leaf Points</span>
                  </div>
                  <span className="text-xl font-black">{user.leafPoints || 0}</span>
                </NavLink>
              )}
              <NavLink 
                to="/products" 
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                Products
              </NavLink>
              <NavLink 
                to="/shops" 
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                Shops
              </NavLink>
              <NavLink 
                to="/orders" 
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                My Orders
              </NavLink>
              <NavLink 
                to="/account" 
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                My Account
              </NavLink>
              {user ? (
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                >
                  Logout
                </button>
              ) : (
                <NavLink 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-center bg-green-600 text-white rounded-xl font-semibold"
                >
                  Sign In
                </NavLink>
              )}
            </nav>
            
            {/* Mobile Categories */}
            <div className="px-4 pb-4 bg-white dark:bg-gray-900">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Categories</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.slice(0, 6).map((category) => (
                  <NavLink
                    key={category.slug}
                    to={`/products?category=${category.slug}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400"
                  >
                    <span>{category.icon}</span>
                    {category.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
