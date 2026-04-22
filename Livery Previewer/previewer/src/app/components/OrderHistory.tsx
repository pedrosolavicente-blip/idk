import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ExternalLink, Download, Filter, ChevronDown, Search, Eye, Mail, RefreshCw } from 'lucide-react';
import type { CartItem } from '../hooks/Types';

interface Order {
  id: string;
  paymentMethod: 'paypal' | 'roblox';
  transactionId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
  completedAt?: string;
  trackingNumber?: string;
  downloadLinks?: string[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Load orders from localStorage
  useEffect(() => {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('order_history') || '[]');
      setOrders(savedOrders);
      setFilteredOrders(savedOrders);
    } catch (error) {
      console.error('Failed to load order history:', error);
    }
  }, []);

  // Filter and sort orders
  useEffect(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.transactionId.toLowerCase().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply payment method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === methodFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'total':
          return b.total - a.total;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, methodFilter, sortBy]);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'processing': return 'text-blue-400 bg-blue-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      case 'refunded': return 'text-zinc-400 bg-zinc-400/10';
      default: return 'text-zinc-400 bg-zinc-400/10';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'completed': return <Package size={16} />;
      case 'processing': return <RefreshCw size={16} className="animate-spin" />;
      case 'pending': return <Eye size={16} />;
      case 'cancelled': return <Eye size={16} />;
      case 'refunded': return <RefreshCw size={16} />;
      default: return <Package size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-4 h-4 text-[#c4ff0d]" />
            <span className="text-sm font-bold">Order History</span>
          </div>
          <Link
            to="/shop"
            className="text-xs px-3 py-1.5 rounded-lg bg-white/6 hover:bg-white/12 text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Shop
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/6 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white/6 border border-white/10 rounded-lg text-white text-sm px-4 py-2 pr-8 focus:border-[#c4ff0d]/40 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="appearance-none bg-white/6 border border-white/10 rounded-lg text-white text-sm px-4 py-2 pr-8 focus:border-[#c4ff0d]/40 focus:outline-none"
              >
                <option value="all">All Methods</option>
                <option value="paypal">PayPal</option>
                <option value="roblox">Roblox</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white/6 border border-white/10 rounded-lg text-white text-sm px-4 py-2 pr-8 focus:border-[#c4ff0d]/40 focus:outline-none"
              >
                <option value="date">Sort by Date</option>
                <option value="total">Sort by Total</option>
                <option value="status">Sort by Status</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">
              {searchQuery || statusFilter !== 'all' || methodFilter !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-zinc-500 text-sm mb-6">
              {searchQuery || statusFilter !== 'all' || methodFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Your order history will appear here once you make a purchase.'}
            </p>
            {orders.length === 0 && (
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black font-semibold rounded-lg transition-colors"
              >
                <Package className="w-4 h-4" />
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
                {/* Order Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/6 transition-colors"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">{order.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500 capitalize">{order.paymentMethod}</span>
                      </div>
                      <div className="text-sm text-zinc-400 mt-1">
                        {formatDate(order.createdAt)} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#c4ff0d]">${(order.total * 1.08).toFixed(2)}</div>
                    <div className="text-xs text-zinc-500">Total</div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedOrders.has(order.id) && (
                  <div className="border-t border-white/8 p-4 space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white text-sm mb-2">Items</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-white/4 rounded-lg">
                          <Package size={16} className="text-zinc-400 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-white">{item.name}</p>
                            <p className="text-xs text-zinc-400">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                          </div>
                          <span className="text-sm text-[#c4ff0d] font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-white text-sm">Order Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Order ID:</span>
                            <span className="text-white font-mono">{order.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Transaction ID:</span>
                            <span className="text-white font-mono">{order.transactionId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Payment Method:</span>
                            <span className="text-white capitalize">{order.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Subtotal:</span>
                            <span className="text-white">${order.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Tax:</span>
                            <span className="text-white">${(order.total * 0.08).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-white">Total:</span>
                            <span className="text-[#c4ff0d]">${(order.total * 1.08).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-white text-sm">Actions</h4>
                        <div className="space-y-2">
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors text-sm">
                            <Mail size={16} />
                            Email Receipt
                          </button>
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors text-sm">
                            <Download size={16} />
                            Download Receipt
                          </button>
                          {order.status === 'completed' && (
                            <Link
                              to="/downloads"
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg transition-colors text-sm font-semibold text-center"
                            >
                              <Package size={16} />
                              View Downloads
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
