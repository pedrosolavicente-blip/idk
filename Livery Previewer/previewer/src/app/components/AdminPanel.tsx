import { useState, useEffect } from 'react';
import { X, Package, DollarSign, Star, Edit, Trash2, Plus, Eye, Save, Settings, BarChart2, ShoppingBag, Users, AlertCircle } from 'lucide-react';

const BASE = (import.meta as any).env?.BASE_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

interface AdminStats {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  pendingReviews: number;
}

const EMPTY_PRODUCT: Partial<Product> = {
  name: '',
  price: 0,
  category: 'software',
  subcategory: '',
  description: '',
  features: [],
  images: [],
  rating: 0,
  reviewCount: 0,
  inStock: true,
  isNew: false,
  isOnSale: false,
  specifications: {},
  shippingInfo: 'Free shipping',
};

// ─── Product Form Modal ────────────────────────────────────────────────────────

interface ProductFormProps {
  editingProduct: Product | null;
  onSave: (product: Product) => void;
  onClose: () => void;
}

const ProductForm = ({ editingProduct, onSave, onClose }: ProductFormProps) => {
  const [formData, setFormData] = useState<Partial<Product>>(
    editingProduct ? { ...editingProduct } : { ...EMPTY_PRODUCT }
  );

  const set = (key: keyof Product, value: unknown) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name || 'New Product',
      price: formData.price || 0,
      category: formData.category || 'software',
      subcategory: formData.subcategory || '',
      description: formData.description || '',
      features: formData.features || [],
      images: formData.images?.length ? formData.images : [`${BASE}marketplace.svg`],
      rating: formData.rating || 0,
      reviewCount: formData.reviewCount || 0,
      inStock: formData.inStock !== false,
      isNew: formData.isNew || false,
      isOnSale: formData.isOnSale || false,
      specifications: formData.specifications || {},
      shippingInfo: formData.shippingInfo || 'Free shipping',
    };
    onSave(product);
  };

  const inputCls =
    'w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/50 focus:ring-1 focus:ring-[#c4ff0d]/20 focus:outline-none transition-colors placeholder:text-zinc-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <h2 className="text-lg font-bold text-white">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Row 1 – Name + Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => set('name', e.target.value)}
                  className={inputCls}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={e => set('price', parseFloat(e.target.value) || 0)}
                    className={`${inputCls} pl-7`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 2 – Original Price + Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Original Price (optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                  <input
                    type="number"
                    value={formData.originalPrice || ''}
                    onChange={e => set('originalPrice', parseFloat(e.target.value) || undefined)}
                    className={`${inputCls} pl-7`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Shipping Info</label>
                <input
                  type="text"
                  value={formData.shippingInfo || ''}
                  onChange={e => set('shippingInfo', e.target.value)}
                  className={inputCls}
                  placeholder="e.g., Free shipping"
                />
              </div>
            </div>

            {/* Row 3 – Category + Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={formData.category || 'software'}
                  onChange={e => set('category', e.target.value)}
                  className={inputCls}
                >
                  <option value="software">Software</option>
                  <option value="templates">Templates</option>
                  <option value="assets">Assets</option>
                  <option value="tools">Tools</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Subcategory</label>
                <input
                  type="text"
                  value={formData.subcategory || ''}
                  onChange={e => set('subcategory', e.target.value)}
                  className={inputCls}
                  placeholder="e.g., design-tools"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={e => set('description', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Describe your product…"
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Features <span className="normal-case text-zinc-600 font-normal">(comma-separated)</span></label>
              <input
                type="text"
                value={formData.features?.join(', ') || ''}
                onChange={e => set('features', e.target.value.split(',').map(f => f.trim()).filter(Boolean))}
                className={inputCls}
                placeholder="Feature one, feature two, feature three"
              />
            </div>

            {/* Badge */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Badge <span className="normal-case text-zinc-600 font-normal">(optional)</span></label>
              <input
                type="text"
                value={formData.badge || ''}
                onChange={e => set('badge', e.target.value)}
                className={inputCls}
                placeholder="e.g., Best Seller"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              {([
                ['inStock', 'In Stock'],
                ['isNew', 'New Product'],
                ['isOnSale', 'On Sale'],
              ] as [keyof Product, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={!!formData[key]}
                      onChange={e => set(key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#c4ff0d] transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-zinc-300">{label}</span>
                </label>
              ))}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-white/8 hover:bg-white/14 text-zinc-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            className="px-5 py-2 text-sm bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg font-semibold transition-colors"
          >
            {editingProduct ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) => (
  <div className="bg-white/4 border border-white/8 rounded-xl p-5 flex items-center gap-4">
    <div className={`p-2.5 rounded-lg bg-white/6 ${accent}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
    </div>
  </div>
);

// ─── Main AdminPanel ───────────────────────────────────────────────────────────

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [storeName, setStoreName] = useState('Livery Marketplace');
  const [storeDesc, setStoreDesc] = useState('Premium livery designs and assets');
  const [currency, setCurrency] = useState('USD');
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    pendingReviews: 0,
  });

  // Load persisted data
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem('admin_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedStats = localStorage.getItem('admin_stats');
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch (_) { /* ignore parse errors */ }
  }, []);

  // Persist products + sync stats
  const persistProducts = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('admin_products', JSON.stringify(updated));
    const newStats = { ...stats, totalProducts: updated.length };
    setStats(newStats);
    localStorage.setItem('admin_stats', JSON.stringify(newStats));
  };

  const handleSaveProduct = (product: Product) => {
    const updated = editingProduct
      ? products.map(p => (p.id === product.id ? product : p))
      : [...products, product];
    persistProducts(updated);
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    persistProducts(products.filter(p => p.id !== productId));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const tabs = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">

      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/90 backdrop-blur border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#c4ff0d] flex items-center justify-center">
              <Settings className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Admin Panel</span>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/14 text-zinc-300 transition-colors"
          >
            ← Back to Shop
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tabs */}
        <nav className="flex gap-1 mb-8 p-1 bg-white/4 rounded-xl w-fit border border-white/8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#c4ff0d] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Products Tab ──────────────────────────────────── */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Products</h2>
                <p className="text-sm text-zinc-500 mt-0.5">{products.length} item{products.length !== 1 ? 's' : ''} in catalog</p>
              </div>
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-4 py-2 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus size={15} />
                Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-2xl">
                <ShoppingBag className="w-10 h-10 text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm">No products yet.</p>
                <button
                  onClick={handleAddProduct}
                  className="mt-4 px-4 py-2 bg-white/8 hover:bg-white/14 text-zinc-300 rounded-lg text-sm transition-colors"
                >
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="group bg-white/4 border border-white/8 rounded-xl overflow-hidden hover:border-white/16 transition-colors"
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-gradient-to-br from-[#c4ff0d]/8 to-transparent overflow-hidden">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-zinc-700" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        {product.isNew && (
                          <span className="px-2 py-0.5 bg-[#c4ff0d] text-black text-xs font-bold rounded-full">NEW</span>
                        )}
                        {product.isOnSale && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">SALE</span>
                        )}
                        {product.badge && (
                          <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-sm">{product.badge}</span>
                        )}
                      </div>

                      {/* Actions overlay */}
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg backdrop-blur-sm transition-colors"
                          title="Edit"
                        >
                          <Edit size={13} className="text-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 bg-red-600/70 hover:bg-red-600/90 rounded-lg backdrop-blur-sm transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} className="text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-1">{product.name}</h3>
                        <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${product.inStock ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                          {product.inStock ? 'In stock' : 'Out of stock'}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{product.description}</p>
                      )}

                      {/* Rating */}
                      {product.rating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={11}
                                className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-zinc-500">{product.rating} ({product.reviewCount})</span>
                        </div>
                      )}

                      {/* Price row */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-lg font-bold text-white">${product.price.toFixed(2)}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-zinc-600 line-through">${product.originalPrice.toFixed(2)}</span>
                        )}
                        <span className="ml-auto text-xs text-zinc-600 capitalize">{product.category}</span>
                      </div>

                      {/* Features */}
                      {product.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {product.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/6 text-zinc-400 text-xs rounded-full">{f}</span>
                          ))}
                          {product.features.length > 3 && (
                            <span className="px-2 py-0.5 text-zinc-600 text-xs">+{product.features.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Analytics Tab ─────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              <StatCard label="Total Products"  value={stats.totalProducts}                        icon={Package}    accent="text-blue-400" />
              <StatCard label="Total Revenue"   value={`$${stats.totalRevenue.toLocaleString()}`}  icon={DollarSign} accent="text-emerald-400" />
              <StatCard label="Total Orders"    value={stats.totalOrders}                          icon={ShoppingBag} accent="text-purple-400" />
              <StatCard label="Active Users"    value={stats.activeUsers}                          icon={Users}      accent="text-orange-400" />
              <StatCard label="Pending Reviews" value={stats.pendingReviews}                       icon={AlertCircle} accent="text-red-400" />
              <StatCard label="Avg. Rating"     value="—"                                          icon={Star}       accent="text-yellow-400" />
            </div>

            <div className="bg-white/4 border border-white/8 rounded-xl p-6 flex flex-col items-center justify-center gap-3 h-48">
              <BarChart2 className="w-8 h-8 text-zinc-700" />
              <p className="text-sm text-zinc-600">Charts coming soon</p>
            </div>
          </div>
        )}

        {/* ── Settings Tab ──────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-white">Settings</h2>

            {/* Store */}
            <section className="bg-white/4 border border-white/8 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Store</h3>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Store Description</label>
                <textarea
                  value={storeDesc}
                  onChange={e => setStoreDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/50 focus:outline-none transition-colors resize-none"
                />
              </div>
            </section>

            {/* Notifications */}
            <section className="bg-white/4 border border-white/8 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Notifications</h3>
              {[
                [notifyOrders, setNotifyOrders, 'Email me on new orders'],
                [notifyReviews, setNotifyReviews, 'Email me on new reviews'],
              ].map(([checked, setter, label], i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={checked as boolean} onChange={e => (setter as (v: boolean) => void)(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#c4ff0d] transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-zinc-300">{label as string}</span>
                </label>
              ))}
            </section>

            {/* Payment */}
            <section className="bg-white/4 border border-white/8 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Payment</h3>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Default Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/50 focus:outline-none transition-colors"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </section>

            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black rounded-lg font-semibold text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              {settingsSaved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          editingProduct={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
};

export default AdminPanel;