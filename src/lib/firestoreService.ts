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

// Default initial plans
export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Tier',
    priceMonthly: 0,
    priceYearly: 0,
    credits: 100,
    features: ['1 Project limit', 'Basic models only', 'Standard chat sandbox', 'No webhook channels']
  },
  {
    id: 'starter',
    name: 'Starter Plan',
    priceMonthly: 49,
    priceYearly: 470,
    credits: 1000,
    features: ['3 Projects concurrent', 'Advanced models available', 'Razorpay client access', 'GST-compliant invoice download', 'Standard 12h SRE support']
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    priceMonthly: 99,
    priceYearly: 950,
    credits: 5000,
    features: ['Unlimited Projects', 'Intelligent Model Routing', 'Full Marketplace listing publish', 'Collaborative Agent Swarms', 'Dedicated Discord channel']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    priceMonthly: 299,
    priceYearly: 2870,
    credits: 25000,
    features: ['Private SRE containers', 'Custom Fine-Tuning endpoints', 'Dedicated SRE Manager', 'SSO/SAML Authentication', '99.99% SLA Guarantee']
  }
];

// Default initial marketplace products
export const DEFAULT_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'm1',
    title: 'SRE Docker Auto-Deployer Agent',
    description: 'Agent specialized in configuring self-healing Docker structures, health probes, and Kubernetes configurations.',
    price: 19,
    type: 'agent',
    author: 'DevForge Core',
    rating: 4.9,
    downloads: 342,
    earnings: 6498,
    category: 'sre'
  },
  {
    id: 'm2',
    title: 'Next.js 15 SaaS Dashboard Template',
    description: 'Fully configured SaaS dashboard setup with server actions, Tailwind v4, next-auth, and clean bento panels.',
    price: 29,
    type: 'template',
    author: 'Alex Rivera',
    rating: 4.8,
    downloads: 180,
    earnings: 5220,
    category: 'template'
  },
  {
    id: 'm3',
    title: 'Supabase Sync Workflow Pack',
    description: 'Automated drag-and-drop workflow nodes to instantly build and synchronize table structures with Supabase.',
    price: 0,
    type: 'workflow',
    author: 'InnoTech Lab',
    rating: 4.6,
    downloads: 890,
    earnings: 0,
    category: 'workflow'
  },
  {
    id: 'm4',
    title: 'Gemini RAG Embedding Plugin',
    description: 'Sleek vector search embedding connector optimized to index large folder codebases with gemini-embedding-2-preview.',
    price: 15,
    type: 'plugin',
    author: 'AI Wizard',
    rating: 4.7,
    downloads: 95,
    earnings: 1425,
    category: 'ai'
  }
];

