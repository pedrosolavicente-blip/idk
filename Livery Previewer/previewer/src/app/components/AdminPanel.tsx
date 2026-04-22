import { useState, useEffect } from 'react';
import { X, Upload, Package, DollarSign, Star, Edit, Trash2, Plus, Eye, EyeOff, Save, Settings } from 'lucide-react';

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

interface AdminStats {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  pendingReviews: number;
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    pendingReviews: 0
  });

  // Load existing products
  useEffect(() => {
    // In a real app, this would fetch from API
    const savedProducts = localStorage.getItem('admin_products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
    
    // Load stats
    const savedStats = localStorage.getItem('admin_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const handleSaveProduct = (product: Product) => {
    const updatedProducts = editingProduct 
      ? products.map(p => p.id === product.id ? product : p)
      : [...products, product];
    
    setProducts(updatedProducts);
    localStorage.setItem('admin_products', JSON.stringify(updatedProducts));
    
    // Update stats
    const newStats = {
      ...stats,
      totalProducts: updatedProducts.length
    };
    setStats(newStats);
    localStorage.setItem('admin_stats', JSON.stringify(newStats));
    
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    localStorage.setItem('admin_products', JSON.stringify(updatedProducts));
    
    // Update stats
    const newStats = {
      ...stats,
      totalProducts: updatedProducts.length
    };
    setStats(newStats);
    localStorage.setItem('admin_stats', JSON.stringify(newStats));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const ProductForm = () => {
    const [formData, setFormData] = useState<Partial<Product>>(() => ({
      name: '',
      price: 0,
      category: 'software',
      subcategory: 'design-tools',
      description: '',
      features: [],
      images: [],
      rating: 0,
      reviewCount: 0,
      inStock: true,
      isNew: false,
      isOnSale: false,
      specifications: {},
      shippingInfo: 'Free shipping'
    }));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newProduct: Product = {
        id: editingProduct?.id || Date.now().toString(),
        name: formData.name || 'New Product',
        price: formData.price || 0,
        category: formData.category || 'software',
        subcategory: formData.subcategory || 'design-tools',
        description: formData.description || '',
        features: formData.features || [],
        images: formData.images || [`${BASE}marketplace.svg`],
        rating: formData.rating || 0,
        reviewCount: formData.reviewCount || 0,
        inStock: formData.inStock !== false,
        isNew: formData.isNew || false,
        isOnSale: formData.isOnSale || false,
        specifications: formData.specifications || {},
        shippingInfo: formData.shippingInfo || 'Free shipping'
      };

      handleSaveProduct(newProduct);
      setFormData({});
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
            <h2 className="text-lg font-bold text-white">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button 
              onClick={() => {
                setShowProductForm(false);
                setEditingProduct(null);
                setFormData({});
              }}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none resize-none"
                  rows={4}
                  placeholder="Describe your product..."
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none"
                  >
                    <option value="software">Software</option>
                    <option value="templates">Templates</option>
                    <option value="assets">Assets</option>
                    <option value="tools">Tools</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Subcategory</label>
                  <input
                    type="text"
                    value={formData.subcategory || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none"
                    placeholder="e.g., design-tools"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Shipping Info</label>
                  <input
                    type="text"
                    value={formData.shippingInfo || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingInfo: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none"
                    placeholder="e.g., Free shipping"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Features (comma-separated)</label>
                <input
                  type="text"
                  value={formData.features?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    features: e.target.value.split(',').map(f => f.trim()).filter(f => f) 
                  }))}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none"
                  placeholder="feature1, feature2, feature3"
                />
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.inStock !== false}
                    onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                    className="w-4 h-4 text-[#c4ff0d] border-white/10 rounded focus:ring-[#c4ff0d]/20"
                  />
                  <label className="text-sm font-medium text-zinc-300">In Stock</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isNew || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isNew: e.target.checked }))}
                    className="w-4 h-4 text-[#c4ff0d] border-white/10 rounded focus:ring-[#c4ff0d]/20"
                  />
                  <label className="text-sm font-medium text-zinc-300">New Product</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isOnSale || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isOnSale: e.target.checked }))}
                    className="w-4 h-4 text-[#c4ff0d] border-white/10 rounded focus:ring-[#c4ff0d]/20"
                  />
                  <label className="text-sm font-medium text-zinc-300">On Sale</label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setFormData({});
                  }}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg transition-colors font-semibold"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Admin Header */}
      <div className="bg-[#0f0f0f] border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#c4ff0d]" />
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
              >
                Back to Shop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-white/8">
          {[
            { id: 'products', label: 'Products', icon: Package },
            { id: 'analytics', label: 'Analytics', icon: Star },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[#c4ff0d] border-b-2 border-[#c4ff0d]'
                  : 'text-zinc-400 hover:text-white border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <div>
            {/* Products Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Product Management</h2>
                <p className="text-zinc-400">Manage your product catalog</p>
              </div>
              
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-4 py-2 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg transition-colors font-semibold"
              >
                <Plus size={16} />
                Add New Product
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  {/* Product Image */}
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-[#c4ff0d]/10 to-transparent">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        
                        {/* Rating */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={`${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-zinc-400">
                            {product.rating} ({product.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                        >
                          <Edit size={14} className="text-zinc-400" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-xl font-bold text-white">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-zinc-400 line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <span className={`text-sm font-medium ${
                        product.inStock ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {product.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-white/10 text-xs text-zinc-300 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-400' },
                { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
                { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-purple-400' },
                { label: 'Active Users', value: stats.activeUsers, icon: Eye, color: 'text-orange-400' },
                { label: 'Pending Reviews', value: stats.pendingReviews, icon: Star, color: 'text-red-400' }
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Admin Settings</h2>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Store Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Store Name</label>
                      <input
                        type="text"
                        defaultValue="Livery Marketplace"
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Store Description</label>
                      <textarea
                        defaultValue="Premium livery designs and assets"
                        rows={3}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-[#c4ff0d] border-white/10 rounded focus:ring-[#c4ff0d]/20"
                      />
                      <label className="text-sm font-medium text-zinc-300">Email notifications for new orders</label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-[#c4ff0d] border-white/10 rounded focus:ring-[#c4ff0d]/20"
                      />
                      <label className="text-sm font-medium text-zinc-300">Email notifications for new reviews</label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Payment Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Default Currency</label>
                      <select className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/40 focus:outline-none">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button className="px-6 py-2 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg transition-colors font-semibold">
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && <ProductForm />}
    </div>
  );
};

export default AdminPanel;
