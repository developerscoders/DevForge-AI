import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Project,
  FileNode,
  Transaction,
  Coupon,
  MarketplaceProduct,
  WebhookEvent,
  TeamMember,
  SubscriptionPlan,
  BlueprintTemplate
} from '../types';

export interface FirestoreTenant {
  id: string;
  displayName: string;
  email: string;
  planId: string;
  planName: string;
  creditsRemaining: number;
  creditsTotal: number;
  status: string;
}

export interface FirestoreAdminAnalytics {
  monthlyRecurringRevenue: number;
  annualRunRate: number;
  totalRevenue: number;
  activeSubscriptions: number;
  activeTenants: number;
  globalCreditUsage: number;
  revenueHistory: Array<{ month: string; Revenue: number }>;
}

async function assertFirestoreAdmin(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Authentication is required.');
  const token = await currentUser.getIdTokenResult();
  if (token.claims.admin !== true) throw new Error('Administrator access is required.');
}

/** Reads tenant directory data from Firestore; never returns credentials or tokens. */
export const fetchFirestoreAdminTenants = async (): Promise<FirestoreTenant[]> => {
  await assertFirestoreAdmin();
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      displayName: data.displayName || 'Unnamed user',
      email: data.email || '',
      planId: data.planId || 'free',
      planName: data.planName || 'Free Tier',
      creditsRemaining: Number(data.creditsRemaining || 0),
      creditsTotal: Number(data.creditsTotal || 0),
      status: data.status || 'active',
    };
  });
};

/** Derives SRE analytics from Firestore entitlements and completed transactions. */
export const fetchFirestoreAdminAnalytics = async (): Promise<FirestoreAdminAnalytics> => {
  const tenants = await fetchFirestoreAdminTenants();
  const transactionSnap = await getDocs(collection(db, 'transactions'));
  const transactions = transactionSnap.docs.map((item) => item.data());
  const completed = transactions.filter((transaction) => transaction.status === 'success');
  const totalRevenue = completed.reduce((sum, transaction) => sum + Number(transaction.totalAmount ?? transaction.amount ?? 0), 0);
  const monthlyRecurringRevenue = tenants.reduce((sum, tenant) => sum + ({ starter: 49, pro: 99, enterprise: 299 }[tenant.planId] || 0), 0);
  const creditsTotal = tenants.reduce((sum, tenant) => sum + tenant.creditsTotal, 0);
  const creditsRemaining = tenants.reduce((sum, tenant) => sum + tenant.creditsRemaining, 0);
  return {
    monthlyRecurringRevenue,
    annualRunRate: monthlyRecurringRevenue * 12,
    totalRevenue,
    activeSubscriptions: tenants.filter((tenant) => tenant.planId !== 'free' && tenant.status === 'active').length,
    activeTenants: tenants.filter((tenant) => tenant.status === 'active').length,
    globalCreditUsage: Math.max(0, creditsTotal - creditsRemaining),
    revenueHistory: [{ month: 'Current', Revenue: totalRevenue }],
  };
};

export const fetchFirestoreAdminTransactions = async (): Promise<Transaction[]> => {
  await assertFirestoreAdmin();
  const snap = await getDocs(collection(db, 'transactions'));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() } as Transaction))
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
};

// ==========================================
// 1. Subscription Plans Firestore Operations
// ==========================================
export const fetchFirestorePlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const coll = collection(db, 'plans');
    const snap = await getDocs(coll);
    const plans: SubscriptionPlan[] = [];
    snap.forEach((d) => {
      plans.push({ id: d.id, ...d.data() } as SubscriptionPlan);
    });

    // Natural sort by priceMonthly ascending: Free, Starter, Pro, Enterprise
    return plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0));
  } catch (e) {
    console.error('Error reading plans from Firestore database:', e);
    return [];
  }
};

export const saveFirestorePlan = async (plan: SubscriptionPlan) => {
  try {
    if (!auth.currentUser) return;
    const docRef = doc(db, 'plans', plan.id);
    await setDoc(docRef, plan, { merge: true });
  } catch (e) {
    console.warn('Error saving plan to Firestore:', e);
  }
};

// ==========================================
// 2. Coupons Firestore Operations
// ==========================================
export const fetchFirestoreCoupons = async (): Promise<Coupon[]> => {
  try {
    const coll = collection(db, 'coupons');
    const snap = await getDocs(coll);
    const coupons: Coupon[] = [];
    snap.forEach((d) => {
      coupons.push(d.data() as Coupon);
    });
    return coupons;
  } catch (e) {
    console.error('Error reading coupons from Firestore database:', e);
    return [];
  }
};

