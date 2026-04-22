import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Package, ShoppingCart as CartIcon } from 'lucide-react';
import SharedNavbar from './SharedNavbar';
import { useShoppingCart, CartSidebar } from './ShoppingCart';
import SearchBar from './SearchBar';
import type { Product } from './types';

const BASE = (import.meta as any).env?.BASE_URL || '';

// ─── Static product catalog ────────────────────────────────────────────────────

const STATIC_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Livery Designer Pro',
    price: 29.99,
    originalPrice: 49.99,
    category: 'software',
    subcategory: 'design-tools',
    description: 'Professional-grade livery design software with advanced features and unlimited exports. Perfect for ERLC designers who demand the best.',
    features: ['Advanced Design Tools', 'Unlimited Exports', 'Premium Templates', 'Priority Support', 'Real-time Preview', 'Cloud Storage'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.8,
    reviewCount: 127,
    inStock: true,
    isNew: true,
    isOnSale: true,
    badge: 'BESTSELLER',
    variants: [
      { id: '1-basic', name: 'Basic License', price: 29.99, inStock: true },
      { id: '1-pro',   name: 'Pro License',   price: 49.99, inStock: true },
    ],
    specifications: { 'Version': '3.0 Pro', 'License': 'Perpetual', 'Platforms': 'Windows, Mac, Linux', 'File Formats': 'PNG, JPG, SVG, DDS' },
    shippingInfo: 'Instant digital delivery via email',
    returnPolicy: '30-day money-back guarantee',
  },
  {
    id: '2',
    name: 'ERLC Vehicle Pack Ultimate',
    price: 14.99,
    originalPrice: 24.99,
    category: 'digital',
    subcategory: 'vehicle-packs',
    description: 'Complete collection of 50+ high-quality vehicle models for ERLC. Includes police, fire, EMS, and civilian vehicles.',
    features: ['50+ Vehicle Models', 'HD Textures', 'Regular Updates', 'Commercial License', 'Customizable Parts'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    isOnSale: true,
    badge: 'POPULAR',
    specifications: { 'Models': '50+ Vehicles', 'Formats': 'OBJ, FBX', 'Texture Resolution': '4K' },
    shippingInfo: 'Instant download after purchase',
    returnPolicy: '14-day refund',
  },
  {
    id: '3',
    name: 'itzz Merchandise Collection',
    price: 39.99,
    category: 'merchandise',
    subcategory: 'clothing',
    description: 'Exclusive itzz branded clothing and accessories. Premium quality materials and exclusive designs.',
    features: ['Premium T-Shirt', 'Limited Edition Hoodie', 'Embroidered Cap', 'Sticker Pack', 'Collector\'s Box'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    badge: 'LIMITED',
    variants: [
      { id: '3-s', name: 'Size S', price: 39.99, inStock: true },
      { id: '3-m', name: 'Size M', price: 39.99, inStock: true },
      { id: '3-l', name: 'Size L', price: 39.99, inStock: false },
      { id: '3-xl', name: 'Size XL', price: 39.99, inStock: true },
    ],
    shippingInfo: 'Free shipping on orders over $50',
  },
  {
    id: '4',
    name: 'Advanced Texture Pack Pro',
    price: 19.99,
    category: 'digital',
    subcategory: 'textures',
    description: 'Professional texture pack with 100+ high-resolution textures for vehicle customization.',
    features: ['100+ 4K Textures', 'PBR Materials', 'Custom Patterns', 'Regular Updates', 'Commercial License'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    isNew: true,
    shippingInfo: 'Instant digital delivery',
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
    images: [`${BASE}marketplace.svg`],
    rating: 4.5,
    reviewCount: 78,
    inStock: true,
    isOnSale: true,
    badge: 'HOT DEAL',
    shippingInfo: 'Instant activation',
  },
];

const PRICE_RANGES = [
  { id: 'all',  min: 0,  max: Infinity },
  { id: '0-25', min: 0,  max: 25       },
  { id: '25-50',min: 25, max: 50       },
  { id: '50+',  min: 50, max: Infinity },
];

// ─── Star renderer ─────────────────────────────────────────────────────────────

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${cls} ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
      ))}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
}: {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
}) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/shop/${product.id}`} className="block group">
      <div className="relative bg-white/4 border border-white/8 rounded-xl overflow-hidden hover:border-[#c4ff0d]/30 hover:bg-white/6 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-video bg-gradient-to-br from-[#c4ff0d]/6 to-transparent overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            style={{ maxHeight: '120px' }}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.isNew      && <span className="px-2 py-0.5 bg-[#c4ff0d] text-black text-[10px] font-bold rounded-full">NEW</span>}
            {product.isOnSale   && <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">SALE</span>}
            {product.badge      && <span className="px-2 py-0.5 bg-black/70 text-[#c4ff0d] text-[10px] font-bold rounded-full backdrop-blur-sm">{product.badge}</span>}
            {discount > 0       && <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">-{discount}%</span>}
          </div>

          {/* Quick actions */}
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(product.id); }}
              className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg backdrop-blur-sm transition-colors"
              title={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-3 h-3 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2.5">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-[#c4ff0d] transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2">
            <Stars rating={product.rating} />
            <span className="text-xs text-zinc-500">{product.rating} ({product.reviewCount})</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {product.features.slice(0, 3).map((f, i) => (
              <span key={i} className="px-2 py-0.5 bg-white/6 text-zinc-400 text-[10px] rounded-full">{f}</span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-xs text-zinc-600 line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            <button
              onClick={e => onAddToCart(e, product.id)}
              disabled={!product.inStock}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                product.inStock
                  ? 'bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {product.inStock ? (
                <><CartIcon className="w-3 h-3" /> Add</>
              ) : 'Out of stock'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Shop ──────────────────────────────────────────────────────────────────────

export default function Shop() {
  const {
    addToCart, removeFromCart, updateQuantity, clearCart,
    itemCount, cartItems, isOpen, setIsOpen,
    subtotal, shipping, tax, total,
  } = useShoppingCart();

  const [allProducts, setAllProducts]       = useState<Product[]>(STATIC_PRODUCTS);
  const [filteredProducts, setFiltered]     = useState<Product[]>(STATIC_PRODUCTS);
  const [favorites, setFavorites]           = useState<string[]>([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCategory, setCategory]    = useState('all');
  const [sortBy, setSortBy]                 = useState('featured');

  // Merge admin-created products with static catalog
  useEffect(() => {
    try {
      const adminRaw = localStorage.getItem('admin_products');
      const adminProducts: Product[] = adminRaw ? JSON.parse(adminRaw) : [];
      setAllProducts([...STATIC_PRODUCTS, ...adminProducts]);
    } catch { setAllProducts(STATIC_PRODUCTS); }
  }, []);

  // Load persisted favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem('itzz-favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Filter + sort
  useEffect(() => {
    let out = [...allProducts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      out = out.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.features.some(f => f.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      out = out.filter(p => p.category === selectedCategory);
    }

    switch (sortBy) {
      case 'price-low':  out.sort((a, b) => a.price - b.price);         break;
      case 'price-high': out.sort((a, b) => b.price - a.price);         break;
      case 'popular':    out.sort((a, b) => b.reviewCount - a.reviewCount); break;
      case 'latest':     out = out.filter(p => p.isNew).concat(out.filter(p => !p.isNew)); break;
      default: break;
    }

    setFiltered(out);
  }, [searchQuery, selectedCategory, sortBy, allProducts]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('itzz-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleAddToCart = useCallback((e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(productId);
  }, [addToCart]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SharedNavbar cartItemCount={itemCount} onCartClick={() => setIsOpen(true)} />

      {/* Search bar */}
      <div className="sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-3 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/4">
        <div className="max-w-7xl mx-auto">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setCategory}
            selectedSort={sortBy}
            setSelectedSort={setSortBy}
            uploadCount={filteredProducts.length}
          />
        </div>
      </div>

      {/* Hero banner */}
      <section className="relative flex items-center justify-center h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c4ff0d]/4 to-transparent pointer-events-none" />
        <img src={`${BASE}marketplace.svg`} alt="Marketplace" className="h-24 object-contain relative z-10" />
      </section>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="w-14 h-14 text-zinc-700 mb-5" />
            <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
            <p className="text-zinc-500 text-sm mb-6">Try adjusting your search or filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setCategory('all'); setSortBy('featured'); }}
              className="px-5 py-2 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      <CartSidebar
        cartItems={cartItems} isOpen={isOpen} setIsOpen={setIsOpen}
        updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart}
        subtotal={subtotal} shipping={shipping} tax={tax} total={total} itemCount={itemCount}
      />
    </div>
  );
}