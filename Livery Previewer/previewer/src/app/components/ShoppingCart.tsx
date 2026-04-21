import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, X, Plus, Minus, Trash2, CreditCard, Truck, 
  ChevronLeft, Package, Shield 
} from 'lucide-react';

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

// Mock product data (same as Shop component)
const MOCK_PRODUCTS: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Premium Livery Designer Pro',
    price: 29.99,
    image: '/placeholder-product-1.jpg',
    inStock: true
  },
  '2': {
    id: '2',
    name: 'ERLC Vehicle Pack',
    price: 14.99,
    image: '/placeholder-product-2.jpg',
    inStock: true
  },
  '3': {
    id: '3',
    name: 'itzz Merchandise Bundle',
    price: 39.99,
    image: '/placeholder-product-3.jpg',
    inStock: true
  }
};

// Cart hook for managing cart state
export function useShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('itzz-shop-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('itzz-shop-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (productId: string, quantity: number = 1) => {
    const product = MOCK_PRODUCTS[productId];
    if (!product || !product.inStock) return;

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity,
          inStock: product.inStock
        }];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal >= 50 ? 0 : 4.99) : 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    isOpen,
    setIsOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    shipping,
    tax,
    total,
    itemCount
  };
}

// Cart Button Component
export function CartButton({ itemCount, onClick }: { itemCount: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-400 hover:text-white transition-colors"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c4ff0d] text-black text-xs font-bold rounded-full flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}

// Cart Sidebar Component
export function CartSidebar({ 
  cartItems, 
  isOpen, 
  setIsOpen, 
  updateQuantity, 
  removeFromCart, 
  clearCart,
  subtotal,
  shipping,
  tax,
  total,
  itemCount 
}: {
  cartItems: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}) {
  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">Shopping Cart ({itemCount})</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
              <p className="text-gray-400 mb-4">Add some products to get started!</p>
              <Link
                to="/shop"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Browse Shop</span>
              </Link>
            </div>
          ) : (
            <>
              {cartItems.map(item => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex space-x-4">
                    {/* Product Image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{item.name}</h4>
                      <p className="text-[#c4ff0d] font-bold mb-2">${item.price}</p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 bg-white/5 border border-white/10 rounded hover:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 bg-white/5 border border-white/10 rounded hover:bg-white/10"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-white/10 p-4 space-y-4">
            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shipping</span>
                <span className="text-white">
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax</span>
                <span className="text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-[#c4ff0d]">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Free Shipping Notice */}
            {subtotal < 50 && subtotal > 0 && (
              <div className="bg-[#c4ff0d]/10 border border-[#c4ff0d]/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-[#c4ff0d]" />
                  <p className="text-sm text-[#c4ff0d]">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Proceed to checkout
                  console.log('Proceeding to checkout');
                }}
                className="w-full py-3 px-4 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Checkout</span>
              </button>
              
              <button
                onClick={clearCart}
                className="w-full py-2 px-4 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}

// Full Cart Page Component
export function CartPage({ 
  cartItems, 
  updateQuantity, 
  removeFromCart, 
  clearCart,
  subtotal,
  shipping,
  tax,
  total,
  itemCount 
}: {
  cartItems: CartItem[];
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/shop" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Shop</span>
            </Link>
            
            <h1 className="text-xl font-bold">Shopping Cart</h1>
            
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex space-x-6">
                    {/* Product Image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                      <p className="text-[#c4ff0d] font-bold text-xl mb-4">${item.price}</p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-400">Quantity:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal ({itemCount} items)</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping</span>
                    <span className="text-white">
                      {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax</span>
                    <span className="text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-[#c4ff0d]">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Shield className="w-4 h-4 text-[#c4ff0d]" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Truck className="w-4 h-4 text-[#c4ff0d]" />
                    <span>Free Shipping on orders $50+</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => {
                    // Proceed to checkout
                    console.log('Proceeding to checkout');
                  }}
                  className="w-full py-3 px-4 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Checkout</span>
                </button>

                {/* Continue Shopping */}
                <Link
                  to="/shop"
                  className="block w-full mt-4 py-2 px-4 text-center text-[#c4ff0d] hover:underline"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}