export const saveFirestoreCoupon = async (coupon: Coupon) => {
  try {
    if (!auth.currentUser) return;
    const docRef = doc(db, 'coupons', coupon.code.toUpperCase());
    await setDoc(docRef, { ...coupon, code: coupon.code.toUpperCase() }, { merge: true });
  } catch (e) {
    console.warn('Error saving coupon to Firestore:', e);
  }
};

// ==========================================
// 3. Projects Firestore Operations
// ==========================================
export const fetchFirestoreProjects = async (userId?: string): Promise<Project[]> => {
  try {
    const coll = collection(db, 'projects');
    const q = userId ? query(coll, where('userId', '==', userId)) : coll;
    const snap = await getDocs(q);
    const results: Project[] = [];
    snap.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as Project);
    });
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (e) {
    console.warn('Error fetching projects from Firestore:', e);
    return [];
  }
};

export const fetchFirestoreProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Project;
    }
    return null;
  } catch (e) {
    console.warn('Error fetching project by id from Firestore:', e);
    return null;
  }
};

export const saveFirestoreProject = async (project: Project, userId?: string) => {
  try {
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid) {
      console.warn('Skipping Firestore save: user not authenticated');
      return;
    }
    const docRef = doc(db, 'projects', project.id);
    await setDoc(docRef, { ...project, userId: currentUid, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Error saving project to Firestore:', e);
  }
};

export const deleteFirestoreProject = async (projectId: string) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Error deleting project from Firestore:', e);
  }
};

export const updateFirestoreProjectFiles = async (projectId: string, files: FileNode[]) => {
  try {
    if (!auth.currentUser) {
      console.warn('Skipping Firestore file update: user not authenticated');
      return;
    }
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, { files, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn('Error updating project files in Firestore:', e);
  }
};

export const updateFirestoreProjectDetails = async (
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'deployedUrl'>>
) => {
  try {
    if (!auth.currentUser) return;
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn('Error updating project details in Firestore:', e);
  }
};

/** An audit record only: exported source remains in the owned project document. */
export const recordFirestoreProjectExport = async (project: Project, format: 'zip' | 'json') => {
  try {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;
    const exportId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'projects', project.id, 'exports', exportId), {
      id: exportId,
      projectId: project.id,
      userId: currentUid,
      format,
      fileCount: project.files?.length || 0,
      exportedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Error recording project export in Firestore:', e);
  }
};

export const listenToFirestoreProject = (projectId: string, onUpdate: (project: Project) => void) => {
  const docRef = doc(db, 'projects', projectId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as Project);
      }
    },
    (error) => {
      console.warn('Firestore snapshot listener error for project:', error);
    }
  );
};

// ==========================================
// 4. Transactions Firestore Operations
// ==========================================
export const saveFirestoreTransaction = async (tx: Transaction, userId?: string) => {
  try {
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid) {
      console.warn('Skipping transaction save to Firestore: user not authenticated');
      return;
    }
    const docRef = doc(db, 'transactions', tx.id);
    await setDoc(docRef, { ...tx, userId: currentUid, createdAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Error saving transaction in Firestore:', e);
  }
};

export const fetchFirestoreTransactions = async (userId?: string): Promise<Transaction[]> => {
  try {
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid) {
      return [];
    }
    const coll = collection(db, 'transactions');
    const q = query(coll, where('userId', '==', currentUid));
    const snap = await getDocs(q);
    const txs: Transaction[] = [];
    snap.forEach((d) => txs.push({ id: d.id, ...d.data() } as Transaction));
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.warn('Error fetching transactions from Firestore:', e);
    return [];
  }
};

// ==========================================
// 5. Marketplace Firestore Operations
// ==========================================
export const fetchFirestoreMarketplaceProducts = async (): Promise<MarketplaceProduct[]> => {
  try {
    const snap = await getDocs(collection(db, 'marketplace_products'));
    const products: MarketplaceProduct[] = [];
    snap.forEach((d) => products.push({ id: d.id, ...d.data() } as MarketplaceProduct));
    return products;
  } catch (e) {
    console.error('Error fetching marketplace products from Firestore database:', e);
    return [];
  }
};

