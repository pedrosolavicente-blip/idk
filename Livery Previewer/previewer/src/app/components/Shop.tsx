import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Heart, Star, Filter, X, ChevronDown, Package, Truck, Shield, CreditCard } from 'lucide-react';

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
}

// Mock product data
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Livery Designer Pro',
    price: 29.99,
    originalPrice: 49.99,
    category: 'software',
    subcategory: 'design-tools',
    description: 'Professional-grade livery design software with advanced features and unlimited exports.',
    features: ['Advanced Design Tools', 'Unlimited Exports', 'Premium Templates', 'Priority Support'],
    images: ['/placeholder-product-1.jpg', '/placeholder-product-1-2.jpg'],
    rating: 4.8,
    reviewCount: 127,
    inStock: true,
    isNew: true,
    isOnSale: true,
    badge: 'BESTSELLER'
  },
  {
    id: '2',
    name: 'ERLC Vehicle Pack',
    price: 14.99,
    category: 'digital',
    subcategory: 'vehicle-packs',
    description: 'Complete collection of 50+ high-quality vehicle models for ERLC.',
    features: ['50+ Vehicle Models', 'HD Textures', 'Regular Updates', 'Commercial License'],
    images: ['/placeholder-product-2.jpg', '/placeholder-product-2-2.jpg'],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    isOnSale: true
  },
  {
    id: '3',
    name: 'itzz Merchandise Bundle',
    price: 39.99,
    category: 'merchandise',
    subcategory: 'clothing',
    description: 'Exclusive itzz branded clothing and accessories bundle.',
    features: ['T-Shirt', 'Hoodie', 'Cap', 'Sticker Pack', 'Premium Quality'],
    images: ['/placeholder-product-3.jpg', '/placeholder-product-3-2.jpg'],
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    badge: 'LIMITED EDITION'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: Package },
  { id: 'software', name: 'Software', icon: Package },
  { id: 'digital', name: 'Digital Goods', icon: Package },
  { id: 'merchandise', name: 'Merchandise', icon: Package }
];

const PRICE_RANGES = [
  { id: 'all', name: 'All Prices', min: 0, max: Infinity },
  { id: '0-25', name: 'Under $25', min: 0, max: 25 },
  { id: '25-50', name: '$25 - $50', min: 25, max: 50 },
  { id: '50+', name: 'Over $50', min: 50, max: Infinity }
];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
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
      case 'newest':
        filtered = [...filtered].filter(p => p.isNew).concat([...filtered].filter(p => !p.isNew));
        break;
      case 'featured':
      default:
        // Keep original order with featured items first
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const addToCart = (productId: string) => {
    setCart([...cart, productId]);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#c4ff0d] to-[#d4ff3d] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">IT</span>
              </div>
              <span className="text-xl font-bold">itzz Shop</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#c4ff0d]/50 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Heart className="w-6 h-6" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c4ff0d] text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c4ff0d] text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#c4ff0d]/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-black mb-6 bg-gradient-to-r from-white to-[#c4ff0d] bg-clip-text text-transparent">
              Premium Products
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Discover exclusive itzz products, software tools, and merchandise designed for professionals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Truck className="w-4 h-4 text-[#c4ff0d]" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Shield className="w-4 h-4 text-[#c4ff0d]" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Package className="w-4 h-4 text-[#c4ff0d]" />
                <span>Instant Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 space-y-6">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
              >
                <span className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </span>
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Content */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-6`}>
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Categories</h3>
                <div className="space-y-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-[#c4ff0d]/10 text-[#c4ff0d] border border-[#c4ff0d]/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <category.icon className="w-4 h-4" />
                        <span>{category.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Price Range</h3>
                <div className="space-y-2">
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedPriceRange(range.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedPriceRange === range.id
                          ? 'bg-[#c4ff0d]/10 text-[#c4ff0d] border border-[#c4ff0d]/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {range.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400">
                Showing {filteredProducts.length} of {products.length} products
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c4ff0d]/50"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <Link key={product.id} to={`/shop/${product.id}`} className="block">
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#c4ff0d]/30 transition-all group">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-[#c4ff0d]/10 to-transparent">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isNew && (
                        <span className="px-2 py-1 bg-[#c4ff0d] text-black text-xs font-bold rounded">
                          NEW
                        </span>
                      )}
                      {product.isOnSale && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                          SALE
                        </span>
                      )}
                      {product.badge && (
                        <span className="px-2 py-1 bg-black/80 text-[#c4ff0d] text-xs font-bold rounded">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="p-2 bg-black/60 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">({product.reviewCount})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-white">${product.price}</span>
                        {product.originalPrice && (
                          <span className="ml-2 text-sm text-gray-400 line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(product.id);
                      }}
                      disabled={!product.inStock}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                        product.inStock
                          ? 'bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                <p className="text-gray-400">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
