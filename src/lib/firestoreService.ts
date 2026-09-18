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
// Firestore Quota Circuit Breaker & Fallback
// ==========================================
const QUOTA_STORAGE_KEY = 'devforge_firestore_quota_exhausted_v2';
const QUOTA_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

export const isFirestoreQuotaExhausted = (): boolean => {
  try {
    const val = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!val) return false;
    const timestamp = Number(val);
    if (isNaN(timestamp) || Date.now() - timestamp > QUOTA_EXPIRY_MS) {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const markFirestoreQuotaExhausted = () => {
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, String(Date.now()));
    console.warn('[DevForge SRE] Firestore write quota metric exceeded. Switched persistence to local client storage engine.');
  } catch {}
};

export const clearFirestoreQuotaFlag = () => {
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {}
};

export function isQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  const code = err?.code || '';
  const msg = String(err?.message || err);
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('Free daily write units')
  );
}

async function safeFirestoreSetDoc(docRef: any, data: any, options?: any): Promise<boolean> {
  if (isFirestoreQuotaExhausted()) return false;
  try {
    if (options) {
      await setDoc(docRef, data, options);
    } else {
      await setDoc(docRef, data);
    }
    return true;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    } else {
      console.warn('[Firestore SetDoc Warning]:', err?.message || err);
    }
    return false;
  }
}

async function safeFirestoreUpdateDoc(docRef: any, data: any): Promise<boolean> {
  if (isFirestoreQuotaExhausted()) return false;
  try {
    await updateDoc(docRef, data);
    return true;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    } else {
      console.warn('[Firestore UpdateDoc Warning]:', err?.message || err);
    }
    return false;
  }
}

async function safeFirestoreDeleteDoc(docRef: any): Promise<boolean> {
  if (isFirestoreQuotaExhausted()) return false;
  try {
    await deleteDoc(docRef);
    return true;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    return false;
  }
}

// Local storage mirrors for offline / quota resilient operation
const LOCAL_PROJECTS_KEY = 'devforge_local_projects_v2';
const LOCAL_TRANSACTIONS_KEY = 'devforge_local_transactions_v2';

export const getLocalStoredProjects = (userId?: string): Project[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (!raw) return [];
    const list: Project[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (userId) {
      return list.filter(p => !p.userId || p.userId === userId);
    }
    return list;
  } catch {
    return [];
  }
};

export const saveLocalStoredProject = (project: Project, userId?: string) => {
  try {
    const list = getLocalStoredProjects();
    const currentUid = auth.currentUser?.uid || userId || project.userId;
    const updatedProject = { ...project, userId: currentUid, updatedAt: new Date().toISOString() };
    const existingIndex = list.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      list[existingIndex] = updatedProject;
    } else {
      list.unshift(updatedProject);
    }
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not cache project locally:', e);
  }
};

export const removeLocalStoredProject = (projectId: string) => {
  try {
    const list = getLocalStoredProjects();
    const filtered = list.filter(p => p.id !== projectId);
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(filtered));
  } catch {}
};

// ==========================================
// 1. Subscription Plans Firestore Operations
// ==========================================
export const fetchFirestorePlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    if (isFirestoreQuotaExhausted()) return [];
    const coll = collection(db, 'plans');
    const snap = await getDocs(coll);
    const plans: SubscriptionPlan[] = [];
    snap.forEach((d) => {
      plans.push({ id: d.id, ...d.data() } as SubscriptionPlan);
    });

    // Natural sort by priceMonthly ascending: Free, Starter, Pro, Enterprise
    return plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0));
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    return [];
  }
};

export const saveFirestorePlan = async (plan: SubscriptionPlan) => {
  try {
    if (!auth.currentUser || isFirestoreQuotaExhausted()) return;
    const docRef = doc(db, 'plans', plan.id);
    await safeFirestoreSetDoc(docRef, plan, { merge: true });
  } catch (e) {
    console.warn('Error saving plan:', e);
  }
};

// ==========================================
// 2. Coupons Firestore Operations
// ==========================================
export const fetchFirestoreCoupons = async (): Promise<Coupon[]> => {
  try {
    if (isFirestoreQuotaExhausted()) return [];
    const coll = collection(db, 'coupons');
    const snap = await getDocs(coll);
    const coupons: Coupon[] = [];
    snap.forEach((d) => {
      coupons.push(d.data() as Coupon);
    });
    return coupons;
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    return [];
  }
};

export const saveFirestoreCoupon = async (coupon: Coupon) => {
  try {
    if (!auth.currentUser || isFirestoreQuotaExhausted()) return;
    const docRef = doc(db, 'coupons', coupon.code.toUpperCase());
    await safeFirestoreSetDoc(docRef, { ...coupon, code: coupon.code.toUpperCase() }, { merge: true });
  } catch (e) {
    console.warn('Error saving coupon:', e);
  }
};