export const saveFirestoreMarketplaceProduct = async (product: MarketplaceProduct, userId?: string) => {
  try {
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid) {
      console.warn('Skipping marketplace product Firestore save: user not authenticated');
      return;
    }
    const docRef = doc(db, 'marketplace_products', product.id);
    await setDoc(docRef, {
      ...product,
      authorId: currentUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Error saving marketplace product to Firestore:', e);
  }
};

export const updateFirestoreProductStats = async (productId: string, price: number) => {
  try {
    if (!auth.currentUser) {
      return;
    }
    const docRef = doc(db, 'marketplace_products', productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentDownloads = data.downloads || 0;
      const currentEarnings = data.earnings || 0;
      await updateDoc(docRef, {
        downloads: currentDownloads + 1,
        earnings: currentEarnings + price,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('Error updating marketplace product stats:', e);
  }
};

export const recordFirestoreMarketplacePurchase = async (
  userId: string,
  product: MarketplaceProduct,
  paymentId?: string
) => {
  try {
    if (!auth.currentUser) return;
    const purchaseId = `pur_${Math.random().toString(36).substring(2, 9)}`;
    const purchaseRef = doc(db, 'marketplace_purchases', purchaseId);
    await setDoc(purchaseRef, {
      id: purchaseId,
      userId,
      productId: product.id,
      productTitle: product.title,
      amount: product.price,
      paymentId: paymentId || `free_${Date.now()}`,
      purchasedAt: new Date().toISOString(),
    });

    // Save corresponding financial transaction if paid
    if (product.price > 0 || paymentId) {
      const tx: Transaction = {
        id: paymentId || `pay_mkt_${Math.random().toString(36).substring(2, 9)}`,
        date: new Date().toISOString(),
        amount: product.price,
        planName: `Marketplace: ${product.title}`,
        status: 'success',
        invoiceNumber: `INV-2026-M${Math.floor(1000 + Math.random() * 9000)}`,
        taxAmount: parseFloat((product.price * 0.18).toFixed(2)),
        totalAmount: product.price
      };
      await saveFirestoreTransaction(tx, userId);
    }

    // Update product download and revenue statistics in database
    await updateFirestoreProductStats(product.id, product.price);
  } catch (e) {
    console.warn('Error recording marketplace purchase in Firestore:', e);
  }
};

// ==========================================
// 6. Team Members Firestore Operations
// ==========================================
export const fetchFirestoreTeamMembers = async (userId?: string): Promise<TeamMember[]> => {
  try {
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid) {
      return [];
    }
    const coll = collection(db, 'team_members');
    const q = query(coll, where('ownerId', '==', currentUid));
    const snap = await getDocs(q);
    const members: TeamMember[] = [];
    snap.forEach((d) => members.push({ id: d.id, ...d.data() } as TeamMember));
    return members;
  } catch (e) {
    console.warn('Error fetching team members from Firestore:', e);
    return [];
  }
};

export const saveFirestoreTeamMember = async (member: Omit<TeamMember, 'id'>, userId?: string): Promise<TeamMember | null> => {
  try {
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid) return null;
    const memberId = `t_${Math.random().toString(36).substring(2, 8)}`;
    const fullMember: TeamMember = {
      id: memberId,
      ...member,
    };
    const docRef = doc(db, 'team_members', memberId);
    await setDoc(docRef, { ...fullMember, ownerId: currentUid });
    return fullMember;
  } catch (e) {
    console.warn('Error saving team member to Firestore:', e);
    return null;
  }
};

// ==========================================
// 7. User Subscription & Credits in Firestore
// ==========================================
export const updateFirestoreUserSubscription = async (
  userId: string,
  plan: SubscriptionPlan,
  cycle: 'monthly' | 'yearly',
  extraCredits = 0
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? snap.data() : {};

    const currentRemaining = existing.creditsRemaining || 0;
    const currentTotal = existing.creditsTotal || 0;
    const addedCredits = plan.credits + extraCredits;

    const nextRenewalDate = new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];

    const updatedData = {
      planId: plan.id,
      planName: plan.name,
      billingCycle: cycle,
      creditsRemaining: currentRemaining + addedCredits,
      creditsTotal: currentTotal + addedCredits,
      nextRenewal: nextRenewalDate,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, updatedData, { merge: true });
    return updatedData;
  } catch (e) {
    console.warn('Error updating user subscription in Firestore:', e);
    return null;
  }
};

