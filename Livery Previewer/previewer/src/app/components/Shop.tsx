import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Package } from 'lucide-react';
import SharedNavbar from './SharedNavbar';
import { useShoppingCart, CartSidebar } from './ShoppingCart';
import SearchBar from './SearchBar';

const BASE = (import.meta as any).env?.BASE_URL || '';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  description: string;
  features: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  badge?: string;
  variants?: ProductVariant[];
  specifications?: Record<string, string>;
  shippingInfo?: string;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  image?: string;
  inStock: boolean;
}

// Comprehensive product catalog
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Livery Designer Pro',
    price: 29.99,
    originalPrice: 49.99,
    category: 'software',
    subcategory: 'design-tools',
    description: 'Professional-grade livery design software with advanced features and unlimited exports. Perfect for ERLC designers who demand the best.',
    features: ['Advanced Design Tools', 'Unlimited Exports', 'Premium Templates', 'Priority Support', 'Real-time Preview', 'Cloud Storage'],
    images: ['/placeholder-product-1.jpg', '/placeholder-product-1-2.jpg', '/placeholder-product-1-3.jpg'],
    rating: 4.8,
    reviewCount: 127,
    inStock: true,
    isNew: true,
    isOnSale: true,
    badge: 'BESTSELLER',
    variants: [
      { id: '1-basic', name: 'Basic License', price: 29.99, inStock: true },
      { id: '1-pro', name: 'Pro License', price: 49.99, inStock: true },
      { id: '1-enterprise', name: 'Enterprise', price: 99.99, inStock: true }
    ],
    specifications: {
      'Version': '3.0 Pro',
      'License': 'Perpetual',
      'Platforms': 'Windows, Mac, Linux',
      'File Formats': 'PNG, JPG, SVG, DDS'
    },
    shippingInfo: 'Instant digital delivery via email'
  },
  {
    id: '2',
    name: 'ERLC Vehicle Pack Ultimate',
    price: 14.99,
    originalPrice: 24.99,
    category: 'digital',
    subcategory: 'vehicle-packs',
    description: 'Complete collection of 50+ high-quality vehicle models for ERLC. Includes police, fire, EMS, and civilian vehicles.',
    features: ['50+ Vehicle Models', 'HD Textures', 'Regular Updates', 'Commercial License', 'Customizable Parts', 'Sound Files'],
    images: ['/placeholder-product-2.jpg', '/placeholder-product-2-2.jpg', '/placeholder-product-2-3.jpg'],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    isOnSale: true,
    badge: 'POPULAR',
    specifications: {
      'Models': '50+ Vehicles',
      'Formats': 'OBJ, FBX',
      'Texture Resolution': '4K',
      'Poly Count': '10K-50K per model'
    },
    shippingInfo: 'Instant download after purchase'
  },
  {
    id: '3',
    name: 'itzz Merchandise Collection',
    price: 39.99,
    category: 'merchandise',
    subcategory: 'clothing',
    description: 'Exclusive itzz branded clothing and accessories bundle. Premium quality materials and exclusive designs.',
    features: ['Premium T-Shirt', 'Limited Edition Hoodie', 'Embroidered Cap', 'Sticker Pack', 'Collector\'s Box'],
    images: ['/placeholder-product-3.jpg', '/placeholder-product-3-2.jpg', '/placeholder-product-3-3.jpg'],
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    badge: 'LIMITED EDITION',
    variants: [
      { id: '3-s', name: 'Size S', price: 39.99, inStock: true },
      { id: '3-m', name: 'Size M', price: 39.99, inStock: true },
      { id: '3-l', name: 'Size L', price: 39.99, inStock: false },
      { id: '3-xl', name: 'Size XL', price: 39.99, inStock: true }
    ],
    shippingInfo: 'Free shipping on orders over $50'
  },
  {
    id: '4',
    name: 'Advanced Texture Pack Pro',
    price: 19.99,
    category: 'digital',
    subcategory: 'textures',
    description: 'Professional texture pack with 100+ high-resolution textures for vehicle customization.',
    features: ['100+ 4K Textures', 'PBR Materials', 'Custom Patterns', 'Regular Updates', 'Commercial License'],
    images: ['/placeholder-product-4.jpg', '/placeholder-product-4-2.jpg'],
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    isNew: true,
    shippingInfo: 'Instant digital delivery'
  },
  {
    id: '5',
    name: 'itzz Discord Premium',
    price: 9.99,
    originalPrice: 14.99,
    category: 'digital',
    subcategory: 'membership',
    description: 'Premium Discord membership with exclusive perks, early access, and special roles.',
    features: ['Exclusive Role', 'Early Access', 'Private Channels', 'Monthly Giveaways', 'Support Server'],
    images: ['/placeholder-product-5.jpg'],
    rating: 4.5,
    reviewCount: 78,
    inStock: true,
    isOnSale: true,
    badge: 'HOT DEAL',
    shippingInfo: 'Instant activation'
  }
];

const PRICE_RANGES = [
  { id: 'all', name: 'All Prices', min: 0, max: Infinity },
  { id: '0-25', name: 'Under $25', min: 0, max: 25 },
  { id: '25-50', name: '$25 - $50', min: 25, max: 50 },
  { id: '50+', name: 'Over $50', min: 50, max: Infinity }
];

