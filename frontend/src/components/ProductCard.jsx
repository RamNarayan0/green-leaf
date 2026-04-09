import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Clock, Plus, Minus } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import Badge from './ui/Badge';

const ProductCard = ({ product, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart, cart, updateQuantity } = useAppStore();
  
  const cartItem = cart?.items?.find(item => item.productId === product._id);
  const quantity = cartItem?.quantity || 0;
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleQuantityChange = (e, delta) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(product._id, quantity + delta);
    } else if (delta > 0) {
      addToCart(product, 1);
    }
  };

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="h-full"
    >
      <Link
        to={`/product/${product._id}`}
        className="block group h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`
          relative bg-card rounded-2xl border flex flex-col h-full overflow-hidden
          transition-all duration-300
          ${isHovered ? 'border-primary/40 shadow-card-hover -translate-y-1' : 'border-border'}
        `}>
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={product.primaryImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
              alt={product.name}
              className={`
                w-full h-full object-cover transition-transform duration-500
                ${isHovered ? 'scale-105' : 'scale-100'}
              `}
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {discount > 0 && (
                <div className="px-2.5 py-1 bg-destructive text-destructive-foreground text-[10px] font-bold tracking-wider uppercase rounded-full shadow-sm">
                  {discount}% OFF
                </div>
              )}
              {product.isNew && (
                <div className="px-2.5 py-1 bg-secondary text-secondary-foreground text-[10px] font-bold tracking-wider uppercase rounded-full shadow-sm">
                  NEW
                </div>
              )}
            </div>

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFavorite(!isFavorite);
              }}
              className={`
                absolute top-3 right-3 p-2 rounded-full transition-all duration-300 shadow-sm
                ${isFavorite 
                  ? 'bg-destructive text-destructive-foreground' 
                  : 'bg-background/80 backdrop-blur-md text-muted-foreground hover:text-destructive'
                }
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
              `}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Quick Add Overlay */}
            <motion.div
              initial={false}
              animate={{
                opacity: isHovered || quantity > 0 ? 1 : 0,
                y: isHovered || quantity > 0 ? 0 : 20
              }}
              className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent"
            >
              {quantity === 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="w-full h-10 bg-background text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground focus:ring-2 focus:ring-ring transition-all shadow-sm text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Quick Add
                </button>
              ) : (
                <div className="flex items-center justify-between bg-primary rounded-xl h-10 px-1 shadow-eco text-primary-foreground">
                  <button
                    onClick={(e) => handleQuantityChange(e, -1)}
                    className="w-8 h-8 flex items-center justify-center text-primary-foreground hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm tracking-wide">{quantity}</span>
                  <button
                    onClick={(e) => handleQuantityChange(e, 1)}
                    className="w-8 h-8 flex items-center justify-center text-primary-foreground hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col justify-between bg-card text-card-foreground">
            <div>
              {/* Category */}
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5 opacity-90">
                {product.category?.name || 'Grocery'}
              </p>
              
              {/* Title */}
              <h3 className="font-semibold text-foreground leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
            </div>

            <div>
              {/* Rating & Delivery */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                  <span className="text-[13px] font-bold text-foreground">
                    {product.rating || '4.8'}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    ({product.reviewCount || '24'})
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border"></div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">{product.deliveryTime || '15 min'}</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-xl font-bold text-foreground">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-[13px] font-semibold text-muted-foreground line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
