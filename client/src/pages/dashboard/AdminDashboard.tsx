import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ShieldAlert, Users, Percent, MessageSquare, TrendingUp, CheckCircle, Trash2, ArrowUpRight, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'sellers' | 'coupons' | 'reviews'>('sellers');

  // Coupon fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [minOrderValue, setMinOrderValue] = useState('0.0');

  // Fetch admin dashboard stats
  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => apiRequest('/admin/stats')
  });

  // Fetch sellers
  const { data: sellersData } = useQuery({
    queryKey: ['adminSellers'],
    queryFn: () => apiRequest('/admin/sellers')
  });

  // Fetch coupons
  const { data: couponsData } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: () => apiRequest('/admin/coupons')
  });

  // Fetch reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: () => apiRequest('/admin/reviews')
  });

  const stats = statsData?.stats;
  const sellers = sellersData?.sellers || [];
  const coupons = couponsData?.coupons || [];
  const reviews = reviewsData?.reviews || [];

  // Approve seller mutation
  const approveSellerMutation = useMutation({
    mutationFn: (sellerId: string) => apiRequest(`/admin/sellers/${sellerId}/approve`, {
      method: 'PATCH'
    }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['adminSellers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Approval failed');
    }
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: (body: any) => apiRequest('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: () => {
      toast.success('Discount coupon registered!');
      setCode('');
      setValue('');
      setExpiryDate('');
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Creation failed');
    }
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/coupons/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast.success('Coupon removed');
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    }
  });

  // Toggle review approval
  const toggleReviewMutation = useMutation({
    mutationFn: (reviewId: string) => apiRequest(`/admin/reviews/${reviewId}/toggle-approval`, {
      method: 'PATCH'
    }),
    onSuccess: () => {
      toast.success('Review status toggled');
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
    }
  });

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value || !expiryDate) {
      toast.warning('Please fill in required fields');
      return;
    }
    createCouponMutation.mutate({
      code,
      discountType,
      value,
      expiryDate,
      usageLimit,
      minOrderValue
    });
  };

  return (
    <div className="py-6 flex flex-col gap-10 max-w-6xl mx-auto animate-slide-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-indigo-400" /> Admin Control Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">Review marketplace metrics, approve vendors, configure coupons, and moderate content.</p>
      </div>

      {/* Metrics Row */}
      {stats && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-indigo-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Sales Revenue</span>
              <span className="text-2xl font-extrabold text-white">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-400 bg-indigo-500/10 p-1.5 rounded-xl" />
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-emerald-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Marketplace Orders</span>
              <span className="text-2xl font-extrabold text-white">{stats.totalOrders}</span>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-400 bg-emerald-500/10 p-1.5 rounded-xl" />
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-pink-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Approved Vendors</span>
              <span className="text-2xl font-extrabold text-white">{stats.totalSellers}</span>
            </div>
            <Users className="w-8 h-8 text-pink-400 bg-pink-500/10 p-1.5 rounded-xl" />
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-amber-500/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pending Approvals</span>
              <span className="text-2xl font-extrabold text-amber-450">{stats.pendingSellers}</span>
            </div>
            <ShieldAlert className="w-8 h-8 text-amber-400 bg-amber-500/10 p-1.5 rounded-xl" />
          </div>
        </section>
      )}

      {/* Analytics Charts */}
      {stats && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-900 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Monthly Revenue Flow (₹)</h3>
            <div className="h-64 w-full">
              {stats.chartData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-slate-550 text-xs">
                  No sales data logged yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#6366f1', fontSize: '12px', fontWeight: 'black' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#adminSalesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* User splits & Category shares */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-900 flex flex-col gap-5 justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Category Gross Share</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Top performing departments by revenue</p>
            </div>
            <div className="h-44 w-full mt-2">
              {stats.categoryData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-slate-550 text-xs">
                  No category shares recorded.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#a78bfa', fontSize: '11px' }}
                    />
                    <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[10px]">
              <span className="text-slate-450 font-bold">User Registrations split:</span>
              <div className="flex gap-2.5">
                {stats.userSplits.map((split: any, idx: number) => {
                  const colors = ['#6366f1', '#10b981', '#f59e0b'];
                  return (
                    <span key={split.name} className="flex items-center gap-1 font-semibold text-slate-350">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[idx % 3] }} />
                      {split.name}: {split.value}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tabs list */}
      <section className="flex flex-col gap-6">
        <div className="flex border-b border-slate-900 pb-2 gap-6 text-sm font-semibold">
          {[
            { id: 'sellers', label: 'Vendor Approvals', count: stats?.pendingSellers },
            { id: 'coupons', label: 'Promo Coupons', count: coupons.length },
            { id: 'reviews', label: 'Review Moderation', count: reviews.filter((r: any) => !r.isApproved).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 relative cursor-pointer ${activeTab === tab.id ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 rounded-full bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Sellers Table */}
        {activeTab === 'sellers' && (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-base text-white">Vendor Approval Requests</h3>
            
            {sellers.length === 0 ? (
              <p className="text-slate-550 text-xs py-8 text-center">No registered sellers profiles found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 font-bold">
                      <th className="py-3 px-4">Company Name</th>
                      <th className="py-3 px-4">Owner Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((sel: any) => (
                      <tr key={sel.id} className="border-b border-slate-900/60 hover:bg-slate-950/20">
                        <td className="py-4 px-4 font-semibold text-slate-200">{sel.companyName}</td>
                        <td className="py-4 px-4 text-slate-400">{sel.user?.name}</td>
                        <td className="py-4 px-4 text-slate-450">{sel.user?.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${sel.isApproved ? 'bg-emerald-950/20 text-emerald-450 border border-emerald-500/10' : 'bg-amber-950/20 text-amber-450 border border-amber-500/10'}`}>
                            {sel.isApproved ? 'APPROVED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => approveSellerMutation.mutate(sel.id)}
                            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer transition-colors ${
                              sel.isApproved 
                                ? 'bg-rose-950/30 text-rose-400 border border-rose-500/20 hover:bg-rose-900/30' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-500'
                            }`}
                          >
                            {sel.isApproved ? 'Suspend' : 'Approve'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Coupons Setup */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Create Coupon Form */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 h-fit">
              <h3 className="font-bold text-base text-white border-b border-slate-850 pb-3">Create Promo Coupon</h3>
              <form onSubmit={handleCouponSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="WINTER20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 uppercase outline-none focus:border-indigo-500/80"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="PERCENTAGE">% Discount</option>
                      <option value="FIXED">₹ Flat Off</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Value</label>
                    <input
                      type="number"
                      placeholder="20"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Min Order Threshold (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Usage Limit</label>
                    <input
                      type="number"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer shadow-lg hover:shadow-indigo-500/10 mt-2"
                >
                  Register Coupon
                </button>
              </form>
            </div>

            {/* Coupons List */}
            <div className="glass-panel rounded-2xl p-6 md:col-span-2 flex flex-col gap-4">
              <h3 className="font-bold text-base text-white">Active Promo Coupons</h3>
              {coupons.length === 0 ? (
                <p className="text-slate-550 text-xs py-8 text-center">No coupons configured yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {coupons.map((c: any) => (
                    <div key={c.id} className="p-4 border border-slate-900 bg-slate-950/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                          {c.code}
                        </span>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-bold text-slate-250">
                            {c.discountType === 'PERCENTAGE' ? `${c.value}% Off` : `₹${c.value} Flat Off`}
                          </span>
                          <span className="text-[10px] text-slate-550">
                            Min Order: ₹{c.minOrderValue} | Expiry: {new Date(c.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">Usages: {c.usedCount} / {c.usageLimit}</span>
                        <button
                          onClick={() => deleteCouponMutation.mutate(c.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 3: Reviews moderation */}
        {activeTab === 'reviews' && (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-base text-white">Product Reviews Moderation</h3>
            {reviews.length === 0 ? (
              <p className="text-slate-550 text-xs py-8 text-center">No customer reviews submitted.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="p-4 border border-slate-900 rounded-xl bg-slate-950/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="font-bold text-slate-300">{rev.user?.name}</span>
                        <span className="text-slate-500">on</span>
                        <span className="font-semibold text-indigo-400">{rev.product?.name}</span>
                      </div>
                      <div className="flex text-amber-450 gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 leading-normal">"{rev.comment}"</p>
                    </div>

                    <div className="flex items-center gap-4 border-l border-slate-900 pl-4 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rev.isApproved ? 'bg-emerald-950/20 text-emerald-450 border border-emerald-500/10' : 'bg-rose-950/20 text-rose-450 border border-rose-500/10'}`}>
                        {rev.isApproved ? 'VISIBLE' : 'HIDDEN'}
                      </span>
                      <button
                        onClick={() => toggleReviewMutation.mutate(rev.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer border ${rev.isApproved ? 'bg-rose-950/30 text-rose-400 border-rose-500/20 hover:bg-rose-950/50' : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20 hover:bg-emerald-950/50'}`}
                      >
                        {rev.isApproved ? 'Hide Review' : 'Approve Review'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </section>

    </div>
  );
}
