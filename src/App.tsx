import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import {
  Project,
  FileNode,
  Agent,
  Transaction,
  Coupon,
  MarketplaceProduct,
  WebhookEvent,
  TeamMember,
  SubscriptionPlan
} from './types';
import Navbar from './components/Navbar';
import ProjectIntake from './components/ProjectIntake';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectView from './pages/ProjectView';
import BillingDashboard from './components/BillingDashboard';
import Marketplace from './components/Marketplace';
import AdminBillingDashboard from './components/AdminBillingDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  fetchFirestoreProjects,
  saveFirestoreProject,
  deleteFirestoreProject,
  updateFirestoreProjectFiles,
  saveFirestoreTransaction,
  fetchFirestoreTransactions,
  fetchFirestoreMarketplaceProducts,
  saveFirestoreMarketplaceProduct,
  updateFirestoreProductStats,
  recordFirestoreMarketplacePurchase,
  fetchFirestorePlans,
  saveFirestorePlan,
  fetchFirestoreCoupons,
  saveFirestoreCoupon,
  fetchFirestoreTeamMembers,
  saveFirestoreTeamMember,
  updateFirestoreUserSubscription,
  DEFAULT_PLANS
} from './lib/firestoreService';

function AppContent() {
  const navigate = useNavigate();
  const { user, profile, updateUserCredits, updateUserSubscription, refreshProfile } = useAuth();

  // Root database states
  const [projects, setProjects] = useState<Project[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState({
    monthlyRecurringRevenue: 0,
    totalRevenue: 0,
    activeSubscriptions: 1,
  });

  // Dynamic user subscription derived from profile or fallback
  const activeSub = {
    planId: profile?.planId || 'free',
    planName: profile?.planName || 'Free Tier',
    nextRenewal: profile?.nextRenewal || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    creditsRemaining: profile ? profile.creditsRemaining : 0,
    creditsTotal: profile ? profile.creditsTotal : 0,
  };

  // Fetch initial system state from Firestore database
  useEffect(() => {
    async function initFetch() {
      try {
        // 1. Subscription Plans catalog from Firestore
        const fsPlans = await fetchFirestorePlans();
        if (fsPlans && fsPlans.length > 0) {
          setPlans(fsPlans);
        }

        // 2. Load Projects from Firestore
        const firestoreProjs = await fetchFirestoreProjects(user?.uid);
        setProjects(firestoreProjs);

        // 3. Transactions (Firestore for current user)
        if (user) {
          const fsTxs = await fetchFirestoreTransactions(user.uid);
          setTransactions(fsTxs);
        } else {
          setTransactions([]);
        }

        // 4. Coupons from Firestore
        const fsCoupons = await fetchFirestoreCoupons();
        if (fsCoupons && fsCoupons.length > 0) {
          setCoupons(fsCoupons);
        }

        // 5. Marketplace Products from Firestore
        const fsProducts = await fetchFirestoreMarketplaceProducts();
        if (fsProducts && fsProducts.length > 0) {
          setMarketplaceProducts(fsProducts);
        }

        // 6. Team Members from Firestore
        if (user) {
          const fsTeam = await fetchFirestoreTeamMembers(user.uid);
          setTeamMembers(fsTeam);
        } else {
          setTeamMembers([]);
        }

        // 7. Webhook logs
        try {
          const webRes = await fetch('/api/billing/webhooks/logs');
          const webData = await webRes.json();
          if (Array.isArray(webData)) setWebhookLogs(webData);
        } catch (e) {}

        // 8. Admin Analytics
        try {
          const analyticsRes = await fetch('/api/billing/analytics');
          const analyticsData = await analyticsRes.json();
          setAdminAnalytics(analyticsData);
        } catch (e) {}

      } catch (err) {
        console.error('Failed fetching data from Firestore database.', err);
      }
    }
    initFetch();
  }, [user]);

  // 1. Submit New Project Trigger
  const handleForgeProject = async (promptText: string, modelConfig: Record<string, string>) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, modelConfig, userId: user?.uid }),
      });
      const newProject = await res.json();
      
      // Save directly to Firestore database
      if (user) {
        await saveFirestoreProject(newProject, user.uid);
      }
      
      setProjects((prev) => [newProject, ...prev]);

      // Deduct credits from user account
      const estDeduction = 450;
      if (user) {
        await updateUserCredits(estDeduction);
      }

      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      console.error('Error forging project:', err);
    }
  };

  // 2. Save Code File
  const handleUpdateProjectFiles = async (projectId: string, updatedFiles: FileNode[]) => {
    try {
      if (user) {
        await updateFirestoreProjectFiles(projectId, updatedFiles);
      }
      await fetch(`/api/projects/${projectId}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: updatedFiles }),
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, files: updatedFiles } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Delete Project
  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteFirestoreProject(projectId);
      try {
        await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      } catch (e) {}
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // 4. Duplicate Project
  const handleDuplicateProject = async (proj: Project) => {
    try {
      const newId = `proj_${Math.random().toString(36).substring(2, 9)}`;
      const duplicated: Project = {
        ...proj,
        id: newId,
        name: `${proj.name} (Copy)`,
        createdAt: new Date().toISOString(),
      };
      if (user) {
        await saveFirestoreProject(duplicated, user.uid);
      }
      setProjects((prev) => [duplicated, ...prev]);
    } catch (err) {
      console.error('Error duplicating project:', err);
    }
  };

  // 5. Re-Trigger manual agent stream build
  const handleTriggerStream = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stream`);
      const data = await res.json();
      if (data.success) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, status: 'coding' } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Upgrade Subscription Plan or Purchase Extra Credits
  const handleUpgradeSubscription = async (
    planId?: string,
    cycle: string = 'monthly',
    extraCredits?: number,
    coupon?: string,
    alreadyVerified = false
  ) => {
    try {
      const selectedPlanObj = plans.find((p) => p.id === planId) || DEFAULT_PLANS.find((p) => p.id === planId);
      const planName = selectedPlanObj ? selectedPlanObj.name : `${extraCredits || 1000} Extra Credits Top-up`;
      const basePrice = selectedPlanObj
        ? cycle === 'yearly'
          ? selectedPlanObj.priceYearly
          : selectedPlanObj.priceMonthly
        : extraCredits === 1000 ? 10 : 45;

      const taxAmount = parseFloat((basePrice * 0.18).toFixed(2));
      const totalAmount = parseFloat((basePrice + taxAmount).toFixed(2));

      // Create transaction object
      const tx: Transaction = {
        id: `tx_${Math.random().toString(36).substring(2, 9)}`,
        date: new Date().toISOString(),
        amount: basePrice,
        planName,
        status: 'success',
        invoiceNumber: `INV-2026-T${Math.floor(1000 + Math.random() * 9000)}`,
        taxAmount,
        totalAmount,
        couponUsed: coupon
      };

      // 1. Instantly update subscription in AuthContext (handles both Firebase Auth and Guest Sandbox state)
      if (selectedPlanObj) {
        await updateUserSubscription(
          selectedPlanObj.id,
          selectedPlanObj.name,
          cycle as 'monthly' | 'yearly',
          selectedPlanObj.credits + (extraCredits || 0)
        );
      } else if (extraCredits) {
        await updateUserCredits(-extraCredits); // adds extra credits
      }

      // 2. Notify backend server to record transaction and update SRE analytics
      try {
        await fetch('/api/billing/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            cycle,
            extraCredits,
            coupon,
            userId: user?.uid || 'guest_user'
          })
        });

        const analyticsRes = await fetch('/api/billing/analytics');
        const analyticsData = await analyticsRes.json();
        setAdminAnalytics(analyticsData);
      } catch (e) {}

      if (user) {
        // Save Transaction to Firestore
        await saveFirestoreTransaction(tx, user.uid);

        // Refresh transactions list
        const updatedTxs = await fetchFirestoreTransactions(user.uid);
        setTransactions(updatedTxs);
        await refreshProfile();
      } else {
        setTransactions((prev) => [tx, ...prev]);
      }
    } catch (err) {
      console.error('Failed to update subscription:', err);
    }
  };

  // 5. Add new team member
  const handleAddTeamMember = async (name: string, email: string, role: string) => {
    try {
      if (user) {
        const savedMember = await saveFirestoreTeamMember({
          name,
          email,
          role: role as any,
          joinedDate: new Date().toISOString().split('T')[0]
        }, user.uid);
        if (savedMember) {
          setTeamMembers((prev) => [...prev, savedMember]);
        }
      }
    } catch (err) {
      console.error('Error adding team member:', err);
    }
  };

  // 6. Simulate Webhook
  const handleSimulateWebhook = async (type: string) => {
    try {
      const res = await fetch('/api/billing/webhooks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: type }),
      });
      const data = await res.json();
      if (data.success) {
        const webRes = await fetch('/api/billing/webhooks/logs');
        const webData = await webRes.json();
        setWebhookLogs(webData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Process Refund
  const handleRefund = async (transactionId: string) => {
    try {
      const res = await fetch('/api/billing/transactions/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();
      if (data.success) {
        if (user) {
          const fsTxs = await fetchFirestoreTransactions(user.uid);
          setTransactions(fsTxs);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 8. Update Plan in Firestore (Admin pricing controller)
  const handleUpdatePlan = async (id: string, priceMonthly: number, priceYearly: number, credits: number) => {
    try {
      const existing = plans.find((p) => p.id === id);
      if (existing) {
        const updated: SubscriptionPlan = {
          ...existing,
          priceMonthly,
          priceYearly,
          credits,
        };
        await saveFirestorePlan(updated);
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 9. Create Coupon in Firestore (Admin)
  const handleAddCoupon = async (code: string, type: string, value: number, desc: string) => {
    try {
      const newCoupon: Coupon = {
        code: code.toUpperCase(),
        discountType: type as 'percent' | 'flat',
        discountValue: value,
        description: desc,
        active: true,
      };
      await saveFirestoreCoupon(newCoupon);
      setCoupons((prev) => [...prev.filter((c) => c.code !== newCoupon.code), newCoupon]);
    } catch (err) {
      console.error(err);
    }
  };

  // 10. Publish product in marketplace & save to Firestore
  const handlePublishProduct = async (
    title: string,
    description: string,
    price: number,
    type: any,
    author: string,
    artifactCode?: string
  ) => {
    try {
      const newProduct: MarketplaceProduct = {
        id: `mkt_${Math.random().toString(36).substring(2, 9)}`,
        title,
        description,
        price,
        type,
        author,
        rating: 5.0,
        downloads: 0,
        earnings: 0,
        artifactCode,
      };

      await saveFirestoreMarketplaceProduct(newProduct, user?.uid);
      setMarketplaceProducts((prev) => [newProduct, ...prev]);
    } catch (err) {
      console.error('Failed to publish product:', err);
    }
  };

  // 11. Buy or Install marketplace plugin & record in Firestore
  const handlePurchaseProduct = async (productId: string, paymentId?: string) => {
    try {
      const prod = marketplaceProducts.find((p) => p.id === productId);
      if (!prod) return;

      if (user) {
        await recordFirestoreMarketplacePurchase(user.uid, prod, paymentId);
        const updatedTxs = await fetchFirestoreTransactions(user.uid);
        setTransactions(updatedTxs);
      }

      // Update local product statistics
      setMarketplaceProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, downloads: (p.downloads || 0) + 1, earnings: (p.earnings || 0) + prod.price }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to purchase product:', err);
    }
  };

  // 12. Handle project status/details update
  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === updatedProject.id);
      if (exists) {
        return prev.map((p) => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p));
      }
      return [updatedProject, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-slate-100 pb-16">
      <Navbar
        creditsRemaining={activeSub.creditsRemaining}
        creditsTotal={activeSub.creditsTotal}
        planName={activeSub.planName}
      />

      <Routes>
        {/* Project intake builder */}
        <Route path="/" element={<ProjectIntake onSubmit={handleForgeProject} />} />

        {/* List of projects dashboard */}
        <Route
          path="/projects"
          element={
            <ProjectDashboard
              projects={projects}
              onDeleteProject={handleDeleteProject}
              onDuplicateProject={handleDuplicateProject}
            />
          }
        />

        {/* Project workspace with swarm logs, code files, visual builder, live preview iframe */}
        <Route
          path="/projects/:id"
          element={
            <ProjectView
              projects={projects}
              onUpdateProjectFiles={handleUpdateProjectFiles}
              onTriggerStream={handleTriggerStream}
              onDeleteProject={handleDeleteProject}
              onProjectUpdated={handleProjectUpdated}
            />
          }
        />

        {/* Payments, subscriptions plans, and GST invoice manager */}
        <Route
          path="/billing"
          element={
            <BillingDashboard
              plans={plans}
              activeSub={activeSub}
              transactions={transactions}
              onUpgrade={handleUpgradeSubscription}
              coupons={coupons}
              teamMembers={teamMembers}
              onAddTeamMember={handleAddTeamMember}
            />
          }
        />

        {/* AI swarm agents and templates marketplace */}
        <Route
          path="/marketplace"
          element={
            <Marketplace
              products={marketplaceProducts}
              onPublishProduct={handlePublishProduct}
              onPurchaseProduct={handlePurchaseProduct}
            />
          }
        />

        {/* SRE Admin log simulator, coupons, ARR progression */}
        <Route
          path="/admin"
          element={
            <AdminBillingDashboard
              analytics={adminAnalytics}
              transactions={transactions}
              coupons={coupons}
              webhooks={webhookLogs}
              onSimulateWebhook={handleSimulateWebhook}
              onRefund={handleRefund}
              onUpdatePlan={handleUpdatePlan}
              onAddCoupon={handleAddCoupon}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
