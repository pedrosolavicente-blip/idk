import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SharedNavbar from './SharedNavbar';
import { ChevronLeft, ChevronRight, Star, Heart, Share2, Package, ShoppingCart, Check } from 'lucide-react';
import { useShoppingCart, CartSidebar } from './ShoppingCart';
import type { Product, Review } from '../hooks/Types';

const BASE = (import.meta as any).env?.BASE_URL || '';

// ─── Mock catalog (same IDs as Shop) ──────────────────────────────────────────

const STATIC_PRODUCTS: Record<string, Product> = {
  '1': {
    id: '1', name: 'Premium Livery Designer Pro', price: 29.99, originalPrice: 49.99,
    category: 'software', subcategory: 'design-tools',
    description: 'Professional-grade livery design software with advanced features and unlimited exports. Perfect for ERLC designers who want to create stunning liveries with ease.',
    features: ['Advanced Design Tools', 'Unlimited Exports', 'Premium Templates', 'Priority Support', 'Real-time Preview', 'Cloud Storage'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.8, reviewCount: 127, inStock: true, isNew: true, isOnSale: true, badge: 'BESTSELLER',
    specifications: { 'Version': '3.0 Pro', 'License': 'Perpetual', 'Platforms': 'Windows, Mac, Linux', 'File Formats': 'PNG, JPG, SVG, DDS', 'Updates': '1 Year Free' },
    shippingInfo: 'Instant digital delivery via email', returnPolicy: '30-day money-back guarantee',
  },
  '2': {
    id: '2', name: 'ERLC Vehicle Pack Ultimate', price: 14.99, originalPrice: 24.99,
    category: 'digital', subcategory: 'vehicle-packs',
    description: 'Complete collection of 50+ high-quality vehicle models for ERLC. Includes police, fire, EMS, and civilian vehicles with detailed textures.',
    features: ['50+ Vehicle Models', 'HD Textures', 'Regular Updates', 'Commercial License', 'Customizable Parts'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.6, reviewCount: 89, inStock: true, isOnSale: true, badge: 'POPULAR',
    specifications: { 'Models': '50+ Vehicles', 'Formats': 'OBJ, FBX', 'Texture Resolution': '4K', 'Poly Count': '10K–50K per model', 'License': 'Commercial Use' },
    shippingInfo: 'Instant download after purchase', returnPolicy: '14-day refund for digital products',
  },
  '3': {
    id: '3', name: 'itzz Merchandise Collection', price: 39.99,
    category: 'merchandise', subcategory: 'clothing',
    description: 'Exclusive itzz branded clothing and accessories bundle. Premium quality materials with collector\'s packaging.',
    features: ['Premium T-Shirt', 'Limited Edition Hoodie', 'Embroidered Cap', 'Sticker Pack', 'Collector\'s Box'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.9, reviewCount: 203, inStock: true, badge: 'LIMITED',
    shippingInfo: 'Free shipping on orders over $50', returnPolicy: 'No returns on limited edition items',
  },
  '4': {
    id: '4', name: 'Advanced Texture Pack Pro', price: 19.99,
    category: 'digital', subcategory: 'textures',
    description: 'Professional texture pack with 100+ high-resolution textures for vehicle customization.',
    features: ['100+ 4K Textures', 'PBR Materials', 'Custom Patterns', 'Regular Updates', 'Commercial License'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.7, reviewCount: 156, inStock: true, isNew: true,
    shippingInfo: 'Instant digital delivery',
  },
  '5': {
    id: '5', name: 'itzz Discord Premium', price: 9.99, originalPrice: 14.99,
    category: 'digital', subcategory: 'membership',
    description: 'Premium Discord membership with exclusive perks, early access, and special roles.',
    features: ['Exclusive Role', 'Early Access', 'Private Channels', 'Monthly Giveaways', 'Support Server'],
    images: [`${BASE}marketplace.svg`],
    rating: 4.5, reviewCount: 78, inStock: true, isOnSale: true, badge: 'HOT DEAL',
    shippingInfo: 'Instant activation',
  },
};

const MOCK_REVIEWS: Review[] = [
  { id: '1', user: 'Alex Designer',  rating: 5, date: '2024-01-15', verified: true, helpful: 23, content: 'Absolutely amazing! The export quality is incredible and the templates save so much time. Worth every penny.' },
  { id: '2', user: 'Sarah Creator',  rating: 4, date: '2024-01-10', verified: true, helpful: 15, content: 'Great tool for livery design. The interface is intuitive and the real-time preview is fantastic. Only wish it had more font options.' },
  { id: '3', user: 'Mike Artist',    rating: 5, date: '2024-01-05', verified: true, helpful: 31, content: 'This has revolutionized my workflow. The cloud storage feature means I can work from anywhere. Highly recommend!' },
];

// ─── Stars ─────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${cls} ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
      ))}
    </div>
  );
}