export default function Shop() {
  const { 
    addToCart, 
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount, 
    cartItems,
    isOpen, 
    setIsOpen,
    subtotal,
    shipping,
    tax,
    total
  } = useShoppingCart();

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(PRODUCTS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    let filtered = PRODUCTS;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by price range
    const priceRange = PRICE_RANGES.find(range => range.id === selectedPriceRange);
    if (priceRange) {
      filtered = filtered.filter(product => 
        product.price >= priceRange.min && product.price <= priceRange.max
      );
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered = [...filtered].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        filtered = [...filtered].filter(p => p.isNew).concat([...filtered].filter(p => !p.isNew));
        break;
      case 'featured':
      default:
        // Keep original order with featured items first
        break;
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(productId);
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${starSize} ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-600'
        }`}
      />
    ));
  };

  const ProductCard = ({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) => {
    const discount = product.originalPrice 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

    if (viewMode === 'list') {
      return (
        <Link to={`/shop/${product.id}`} className="block">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-[#c4ff0d]/30 transition-all duration-300 group">
            <div className="flex gap-6">
              {/* Product Image */}
              <div className="relative w-32 h-32 bg-gradient-to-br from-[#c4ff0d]/10 to-transparent rounded-lg overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isNew && (
                    <span className="px-2 py-1 bg-[#c4ff0d] text-black text-xs font-bold rounded-full">
                      NEW
                    </span>
                  )}
                  {product.isOnSale && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      SALE
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      -{discount}%
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#c4ff0d] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex">{renderStars(product.rating, 'sm')}</div>
                      <span className="text-sm text-gray-400">
                        {product.rating} ({product.reviewCount} reviews)
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {product.features.slice(0, 4).map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-white/10 text-xs text-gray-300 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Stock Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-medium ${
                        product.inStock ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                      </span>
                      {product.shippingInfo && (
                        <span className="text-xs text-gray-400">{product.shippingInfo}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all"
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Quick view functionality
                      }}
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all"
                    >
                      <Package className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl font-bold text-white">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleAddToCart(e, product.id)}
                    disabled={!product.inStock}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      product.inStock
                        ? 'bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black shadow-lg shadow-[#c4ff0d]/20'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    }

    // Grid view - Enhanced with glass effect and more details
    return (
      <Link to={`/shop/${product.id}`} className="block">
        <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-[#c4ff0d]/30 hover:bg-white/10 transition-all duration-300 group">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
          
          {/* Product Image */}
          <div className="relative aspect-[16/9] bg-gradient-to-br from-[#c4ff0d]/10 to-transparent rounded-t-xl overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {product.isNew && (
                <span className="px-2 py-1 bg-[#c4ff0d] text-black text-xs font-bold rounded-full backdrop-blur-sm">
                  NEW
                </span>
              )}
              {product.isOnSale && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                  SALE
                </span>
              )}
              {product.badge && (
                <span className="px-2 py-1 bg-black/80 text-[#c4ff0d] text-xs font-bold rounded-full backdrop-blur-sm">
                  {product.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(product.id);
                }}
                className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-all"
              >
                <Heart className={`w-3.5 h-3.5 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Quick view functionality
                }}
                className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-all"
              >
                <Package className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-[#c4ff0d] transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>
                
                {/* Rating and Reviews */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex">{renderStars(product.rating, 'sm')}</div>
                    <span className="text-sm text-gray-400">({product.reviewCount})</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // View all reviews
                    }}
                    className="text-xs text-[#c4ff0d] hover:text-[#d4ff3d] transition-colors"
                  >
                    View Reviews
                  </button>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {product.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-white/10 text-xs text-gray-300 rounded-full backdrop-blur-sm">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Stock and Shipping */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium ${
                    product.inStock ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                  </span>
                  {product.shippingInfo && (
                    <span className="text-xs text-gray-400">{product.shippingInfo}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Price and Add to Cart */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg font-bold text-white">${product.price}</span>
                  {product.originalPrice && (
                    <span className="ml-2 text-sm text-gray-400 line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={(e) => handleAddToCart(e, product.id)}
                disabled={!product.inStock}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  product.inStock
                    ? 'bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black shadow-lg shadow-[#c4ff0d]/20'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Shared Navbar */}
      <SharedNavbar />

      {/* Fixed Search/Filter Bar */}
      <div className="sticky top-20 z-40 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSort={sortBy}
            setSelectedSort={setSortBy}
            uploadCount={filteredProducts.length}
          />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 flex items-center justify-center pt-32 z-10">
          <img 
            src={`${BASE}marketplace.svg`} 
            alt="Marketplace Banner" 
            className="w-full h-48 object-contain"
          />
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} viewMode="grid" />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">No products found</h3>
            <p className="text-gray-400 mb-8">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedPriceRange('all');
                setSortBy('featured');
              }}
              className="px-6 py-3 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      <CartSidebar 
        cartItems={cartItems}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        subtotal={subtotal}
        shipping={shipping}
        tax={tax}
        total={total}
        itemCount={itemCount}
      />
    </div>
  );
}
