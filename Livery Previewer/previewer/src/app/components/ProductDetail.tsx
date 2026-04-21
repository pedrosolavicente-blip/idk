import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SharedNavbar from './SharedNavbar';
import { 
  ShoppingCart, Heart, Star, Truck, Shield, CreditCard, Package, 
  ChevronLeft, ChevronRight, Plus, Minus, Share2, ArrowLeft 
} from 'lucide-react';

// Types (same as Shop component)
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
  specifications?: Record<string, string>;
  shippingInfo?: string;
  returnPolicy?: string;
}

interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  verified: boolean;
  helpful: number;
  content: string;
}

// Mock data - in real app this would come from API
const MOCK_PRODUCTS: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Premium Livery Designer Pro',
    price: 29.99,
    originalPrice: 49.99,
    category: 'software',
    subcategory: 'design-tools',
    description: 'Professional-grade livery design software with advanced features and unlimited exports. Perfect for ERLC designers who want to create stunning liveries with ease.',
    features: [
      'Advanced Design Tools',
      'Unlimited Exports', 
      'Premium Templates',
      'Priority Support',
      'Real-time Preview',
      'Cloud Storage'
    ],
    images: [
      '/placeholder-product-1.jpg',
      '/placeholder-product-1-2.jpg', 
      '/placeholder-product-1-3.jpg',
      '/placeholder-product-1-4.jpg'
    ],
    rating: 4.8,
    reviewCount: 127,
    inStock: true,
    isNew: true,
    isOnSale: true,
    badge: 'BESTSELLER',
    specifications: {
      'Version': '3.0 Pro',
      'License': 'Perpetual',
      'Platforms': 'Windows, Mac, Linux',
      'File Formats': 'PNG, JPG, SVG, DDS',
      'Updates': '1 Year Free Updates'
    },
    shippingInfo: 'Instant digital delivery via email',
    returnPolicy: '30-day money-back guarantee'
  },
  '2': {
    id: '2',
    name: 'ERLC Vehicle Pack',
    price: 14.99,
    category: 'digital',
    subcategory: 'vehicle-packs',
    description: 'Complete collection of 50+ high-quality vehicle models for ERLC. Includes police, fire, EMS, and civilian vehicles with detailed textures.',
    features: [
      '50+ Vehicle Models',
      'HD Textures',
      'Regular Updates',
      'Commercial License',
      'Customizable Parts'
    ],
    images: [
      '/placeholder-product-2.jpg',
      '/placeholder-product-2-2.jpg'
    ],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    isOnSale: true,
    specifications: {
      'Models': '50+ Vehicles',
      'Formats': 'OBJ, FBX',
      'Texture Resolution': '4K',
      'Poly Count': '10K-50K per model',
      'License': 'Commercial Use'
    },
    shippingInfo: 'Instant download after purchase',
    returnPolicy: '14-day refund for digital products'
  }
};

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    user: 'Alex Designer',
    rating: 5,
    date: '2024-01-15',
    verified: true,
    helpful: 23,
    content: 'Absolutely amazing software! The export quality is incredible and the templates save me so much time. Worth every penny!'
  },
  {
    id: '2', 
    user: 'Sarah Creator',
    rating: 4,
    date: '2024-01-10',
    verified: true,
    helpful: 15,
    content: 'Great tool for livery design. The interface is intuitive and the real-time preview is fantastic. Only wish it had more font options.'
  },
  {
    id: '3',
    user: 'Mike Artist',
    rating: 5,
    date: '2024-01-05',
    verified: true,
    helpful: 31,
    content: 'This has revolutionized my workflow. The cloud storage feature means I can work from anywhere. Highly recommend!'
  }
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'description' | 'specifications' | 'reviews'>('description');

  useEffect(() => {
    // In real app, this would be an API call
    if (id && MOCK_PRODUCTS[id]) {
      setProduct(MOCK_PRODUCTS[id]);
    }
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Link to="/shop" className="text-[#c4ff0d] hover:underline">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const addToCart = () => {
    // Cart functionality would be implemented here
    console.log(`Added ${quantity} of ${product.name} to cart`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Shared Navbar */}
      <SharedNavbar />

      {/* Main Content */}
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/shop" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Shop</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Product Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gradient-to-br from-[#c4ff0d]/10 to-transparent rounded-xl overflow-hidden">
              <img
                src={product.images[currentImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/60 backdrop-blur-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/60 backdrop-blur-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="px-3 py-1 bg-[#c4ff0d] text-black text-sm font-bold rounded">
                    NEW
                  </span>
                )}
                {product.isOnSale && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded">
                    SALE
                  </span>
                )}
                {product.badge && (
                  <span className="px-3 py-1 bg-black/80 text-[#c4ff0d] text-sm font-bold rounded">
                    {product.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex space-x-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImage === index
                        ? 'border-[#c4ff0d]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {renderStars(product.rating)}
                </div>
                <span className="text-gray-400">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-white">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  ${product.originalPrice}
                </span>
              )}
              {product.isOnSale && (
                <span className="px-2 py-1 bg-red-500 text-white text-sm font-bold rounded">
                  Save ${product.originalPrice! - product.price}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-300 leading-relaxed">{product.description}</p>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#c4ff0d] rounded-full" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchase Options */}
            <div className="space-y-4">
              {/* Quantity */}
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                disabled={!product.inStock}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
                  product.inStock
                    ? 'bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <Truck className="w-6 h-6 text-[#c4ff0d]" />
                  <span className="text-xs text-gray-400">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <Shield className="w-6 h-6 text-[#c4ff0d]" />
                  <span className="text-xs text-gray-400">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <Package className="w-6 h-6 text-[#c4ff0d]" />
                  <span className="text-xs text-gray-400">Instant Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-white/10">
            <nav className="flex space-x-8">
              {(['description', 'specifications', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    selectedTab === tab
                      ? 'border-[#c4ff0d] text-[#c4ff0d]'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {selectedTab === 'description' && (
              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-semibold mb-4">Product Description</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {product.description}
                </p>
                <p className="text-gray-300 leading-relaxed">
                  This premium product is designed for professionals who demand the best quality and performance. 
                  With advanced features and intuitive interface, it's the perfect choice for your needs.
                </p>
              </div>
            )}

            {selectedTab === 'specifications' && product.specifications && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">{key}:</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                
                {product.shippingInfo && (
                  <div className="mt-6 p-4 bg-white/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Shipping Information</h4>
                    <p className="text-gray-300">{product.shippingInfo}</p>
                  </div>
                )}
                
                {product.returnPolicy && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Return Policy</h4>
                    <p className="text-gray-300">{product.returnPolicy}</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div>
                <h3 className="text-xl font-semibold mb-6">Customer Reviews</h3>
                
                {/* Review Summary */}
                <div className="bg-white/5 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-3xl font-bold">{product.rating}</span>
                        <div className="flex">{renderStars(product.rating)}</div>
                      </div>
                      <p className="text-gray-400">Based on {product.reviewCount} reviews</p>
                    </div>
                    <button className="px-4 py-2 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors">
                      Write a Review
                    </button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white/5 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold">{review.user}</span>
                            {review.verified && (
                              <span className="px-2 py-1 bg-[#c4ff0d]/20 text-[#c4ff0d] text-xs font-bold rounded">
                                VERIFIED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex">{renderStars(review.rating)}</div>
                            <span className="text-gray-400 text-sm">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4">{review.content}</p>
                      <div className="flex items-center space-x-4">
                        <button className="text-sm text-gray-400 hover:text-white">
                          Helpful ({review.helpful})
                        </button>
                        <button className="text-sm text-gray-400 hover:text-white">
                          Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
