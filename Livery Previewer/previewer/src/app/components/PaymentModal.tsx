import { useState, useEffect } from 'react';
import { X, CreditCard, Wallet, Check, AlertCircle, Loader2 } from 'lucide-react';
import getPayPalService from '../services/PayPalService';
import getRobloxService from '../services/RobloxService';
import type { CartItem } from './types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  total: number;
  onPaymentComplete: (transactionId: string, method: 'paypal' | 'roblox') => void;
}

type PaymentMethod = 'paypal' | 'roblox';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export default function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  total,
  onPaymentComplete,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('paypal');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [robloxUser, setRobloxUser] = useState<any>(null);

  const robloxService = getRobloxService();
  const paypalService = getPayPalService();

  // Initialize Roblox service when modal opens
  useEffect(() => {
    if (isOpen && selectedMethod === 'roblox') {
      robloxService.initialize()
        .then(() => {
          setRobloxUser(robloxService.getCurrentUser());
        })
        .catch(error => {
          console.error('Roblox initialization failed:', error);
          setErrorMessage('Failed to initialize Roblox payment');
        });
    }
  }, [isOpen, selectedMethod]);

  // Initialize PayPal when modal opens
  useEffect(() => {
    if (isOpen && selectedMethod === 'paypal') {
      paypalService.loadSDK().catch(error => {
        console.error('PayPal SDK loading failed:', error);
        setErrorMessage('Failed to load PayPal');
      });
    }
  }, [isOpen, selectedMethod]);

  const handlePayPalPayment = async () => {
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Create PayPal order
      const orderId = await paypalService.createOrder(cartItems, total);
      
      // For mock implementation, simulate approval
      if (orderId.startsWith('MOCK-')) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const order = await paypalService.captureMockOrder(orderId);
        setPaymentStatus('success');
        onPaymentComplete(order.id, 'paypal');
        return;
      }

      // Render PayPal buttons (in real implementation)
      const container = document.getElementById('paypal-button-container');
      if (container) {
        paypalService.renderButtons(container, {
          createOrder: () => paypalService.createOrder(cartItems, total),
          onApprove: (data) => {
            setPaymentStatus('success');
            onPaymentComplete(data.orderID, 'paypal');
          },
          onError: (error) => {
            setPaymentStatus('error');
            setErrorMessage('PayPal payment failed. Please try again.');
          },
          onCancel: () => {
            setPaymentStatus('idle');
          },
        });
      }
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage('PayPal payment failed. Please try again.');
    }
  };

  const handleRobloxPayment = async () => {
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      if (!robloxUser) {
        throw new Error('Roblox user not authenticated');
      }

      const robuxAmount = robloxService.convertUSDToRobux(total);
      
      if (!robloxService.hasSufficientBalance(robuxAmount)) {
        setPaymentStatus('error');
        setErrorMessage(`Insufficient Robux balance. You need ${robuxAmount} Robux but only have ${robloxUser.robuxBalance}.`);
        return;
      }

      // Create Roblox payment
      const transaction = await robloxService.createPayment(cartItems, total);
      
      // For mock implementation, simulate processing
      if (transaction.id.startsWith('ROBLOX-')) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const completedTransaction = await robloxService.processMockPayment(transaction.id);
        setPaymentStatus('success');
        onPaymentComplete(completedTransaction.id, 'roblox');
        return;
      }

      // Open Roblox purchase modal (in real implementation)
      robloxService.openPurchaseModal(transaction);
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Roblox payment failed. Please try again.');
    }
  };

  const handlePayment = () => {
    if (selectedMethod === 'paypal') {
      handlePayPalPayment();
    } else {
      handleRobloxPayment();
    }
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setErrorMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="font-bold text-white">Checkout</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Items ({cartItems.length})</span>
                <span className="text-white">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tax</span>
                <span className="text-white">${(total * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-2 border-t border-white/8">
                <span>Total</span>
                <span>${(total * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Payment Method</h3>
            
            <button
              onClick={() => {
                setSelectedMethod('paypal');
                resetPayment();
              }}
              disabled={paymentStatus === 'processing'}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                selectedMethod === 'paypal'
                  ? 'border-[#c4ff0d] bg-[#c4ff0d]/10'
                  : 'border-white/10 hover:border-white/20 bg-white/4'
              } ${paymentStatus === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white">PayPal</p>
                <p className="text-xs text-zinc-400">Pay with credit card or PayPal balance</p>
              </div>
              {selectedMethod === 'paypal' && (
                <Check size={20} className="text-[#c4ff0d]" />
              )}
            </button>

            <button
              onClick={() => {
                setSelectedMethod('roblox');
                resetPayment();
              }}
              disabled={paymentStatus === 'processing'}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                selectedMethod === 'roblox'
                  ? 'border-[#c4ff0d] bg-[#c4ff0d]/10'
                  : 'border-white/10 hover:border-white/20 bg-white/4'
              } ${paymentStatus === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-10 h-10 bg-[#00a8ff] rounded-lg flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white">Roblox</p>
                <p className="text-xs text-zinc-400">
                  {robloxUser ? `${robloxUser.robuxBalance} Robux available` : 'Connect Roblox account'}
                </p>
              </div>
              {selectedMethod === 'roblox' && (
                <Check size={20} className="text-[#c4ff0d]" />
              )}
            </button>
          </div>

          {/* PayPal Button Container */}
          {selectedMethod === 'paypal' && paymentStatus === 'idle' && (
            <div id="paypal-button-container" className="min-h-[40px]" />
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* Processing State */}
          {paymentStatus === 'processing' && (
            <div className="flex items-center justify-center gap-3 py-4">
              <Loader2 size={20} className="animate-spin text-[#c4ff0d]" />
              <span className="text-white">Processing payment...</span>
            </div>
          )}

          {/* Success State */}
          {paymentStatus === 'success' && (
            <div className="flex items-center justify-center gap-3 py-4">
              <Check size={20} className="text-green-400" />
              <span className="text-green-400">Payment successful!</span>
            </div>
          )}

          {/* Action Buttons */}
          {paymentStatus === 'idle' || paymentStatus === 'error' ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 py-2.5 px-4 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg transition-colors text-sm font-semibold"
              >
                Pay ${(total * 1.08).toFixed(2)}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
