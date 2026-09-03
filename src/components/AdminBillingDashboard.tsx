import React, { useState, useEffect } from 'react';
import { WebhookEvent, Coupon, Transaction } from '../types';
import {
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Users,
  RefreshCw,
  Send,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  Activity,
  Percent,
  Gift,
  Undo,
  Cpu,
  Zap,
  CheckCircle,
  AlertTriangle,
  Key,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from './SEOHead';
import { PAGE_SEO } from '../lib/seoConfig';

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

interface ProviderStatusData {
  status: string;
  providers: {
    gemini: { configured: boolean; name: string; models: string[]; role: string; latencyEstimate: string };
    openrouter: { configured: boolean; name: string; models: string[]; role: string; latencyEstimate: string };
    nvidia: { configured: boolean; name: string; models: string[]; role: string; latencyEstimate: string };
    groq: { configured: boolean; name: string; models: string[]; role: string; latencyEstimate: string };
  };
  agents: Array<{
    id: string;
    name: string;
    role: string;
    provider: string;
    model: string;
    configured: boolean;
  }>;
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
  const { profile, user, updateUserSubscription } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'tenants' | 'providers' | 'coupons' | 'webhooks' | 'plans'>('analytics');

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

  // Multi-LLM provider status state
  const [providerData, setProviderData] = useState<ProviderStatusData | null>(null);
  const [isPinging, setIsPinging] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { latency: number; provider: string; ok: boolean }>>({});

  // Tenant Tier Management & DB Integration
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [tenantTierSelected, setTenantTierSelected] = useState<string>(profile?.planId || 'free');
  const [tenantFeedback, setTenantFeedback] = useState<string>('');
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('starter');

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenantsList(data);
      }
    } catch (e) {
      console.warn('Could not fetch tenants list', e);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/agents/providers/status');
      if (res.ok) {
        const data = await res.json();
        setProviderData(data);
      }
    } catch (e) {
      console.warn('Could not load provider status', e);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchTenants();
  }, []);

  useEffect(() => {
    if (profile?.planId) {
      setTenantTierSelected(profile.planId);
    }
  }, [profile?.planId]);

  const handlePingProvider = async (providerKey: string, model: string) => {
    setIsPinging(providerKey);
    try {
      const start = Date.now();
      const res = await fetch('/api/agents/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerKey, model }),
      });
      const data = await res.json();
      const latency = Date.now() - start;
      setPingResults((prev) => ({
        ...prev,
        [providerKey]: {
          latency: data.result?.latencyMs || latency,
          provider: data.result?.provider || providerKey,
          ok: data.success,
        },
      }));
    } catch (e) {
      setPingResults((prev) => ({
        ...prev,
        [providerKey]: { latency: 0, provider: providerKey, ok: false },
      }));
    } finally {
      setIsPinging(null);
    }
  };

  const handleUpdateTenantTier = async (newPlanId: string, targetEmail?: string, targetId?: string) => {
    let name = 'Free Tier';
    let credits = 500;
    if (newPlanId === 'starter') { name = 'Starter Plan'; credits = 1000; }
    if (newPlanId === 'pro') { name = 'Pro Plan'; credits = 5000; }
    if (newPlanId === 'enterprise') { name = 'Enterprise Plan'; credits = 25000; }

    // 1. Update backend server database
    try {
      await fetch('/api/admin/tenants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId || profile?.uid || user?.uid,
          email: targetEmail || profile?.email || user?.email || 'developer@devforge.ai',
          planId: newPlanId,
          creditsRemaining: credits
        })
      });
      await fetchTenants();
    } catch (e) {
      console.warn('Backend tenant update error', e);
    }

    // 2. Update AuthContext and Firestore
    await updateUserSubscription(newPlanId, name, 'monthly', credits);
    setTenantTierSelected(newPlanId);
    setTenantFeedback(`Tenant tier instantly updated to ${name}!`);
    setTimeout(() => setTenantFeedback(''), 3000);
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantEmail) return;
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newTenantName || newTenantEmail.split('@')[0],
          email: newTenantEmail,
          planId: newTenantPlan
        })
      });
      if (res.ok) {
        setNewTenantEmail('');
        setNewTenantName('');
        setIsAddingTenant(false);
        setTenantFeedback('New tenant created and saved to database!');
        setTimeout(() => setTenantFeedback(''), 3000);
        await fetchTenants();
      }
    } catch (e) {
      console.warn('Error adding tenant', e);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTenantFeedback('Tenant deleted from database.');
        setTimeout(() => setTenantFeedback(''), 3000);
        await fetchTenants();
      }
    } catch (e) {
      console.warn('Error deleting tenant', e);
    }
  };

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

  // Dynamic revenue progression strictly from database analytics
  const chartData = (analytics as any)?.revenueHistory && (analytics as any).revenueHistory.length > 0
    ? (analytics as any).revenueHistory
    : [
        { month: 'Current', Revenue: analytics?.totalRevenue || 0 }
      ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 text-slate-100" id="admin-billing-view">
      <SEOHead {...PAGE_SEO.admin} />
      
      {/* HEADER ROW */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-4">
        <div className="flex flex-col">
          <span className="label mb-2 text-rose-500">Security & Billing Command</span>
          <h1 className="massive-type text-6xl text-white">
            Admin Console<span className="text-rose-500">.</span>
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">
            Global SaaS metrics, multi-agent AI providers, active tenants, webhook simulator, and pricing editor.
          </p>
        </div>

        {/* Admin Navigation tabs */}
        <div className="bg-[#111111] border border-[#222222] p-1 flex flex-wrap text-[10px] uppercase tracking-widest font-bold">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 transition duration-200 ${activeTab === 'analytics' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-analytics"
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-3.5 py-2 transition duration-200 ${activeTab === 'tenants' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-tenants"
          >
            Live Tenants
          </button>
          <button
            onClick={() => { setActiveTab('providers'); fetchProviders(); }}
            className={`px-3.5 py-2 transition duration-200 ${activeTab === 'providers' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-providers"
          >
            AI Providers
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-2 transition duration-200 ${activeTab === 'coupons' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-coupons"
          >
            Coupons
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-3.5 py-2 transition duration-200 ${activeTab === 'webhooks' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-webhooks"
          >
            Webhooks
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-2 transition duration-200 ${activeTab === 'plans' ? 'bg-white text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-admin-plans"
          >
            Plan Editor
          </button>
        </div>
      </header>

      {/* 1. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Revenue metrics cards row */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#111111] border border-[#222222] p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="label text-[9px] text-slate-500">Monthly Rec. Revenue</span>
                <div className="text-2xl font-black text-white mt-1.5 font-mono">
                  ${(analytics?.monthlyRecurringRevenue ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="label text-[9px] text-slate-500">Annual Run Rate</span>
                <div className="text-2xl font-black text-white mt-1.5 font-mono">
                  ${((analytics as any)?.annualRunRate ?? ((analytics?.monthlyRecurringRevenue ?? 0) * 12)).toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="label text-[9px] text-slate-500">Cumulative Earnings</span>
                <div className="text-2xl font-black text-white mt-1.5 font-mono">
                  ${(analytics?.totalRevenue ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="label text-[9px] text-slate-500">Tenant Active Subscriptions</span>
                <div className="text-2xl font-black text-white mt-1.5 font-mono">
                  {analytics?.activeSubscriptions ?? 0}
                </div>
              </div>
              <div className="p-2.5 bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Large Recharts revenue growth and webhook controller */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-8 bg-[#111111] border border-[#222222] p-6 shadow-xl h-96 flex flex-col justify-between">
              <div>
                <span className="label text-[9px] mb-1">Financial Progress</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Revenue Growth Over Time</h3>
                <span className="text-[9px] text-slate-500 font-mono">REPRESENTING MONTHLY RETAINED MRR PLUS EXTRA TOKENS CHECKOUTS</span>
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
                <p className="text-slate-400 text-xs mt-1 leading-relaxed uppercase tracking-wide text-[10px]">
                  Trigger simulated payloads to audit how the client applet handles credit updates or failed payment recovery.
                </p>
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

      {/* 2. LIVE TENANTS & SUBSCRIPTIONS TAB */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-[#222222] gap-4">
              <div>
                <span className="label text-violet-400">Live Tenant Management</span>
                <h2 className="text-xl font-bold uppercase tracking-wider text-white mt-1">
                  Active User Subscriptions & Dynamic Tier Override
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  View your current active session tier and dynamically change or grant compute tiers instantly.
                </p>
              </div>

              {tenantFeedback && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 font-mono animate-pulse">
                  {tenantFeedback}
                </div>
              )}
            </div>

            {/* Current Active Tenant Card */}
            <div className="grid md:grid-cols-3 gap-6 bg-[#050505] border border-[#222222] p-5">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Current User / Tenant</span>
                <div className="font-bold text-white text-base">
                  {profile?.displayName || user?.displayName || 'Active Architect'}
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {profile?.email || user?.email || 'developer@devforge.ai'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  UID: <span className="text-slate-400">{profile?.uid || user?.uid || 'guest_user'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Current Live Plan Tier</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-violet-400 uppercase font-mono">
                    {profile?.planName || 'Free Tier'}
                  </span>
                  <span className={`text-[8px] px-2 py-0.5 uppercase font-bold border ${
                    (profile?.planId || 'free') !== 'free'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {(profile?.planId || 'free') !== 'free' ? 'PREMIUM' : 'FREE'}
                  </span>
                </div>
                <div className="text-xs font-mono text-cyan-400 font-bold">
                  {(profile?.creditsRemaining ?? 500).toLocaleString()} / {(profile?.creditsTotal ?? 500).toLocaleString()} AI Credits
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Renewal: {profile?.nextRenewal || '2026-10-01'}
                </div>
              </div>

              <div className="space-y-2 border-t md:border-t-0 md:border-l border-[#222222] md:pl-6">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Admin Tier Override</span>
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex gap-2">
                    <select
                      value={tenantTierSelected}
                      onChange={(e) => setTenantTierSelected(e.target.value)}
                      className="bg-[#111111] border border-[#333333] text-xs text-white px-3 py-2 flex-1 outline-none uppercase font-bold"
                    >
                      <option value="free">Free Tier (500 Credits)</option>
                      <option value="starter">Starter Plan (1,000 Credits)</option>
                      <option value="pro">Pro Plan (5,000 Credits)</option>
                      <option value="enterprise">Enterprise Plan (25,000 Credits)</option>
                    </select>
                    <button
                      onClick={() => handleUpdateTenantTier(tenantTierSelected)}
                      className="bg-white hover:bg-violet-400 text-black text-[10px] uppercase font-bold px-3 py-2 transition duration-200"
                    >
                      Set Tier
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">
                    Directly synchronizes with AuthContext & Firestore.
                  </span>
                </div>
              </div>
            </div>

            {/* Tenant Directory Table */}
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Connected Tenant Database Directory ({tenantsList.length})
                </h3>
                <button
                  onClick={() => setIsAddingTenant(!isAddingTenant)}
                  className="bg-[#18181b] hover:bg-[#27272a] text-slate-200 border border-[#333] text-[10px] uppercase font-bold px-3 py-1.5 transition"
                >
                  {isAddingTenant ? 'Cancel' : '+ Add Tenant Record'}
                </button>
              </div>

              {/* Add Tenant Form */}
              {isAddingTenant && (
                <form onSubmit={handleAddTenant} className="bg-[#050505] border border-[#222222] p-4 grid md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase">Tenant Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Systems"
                      value={newTenantName}
                      onChange={e => setNewTenantName(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] text-xs text-white px-2.5 py-1.5 mt-1 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="admin@acme.com"
                      value={newTenantEmail}
                      onChange={e => setNewTenantEmail(e.target.value)}
                      required
                      className="w-full bg-[#111] border border-[#333] text-xs text-white px-2.5 py-1.5 mt-1 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase">Initial Plan</label>
                    <select
                      value={newTenantPlan}
                      onChange={e => setNewTenantPlan(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] text-xs text-white px-2.5 py-1.5 mt-1 outline-none uppercase font-bold"
                    >
                      <option value="starter">Starter Plan</option>
                      <option value="pro">Pro Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-white hover:bg-violet-400 text-black text-xs font-bold uppercase py-2 transition"
                    >
                      Create Tenant
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#222222] text-slate-500">
                      <th className="pb-3 uppercase">TENANT / EMAIL</th>
                      <th className="pb-3 uppercase">TIER</th>
                      <th className="pb-3 uppercase">CREDITS REMAINING</th>
                      <th className="pb-3 uppercase">STATUS</th>
                      <th className="pb-3 text-right uppercase">QUICK ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]/50 text-slate-300">
                    {/* Active session user row */}
                    <tr className="hover:bg-white/2 bg-violet-950/10">
                      <td className="py-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{profile?.displayName || user?.displayName || 'Active Session User'}</span>
                          <span className="text-[8px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1 py-0.2 uppercase">You</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{profile?.email || user?.email || 'developer@devforge.ai'}</div>
                      </td>
                      <td className="py-3 font-bold text-violet-400 uppercase">
                        {profile?.planName || 'Free Tier'}
                      </td>
                      <td className="py-3 text-cyan-400 font-bold">
                        {(profile?.creditsRemaining ?? 500).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          ACTIVE SESSION
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateTenantTier('starter')}
                          className="bg-[#050505] hover:bg-violet-600 hover:text-white border border-[#222222] text-slate-300 text-[9px] uppercase px-2 py-1 font-bold transition"
                        >
                          Starter
                        </button>
                        <button
                          onClick={() => handleUpdateTenantTier('pro')}
                          className="bg-[#050505] hover:bg-violet-500 hover:text-white border border-[#222222] text-violet-300 text-[9px] uppercase px-2 py-1 font-bold transition"
                        >
                          Pro
                        </button>
                        <button
                          onClick={() => handleUpdateTenantTier('enterprise')}
                          className="bg-[#050505] hover:bg-cyan-500 hover:text-black border border-[#222222] text-cyan-300 text-[9px] uppercase px-2 py-1 font-bold transition"
                        >
                          Enterprise
                        </button>
                      </td>
                    </tr>

                    {/* Database tenants */}
                    {tenantsList.map((t) => (
                      <tr key={t.id} className="hover:bg-white/2">
                        <td className="py-3">
                          <div className="font-bold text-white">{t.displayName || t.name || 'Tenant'}</div>
                          <div className="text-[10px] text-slate-500">{t.email}</div>
                        </td>
                        <td className="py-3 font-bold text-slate-300 uppercase">
                          {t.planName || t.planId || 'Starter Plan'}
                        </td>
                        <td className="py-3 text-slate-300 font-bold">
                          {(t.creditsRemaining ?? 1000).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-400 uppercase">
                            {t.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleUpdateTenantTier('pro', t.email, t.id)}
                            className="bg-[#050505] hover:bg-violet-500 hover:text-white border border-[#222222] text-violet-300 text-[9px] uppercase px-2 py-1 font-bold transition"
                          >
                            Pro
                          </button>
                          <button
                            onClick={() => handleUpdateTenantTier('enterprise', t.email, t.id)}
                            className="bg-[#050505] hover:bg-cyan-500 hover:text-black border border-[#222222] text-cyan-300 text-[9px] uppercase px-2 py-1 font-bold transition"
                          >
                            Enterprise
                          </button>
                          <button
                            onClick={() => handleDeleteTenant(t.id)}
                            className="bg-[#050505] hover:bg-rose-500 hover:text-white border border-[#222222] text-rose-400 text-[9px] uppercase px-1.5 py-1 font-bold transition"
                            title="Delete Tenant"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTI-LLM SWARM PROVIDERS & API KEYS INSPECTOR TAB */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="bg-[#111111] border border-[#222222] p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-[#222222] gap-4">
              <div>
                <span className="label text-cyan-400">Multi-Model Swarm Architecture</span>
                <h2 className="text-xl font-bold uppercase tracking-wider text-white mt-1">
                  AI Provider Endpoints & Swarm Key Inspector
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time audit of Google Gemini, OpenRouter, NVIDIA NIM, and Groq inference pipelines.
                </p>
              </div>
              <button
                onClick={fetchProviders}
                className="bg-[#050505] hover:bg-white/5 text-slate-300 border border-[#222222] text-[10px] uppercase tracking-wider px-3 py-2 font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Refresh Status</span>
              </button>
            </div>

            {/* Provider Grid Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Google Gemini */}
              <div className="bg-[#050505] border border-[#222222] p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Google Gemini</span>
                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      CORE ACTIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    CEO Executive Synthesis & Cross-Agent Self-Healing
                  </p>
                  <div className="text-[9px] font-mono text-cyan-400">
                    Models: gemini-2.5-flash, gemini-2.5-pro
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Key: GEMINI_API_KEY (Server-side)
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
                  <button
                    onClick={() => handlePingProvider('gemini', 'gemini-2.5-flash')}
                    disabled={isPinging === 'gemini'}
                    className="text-[9px] bg-[#111111] hover:bg-violet-500 hover:text-white px-2.5 py-1 text-slate-200 border border-[#333333] uppercase font-bold transition"
                  >
                    {isPinging === 'gemini' ? 'Pinging...' : 'Ping Test'}
                  </button>
                  {pingResults['gemini'] && (
                    <span className="text-[9px] font-mono text-emerald-400">
                      {pingResults['gemini'].latency}ms ✓
                    </span>
                  )}
                </div>
              </div>

              {/* OpenRouter */}
              <div className="bg-[#050505] border border-[#222222] p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">OpenRouter AI</span>
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase border ${
                      providerData?.providers?.openrouter?.configured
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {providerData?.providers?.openrouter?.configured ? 'API KEY ACTIVE' : 'GEMINI ROUTED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Claude 3.5 Sonnet (PM) & GPT-4o-mini (Architect)
                  </p>
                  <div className="text-[9px] font-mono text-violet-400">
                    Models: claude-3.5-sonnet, gpt-4o-mini
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Key: OPENROUTER_API_KEY
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
                  <button
                    onClick={() => handlePingProvider('openrouter', 'anthropic/claude-3.5-sonnet')}
                    disabled={isPinging === 'openrouter'}
                    className="text-[9px] bg-[#111111] hover:bg-violet-500 hover:text-white px-2.5 py-1 text-slate-200 border border-[#333333] uppercase font-bold transition"
                  >
                    {isPinging === 'openrouter' ? 'Pinging...' : 'Ping Test'}
                  </button>
                  {pingResults['openrouter'] && (
                    <span className="text-[9px] font-mono text-emerald-400">
                      {pingResults['openrouter'].latency}ms ✓
                    </span>
                  )}
                </div>
              </div>

              {/* NVIDIA NIM */}
              <div className="bg-[#050505] border border-[#222222] p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">NVIDIA NIM</span>
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase border ${
                      providerData?.providers?.nvidia?.configured
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {providerData?.providers?.nvidia?.configured ? 'API KEY ACTIVE' : 'GEMINI ROUTED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    LLaMA 3.1 70B Instruct (Senior Frontend UI)
                  </p>
                  <div className="text-[9px] font-mono text-emerald-400">
                    Models: meta/llama-3.1-70b-instruct
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Key: NVIDIA_API_KEY
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
                  <button
                    onClick={() => handlePingProvider('nvidia', 'meta/llama-3.1-70b-instruct')}
                    disabled={isPinging === 'nvidia'}
                    className="text-[9px] bg-[#111111] hover:bg-violet-500 hover:text-white px-2.5 py-1 text-slate-200 border border-[#333333] uppercase font-bold transition"
                  >
                    {isPinging === 'nvidia' ? 'Pinging...' : 'Ping Test'}
                  </button>
                  {pingResults['nvidia'] && (
                    <span className="text-[9px] font-mono text-emerald-400">
                      {pingResults['nvidia'].latency}ms ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Groq Inference */}
              <div className="bg-[#050505] border border-[#222222] p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Groq Free Inference</span>
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase border ${
                      providerData?.providers?.groq?.configured
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {providerData?.providers?.groq?.configured ? 'API KEY ACTIVE' : 'GEMINI ROUTED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    LLaMA 3.3 70B (QA) & Mixtral 8x7B (DevOps/SRE)
                  </p>
                  <div className="text-[9px] font-mono text-amber-400">
                    Models: llama-3.3-70b, mixtral-8x7b
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Key: GROQ_API_KEY
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
                  <button
                    onClick={() => handlePingProvider('groq', 'llama-3.3-70b-versatile')}
                    disabled={isPinging === 'groq'}
                    className="text-[9px] bg-[#111111] hover:bg-violet-500 hover:text-white px-2.5 py-1 text-slate-200 border border-[#333333] uppercase font-bold transition"
                  >
                    {isPinging === 'groq' ? 'Pinging...' : 'Ping Test'}
                  </button>
                  {pingResults['groq'] && (
                    <span className="text-[9px] font-mono text-emerald-400">
                      {pingResults['groq'].latency}ms ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Assigned Swarm Agents Table */}
            <div className="space-y-3 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Hierarchical Swarm Agent Assignments & Execution Status
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#222222] text-slate-500">
                      <th className="pb-3 uppercase">AGENT LEAD</th>
                      <th className="pb-3 uppercase">ROLE / MILESTONE</th>
                      <th className="pb-3 uppercase">ASSIGNED MODEL</th>
                      <th className="pb-3 uppercase">PROVIDER</th>
                      <th className="pb-3 text-right uppercase">ROUTING ENGINE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]/50 text-slate-300">
                    <tr className="hover:bg-white/2">
                      <td className="py-3 font-bold text-white">Aria CEO</td>
                      <td className="py-3 text-slate-400 font-sans">Executive Synthesis & Cross-Heal</td>
                      <td className="py-3 text-cyan-400">gemini-2.5-flash</td>
                      <td className="py-3">Google Gemini</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          DIRECT
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/2">
                      <td className="py-3 font-bold text-white">Parker Lead</td>
                      <td className="py-3 text-slate-400 font-sans">Milestone 1: Strategic PRD Matrix</td>
                      <td className="py-3 text-violet-400">claude-3.5-sonnet</td>
                      <td className="py-3">OpenRouter AI</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          AUTO-ROUTED
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/2">
                      <td className="py-3 font-bold text-white">Sophia Lead</td>
                      <td className="py-3 text-slate-400 font-sans">Milestone 2: Schema & Contracts</td>
                      <td className="py-3 text-violet-400">gpt-4o-mini</td>
                      <td className="py-3">OpenRouter AI</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          AUTO-ROUTED
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/2">
                      <td className="py-3 font-bold text-white">Frank Lead</td>
                      <td className="py-3 text-slate-400 font-sans">Milestone 3: React UI Components</td>
                      <td className="py-3 text-emerald-400">llama-3.1-70b-instruct</td>
                      <td className="py-3">NVIDIA NIM</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          AUTO-ROUTED
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/2">
                      <td className="py-3 font-bold text-white">Quinn Lead</td>
                      <td className="py-3 text-slate-400 font-sans">Milestone 4: QA & Security Audits</td>
                      <td className="py-3 text-amber-400">llama-3.3-70b-versatile</td>
                      <td className="py-3">Groq Free Inference</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          AUTO-ROUTED
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/2">
                      <td className="py-3 font-bold text-white">Devon Lead</td>
                      <td className="py-3 text-slate-400 font-sans">Milestone 5: Docker Container Ingress</td>
                      <td className="py-3 text-amber-400">mixtral-8x7b-32768</td>
                      <td className="py-3">Groq Free Inference</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          AUTO-ROUTED
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. COUPONS TAB */}
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

      {/* 5. WEBHOOKS TAB */}
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

      {/* 6. PLAN EDITOR TAB */}
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
