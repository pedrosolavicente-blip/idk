import { useState, useEffect } from 'react';
import {
  X, Package, DollarSign, Star, Edit, Trash2, Plus, Save,
  Settings, BarChart2, ShoppingBag, Users, AlertCircle,
} from 'lucide-react';
import SharedNavbar from './SharedNavbar';
import type { Product, AdminStats } from './types';

const BASE = (import.meta as any).env?.BASE_URL || '';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_PRODUCT: Partial<Product> = {
  name: '', price: 0, category: 'software', subcategory: '',
  description: '', features: [], images: [],
  rating: 0, reviewCount: 0, inStock: true,
  isNew: false, isOnSale: false, specifications: {}, shippingInfo: 'Free shipping',
};

const inputCls = 'w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-[#c4ff0d]/50 focus:ring-1 focus:ring-[#c4ff0d]/10 focus:outline-none transition-colors placeholder:text-zinc-700';

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-9 h-5 bg-white/10 rounded-full peer-checked:bg-[#c4ff0d] transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  return (
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
}

// ─── Product Form Modal ───────────────────────────────────────────────────────

interface ProductFormProps {
  editingProduct: Product | null;
  onSave: (product: Product) => void;
  onClose: () => void;
}

function ProductForm({ editingProduct, onSave, onClose }: ProductFormProps) {
  const [form, setForm] = useState<Partial<Product>>(
    editingProduct ? { ...editingProduct } : { ...EMPTY_PRODUCT }
  );

  const set = (key: keyof Product, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name:         form.name        || 'New Product',
      price:        form.price       || 0,
      category:     form.category    || 'software',
      subcategory:  form.subcategory || '',
      description:  form.description || '',
      features:     form.features    || [],
      images:       form.images?.length ? form.images : [`${BASE}marketplace.svg`],
      rating:       form.rating      || 0,
      reviewCount:  form.reviewCount || 0,
      inStock:      form.inStock !== false,
      isNew:        form.isNew       || false,
      isOnSale:     form.isOnSale    || false,
      badge:        form.badge       || undefined,
      originalPrice:form.originalPrice || undefined,
      specifications: form.specifications || {},
      shippingInfo: form.shippingInfo || 'Free shipping',
      returnPolicy: form.returnPolicy || undefined,
    };
    onSave(product);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <h2 className="font-bold text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Name *</label>
                <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Product name" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">$</span>
                  <input type="number" value={form.price || ''} onChange={e => set('price', parseFloat(e.target.value) || 0)} className={`${inputCls} pl-7`} placeholder="0.00" step="0.01" min="0" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Original Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">$</span>
                  <input type="number" value={form.originalPrice || ''} onChange={e => set('originalPrice', parseFloat(e.target.value) || undefined)} className={`${inputCls} pl-7`} placeholder="0.00" step="0.01" min="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
                <select value={form.category || 'software'} onChange={e => set('category', e.target.value)} className={inputCls}>
                  <option value="software">Software</option>
                  <option value="digital">Digital</option>
                  <option value="templates">Templates</option>
                  <option value="merchandise">Merchandise</option>
                  <option value="tools">Tools</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Subcategory</label>
                <input type="text" value={form.subcategory || ''} onChange={e => set('subcategory', e.target.value)} className={inputCls} placeholder="e.g. design-tools" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Badge</label>
                <input type="text" value={form.badge || ''} onChange={e => set('badge', e.target.value || undefined)} className={inputCls} placeholder="e.g. BESTSELLER" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Describe your product…" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Features <span className="normal-case font-normal text-zinc-700">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={form.features?.join(', ') || ''}
                onChange={e => set('features', e.target.value.split(',').map(f => f.trim()).filter(Boolean))}
                className={inputCls}
                placeholder="Feature one, feature two"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Shipping Info</label>
                <input type="text" value={form.shippingInfo || ''} onChange={e => set('shippingInfo', e.target.value)} className={inputCls} placeholder="e.g. Instant digital delivery" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Return Policy</label>
                <input type="text" value={form.returnPolicy || ''} onChange={e => set('returnPolicy', e.target.value || undefined)} className={inputCls} placeholder="e.g. 30-day money-back" />
              </div>
            </div>

            <div className="flex flex-wrap gap-5 pt-1">
              <Toggle checked={form.inStock !== false} onChange={v => set('inStock', v)} label="In Stock" />
              <Toggle checked={!!form.isNew}           onChange={v => set('isNew', v)}    label="New Product" />
              <Toggle checked={!!form.isOnSale}        onChange={v => set('isOnSale', v)} label="On Sale" />
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="product-form" className="px-5 py-2 text-sm bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black font-semibold rounded-lg transition-colors">
            {editingProduct ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AdminPanel ───────────────────────────────────────────────────────────────

const AdminPanel = () => {
  const [activeTab,       setActiveTab]       = useState<'products' | 'analytics' | 'settings'>('products');
  const [products,        setProducts]        = useState<Product[]>([]);
  const [editingProduct,  setEditing]         = useState<Product | null>(null);
  const [showForm,        setShowForm]        = useState(false);
  const [storeName,       setStoreName]       = useState('Livery Marketplace');
  const [storeDesc,       setStoreDesc]       = useState('Premium livery designs and assets');
  const [currency,        setCurrency]        = useState('USD');
  const [notifyOrders,    setNotifyOrders]    = useState(true);
  const [notifyReviews,   setNotifyReviews]   = useState(true);
  const [settingsSaved,   setSettingsSaved]   = useState(false);

  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0, totalRevenue: 0, totalOrders: 0, activeUsers: 0, pendingReviews: 0,
  });

  useEffect(() => {
    try {
      const sp = localStorage.getItem('admin_products');
      if (sp) setProducts(JSON.parse(sp));
      const ss = localStorage.getItem('admin_stats');
      if (ss) setStats(JSON.parse(ss));
    } catch { /* ignore */ }
  }, []);

  const persist = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('admin_products', JSON.stringify(updated));
    const newStats = { ...stats, totalProducts: updated.length };
    setStats(newStats);
    localStorage.setItem('admin_stats', JSON.stringify(newStats));
  };

  const handleSave = (product: Product) => {
    const updated = editingProduct
      ? products.map(p => p.id === product.id ? product : p)
      : [...products, product];
    persist(updated);
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    persist(products.filter(p => p.id !== id));
  };

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const tabs = [
    { id: 'products',  label: 'Products',  icon: Package   },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings',  label: 'Settings',  icon: Settings  },
  ] as const;

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">
      <SharedNavbar />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#c4ff0d] flex items-center justify-center">
              <Settings className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm font-bold tracking-tight">Admin Panel</span>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/6 hover:bg-white/12 text-zinc-400 hover:text-white transition-colors"
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
                activeTab === tab.id ? 'bg-[#c4ff0d] text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Products ── */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Products</h2>
                <p className="text-sm text-zinc-500 mt-0.5">{products.length} item{products.length !== 1 ? 's' : ''} in catalog</p>
              </div>
              <button
                onClick={() => { setEditing(null); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-2xl text-center">
                <ShoppingBag className="w-10 h-10 text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm mb-4">No products yet.</p>
                <button
                  onClick={() => { setEditing(null); setShowForm(true); }}
                  className="px-4 py-2 bg-white/6 hover:bg-white/10 text-zinc-300 rounded-lg text-sm transition-colors"
                >
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map(product => (
                  <div key={product.id} className="group bg-white/4 border border-white/8 rounded-xl overflow-hidden hover:border-white/14 transition-colors">
                    {/* Image */}
                    <div className="relative aspect-video bg-gradient-to-br from-[#c4ff0d]/6 to-transparent">
                      {product.images[0]
                        ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-4" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-zinc-700" /></div>
                      }

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {product.isNew    && <span className="px-1.5 py-0.5 bg-[#c4ff0d] text-black text-[10px] font-bold rounded-full">NEW</span>}
                        {product.isOnSale && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">SALE</span>}
                        {product.badge    && <span className="px-1.5 py-0.5 bg-black/70 text-[#c4ff0d] text-[10px] font-bold rounded-full">{product.badge}</span>}
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditing(product); setShowForm(true); }}
                          className="p-1.5 bg-black/70 hover:bg-black rounded-lg backdrop-blur-sm transition-colors"
                          title="Edit"
                        >
                          <Edit size={12} className="text-white" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 bg-red-600/70 hover:bg-red-600 rounded-lg backdrop-blur-sm transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-white line-clamp-1">{product.name}</h3>
                        <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${product.inStock ? 'bg-green-500/12 text-green-400' : 'bg-red-500/12 text-red-400'}`}>
                          {product.inStock ? 'In stock' : 'Out of stock'}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">{product.description}</p>
                      )}

                      {product.rating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-800'} />
                            ))}
                          </div>
                          <span className="text-[10px] text-zinc-600">{product.rating} ({product.reviewCount})</span>
                        </div>
                      )}

                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="font-bold text-white">${product.price.toFixed(2)}</span>
                        {product.originalPrice && <span className="text-xs text-zinc-700 line-through">${product.originalPrice.toFixed(2)}</span>}
                        <span className="ml-auto text-[10px] text-zinc-700 capitalize">{product.category}</span>
                      </div>

                      {product.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {product.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-white/5 text-zinc-500 text-[10px] rounded-full">{f}</span>
                          ))}
                          {product.features.length > 3 && <span className="text-[10px] text-zinc-700">+{product.features.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              <StatCard label="Total Products"  value={stats.totalProducts}                          icon={Package}     accent="text-blue-400"    />
              <StatCard label="Total Revenue"   value={`$${stats.totalRevenue.toLocaleString()}`}    icon={DollarSign}  accent="text-emerald-400" />
              <StatCard label="Total Orders"    value={stats.totalOrders}                            icon={ShoppingBag} accent="text-purple-400"  />
              <StatCard label="Active Users"    value={stats.activeUsers}                            icon={Users}       accent="text-orange-400"  />
              <StatCard label="Pending Reviews" value={stats.pendingReviews}                         icon={AlertCircle} accent="text-red-400"     />
              <StatCard label="Avg. Rating"     value="—"                                            icon={Star}        accent="text-yellow-400"  />
            </div>
            <div className="bg-white/4 border border-white/8 rounded-xl p-6 flex flex-col items-center justify-center gap-3 h-48">
              <BarChart2 className="w-8 h-8 text-zinc-700" />
              <p className="text-sm text-zinc-600">Charts — coming soon</p>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold">Settings</h2>

            <section className="bg-white/4 border border-white/8 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Store</h3>
              <div>
                <label className="block text-xs text-zinc-600 mb-1.5">Store Name</label>
                <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-600 mb-1.5">Store Description</label>
                <textarea value={storeDesc} onChange={e => setStoreDesc(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
              </div>
            </section>

            <section className="bg-white/4 border border-white/8 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notifications</h3>
              <Toggle checked={notifyOrders}  onChange={setNotifyOrders}  label="Email me on new orders"  />
              <Toggle checked={notifyReviews} onChange={setNotifyReviews} label="Email me on new reviews" />
            </section>

            <section className="bg-white/4 border border-white/8 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Payment</h3>
              <div>
                <label className="block text-xs text-zinc-600 mb-1.5">Default Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </section>

            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black font-semibold text-sm rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {settingsSaved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          editingProduct={editingProduct}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
};

export default AdminPanel;