// ==========================================
// 3. Projects Firestore Operations
// ==========================================
export const fetchFirestoreProjects = async (userId?: string): Promise<Project[]> => {
  const localList = getLocalStoredProjects(userId);

  if (isFirestoreQuotaExhausted()) {
    return localList;
  }

  try {
    const coll = collection(db, 'projects');
    const q = userId ? query(coll, where('userId', '==', userId)) : coll;
    const snap = await getDocs(q);
    const firestoreList: Project[] = [];
    snap.forEach((d) => {
      firestoreList.push({ id: d.id, ...d.data() } as Project);
    });

    // Merge Firestore with local: If local has a newer version or unsynced project, keep it!
    const map = new Map<string, Project>();
    for (const p of firestoreList) {
      map.set(p.id, p);
    }
    for (const p of localList) {
      const existing = map.get(p.id);
      if (!existing || new Date(p.updatedAt || 0).getTime() > new Date(existing.updatedAt || 0).getTime()) {
        map.set(p.id, p);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    console.warn('Returning local projects storage:', e?.message || e);
    return localList;
  }
};

export const fetchFirestoreProjectById = async (projectId: string): Promise<Project | null> => {
  const localList = getLocalStoredProjects();
  const local = localList.find((p) => p.id === projectId) || null;

  if (isFirestoreQuotaExhausted()) {
    return local;
  }

  try {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const remote = { id: snap.id, ...snap.data() } as Project;
      if (local && new Date(local.updatedAt || 0).getTime() > new Date(remote.updatedAt || 0).getTime()) {
        return local;
      }
      return remote;
    }
    return local;
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    return local;
  }
};

export const saveFirestoreProject = async (project: Project, userId?: string) => {
  // Always save locally so project data is 100% durable
  saveLocalStoredProject(project, userId);

  const currentUid = auth.currentUser?.uid || userId || project.userId;
  if (!currentUid || isFirestoreQuotaExhausted()) {
    return;
  }

  try {
    const docRef = doc(db, 'projects', project.id);
    await safeFirestoreSetDoc(docRef, { ...project, userId: currentUid, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

export const deleteFirestoreProject = async (projectId: string) => {
  removeLocalStoredProject(projectId);
  if (isFirestoreQuotaExhausted() || !auth.currentUser) return;
  try {
    const docRef = doc(db, 'projects', projectId);
    await safeFirestoreDeleteDoc(docRef);
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

export const updateFirestoreProjectFiles = async (projectId: string, files: FileNode[]) => {
  const localList = getLocalStoredProjects();
  const existing = localList.find((p) => p.id === projectId);
  if (existing) {
    existing.files = files;
    existing.updatedAt = new Date().toISOString();
    saveLocalStoredProject(existing);
  }

  if (isFirestoreQuotaExhausted() || !auth.currentUser) return;
  try {
    const docRef = doc(db, 'projects', projectId);
    await safeFirestoreUpdateDoc(docRef, { files, updatedAt: new Date().toISOString() });
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

export const updateFirestoreProjectDetails = async (
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'deployedUrl'>>
) => {
  const localList = getLocalStoredProjects();
  const existing = localList.find((p) => p.id === projectId);
  if (existing) {
    Object.assign(existing, updates);
    existing.updatedAt = new Date().toISOString();
    saveLocalStoredProject(existing);
  }

  if (isFirestoreQuotaExhausted() || !auth.currentUser) return;
  try {
    const docRef = doc(db, 'projects', projectId);
    await safeFirestoreUpdateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

/** An audit record only: exported source remains in the owned project document. */
export const recordFirestoreProjectExport = async (project: Project, format: 'zip' | 'json') => {
  try {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || isFirestoreQuotaExhausted()) return;
    const exportId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await safeFirestoreSetDoc(doc(db, 'projects', project.id, 'exports', exportId), {
      id: exportId,
      projectId: project.id,
      userId: currentUid,
      format,
      fileCount: project.files?.length || 0,
      exportedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

export const listenToFirestoreProject = (projectId: string, onUpdate: (project: Project) => void) => {
  if (isFirestoreQuotaExhausted()) {
    const local = getLocalStoredProjects().find((p) => p.id === projectId);
    if (local) onUpdate(local);
    return () => {};
  }

  try {
    const docRef = doc(db, 'projects', projectId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate({ id: snap.id, ...snap.data() } as Project);
        }
      },
      (error: any) => {
        if (isQuotaExhaustedError(error)) {
          markFirestoreQuotaExhausted();
          const local = getLocalStoredProjects().find((p) => p.id === projectId);
          if (local) onUpdate(local);
        }
      }
    );
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    const local = getLocalStoredProjects().find((p) => p.id === projectId);
    if (local) onUpdate(local);
    return () => {};
  }
};

// ==========================================
// 4. Transactions Firestore Operations
// ==========================================
export const saveFirestoreTransaction = async (tx: Transaction, userId?: string) => {
  try {
    const currentUid = auth.currentUser?.uid || userId;
    // Local persistence for transactions
    try {
      const raw = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
      const list: Transaction[] = raw ? JSON.parse(raw) : [];
      list.unshift(tx);
      localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(list));
    } catch {}

    if (!currentUid || isFirestoreQuotaExhausted()) return;
    const docRef = doc(db, 'transactions', tx.id);
    await safeFirestoreSetDoc(docRef, { ...tx, userId: currentUid, createdAt: new Date().toISOString() }, { merge: true });
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

export const fetchFirestoreTransactions = async (userId?: string): Promise<Transaction[]> => {
  let localTxs: Transaction[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (raw) localTxs = JSON.parse(raw);
  } catch {}

  if (isFirestoreQuotaExhausted()) return localTxs;

  try {
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid) return localTxs;
    const coll = collection(db, 'transactions');
    const q = query(coll, where('userId', '==', currentUid));
    const snap = await getDocs(q);
    const txs: Transaction[] = [];
    snap.forEach((d) => txs.push({ id: d.id, ...d.data() } as Transaction));
    
    // Merge
    const map = new Map<string, Transaction>();
    for (const t of txs) map.set(t.id, t);
    for (const t of localTxs) if (!map.has(t.id)) map.set(t.id, t);

    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    return localTxs;
  }
};

// ==========================================
// 5. Marketplace Firestore Operations
// ==========================================
export const fetchFirestoreMarketplaceProducts = async (): Promise<MarketplaceProduct[]> => {
  try {
    if (isFirestoreQuotaExhausted()) return [];
    const snap = await getDocs(collection(db, 'marketplace_products'));
    const products: MarketplaceProduct[] = [];
    snap.forEach((d) => products.push({ id: d.id, ...d.data() } as MarketplaceProduct));
    return products;
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    return [];
  }
};

export const saveFirestoreMarketplaceProduct = async (product: MarketplaceProduct, userId?: string) => {
  try {
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid || isFirestoreQuotaExhausted()) return;
    const docRef = doc(db, 'marketplace_products', product.id);
    await safeFirestoreSetDoc(
      docRef,
      {
        ...product,
        authorId: currentUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

export const updateFirestoreProductStats = async (productId: string, price: number) => {
  try {
    if (!auth.currentUser || isFirestoreQuotaExhausted()) return;
    const docRef = doc(db, 'marketplace_products', productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentDownloads = data.downloads || 0;
      const currentEarnings = data.earnings || 0;
      await safeFirestoreUpdateDoc(docRef, {
        downloads: currentDownloads + 1,
        earnings: currentEarnings + price,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

export const recordFirestoreMarketplacePurchase = async (
  userId: string,
  product: MarketplaceProduct,
  paymentId?: string
) => {
  try {
    if (!auth.currentUser || isFirestoreQuotaExhausted()) return;
    const purchaseId = `pur_${Math.random().toString(36).substring(2, 9)}`;
    const purchaseRef = doc(db, 'marketplace_purchases', purchaseId);
    await safeFirestoreSetDoc(purchaseRef, {
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
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
  }
};

// ==========================================
// 6. Team Members Firestore Operations
// ==========================================
export const fetchFirestoreTeamMembers = async (userId?: string): Promise<TeamMember[]> => {
  try {
    if (isFirestoreQuotaExhausted()) return [];
    const currentUid = auth.currentUser?.uid || userId;
    if (!currentUid) return [];
    const coll = collection(db, 'team_members');
    const q = query(coll, where('ownerId', '==', currentUid));
    const snap = await getDocs(q);
    const members: TeamMember[] = [];
    snap.forEach((d) => members.push({ id: d.id, ...d.data() } as TeamMember));
    return members;
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
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
    if (isFirestoreQuotaExhausted()) return fullMember;
    const docRef = doc(db, 'team_members', memberId);
    await safeFirestoreSetDoc(docRef, { ...fullMember, ownerId: currentUid });
    return fullMember;
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
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
    const addedCredits = plan.credits + extraCredits;
    const nextRenewalDate = new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];

    const updatedData = {
      planId: plan.id,
      planName: plan.name,
      billingCycle: cycle,
      creditsRemaining: addedCredits,
      creditsTotal: addedCredits,
      nextRenewal: nextRenewalDate,
      updatedAt: new Date().toISOString(),
    };

    if (isFirestoreQuotaExhausted()) {
      return updatedData;
    }

    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? snap.data() : {};

    const currentRemaining = existing.creditsRemaining || 0;
    const currentTotal = existing.creditsTotal || 0;

    const fullData = {
      ...updatedData,
      creditsRemaining: currentRemaining + addedCredits,
      creditsTotal: currentTotal + addedCredits,
    };

    await safeFirestoreSetDoc(userRef, fullData, { merge: true });
    return fullData;
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
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
  if (isFirestoreQuotaExhausted()) {
    return DEFAULT_DATABASE_TEMPLATES;
  }
  try {
    const coll = collection(db, 'templates');
    const snap = await getDocs(coll);
    const list: BlueprintTemplate[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as BlueprintTemplate);
    });

    if (list.length === 0) {
      return DEFAULT_DATABASE_TEMPLATES;
    }
    return list;
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    return DEFAULT_DATABASE_TEMPLATES;
  }
};

export const saveFirestoreTemplate = async (template: BlueprintTemplate) => {
  try {
    if (isFirestoreQuotaExhausted()) return false;
    const docRef = doc(db, 'templates', template.id);
    await safeFirestoreSetDoc(docRef, template, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) markFirestoreQuotaExhausted();
    return false;
  }
};



