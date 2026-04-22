import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, X, Plus, Minus, Trash2, CreditCard,
  Truck, ChevronLeft, Package, Shield,
} from 'lucide-react';
import type { CartItem } from '../hooks/Types';
import PaymentModal from './PaymentModal';
import OrderConfirmation from './OrderConfirmation';

const BASE = (import.meta as any).env?.BASE_URL || '';

// ─── Mock product lookup (replace with real API in production) ─────────────────

interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

const MOCK_PRODUCTS: Record<string, SimpleProduct> = {
  '1': { id: '1', name: 'Premium Livery Designer Pro',  price: 29.99, image: `${BASE}marketplace.svg`, inStock: true },
  '2': { id: '2', name: 'ERLC Vehicle Pack Ultimate',   price: 14.99, image: `${BASE}marketplace.svg`, inStock: true },
  '3': { id: '3', name: 'itzz Merchandise Collection',  price: 39.99, image: `${BASE}marketplace.svg`, inStock: true },
  '4': { id: '4', name: 'Advanced Texture Pack Pro',    price: 19.99, image: `${BASE}marketplace.svg`, inStock: true },
  '5': { id: '5', name: 'itzz Discord Premium',         price:  9.99, image: `${BASE}marketplace.svg`, inStock: true },
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('itzz-shop-cart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem('itzz-shop-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (productId: string, quantity = 1) => {
    // Try admin-created products first, fall back to mock
    let product: SimpleProduct | undefined = MOCK_PRODUCTS[productId];
    try {
      const adminProducts: any[] = JSON.parse(localStorage.getItem('admin_products') || '[]');
      const ap = adminProducts.find(p => p.id === productId);
      if (ap) product = { id: ap.id, name: ap.name, price: ap.price, image: ap.images?.[0] || `${BASE}marketplace.svg`, inStock: ap.inStock };
    } catch { /* ignore */ }

    if (!product || !product.inStock) return;

    setCartItems(prev => {
      const existing = prev.find(i => i.id === productId);
      if (existing) {
        return prev.map(i => i.id === productId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { id: product!.id, name: product!.name, price: product!.price, image: product!.image, quantity, inStock: product!.inStock }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
  };

  const clearCart = () => setCartItems([]);

  const subtotal  = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping  = subtotal > 0 ? (subtotal >= 50 ? 0 : 4.99) : 0;
  const tax       = subtotal * 0.08;
  const total     = subtotal + shipping + tax;
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return { cartItems, isOpen, setIsOpen, addToCart, updateQuantity, removeFromCart, clearCart, subtotal, shipping, tax, total, itemCount };
}

// ─── Cart Button ───────────────────────────────────────────────────────────────

export function CartButton({ itemCount, onClick }: { itemCount: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative p-2 text-zinc-400 hover:text-white transition-colors">
      <ShoppingCart className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#c4ff0d] text-black text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

// ─── Shared order summary rows ────────────────────────────────────────────────

function OrderRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-bold text-base' : ''}`}>
      <span className={bold ? 'text-white' : 'text-zinc-400'}>{label}</span>
      <span className={bold ? 'text-[#c4ff0d]' : 'text-white'}>{value}</span>
    </div>
  );
}

// ─── Cart Sidebar ──────────────────────────────────────────────────────────────

export function CartSidebar({
  cartItems, isOpen, setIsOpen, updateQuantity, removeFromCart, clearCart,
  subtotal, shipping, tax, total, itemCount,
}: {
  cartItems: CartItem[]; isOpen: boolean; setIsOpen: (v: boolean) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  subtotal: number; shipping: number; tax: number; total: number; itemCount: number;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ orderId: string; paymentMethod: 'paypal' | 'roblox'; transactionId: string } | null>(null);

  const handlePaymentComplete = (transactionId: string, method: 'paypal' | 'roblox') => {
    const orderId = `ORD-${Date.now()}`;
    setCompletedOrder({ orderId, paymentMethod: method, transactionId });
    setShowPaymentModal(false);
    setShowOrderConfirmation(true);
    clearCart();
  };
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#0a0a0a] border-l border-white/10 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="font-semibold text-white text-sm">Cart <span className="text-zinc-500">({itemCount})</span></h2>
          <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <ShoppingCart className="w-12 h-12 text-zinc-700" />
              <p className="text-zinc-500 text-sm">Your cart is empty</p>
              <Link to="/shop" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-[#c4ff0d] text-black text-sm font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors">
                Browse Shop
              </Link>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-white/4 border border-white/8 rounded-xl">
                <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg shrink-0 bg-white/4" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-[#c4ff0d] font-semibold mt-0.5">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white/8 hover:bg-white/16 rounded-md transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs w-5 text-center font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white/8 hover:bg-white/16 rounded-md transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-white/8 p-4 space-y-4">
            <div className="space-y-2">
              <OrderRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
              <OrderRow label="Shipping" value={shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`} />
              <OrderRow label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
              <div className="border-t border-white/8 pt-2">
                <OrderRow label="Total" value={`$${total.toFixed(2)}`} bold />
              </div>
            </div>

            {subtotal < 50 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#c4ff0d]/8 border border-[#c4ff0d]/20 rounded-lg">
                <Truck className="w-3.5 h-3.5 text-[#c4ff0d] shrink-0" />
                <p className="text-xs text-[#c4ff0d]">Add ${(50 - subtotal).toFixed(2)} for free shipping</p>
              </div>
            )}

            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black font-semibold text-sm rounded-lg transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Checkout
            </button>

            <button onClick={clearCart} className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Clear cart
            </button>
          </div>
        )}
      </aside>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cartItems={cartItems}
        total={total}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Order Confirmation Modal */}
      {completedOrder && (
        <OrderConfirmation
          isOpen={showOrderConfirmation}
          onClose={() => setShowOrderConfirmation(false)}
          orderId={completedOrder.orderId}
          paymentMethod={completedOrder.paymentMethod}
          transactionId={completedOrder.transactionId}
          cartItems={cartItems}
          total={total}
        />
      )}
    </>
  );
}

// ─── Cart Page ─────────────────────────────────────────────────────────────────

export function CartPage({
  cartItems, updateQuantity, removeFromCart, clearCart,
  subtotal, shipping, tax, total, itemCount,
}: {
  cartItems: CartItem[];
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  subtotal: number; shipping: number; tax: number; total: number; itemCount: number;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/shop" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to Shop
          </Link>
          <h1 className="text-sm font-bold">Shopping Cart</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingCart className="w-16 h-16 text-zinc-700 mb-6" />
            <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
            <p className="text-zinc-500 text-sm mb-8">Add some products to get started.</p>
            <Link to="/shop" className="flex items-center gap-2 px-6 py-3 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors">
              <Package className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-5 p-5 bg-white/4 border border-white/8 rounded-xl">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg shrink-0 bg-white/4" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                    <p className="text-[#c4ff0d] font-bold text-lg mb-4">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-400">Qty:</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-white/8 hover:bg-white/16 rounded-lg transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center bg-white/8 hover:bg-white/16 rounded-lg transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={clearCart} className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors mt-2">
                Clear entire cart
              </button>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/4 border border-white/8 rounded-xl p-6 sticky top-20 space-y-5">
                <h2 className="font-bold text-white">Order Summary</h2>

                <div className="space-y-3">
                  <OrderRow label={`Subtotal (${itemCount} item${itemCount !== 1 ? 's' : ''})`} value={`$${subtotal.toFixed(2)}`} />
                  <OrderRow label="Shipping" value={shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`} />
                  <OrderRow label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
                  <div className="border-t border-white/8 pt-3">
                    <OrderRow label="Total" value={`$${total.toFixed(2)}`} bold />
                  </div>
                </div>

                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#c4ff0d]" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#c4ff0d]" />
                    <span>Free shipping on orders $50+</span>
                  </div>
                </div>

                <button
                  onClick={() => console.log('TODO: PayPal / Roblox checkout')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black font-semibold rounded-lg transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Proceed to Checkout
                </button>

                <Link to="/shop" className="block text-center text-sm text-[#c4ff0d] hover:underline">
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