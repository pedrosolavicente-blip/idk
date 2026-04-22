import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Package, Mail, ExternalLink, Download, Clock } from 'lucide-react';
import type { CartItem } from './types';

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  paymentMethod: 'paypal' | 'roblox';
  transactionId: string;
  cartItems: CartItem[];
  total: number;
}

export default function OrderConfirmation({
  isOpen,
  onClose,
  orderId,
  paymentMethod,
  transactionId,
  cartItems,
  total,
}: OrderConfirmationProps) {
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Save order to localStorage
      const order = {
        id: orderId,
        paymentMethod,
        transactionId,
        items: cartItems,
        total,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      
      const existingOrders = JSON.parse(localStorage.getItem('order_history') || '[]');
      localStorage.setItem('order_history', JSON.stringify([...existingOrders, order]));
    }
  }, [isOpen, orderId, paymentMethod, transactionId, cartItems, total]);

  const handleSendEmail = () => {
    // Simulate sending email receipt
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleDownloadReceipt = () => {
    // Generate and download receipt
    const receipt = {
      orderId,
      transactionId,
      paymentMethod,
      items: cartItems,
      total,
      tax: total * 0.08,
      finalTotal: total * 1.08,
      date: new Date().toLocaleDateString(),
    };

    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="font-bold text-white">Order Confirmed!</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Thank you for your order!</h3>
              <p className="text-zinc-400 text-sm">
                Your order has been successfully processed and your items are now available.
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Order ID</span>
              <span className="text-white font-mono text-sm">{orderId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Transaction ID</span>
              <span className="text-white font-mono text-sm">{transactionId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Payment Method</span>
              <span className="text-white text-sm capitalize">{paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Date</span>
              <span className="text-white text-sm">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="border-t border-white/8 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Total Paid</span>
                <span className="text-[#c4ff0d] font-bold text-lg">${(total * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-sm">Items Purchased</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-white/4 rounded-lg">
                  <Package size={16} className="text-zinc-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                    <p className="text-xs text-zinc-400">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <span className="text-sm text-[#c4ff0d] font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Delivery Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Download size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white text-sm mb-1">Digital Delivery</h4>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  All digital items are now available in your account. You can access them anytime from your downloads page.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleSendEmail}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
              >
                <Mail size={16} />
                {emailSent ? 'Email Sent!' : 'Email Receipt'}
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Download Receipt
              </button>
            </div>

            <div className="flex gap-3">
              <Link
                to="/downloads"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg transition-colors text-sm font-semibold text-center"
              >
                <Package size={16} />
                View Downloads
              </Link>
              <Link
                to="/orders"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors text-sm font-medium text-center"
              >
                <Clock size={16} />
                Order History
              </Link>
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="text-center pt-4 border-t border-white/8">
            <p className="text-zinc-400 text-sm mb-3">Need anything else?</p>
            <Link
              to="/shop"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
            >
              <ExternalLink size={16} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
