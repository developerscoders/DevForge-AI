import React, { useState } from 'react';
import { WebhookEvent, Coupon, Transaction } from '../types';
import { ShieldAlert, BarChart3, TrendingUp, Users, RefreshCw, Send, Trash2, ArrowRightLeft, DollarSign, Activity, Percent, Gift, Undo } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminBillingDashboardProps {
  analytics: any;
  transactions: Transaction[];
  coupons: Coupon[];
  webhooks: WebhookEvent[];
  onSimulateWebhook: (type: string) => Promise<void>;
  onRefund: (transactionId: string) => Promise<void>;
  onUpdatePlan: (id: string, priceMonthly: number, priceYearly: number, credits: number) => Promise<void>;
  onAddCoupon: (code: string, type: string, value: number, desc: string) => Promise<void>;
}

export default function AdminBillingDashboard({
  analytics,
  transactions,
  coupons,
  webhooks,
  onSimulateWebhook,
  onRefund,
  onUpdatePlan,
  onAddCoupon,
}: AdminBillingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'coupons' | 'webhooks' | 'plans'>('analytics');

  // Coupon form
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('percent');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Plan form
  const [editPlanId, setEditPlanId] = useState('pro');
  const [editPriceMonthly, setEditPriceMonthly] = useState('99');
  const [editPriceYearly, setEditPriceYearly] = useState('950');
  const [editCredits, setEditCredits] = useState('5000');

  const triggerSimulate = async (type: string) => {
    await onSimulateWebhook(type);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newValue) return;
    await onAddCoupon(newCode, newType, parseFloat(newValue), newDesc);
    setNewCode('');
    setNewValue('');
    setNewDesc('');
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdatePlan(editPlanId, parseFloat(editPriceMonthly), parseFloat(editPriceYearly), parseInt(editCredits));
  };

  // Recharts high fidelity revenue progression (Yearly)
  const chartData = [
    { month: 'Jan', Revenue: 8500 },
    { month: 'Feb', Revenue: 11400 },
    { month: 'Mar', Revenue: 14500 },
    { month: 'Apr', Revenue: 19800 },
    { month: 'May', Revenue: 24200 },
    { month: 'Jun', Revenue: 31500 },
    { month: 'Jul', Revenue: analytics.monthlyRecurringRevenue + 24200 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 text-slate-100" id="admin-billing-view">
      
      {/* HEADER ROW */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-4">
        <div className="flex flex-col">
          <span className="label mb-2 text-rose-500">Security & Billing Command</span>
          <h1 className="massive-type text-6xl text-white">
            Admin Console<span className="text-rose-500">.</span>
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">
            Global SaaS metrics, webhook simulations, failed payment monitors, and credit controllers.
          </p>
        </div>

        {/* Admin Navigation tabs */}
        <div className="bg-[#111111] border border-[#222222] p-1 flex text-[10px] uppercase tracking-widest font-bold">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 transition duration-200 ${activeTab === 'analytics' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-analytics"
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 transition duration-200 ${activeTab === 'coupons' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-coupons"
          >
            Coupons
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 transition duration-200 ${activeTab === 'webhooks' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-webhooks"
          >
            Webhooks
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 transition duration-200 ${activeTab === 'plans' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-plans"
          >
            Plan Editor
          </button>
        </div>
      </header>

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Revenue metrics cards row */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#111111] border border-[#222222] p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="label text-[9px] text-slate-500">Monthly Rec. Revenue</span>
                <div className="text-2xl font-black text-white mt-1.5 font-mono">${analytics.monthlyRecurringRevenue?.toLocaleString()}</div>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="label text-[9px] text-slate-500">Annual Run Rate</span>
                <div className="text-2xl font-black text-white mt-1.5 font-mono">${(analytics.monthlyRecurringRevenue * 12)?.toLocaleString()}</div>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="label text-[9px] text-slate-500">Cumulative Earnings</span>
                <div className="text-2xl font-black text-white mt-1.5 font-mono">${analytics.totalRevenue?.toLocaleString()}</div>
              </div>
              <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="label text-[9px] text-slate-500">Tenant Active Subscriptions</span>
                <div className="text-2xl font-black text-white mt-1.5 font-mono">{analytics.activeSubscriptions}</div>
              </div>
              <div className="p-2.5 bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Large Recharts revenue growth and refund details */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-8 bg-[#111111] border border-[#222222] p-6 shadow-xl h-96 flex flex-col justify-between">
              <div>
                <span className="label text-[9px] mb-1">Financial Progress</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Revenue Growth Over Time</h3>
                <span className="text-[9px] text-slate-500 font-mono">REPRESENTING MONTHLY RETAINED MRR PLUS EXTRA TOKENS CHEKOUTS</span>
              </div>

              <div className="h-60 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111111', borderColor: '#222222', color: '#ffffff' }}
                    />
                    <Area type="monotone" dataKey="Revenue" stroke="#8b5cf6" fill="url(#colorRevenue)" />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SRE Ingress and Webhook Events simulator controller */}
            <div className="lg:col-span-4 bg-[#111111] border border-[#222222] p-6 shadow-xl flex flex-col justify-between h-96">
              <div>
                <span className="label text-[9px] mb-1 text-cyan-400 font-bold">Simulator Core</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Webhook Controller</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed uppercase tracking-wide text-[10px]">Trigger simulated payloads to audit how the client applet handles credit updates or failed payment recovery.</p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => triggerSimulate('subscription.renewed')}
                  className="w-full bg-[#050505] hover:bg-violet-500 hover:text-white text-slate-200 font-bold text-xs p-3 border border-[#222222] transition duration-200 text-left flex items-center justify-between"
                  id="sim-renewed-btn"
                >
                  <span className="uppercase tracking-wider">1. subscription.renewed</span>
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                </button>
                <button
                  onClick={() => triggerSimulate('payment.failed')}
                  className="w-full bg-[#050505] hover:bg-rose-500 hover:text-white text-rose-300 font-bold text-xs p-3 border border-[#222222] transition duration-200 text-left flex items-center justify-between"
                  id="sim-failed-btn"
                >
                  <span className="uppercase tracking-wider">2. payment.failed</span>
                  <Send className="w-3.5 h-3.5 text-rose-400" />
                </button>
                <button
                  onClick={() => triggerSimulate('chargeback.dispute')}
                  className="w-full bg-[#050505] hover:bg-amber-500 hover:text-white text-amber-300 font-bold text-xs p-3 border border-[#222222] transition duration-200 text-left flex items-center justify-between"
                  id="sim-chargeback-btn"
                >
                  <span className="uppercase tracking-wider">3. chargeback.dispute</span>
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-3 border-t border-[#222222] uppercase tracking-wider">
                AUDITING AUTOMATED RESILIENCE
              </div>
            </div>
          </div>

          {/* DB TRANSACTIONS LOGGER & REFUND TRIGGER */}
          <div className="bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-4">
            <span className="label text-[9px] text-slate-400">Ledger Ingress</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mt-1">Global Financial DB Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222222] text-slate-500">
                    <th className="pb-3 font-medium uppercase tracking-wider">TRANSACTION ID</th>
                    <th className="pb-3 font-medium uppercase tracking-wider">INVOICE NO</th>
                    <th className="pb-3 font-medium uppercase tracking-wider">ITEM</th>
                    <th className="pb-3 font-medium uppercase tracking-wider">TOTAL (USD)</th>
                    <th className="pb-3 font-medium uppercase tracking-wider">STATUS</th>
                    <th className="pb-3 font-medium text-right uppercase tracking-wider">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]/50 text-slate-300">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/2 transition duration-150">
                      <td className="py-3.5 font-bold text-slate-400 uppercase">{t.id}</td>
                      <td className="py-3.5 uppercase">{t.invoiceNumber}</td>
                      <td className="py-3.5 text-slate-200 uppercase">{t.planName}</td>
                      <td className="py-3.5 font-bold font-mono">${t.amount?.toFixed(2)}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${t.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {t.status === 'success' ? (
                          <button
                            onClick={() => onRefund(t.id)}
                            className="bg-[#050505] hover:bg-rose-500 hover:text-white border border-[#222222] text-rose-400 text-[9px] uppercase tracking-widest px-2.5 py-1.5 font-bold transition duration-200 flex items-center space-x-1 ml-auto"
                            id={`refund-btn-${t.id}`}
                          >
                            <Undo className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">// Refunded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Coupon creation form */}
          <div className="lg:col-span-5 bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-4">
            <span className="label text-[9px] text-violet-400 font-bold">Campaign Portal</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Gift className="w-4 h-4 text-violet-400" />
              <span>Create Campaign Coupon</span>
            </h3>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="label text-[9px]">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="MONOLITH40"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222222] px-3 py-2 text-xs outline-none focus:border-violet-500 uppercase tracking-widest font-mono text-slate-100"
                  id="admin-coupon-code"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label text-[9px]">Discount Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full bg-[#050505] border border-[#222222] px-2.5 py-2 text-xs text-slate-300 outline-none uppercase tracking-wider font-bold"
                    id="admin-coupon-type"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Dollar ($)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label text-[9px]">Value</label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="w-full bg-[#050505] border border-[#222222] px-3 py-2 text-xs outline-none focus:border-violet-500 font-mono text-slate-100"
                    id="admin-coupon-value"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="label text-[9px]">Campaign Description</label>
                <input
                  type="text"
                  placeholder="Save 40% on Pro Monthly Subscriptions"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222222] px-3 py-2 text-xs outline-none focus:border-violet-500 uppercase tracking-wider font-sans text-slate-100"
                  id="admin-coupon-desc"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-violet-400 text-black py-2.5 font-bold uppercase tracking-widest text-[10px] transition duration-200"
                id="create-coupon-btn"
              >
                Create Coupon
              </button>
            </form>
          </div>

          {/* Active Campaign List */}
          <div className="lg:col-span-7 bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-4">
            <span className="label text-[9px] text-slate-500">Live Campaigns</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Active Campaign Coupons</h3>
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.code} className="flex items-center justify-between bg-[#050505] p-3.5 border border-[#222222] text-xs">
                  <div>
                    <span className="font-mono font-black text-violet-400 text-sm tracking-wider">{coupon.code}</span>
                    <span className="block text-slate-400 mt-1 uppercase text-[10px] tracking-wide">{coupon.description}</span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="bg-[#111111] border border-[#222222] px-2.5 py-1 text-[10px] font-bold text-slate-200 uppercase">
                      {coupon.discountValue}{coupon.discountType === 'percent' ? '%' : '$'} OFF
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#222222]">
            <div>
              <span className="label text-[9px] text-slate-500">SaaS Streaming Logs</span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mt-1">Live Webhook Payload Logs</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">AUDITING HEAL INGRESS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#222222] text-slate-500">
                  <th className="pb-3 font-medium uppercase tracking-wider">EVENT ID</th>
                  <th className="pb-3 font-medium uppercase tracking-wider">TIMESTAMP</th>
                  <th className="pb-3 font-medium uppercase tracking-wider">EVENT TYPE</th>
                  <th className="pb-3 font-medium uppercase tracking-wider">PAYLOAD</th>
                  <th className="pb-3 font-medium uppercase tracking-wider">STATUS</th>
                  <th className="pb-3 font-medium text-right uppercase tracking-wider">HTTP RESP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]/50 text-slate-300">
                {webhooks.map((log) => (
                  <tr key={log.id} className="hover:bg-white/2 transition duration-150">
                    <td className="py-3.5 font-bold text-slate-400 uppercase">{log.id}</td>
                    <td className="py-3.5">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3.5 font-sans font-bold text-slate-200 uppercase tracking-wider">{log.eventType}</td>
                    <td className="py-3.5 max-w-xs truncate text-slate-400" title={log.payload}>{log.payload}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold font-mono text-indigo-400">{log.responseCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-4 max-w-md mx-auto">
          <span className="label text-[9px] text-rose-500">Global Pricing Schema</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mt-1">Update Global Plan Parameters</h3>
          
          <form onSubmit={handleUpdatePlan} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="label text-[9px]">Select Plan to Edit</label>
              <select
                value={editPlanId}
                onChange={e => {
                  setEditPlanId(e.target.value);
                  // preset defaults based on plan selected
                  if (e.target.value === 'starter') {
                    setEditPriceMonthly('49'); setEditPriceYearly('470'); setEditCredits('1000');
                  } else if (e.target.value === 'pro') {
                    setEditPriceMonthly('99'); setEditPriceYearly('950'); setEditCredits('5000');
                  } else {
                    setEditPriceMonthly('299'); setEditPriceYearly('2870'); setEditCredits('25000');
                  }
                }}
                className="w-full bg-[#050505] border border-[#222222] px-2.5 py-2 text-xs text-slate-300 outline-none uppercase font-bold tracking-wider"
                id="edit-plan-selector"
              >
                <option value="starter">Starter Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise Plan</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="label text-[9px]">Price Monthly (USD)</label>
                <input
                  type="number"
                  required
                  value={editPriceMonthly}
                  onChange={e => setEditPriceMonthly(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 font-mono text-slate-100"
                  id="edit-monthly-price"
                />
              </div>
              <div className="space-y-1">
                <label className="label text-[9px]">Price Yearly (USD)</label>
                <input
                  type="number"
                  required
                  value={editPriceYearly}
                  onChange={e => setEditPriceYearly(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 font-mono text-slate-100"
                  id="edit-yearly-price"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="label text-[9px]">Monthly AI Credits</label>
              <input
                type="number"
                required
                value={editCredits}
                onChange={e => setEditCredits(e.target.value)}
                className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 font-mono text-slate-100"
                id="edit-credits"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white hover:bg-violet-400 text-black py-2.5 font-bold uppercase tracking-widest text-[10px] transition duration-200"
              id="submit-edit-plan-btn"
            >
              Update Plan pricing
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