// ==========================================
// 8. Starter Blueprints & Templates in Firestore
// ==========================================
export const DEFAULT_DATABASE_TEMPLATES: BlueprintTemplate[] = [
  {
    id: 'bp_saas_metrics',
    title: 'B2B SaaS Metrics & Billing Hub',
    category: 'SaaS',
    description: 'Autonomous financial telemetry dashboard tracking MRR, ARR, churn rate, user cohorts, and webhook-driven subscription invoices.',
    tags: ['React', 'Tailwind', 'Recharts', 'Firestore', 'Webhooks'],
    suggestedPrompt: 'Build a production-ready SaaS executive dashboard with real-time MRR, customer churn charts, subscription billing tiers, and live webhook logs.',
    difficulty: 'Intermediate',
    estimatedFiles: 14,
    author: 'DevForge AI Swarm',
    createdAt: '2026-03-01'
  },
  {
    id: 'bp_ai_copilot',
    title: 'Autonomous Code Review & SRE Swarm',
    category: 'AI Tools',
    description: 'Multi-agent orchestration cockpit with dedicated Architect, Senior Coder, and Security Reviewer agents inspecting pull requests and terminal output.',
    tags: ['Gemini API', 'Agents', 'TypeScript', 'WebSockets', 'Tailwind'],
    suggestedPrompt: 'Create a collaborative AI agent swarm workspace where a Planner, Architect, and Coder work concurrently on code refactoring with live streaming logs.',
    difficulty: 'Enterprise',
    estimatedFiles: 22,
    author: 'DevForge Core',
    createdAt: '2026-03-05'
  },
  {
    id: 'bp_ecommerce_store',
    title: 'Headless E-Commerce & Checkout Engine',
    category: 'E-Commerce',
    description: 'Full-stack storefront with product filtering, cart drawer, Razorpay/Stripe checkout, GST invoice calculation, and order inventory tracking.',
    tags: ['E-Commerce', 'Cart', 'Razorpay', 'Tailwind', 'Firestore'],
    suggestedPrompt: 'Design a clean minimalist e-commerce shop with product catalog filtering, responsive cart drawer, secure checkout modal, and automated order confirmation.',
    difficulty: 'Intermediate',
    estimatedFiles: 16,
    author: 'DevForge Commerce',
    createdAt: '2026-03-10'
  },
  {
    id: 'bp_analytics_stream',
    title: 'Real-Time Telemetry & Kafka Stream Visualizer',
    category: 'Analytics',
    description: 'High-frequency telemetry stream visualizer with live FPS, container CPU/Memory heatmaps, latency histograms, and alert thresholds.',
    tags: ['Telemetry', 'D3', 'Metrics', 'Live Stream', 'Kafka'],
    suggestedPrompt: 'Build a high-performance system telemetry dashboard displaying CPU, RAM, network I/O spikes, and alert threshold notifications in real time.',
    difficulty: 'Enterprise',
    estimatedFiles: 18,
    author: 'DevForge Telemetry',
    createdAt: '2026-03-12'
  },
  {
    id: 'bp_dev_registry',
    title: 'Microservice Service Mesh & Container Orchestrator',
    category: 'Developer Tools',
    description: 'Kubernetes/Docker pod supervisor with container start/stop triggers, live terminal logs, health checks, and traffic routing rules.',
    tags: ['DevOps', 'Containers', 'Kubernetes', 'Terminal', 'Docker'],
    suggestedPrompt: 'Create a container management dashboard allowing developers to monitor active microservices, stream terminal logs, and inspect HTTP proxy routes.',
    difficulty: 'Intermediate',
    estimatedFiles: 15,
    author: 'DevForge DevOps',
    createdAt: '2026-03-14'
  },
  {
    id: 'bp_rag_knowledge',
    title: 'Enterprise Vector Knowledge Base & Search',
    category: 'AI Tools',
    description: 'Semantic vector search documentation engine with markdown rendering, semantic chunking, and AI conversational QA.',
    tags: ['RAG', 'Vector Search', 'Embeddings', 'Markdown', 'Docs'],
    suggestedPrompt: 'Construct an AI document search application that indexes PDF/Markdown documents and provides grounded question-answering with citations.',
    difficulty: 'Intermediate',
    estimatedFiles: 12,
    author: 'DevForge AI Swarm',
    createdAt: '2026-03-15'
  }
];

export const fetchFirestoreTemplates = async (): Promise<BlueprintTemplate[]> => {
  try {
    const coll = collection(db, 'templates');
    const snap = await getDocs(coll);
    const list: BlueprintTemplate[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as BlueprintTemplate);
    });

    if (list.length === 0) {
      // Seed default templates directly to Firestore database
      for (const t of DEFAULT_DATABASE_TEMPLATES) {
        try {
          await setDoc(doc(db, 'templates', t.id), t);
          list.push(t);
        } catch (seedErr) {
          console.warn('Notice seeding template to Firestore:', seedErr);
        }
      }
    }
    return list;
  } catch (e) {
    console.error('Error fetching templates from Firestore database:', e);
    return DEFAULT_DATABASE_TEMPLATES;
  }
};

export const saveFirestoreTemplate = async (template: BlueprintTemplate) => {
  try {
    const docRef = doc(db, 'templates', template.id);
    await setDoc(docRef, template, { merge: true });
    return true;
  } catch (e) {
    console.warn('Error saving template to Firestore:', e);
    return false;
  }
};