// Default initial coupons
export const DEFAULT_COUPONS: Coupon[] = [
  { code: 'LAUNCH20', discountType: 'percent', discountValue: 20, description: '20% off any SRE engine upgrade', active: true },
  { code: 'DEVKIT50', discountType: 'flat', discountValue: 50, description: '$50 instant credit waiver', active: true },
  { code: 'PROSRE100', discountType: 'flat', discountValue: 100, description: '$100 enterprise onboarding voucher', active: true }
];

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

    if (plans.length > 0) {
      return plans;
    }

    // Seed defaults if database collection is empty and user is authenticated
    if (auth.currentUser) {
      for (const p of DEFAULT_PLANS) {
        await setDoc(doc(db, 'plans', p.id), p);
      }
    }
    return DEFAULT_PLANS;
  } catch (e) {
    console.warn('Error reading plans from Firestore, falling back to defaults:', e);
    return DEFAULT_PLANS;
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

    if (coupons.length > 0) {
      return coupons;
    }

    // Seed defaults if empty and auth available
    if (auth.currentUser) {
      for (const c of DEFAULT_COUPONS) {
        await setDoc(doc(db, 'coupons', c.code), c);
      }
    }
    return DEFAULT_COUPONS;
  } catch (e) {
    console.warn('Error reading coupons from Firestore:', e);
    return DEFAULT_COUPONS;
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
    
    if (products.length > 0) {
      return products;
    }

    // Seed defaults if empty and auth is present
    if (auth.currentUser) {
      for (const p of DEFAULT_MARKETPLACE_PRODUCTS) {
        await setDoc(doc(db, 'marketplace_products', p.id), p);
      }
    }
    return DEFAULT_MARKETPLACE_PRODUCTS;
  } catch (e) {
    console.warn('Error fetching marketplace products from Firestore, using fallback:', e);
    return DEFAULT_MARKETPLACE_PRODUCTS;
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
export const DEFAULT_TEMPLATES: BlueprintTemplate[] = [
  {
    id: 'saas-crm',
    title: 'Modern B2B SaaS CRM Platform',
    category: 'SaaS',
    description: 'Complete multi-tenant customer relationship platform with pipeline stages, activity tracking, contact management, and revenue forecasting.',
    tags: ['React', 'Tailwind', 'Pipeline', 'Multi-tenant'],
    suggestedPrompt: 'Build a production-ready B2B SaaS CRM with contact directories, drag-and-drop lead kanban pipeline, deals tracking, activity timeline, and revenue forecast charts.',
    difficulty: 'Enterprise',
    estimatedFiles: 18,
    author: 'DevForge Systems',
    createdAt: '2026-09-01'
  },
  {
    id: 'analytics-dashboard',
    title: 'Real-Time Telemetry & Cloud Metrics',
    category: 'Analytics',
    description: 'High-throughput system monitoring dashboard with interactive time-series charts, latency histograms, error rate logs, and uptime indicators.',
    tags: ['Recharts', 'Live Stream', 'Metrics', 'SRE'],
    suggestedPrompt: 'Create a dark-mode real-time DevOps telemetry dashboard with server CPU/memory gauges, Recharts revenue line graphs, active error logs stream, and cluster node health status.',
    difficulty: 'Intermediate',
    estimatedFiles: 14,
    author: 'SRE Core Team',
    createdAt: '2026-09-01'
  },
  {
    id: 'ai-knowledge-base',
    title: 'AI Documentation & Knowledge Hub',
    category: 'AI Tools',
    description: 'Intelligent developer documentation hub with instant vector search, interactive code playgrounds, markdown renderer, and AI assistant query modal.',
    tags: ['Markdown', 'AI Search', 'Docs', 'Dark UI'],
    suggestedPrompt: 'Create a developer documentation portal with hierarchical sidebar navigation, instant search modal, code syntax highlighting, copyable snippets, and interactive API playground.',
    difficulty: 'Intermediate',
    estimatedFiles: 16,
    author: 'DevForge AI Labs',
    createdAt: '2026-09-02'
  },
  {
    id: 'digital-marketplace',
    title: 'Digital Goods & Plugin Marketplace',
    category: 'E-Commerce',
    description: 'E-commerce platform for developer plugins, digital assets, and AI prompts with checkout flow, rating breakdowns, and creator dashboards.',
    tags: ['E-Commerce', 'Razorpay', 'Digital Assets', 'Creator'],
    suggestedPrompt: 'Build a creator marketplace for digital developer plugins with categorized browsing, search & tag filters, rating reviews, cart checkout, and digital download receipt simulator.',
    difficulty: 'Enterprise',
    estimatedFiles: 20,
    author: 'Marketplace Guild',
    createdAt: '2026-09-02'
  },
  {
    id: 'kanban-workflow',
    title: 'Agile Sprint & Team Task Board',
    category: 'Developer Tools',
    description: 'Collaborative task management board featuring backlog, active sprints, story point estimators, priority tags, and assignee filtering.',
    tags: ['Workflow', 'Drag & Drop', 'Productivity', 'Agile'],
    suggestedPrompt: 'Build an agile project sprint management board with customizable status columns, story point poker estimation, team assignee filters, and markdown task descriptions.',
    difficulty: 'Beginner',
    estimatedFiles: 12,
    author: 'Agile Ops',
    createdAt: '2026-09-03'
  },
  {
    id: 'ai-conversational-studio',
    title: 'Multi-Persona AI Chat Studio',
    category: 'AI Tools',
    description: 'Advanced conversational workspace supporting multiple system personas, parameter tuning (temperature, top-p), streaming response rendering, and prompt history.',
    tags: ['AI Chat', 'Gemini API', 'Streaming', 'Personas'],
    suggestedPrompt: 'Create a multi-persona AI conversational studio with custom system prompts, temperature sliders, streaming message bubble animations, and export chat to JSON/Markdown.',
    difficulty: 'Intermediate',
    estimatedFiles: 15,
    author: 'Cognitive Engine',
    createdAt: '2026-09-03'
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

    if (list.length > 0) {
      return list;
    }

    // Seed defaults to Firestore if collection is empty and user is logged in
    if (auth.currentUser) {
      for (const t of DEFAULT_TEMPLATES) {
        await setDoc(doc(db, 'templates', t.id), t);
      }
    }
    return DEFAULT_TEMPLATES;
  } catch (e) {
    console.warn('Error fetching templates from Firestore, using defaults:', e);
    return DEFAULT_TEMPLATES;
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