// ─── ProductDetail ─────────────────────────────────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    addToCart, updateQuantity, removeFromCart, clearCart,
    itemCount, cartItems, isOpen, setIsOpen,
    subtotal, shipping, tax, total,
  } = useShoppingCart();

  const [product, setProduct]         = useState<Product | null>(null);
  const [currentImage, setCurrentImg] = useState(0);
  const [isFavorite, setFavorite]     = useState(false);
  const [addedToCart, setAdded]       = useState(false);
  const [selectedTab, setTab]         = useState<'description' | 'specifications' | 'reviews'>('description');
  const [selectedVariant, setVariant] = useState<string | null>(null);
  const [helpfulVotes, setHelpful]    = useState<Record<string, boolean>>({});

  // Load product (static + admin-created)
  useEffect(() => {
    if (!id) return;

    let found: Product | null = STATIC_PRODUCTS[id] || null;

    if (!found) {
      try {
        const adminProducts: Product[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
        found = adminProducts.find(p => p.id === id) || null;
      } catch { /* ignore */ }
    }

    setProduct(found);
    if (found?.variants?.length) setVariant(found.variants[0].id);
  }, [id]);

  // Load favorite state
  useEffect(() => {
    if (!id) return;
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('itzz-favorites') || '[]');
      setFavorite(favs.includes(id));
    } catch { /* ignore */ }
  }, [id]);

  const toggleFavorite = () => {
    if (!id) return;
    setFavorite(prev => {
      const next = !prev;
      try {
        const favs: string[] = JSON.parse(localStorage.getItem('itzz-favorites') || '[]');
        const updated = next ? [...favs, id] : favs.filter(f => f !== id);
        localStorage.setItem('itzz-favorites', JSON.stringify(updated));
      } catch { /* ignore */ }
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: product?.name, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleHelpful = (reviewId: string) => {
    setHelpful(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3">Product not found</h2>
          <Link to="/shop" className="text-[#c4ff0d] text-sm hover:underline">← Back to Shop</Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const activeVariant = product.variants?.find(v => v.id === selectedVariant);
  const displayPrice  = activeVariant?.price ?? product.price;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SharedNavbar cartItemCount={itemCount} onCartClick={() => setIsOpen(true)} />

      <main className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
            <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
            <span>/</span>
            <span className="capitalize">{product.category}</span>
            <span>/</span>
            <span className="text-zinc-300 truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* ── Image Gallery ── */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative aspect-square bg-gradient-to-br from-[#c4ff0d]/5 to-transparent rounded-2xl overflow-hidden border border-white/8 group">
                <img
                  src={product.images[currentImage] || `${BASE}marketplace.svg`}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                />

                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImg(p => (p - 1 + product.images.length) % product.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/70 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImg(p => (p + 1) % product.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/70 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.isNew    && <span className="px-2 py-0.5 bg-[#c4ff0d] text-black text-xs font-bold rounded-full">NEW</span>}
                  {product.isOnSale && <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">SALE</span>}
                  {product.badge    && <span className="px-2 py-0.5 bg-black/80 text-[#c4ff0d] text-xs font-bold rounded-full">{product.badge}</span>}
                </div>
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${currentImage === i ? 'border-[#c4ff0d]' : 'border-white/8 hover:border-white/20'}`}
                    >
                      <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-contain p-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product Info ── */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{product.category} · {product.subcategory}</p>
                  <h1 className="text-2xl font-bold text-white leading-tight">{product.name}</h1>
                  <div className="flex items-center gap-2.5 mt-2">
                    <Stars rating={product.rating} size="md" />
                    <span className="text-sm text-zinc-400">{product.rating} <span className="text-zinc-600">({product.reviewCount} reviews)</span></span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={toggleFavorite} className="p-2.5 bg-white/6 hover:bg-white/12 rounded-xl transition-colors" title="Add to wishlist">
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
                  </button>
                  <button onClick={handleShare} className="p-2.5 bg-white/6 hover:bg-white/12 rounded-xl transition-colors" title="Share">
                    <Share2 className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white">${displayPrice.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-lg text-zinc-500 line-through">${product.originalPrice.toFixed(2)}</span>
                )}
                {discount > 0 && (
                  <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-sm font-semibold rounded-full">Save {discount}%</span>
                )}
              </div>

              {/* Description */}
              <p className="text-zinc-400 leading-relaxed text-sm">{product.description}</p>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Options</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setVariant(v.id)}
                        disabled={!v.inStock}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedVariant === v.id
                            ? 'bg-[#c4ff0d] text-black border-[#c4ff0d]'
                            : v.inStock
                            ? 'bg-white/4 text-zinc-300 border-white/10 hover:border-white/30'
                            : 'bg-white/2 text-zinc-600 border-white/5 cursor-not-allowed line-through'
                        }`}
                      >
                        {v.name}
                        {v.price !== product.price && ` · $${v.price.toFixed(2)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Key Features</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white/4 border border-white/6 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c4ff0d] shrink-0" />
                      <span className="text-xs text-zinc-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock + Shipping */}
              <div className="flex items-center gap-4 text-xs">
                <span className={`flex items-center gap-1.5 font-medium ${product.inStock ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-green-400' : 'bg-red-400'}`} />
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                {product.shippingInfo && <span className="text-zinc-500">{product.shippingInfo}</span>}
              </div>

              {/* CTA */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    addedToCart
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : product.inStock
                      ? 'bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {addedToCart ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
                </button>
                <button
                  disabled={!product.inStock}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm border border-white/15 hover:bg-white/6 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="mt-12 border-t border-white/8">
            <nav className="flex gap-1 pt-1">
              {(['description', 'specifications', 'reviews'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTab(tab)}
                  className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                    selectedTab === tab
                      ? 'text-[#c4ff0d] border-[#c4ff0d]'
                      : 'text-zinc-500 border-transparent hover:text-white'
                  }`}
                >
                  {tab}
                  {tab === 'reviews' && <span className="ml-1.5 text-xs text-zinc-600">({MOCK_REVIEWS.length})</span>}
                </button>
              ))}
            </nav>

            <div className="py-8">
              {/* Description tab */}
              {selectedTab === 'description' && (
                <div className="space-y-4 max-w-2xl">
                  <p className="text-zinc-400 leading-relaxed text-sm">{product.description}</p>
                  <p className="text-zinc-500 leading-relaxed text-sm">
                    This premium digital product is crafted for professionals who demand quality and performance.
                    With an intuitive interface and advanced capabilities, it is the ideal choice for serious creators.
                  </p>
                  {product.returnPolicy && (
                    <div className="flex items-start gap-3 p-4 bg-[#c4ff0d]/5 border border-[#c4ff0d]/15 rounded-xl">
                      <Check className="w-4 h-4 text-[#c4ff0d] mt-0.5 shrink-0" />
                      <p className="text-xs text-zinc-400">{product.returnPolicy}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Specifications tab */}
              {selectedTab === 'specifications' && (
                <div className="space-y-5 max-w-2xl">
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                      {Object.entries(product.specifications).map(([key, value], i, arr) => (
                        <div key={key} className={`flex justify-between items-center px-5 py-3 text-sm ${i < arr.length - 1 ? 'border-b border-white/6' : ''}`}>
                          <span className="text-zinc-500 font-medium">{key}</span>
                          <span className="text-white font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {product.shippingInfo && (
                    <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Shipping</p>
                      <p className="text-sm text-zinc-300">{product.shippingInfo}</p>
                    </div>
                  )}

                  {product.returnPolicy && (
                    <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Return Policy</p>
                      <p className="text-sm text-zinc-300">{product.returnPolicy}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews tab */}
              {selectedTab === 'reviews' && (
                <div className="space-y-6 max-w-2xl">
                  {/* Summary */}
                  <div className="flex items-center justify-between p-5 bg-white/4 border border-white/8 rounded-xl">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-bold text-white">{product.rating}</span>
                      <div className="space-y-1">
                        <Stars rating={product.rating} size="md" />
                        <p className="text-xs text-zinc-500">Based on {product.reviewCount} reviews</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-[#c4ff0d] text-black text-sm font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors">
                      Write a Review
                    </button>
                  </div>

                  {/* List */}
                  <div className="space-y-4">
                    {MOCK_REVIEWS.map(review => (
                      <div key={review.id} className="p-5 bg-white/3 border border-white/8 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#c4ff0d]/15 flex items-center justify-center text-xs font-bold text-[#c4ff0d]">
                              {review.user.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">{review.user}</span>
                                {review.verified && (
                                  <span className="px-1.5 py-0.5 bg-[#c4ff0d]/10 text-[#c4ff0d] text-[10px] font-bold rounded">VERIFIED</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Stars rating={review.rating} />
                                <span className="text-xs text-zinc-600">{review.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-zinc-400 leading-relaxed">{review.content}</p>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleHelpful(review.id)}
                            className={`text-xs transition-colors ${helpfulVotes[review.id] ? 'text-[#c4ff0d]' : 'text-zinc-600 hover:text-zinc-300'}`}
                          >
                            Helpful ({review.helpful + (helpfulVotes[review.id] ? 1 : 0)})
                          </button>
                          <button className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">Report</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <CartSidebar
        cartItems={cartItems} isOpen={isOpen} setIsOpen={setIsOpen}
        updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart}
        subtotal={subtotal} shipping={shipping} tax={tax} total={total} itemCount={itemCount}
      />
    </div>
  );
}