import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Store, Plus, Package, ShoppingBag, PlusCircle, Trash2, Edit3, Image, TrendingUp, DollarSign, AlertTriangle, Percent } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SellerDashboard() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'inventory' | 'add-product'>('inventory');

  // Add Product form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Variants setup state
  const [variantsList, setVariantsList] = useState<{ size: string; color: string; stock: number; sku: string }[]>([]);
  const [varSize, setVarSize] = useState('');
  const [varColor, setVarColor] = useState('');
  const [varStock, setVarStock] = useState('10');
  const [varSku, setVarSku] = useState('');

  // Fetch Categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/products/categories')
  });

  const categories = catData?.categories || [];

  // Fetch Vendor Stats
  const { data: statsData } = useQuery({
    queryKey: ['sellerStats'],
    queryFn: () => apiRequest('/orders/seller/stats')
  });

  const stats = statsData?.stats;

  // Fetch Vendor Products
  const { data: prodData } = useQuery({
    queryKey: ['vendorProducts'],
    queryFn: () => apiRequest('/products/seller')
  });

  const products = prodData?.products || [];

  const handleAddVariant = () => {
    if (!varSize && !varColor) {
      toast.warning('Provide size or color for variant specification');
      return;
    }
    const sku = varSku || `NX-VAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setVariantsList([...variantsList, {
      size: varSize || '',
      color: varColor || '',
      stock: parseInt(varStock || '0'),
      sku
    }]);

    // reset fields
    setVarSize('');
    setVarColor('');
    setVarSku('');
  };

  const handleRemoveVariant = (idx: number) => {
    setVariantsList(variantsList.filter((_, i) => i !== idx));
  };

  // Add Product Mutation
  const addProductMutation = useMutation({
    mutationFn: (body: any) => apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: () => {
      toast.success('New product catalog listed!');
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setDiscountPrice('');
      setCategoryId('');
      setImageUrl('');
      setVariantsList([]);
      setActiveTab('inventory');
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Creation failed');
    }
  });

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !price || !categoryId) {
      toast.warning('Please complete all mandatory product fields');
      return;
    }

    const defaultImg = imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';

    addProductMutation.mutate({
      name,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      categoryId,
      images: [defaultImg],
      variants: variantsList
    });
  };

  return (
    <div className="py-6 flex flex-col gap-10 max-w-6xl mx-auto animate-slide-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Store className="w-8 h-8 text-emerald-400" /> Seller Hub Dashboard
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your storefront, coordinate inventories, and tracking items sales.</p>
      </div>

      {/* Analytics Cards */}
      {stats && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-emerald-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gross Sales</span>
              <span className="text-2xl font-extrabold text-white">₹{stats.grossRevenue.toLocaleString('en-IN')}</span>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-400 bg-emerald-500/10 p-1.5 rounded-xl" />
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-rose-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Platform Fee (10%)</span>
              <span className="text-2xl font-extrabold text-rose-455">₹{stats.platformCommission.toLocaleString('en-IN')}</span>
            </div>
            <Percent className="w-8 h-8 text-rose-455 bg-rose-500/10 p-1.5 rounded-xl" />
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-indigo-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Net Store Earnings</span>
              <span className="text-2xl font-extrabold text-indigo-400">₹{stats.netEarnings.toLocaleString('en-IN')}</span>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-400 bg-indigo-500/10 p-1.5 rounded-xl" />
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-amber-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Low Stock Alerts</span>
              <span className="text-2xl font-extrabold text-amber-450">{stats.lowStockItems.length} items</span>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-450 bg-amber-500/10 p-1.5 rounded-xl" />
          </div>
        </section>
      )}

      {/* Analytics Chart & Alerts Row */}
      {stats && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-900 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Store Sales Performance (₹)</h3>
            <div className="h-64 w-full">
              {stats.chartData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-slate-550 text-xs">
                  No sales performance data logged yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'black' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-900 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Critical Inventory Alerts</h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 max-h-[250px] scrollbar-thin">
              {stats.lowStockItems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-550 text-xs py-10 border border-dashed border-slate-850 rounded-2xl">
                  All inventory items are sufficiently stocked.
                </div>
              ) : (
                stats.lowStockItems.map((item: any) => (
                  <div key={item.id} className="p-3 bg-slate-950/40 border border-slate-900/60 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-350 truncate max-w-[170px]">{item.name}</span>
                    <span className="bg-rose-550/15 text-rose-450 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                      {item.stock} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <section className="flex flex-col gap-6">
        <div className="flex border-b border-slate-900 pb-2 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-2 relative cursor-pointer ${activeTab === 'inventory' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-white'}`}
          >
            Store Inventory
          </button>
          <button
            onClick={() => setActiveTab('add-product')}
            className={`pb-2 relative cursor-pointer ${activeTab === 'add-product' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-white'}`}
          >
            Add New Product
          </button>
        </div>

        {/* Tab 1: Inventory list */}
        {activeTab === 'inventory' && (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-base text-white">Stock Control</h3>

            {products.length === 0 ? (
              <p className="text-slate-550 text-xs py-8 text-center">No products found in database store.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 font-bold">
                      <th className="py-3 px-4">Item Catalog</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Base Price</th>
                      <th className="py-3 px-4">Stock Levels</th>
                      <th className="py-3 px-4">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => {
                      const image = JSON.parse(p.images || '[]')[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
                      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0;

                      return (
                        <tr key={p.id} className="border-b border-slate-900/60 hover:bg-slate-950/20">
                          <td className="py-4 px-4 font-semibold text-slate-200 flex items-center gap-3">
                            <img src={image} className="w-9 h-9 object-cover rounded-lg bg-slate-950" />
                            <span>{p.name}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-400">{p.category?.name}</td>
                          <td className="py-4 px-4 font-bold text-slate-305">₹{p.price.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-4">
                            <span className={`font-semibold ${totalStock > 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                              {totalStock} in stock
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-450">{p.ratings.toFixed(1)} / 5.0</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create product form */}
        {activeTab === 'add-product' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Create Product Core info */}
            <form onSubmit={handleProductSubmit} className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col gap-5">
              <h3 className="font-bold text-base text-white border-b border-slate-850 pb-3">Product Catalog Details</h3>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Product Name</label>
                <input
                  type="text"
                  placeholder="Example: Wireless Noise-Cancelling Headphones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Product Description</label>
                <textarea
                  placeholder="Provide details about features, specs, dimensions, and warranty options..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-250 outline-none h-28 resize-none focus:border-indigo-500/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Department Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/85"
                  >
                    <option value="">Select Department</option>
                    {categories.map((c: any) => (
                      <optgroup key={c.id} label={c.name} className="bg-slate-950">
                        <option value={c.id}>{c.name} (Root)</option>
                        {c.subcategories?.map((sub: any) => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Direct Image Link (Unsplash/Url)</label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... (optional)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                    />
                    <Image className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Base Price (₹)</label>
                  <input
                    type="number"
                    placeholder="99.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Discount Sale Price (₹ - optional)</label>
                  <input
                    type="number"
                    placeholder="89.99"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addProductMutation.isPending}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
              >
                List Product in Catalog
              </button>

            </form>

            {/* Product Variants builder */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5 h-fit">
              <h3 className="font-bold text-base text-white border-b border-slate-850 pb-3">Item Variants Builders</h3>
              
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Size</label>
                    <input
                      type="text"
                      placeholder="M, L, 16-inch, 512GB"
                      value={varSize}
                      onChange={(e) => setVarSize(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-250 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Color</label>
                    <input
                      type="text"
                      placeholder="Black, Silver, Red"
                      value={varColor}
                      onChange={(e) => setVarColor(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-250 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Stock</label>
                    <input
                      type="number"
                      value={varStock}
                      onChange={(e) => setVarStock(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-250 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">SKU</label>
                    <input
                      type="text"
                      placeholder="Custom code"
                      value={varSku}
                      onChange={(e) => setVarSku(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-250 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="rounded-lg bg-indigo-600/25 border border-indigo-500/20 px-3 py-2 text-xs font-bold text-indigo-400 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Attribute Variant
                </button>
              </div>

              {/* Active variants preview list */}
              {variantsList.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-slate-900 pt-4">
                  <span className="text-[10px] font-bold text-slate-400">Added Variants:</span>
                  <div className="flex flex-col gap-1.5">
                    {variantsList.map((v, idx) => (
                      <div key={idx} className="p-2 border border-slate-850 bg-slate-950/20 rounded-lg flex items-center justify-between text-xs text-slate-350">
                        <div className="flex flex-col">
                          <span>
                            {v.size && `Size: ${v.size}`} {v.color && `Color: ${v.color}`}
                          </span>
                          <span className="text-[9px] text-slate-550">Stock: {v.stock} | SKU: {v.sku}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-slate-500 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </section>

    </div>
  );
}
