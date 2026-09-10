import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, ArrowRight, Leaf as EcoLeaf } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const Wishlist = () => {
  const { addToCart } = useAppStore();
  // Sample wishlist state (can be extended to sync with backend/localstorage)
  const [wishlistItems, setWishlistItems] = useState([
    {
      _id: 'wish-1',
      name: 'Organic Alphonso Mangoes (1 kg)',
      price: 150,
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
      category: 'Fruits',
      isEcoFriendly: true
    },
    {
      _id: 'wish-2',
      name: 'Fresh Himachal Apples (1 kg)',
      price: 180,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
      category: 'Fruits',
      isEcoFriendly: true
    }
  ]);

  const removeItem = (id) => {
    setWishlistItems(prev => prev.filter(item => item._id !== id));
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    removeItem(product._id);
  };

  return (
    <main className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Wishlist</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Saved items to add to your eco-friendly cart later
            </p>
          </div>
          <span className="px-4 py-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-bold text-sm rounded-full">
            {wishlistItems.length} Saved Items
          </span>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Explore our fresh, climate-friendly store items and save your favorites!
            </p>
            <Link 
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-eco"
            >
              Browse Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {wishlistItems.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors group relative"
                >
                  <div>
                    <div className="w-full h-48 bg-muted rounded-xl overflow-hidden mb-4 relative">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.isEcoFriendly && (
                        <div className="absolute top-2 left-2 px-2.5 py-1 bg-green-600/90 backdrop-blur-md text-white text-[11px] font-bold rounded-full flex items-center gap-1">
                          <EcoLeaf className="w-3 h-3" />
                          Eco Choice
                        </div>
                      )}
                      <button 
                        onClick={() => removeItem(item._id)}
                        className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-sm"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{item.category}</p>
                    <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-1">{item.name}</h3>
                    <p className="text-2xl font-black text-foreground mb-4">₹{item.price}</p>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-eco"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Move to Cart
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
};

export default Wishlist;
