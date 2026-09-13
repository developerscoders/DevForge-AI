import React, { useState, useRef, useEffect } from 'react';
import { MarketplaceProduct } from '../types';
import {
  ShoppingBag,
  Star,
  Download,
  Plus,
  Filter,
  Layout,
  Code,
  Bot,
  Zap,
  DollarSign,
  Sparkles,
  CheckCircle,
  Upload,
  FileCode,
  Lock,
  Search,
  Check,
  ShieldCheck,
  PackageCheck,
  FileText,
  Copy,
  ExternalLink,
  LogIn,
  Smartphone,
  Clock,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import SEOHead from './SEOHead';
import { PAGE_SEO } from '../lib/seoConfig';

interface MarketplaceProps {
  products: MarketplaceProduct[];
  onPublishProduct: (
    title: string,
    description: string,
    price: number,
    type: any,
    author: string,
    artifactCode?: string
  ) => Promise<void>;
  onPurchaseProduct: (productId: string, paymentId?: string) => Promise<void>;
}

export default function Marketplace({
  products,
  onPublishProduct,
  onPurchaseProduct
}: MarketplaceProps) {
  const { user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('0');
  const [newType, setNewType] = useState<'agent' | 'template' | 'plugin' | 'workflow' | 'component'>('agent');
  const [newAuthor, setNewAuthor] = useState('');
  const [artifactCode, setArtifactCode] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Checkout Simulation for paid products
  const [purchasingProduct, setPurchasingProduct] = useState<MarketplaceProduct | null>(null);
  const [showRzpModal, setShowRzpModal] = useState(false);
  const [rzpCard, setRzpCard] = useState('4532 9901 2415 8892');
  const [rzpExpiry, setRzpExpiry] = useState('08/29');
  const [rzpCvv, setRzpCvv] = useState('401');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'otp' | 'success'>('details');
  const [lastDownloadedProduct, setLastDownloadedProduct] = useState<MarketplaceProduct | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // OTP 2FA State for Marketplace Purchases
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [otp, setOtp] = useState('');
  const [otpDestination, setOtpDestination] = useState('');
  const [otpTimerSeconds, setOtpTimerSeconds] = useState(60);
  const [otpError, setOtpError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (checkoutStep === 'otp' && otpTimerSeconds > 0) {
      interval = setInterval(() => {
        setOtpTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkoutStep, otpTimerSeconds]);

  const filters = [
    { id: 'all', label: 'All Items', icon: ShoppingBag },
    { id: 'agent', label: 'AI Agents', icon: Bot },
    { id: 'template', label: 'Templates', icon: Layout },
    { id: 'plugin', label: 'Plugins', icon: Code },
    { id: 'workflow', label: 'Workflows', icon: Zap },
  ];

  // Helper to trigger direct browser file download
  const triggerBrowserDownload = (product: MarketplaceProduct) => {
    const rawContent = product.artifactCode || JSON.stringify({
      id: product.id,
      title: product.title,
      description: product.description,
      type: product.type,
      author: product.author,
      downloadedAt: new Date().toISOString(),
      source: 'DevForge AI Autonomous Marketplace',
      license: 'Commercial Developer License',
      moduleCode: `// DevForge Component: ${product.title}\n// Type: ${product.type}\nexport const ComponentMeta = {\n  id: '${product.id}',\n  name: '${product.title}'\n};\n`
    }, null, 2);

    const blob = new Blob([rawContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${product.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_bundle.json`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setArtifactCode(content);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  const currentProducts = products || [];

  const filteredProducts = currentProducts.filter((p) => {
    const matchesFilter = selectedFilter === 'all' || p.type === selectedFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const myAuthorName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || '';
  const myCreatorProducts = user
    ? currentProducts.filter(
        (p) =>
          (p.author && myAuthorName && p.author.toLowerCase() === myAuthorName.toLowerCase()) ||
          (p as any).authorId === user.uid
      )
    : [];
  const totalDownloads = myCreatorProducts.reduce((sum, p) => sum + (p.downloads || 0), 0);
  const totalEarnings = myCreatorProducts.reduce((sum, p) => sum + (p.earnings || 0), 0);

  const openPublishModal = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setNewAuthor(profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Architect');
    setShowPublishModal(true);
  };

  const triggerPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onPublishProduct(
        newTitle,
        newDesc || 'Autonomous component artifact created on DevForge AI',
        parseFloat(newPrice) || 0,
        newType,
        newAuthor || profile?.displayName || user.email?.split('@')[0] || 'Architect',
        artifactCode || undefined
      );
      setNewTitle('');
      setNewDesc('');
      setNewPrice('0');
      setArtifactCode('');
      setUploadedFileName(null);
      setShowPublishModal(false);
    } catch (err) {
      console.error('Error publishing product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurchaseClick = (product: MarketplaceProduct) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (product.price === 0) {
      // Free download & install
      onPurchaseProduct(product.id);
      triggerBrowserDownload(product);
      setLastDownloadedProduct(product);
      setPurchasingProduct(product);
      setCheckoutStep('success');
      setShowRzpModal(true);
    } else {
      // Paid product - trigger checkout modal
      setPurchasingProduct(product);
      setCheckoutStep('details');
      setOtp('');
      setOtpError('');
      setShowRzpModal(true);
    }
  };

  const submitPaidCardCheckout = async () => {
    if (!rzpCard || !rzpExpiry || !rzpCvv) {
      alert('Please fill out all card fields.');
      return;
    }

    if (!purchasingProduct) return;

    setIsSendingOtp(true);
    setOtpError('');
    setOtp('');

    try {
      const generatedOrderId = `ord_mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setCurrentOrderId(generatedOrderId);

      const res = await fetch('/api/payment/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: generatedOrderId,
          extraCredits: undefined,
          email: user?.email || 'developer@devforge.ai',
          phone: '+1 555 019 8921'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch security authorization code');
      }

      setOtpDestination(data.maskedDestination || 'registered phone/email');
      setDemoOtpCode(data.demoCode || '');
      setOtpTimerSeconds(60);
      setAttemptsRemaining(3);
      setCheckoutStep('otp');
    } catch (err: any) {
      alert(err.message || 'Could not send verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSendingOtp(true);
    setOtpError('');
    setOtp('');
    try {
      const res = await fetch('/api/payment/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrderId,
          email: user?.email || 'developer@devforge.ai',
          phone: '+1 555 019 8921'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }
      setDemoOtpCode(data.demoCode || '');
      setOtpTimerSeconds(60);
      setAttemptsRemaining(3);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyPaidPurchase = async () => {
    if (!purchasingProduct || !user) return;

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      // 1. Verify OTP with Server
      const otpRes = await fetch('/api/payment/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrderId,
          otp: cleanOtp
        })
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok || !otpData.verified) {
        if (otpData.attemptsLeft !== undefined) {
          setAttemptsRemaining(otpData.attemptsLeft);
        }
        setOtpError(otpData.error || 'Invalid OTP code.');
        setIsVerifyingOtp(false);
        return;
      }

      // 2. Verified - capture and deliver artifact
      const paymentId = `pay_mkt_${Math.random().toString(36).substring(2, 10)}`;
      await onPurchaseProduct(purchasingProduct.id, paymentId);
      triggerBrowserDownload(purchasingProduct);
      setLastDownloadedProduct(purchasingProduct);
      setCheckoutStep('success');
    } catch (err: any) {
      setOtpError(err.message || 'Payment authorization failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 text-slate-100" id="marketplace-view">
      <SEOHead pageSlug="/marketplace" pageId="marketplace" {...PAGE_SEO.marketplace} />
      
      {/* GUEST BANNER WHEN NOT LOGGED IN */}
      {!user && (
        <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/40 to-slate-900 border border-violet-500/30 p-5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Marketplace Database Access</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Sign in to publish your custom agents or acquire and download community artifacts stored in Firestore.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded transition duration-200 shrink-0 shadow-lg"
            id="marketplace-signin-btn"
          >
            Sign In to Publish / Buy
          </button>
        </div>
      )}

      {/* HEADER TITLE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-4">
        <div className="flex flex-col">
          <span className="label mb-2">SRE Ecosystem Catalog</span>
          <h1 className="massive-type text-6xl text-white">
            Marketplace<span className="text-violet-500">.</span>
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">
            Exchange custom agent swarms, autoscale layouts, and auto-healing hooks stored in Firestore.
          </p>
        </div>

        <button
          onClick={openPublishModal}
          className="bg-white hover:bg-violet-400 text-black px-6 py-3 font-bold uppercase tracking-widest text-xs flex items-center space-x-2 transition duration-200"
          id="publish-artifact-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Publish to Database</span>
        </button>
      </header>

      {/* CREATOR PORTAL METRICS (Only for authenticated user) */}
      {user && (
        <div className="bg-[#111111] border border-[#222222] p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-4">
            <div>
              <span className="label text-violet-400">Creator Earnings & Cloud Pipeline</span>
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">
                {profile?.displayName || user.displayName || 'Developer'} Portal
              </h3>
            </div>
            <div className="text-right font-mono text-xs text-slate-400">
              <span>{myCreatorProducts.length} PUBLISHED ARTIFACTS IN DB</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-[#050505] p-4 border border-[#222222]">
              <span className="text-slate-500 uppercase text-[9px] block">TOTAL DOWNLOADS</span>
              <span className="text-2xl font-bold text-white mt-1 block">{totalDownloads.toLocaleString()}</span>
            </div>
            <div className="bg-[#050505] p-4 border border-[#222222]">
              <span className="text-slate-500 uppercase text-[9px] block">REVENUE EARNED (USD)</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">${totalEarnings.toLocaleString()}</span>
            </div>
            <div className="bg-[#050505] p-4 border border-[#222222]">
              <span className="text-slate-500 uppercase text-[9px] block">CREATOR SHARE (85%)</span>
              <span className="text-2xl font-bold text-violet-400 mt-1 block">${(totalEarnings * 0.85).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#111111] border border-[#222222] p-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search agents, templates, plugins by keyword or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050505] border border-[#222222] pl-10 pr-4 py-2 text-xs outline-none focus:border-violet-500 font-mono text-slate-300"
            id="marketplace-search-input"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {filters.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 transition duration-200 border ${
                  isSelected
                    ? 'bg-violet-600 text-white border-violet-500'
                    : 'bg-[#050505] text-slate-400 hover:text-slate-200 border-[#222222]'
                }`}
                id={`filter-${f.id}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] p-12 text-center text-slate-500 font-mono space-y-3">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm">No marketplace items match the selected filter or query.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-[#111111] border border-[#222222] p-6 flex flex-col justify-between h-[380px] hover:border-violet-500/50 transition duration-300 shadow-2xl relative group"
              id={`mkt-product-${p.id}`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest font-bold bg-[#050505] border border-[#222222] text-violet-400">
                    {p.type}
                  </span>
                  <div className="flex items-center space-x-1 text-amber-400 font-mono text-[10px]">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{p.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mt-4 line-clamp-2 leading-snug">{p.title}</h3>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed font-sans">{p.description}</p>
              </div>

              <div>
                <div className="border-t border-[#222222] pt-4 mb-4 flex justify-between items-center text-xs font-mono text-slate-500">
                  <span>By {p.author}</span>
                  <span className="text-slate-400">{(p.downloads || 0).toLocaleString()} dl</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono">
                    <span className="text-xs text-slate-500 font-sans uppercase">Price: </span>
                    <span className="text-lg font-black text-white">{p.price === 0 ? 'FREE' : `$${p.price}`}</span>
                  </div>

                  <button
                    onClick={() => handlePurchaseClick(p)}
                    className="bg-white hover:bg-violet-400 text-black px-4 py-2 font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1.5 transition duration-200 shadow-md"
                    id={`buy-product-${p.id}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{p.price === 0 ? 'Download' : 'Purchase'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PUBLISH PRODUCT MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="publish-modal">
          <div className="bg-[#111111] border border-[#222222] w-full max-w-lg p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Publish SRE Component to Firestore</span>
              </h4>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-slate-500 hover:text-slate-300 font-bold"
                id="close-publish-modal-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={triggerPublish} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. SRE Auto-Healing Guardrail Agent"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 text-slate-200"
                  id="pub-title-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 text-slate-200 uppercase"
                    id="pub-type-select"
                  >
                    <option value="agent">AI Agent</option>
                    <option value="template">Template</option>
                    <option value="plugin">Plugin</option>
                    <option value="workflow">Workflow</option>
                    <option value="component">Component</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Price (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 font-mono text-slate-200"
                    id="pub-price-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your agent architecture, model dependencies, and health probes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 text-slate-200 resize-none font-sans"
                  id="pub-desc-input"
                />
              </div>

              {/* File upload / Code input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Artifact Source Code / Bundle</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".json,.js,.ts,.tsx,.md"
                    id="pub-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-violet-400 text-[9px] font-mono hover:underline flex items-center gap-1"
                    id="upload-file-trigger-btn"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadedFileName || 'Upload JSON / TS File'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Paste JSON config or code bundle..."
                  value={artifactCode}
                  onChange={(e) => setArtifactCode(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222222] p-2 outline-none focus:border-violet-500 font-mono text-[10px] text-slate-300 resize-none"
                  id="pub-code-input"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white hover:bg-violet-400 text-black py-2.5 font-bold uppercase tracking-widest text-[10px] transition duration-200 flex items-center justify-center gap-2"
                id="submit-publish-btn"
              >
                {isSubmitting ? 'Writing to Firestore...' : 'Publish to Firestore Database'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT / DOWNLOAD CONFIRMATION MODAL */}
      {showRzpModal && purchasingProduct && (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="mkt-checkout-modal">
          <div className="bg-[#111111] border border-[#222222] w-full max-w-md p-6 shadow-2xl flex flex-col justify-between space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-violet-600 p-2 text-white">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                    {checkoutStep === 'success' ? 'Artifact Ready' : 'Acquire Marketplace Artifact'}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-500">DEVFORGE ECOSYSTEM CATALOG</p>
                </div>
              </div>
              <button
                onClick={() => setShowRzpModal(false)}
                className="text-slate-500 hover:text-slate-300 font-bold"
                id="close-rzp-modal-btn"
              >
                ✕
              </button>
            </div>

            {checkoutStep === 'details' && (
              <div className="space-y-4 text-xs">
                <div className="bg-[#050505] p-4 border border-[#222222] space-y-2">
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-400 label text-[9px]">Item:</span>
                    <span className="text-white font-bold uppercase tracking-wider">{purchasingProduct.title}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-slate-500">Author:</span>
                    <span className="text-slate-300">{purchasingProduct.author}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-slate-500">Item Price:</span>
                    <span className="text-white font-bold font-mono">${purchasingProduct.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] border-t border-[#222222] pt-2">
                    <span className="text-slate-500">Tax (GST 18%):</span>
                    <span className="text-slate-400">${(purchasingProduct.price * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-sans text-sm font-black border-t border-[#222222] pt-2 text-white">
                    <span className="uppercase tracking-wider text-[11px]">Total:</span>
                    <span className="text-violet-400 font-mono">${(purchasingProduct.price * 1.18).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Card Number</label>
                    <input
                      type="text"
                      value={rzpCard}
                      onChange={(e) => setRzpCard(e.target.value)}
                      className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 font-mono text-slate-300"
                      id="mkt-card-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Expiry</label>
                      <input
                        type="text"
                        value={rzpExpiry}
                        onChange={(e) => setRzpExpiry(e.target.value)}
                        className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 font-mono text-slate-300"
                        id="mkt-expiry-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">CVV</label>
                      <input
                        type="password"
                        value={rzpCvv}
                        onChange={(e) => setRzpCvv(e.target.value)}
                        className="w-full bg-[#050505] border border-[#222222] px-3 py-2 outline-none focus:border-violet-500 font-mono text-slate-300"
                        id="mkt-cvv-input"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={submitPaidCardCheckout}
                  disabled={isSendingOtp}
                  className="w-full bg-white hover:bg-violet-400 disabled:bg-slate-800 disabled:text-slate-500 text-black py-2.5 font-bold uppercase tracking-widest text-[10px] transition duration-200 flex items-center justify-center gap-2"
                  id="mkt-pay-btn"
                >
                  {isSendingOtp && (
                    <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isSendingOtp ? 'Dispatching 2FA Code...' : `Pay $${(purchasingProduct.price * 1.18).toFixed(2)} Securely`}</span>
                </button>
              </div>
            )}

            {checkoutStep === 'otp' && (
              <div className="space-y-4 text-xs">
                {/* 3D-Secure Header */}
                <div className="border-b border-[#222222] pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-violet-400 w-5 h-5" />
                    <div>
                      <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">3D-Secure Authentication</span>
                      <span className="text-[9px] text-slate-500 font-mono">256-Bit Bank Level Protocol</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-violet-950/60 text-violet-300 px-2 py-0.5 border border-violet-800/40 rounded">
                    ${(purchasingProduct.price * 1.18).toFixed(2)} USD
                  </span>
                </div>

                {/* Simulated SMS Alert */}
                {demoOtpCode && (
                  <div className="bg-gradient-to-r from-violet-950/40 via-[#111118] to-violet-950/30 border border-violet-500/30 p-3 rounded text-left space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-violet-300 font-bold text-[10px]">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SMS Dispatch Simulator</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">Just now</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                      [Bank Security Alert]: Your DevForge verification code is <strong className="text-amber-400 text-sm tracking-widest bg-black/60 px-1.5 py-0.5 rounded border border-amber-500/30">{demoOtpCode}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOtp(demoOtpCode);
                        setOtpError('');
                      }}
                      className="w-full text-left bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 px-2.5 py-1.5 rounded text-[10px] font-bold flex items-center justify-between transition"
                      id="mkt-autofill-otp-btn"
                    >
                      <span>⚡ Auto-fill One-Time Code</span>
                      <span className="font-mono text-white underline">Apply {demoOtpCode}</span>
                    </button>
                  </div>
                )}

                {/* Description & Target */}
                <div className="text-center space-y-1">
                  <p className="text-slate-300 font-medium">
                    Enter the 6-digit authorization code sent to
                  </p>
                  <p className="text-violet-400 font-mono text-xs font-semibold">
                    {otpDestination || 'your registered phone/email'}
                  </p>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                      if (otpError) setOtpError('');
                    }}
                    className="bg-[#050505] border-2 border-[#333333] focus:border-violet-500 px-4 py-3 text-center text-xl tracking-[0.5em] font-mono text-white w-56 mx-auto block outline-none transition rounded shadow-inner"
                    id="mkt-otp-input"
                    autoFocus
                  />
                  <span className="text-[9px] text-slate-500 font-mono block text-center">
                    {otp.length}/6 digits entered
                  </span>
                </div>

                {/* Error Alert */}
                {otpError && (
                  <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 p-2.5 rounded text-[10px] flex items-center gap-2 text-left">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Countdown Timer & Resend */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-[#222222] pt-3">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {otpTimerSeconds > 0 ? (
                        <>Expires in <strong className="text-slate-200">00:{otpTimerSeconds < 10 ? `0${otpTimerSeconds}` : otpTimerSeconds}</strong></>
                      ) : (
                        <span className="text-rose-400">Code expired</span>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSendingOtp || otpTimerSeconds > 0}
                    className="text-violet-400 hover:text-violet-300 disabled:text-slate-600 disabled:cursor-not-allowed font-bold underline flex items-center gap-1 transition"
                    id="mkt-resend-otp-btn"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                    <span>Resend Code</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={verifyPaidPurchase}
                    disabled={isVerifyingOtp || otp.length !== 6}
                    className="w-full bg-white hover:bg-violet-400 disabled:bg-slate-800 disabled:text-slate-500 text-black py-3 font-bold uppercase tracking-widest text-[10px] transition duration-200 flex items-center justify-center gap-2 rounded-none"
                    id="mkt-otp-verify-btn"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Authorizing Payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Verify & Download Artifact</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep('details');
                      setOtpError('');
                      setOtp('');
                    }}
                    className="w-full text-center text-slate-500 hover:text-slate-300 text-[10px] py-1 transition"
                  >
                    ← Change Card Credentials
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="space-y-4 text-xs text-center">
                <CheckCircle className="text-emerald-400 w-12 h-12 mx-auto" />
                <div>
                  <h5 className="font-bold text-slate-200 uppercase tracking-wider">Purchase & Download Successful</h5>
                  <p className="text-slate-400 mt-1">
                    Your downloaded bundle is ready and recorded in the database.
                  </p>
                </div>

                <div className="p-3 bg-[#050505] border border-[#222222] text-left space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>File: {purchasingProduct.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_bundle.json</span>
                    <button
                      onClick={() => triggerBrowserDownload(purchasingProduct)}
                      className="text-violet-400 hover:underline flex items-center gap-1"
                      id="re-download-btn"
                    >
                      <Download className="w-3 h-3" />
                      <span>Re-download</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowRzpModal(false)}
                  className="w-full bg-transparent hover:bg-white/5 text-slate-300 py-2.5 font-bold uppercase tracking-widest text-[10px] transition duration-200 border border-[#222222]"
                  id="mkt-close-success-btn"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
