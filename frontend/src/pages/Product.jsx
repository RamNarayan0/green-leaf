import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, Heart, Share2, Truck, Shield, RotateCcw, 
  Minus, Plus, ShoppingCart, Check, ChevronRight, 
  ArrowLeft, Clock, Leaf 
} from 'lucide-react';
import { productsAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui';
import Badge from '../components/ui/Badge';

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  const { addToCart, cart } = useAppStore();
  
  const cartItem = cart?.items?.find(item => item.productId === id);
  const inCart = !!cartItem;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsAPI.getById(id);
        const productData = response.data.data?.product || response.data.data;
        setProduct(productData);
        
        // Fetch related products
        if (productData?.category?._id) {
          const relatedRes = await productsAPI.getAll({ 
            category: productData.category._id,
            limit: 4 
          });
          setRelatedProducts(relatedRes.data.data?.products || []);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const images = product?.images?.length > 0 
    ? product.images 
    : [product?.primaryImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'];

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-12 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </main>
    );
  }

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-green-600">Home</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to="/products" className="text-gray-500 hover:text-green-600">Products</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm"
            >
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-green-500' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Category */}
            <p className="text-sm font-medium text-green-600 uppercase tracking-wide mb-2">
              {product.category?.name || 'Grocery'}
            </p>
            
            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (product.rating || 4)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 font-semibold">{product.rating || '4.5'}</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">{product.reviewCount || 128} reviews</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{product.originalPrice}</span>
                  <Badge variant="error">{discount}% OFF</Badge>
                </>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Free Delivery</p>
                  <p className="text-sm text-green-600">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {product.deliveryTime || '15-20 minutes'}
                  </p>
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex items-center gap-4 mb-8">
              {inCart ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-100 rounded-xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 text-gray-600 hover:text-green-600"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center font-semibold">{cartItem?.quantity || quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 text-gray-600 hover:text-green-600"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <Button onClick={handleAddToCart} className="flex-1">
                    <ShoppingCart className="w-5 h-5" />
                    Update Cart
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center bg-gray-100 rounded-xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 text-gray-600 hover:text-green-600"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 text-gray-600 hover:text-green-600"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <Button onClick={handleAddToCart} size="lg" className="flex-1">
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </Button>
                </>
              )}
              
              <button className="p-3 rounded-xl border-2 border-gray-200 hover:border-red-500 hover:text-red-500 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
              <button className="p-3 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:text-green-500 transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs font-medium">Secure Payment</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <RotateCcw className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs font-medium">Easy Returns</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <Leaf className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs font-medium">Eco-Friendly</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex gap-6 border-b border-gray-200 mb-4">
                {['description', 'reviews', 'info'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {activeTab === 'description' && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600">{product.description || 'Fresh and quality product delivered to your doorstep. We ensure the best quality products for our customers.'}</p>
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className={`w-4 h-4 ${j < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="font-medium">John Doe</span>
                      </div>
                      <p className="text-gray-600 text-sm">Great product! Very fresh and good quality. Highly recommended.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Product;

