import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { CMSPage, CMSPageSEO } from '../types';
import { SITE_CONFIG, PAGE_SEO } from './seoConfig';
import { isFirestoreQuotaExhausted, markFirestoreQuotaExhausted, isQuotaExhaustedError } from './firestoreService';

/**
 * Pre-seeded Default CMS Pages with rich SEO metadata
 * for every core route in DevForge AI
 */
export const DEFAULT_CMS_PAGES: CMSPage[] = [
  {
    id: 'home',
    slug: '/',
    name: 'Home & Autonomous AI Builder',
    contentSummary: 'The core AI software engineering intake canvas where developers and founders input specifications to generate full-stack codebases.',
    status: 'published',
    lastUpdated: '2026-09-08T00:00:00Z',
    seo: {
      metaTitle: PAGE_SEO.home.title || `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
      metaDescription: PAGE_SEO.home.description || SITE_CONFIG.defaultDescription,
      metaKeywords: Array.isArray(PAGE_SEO.home.keywords) ? PAGE_SEO.home.keywords : SITE_CONFIG.defaultKeywords,
      canonicalUrl: '/',
      ogType: 'website',
      ogImage: SITE_CONFIG.defaultOgImage,
      noIndex: false,
      structuredData: PAGE_SEO.home.structuredData
    }
  },
  {
    id: 'features',
    slug: '/features',
    name: 'Platform Features & Multi-Agent Swarm',
    contentSummary: 'Deep architectural dive into the hierarchical AI swarm (Product Manager, Architect, Senior Coder, QA Healer), live AST self-healing, and edge deployments.',
    status: 'published',
    lastUpdated: '2026-09-08T00:00:00Z',
    seo: {
      metaTitle: PAGE_SEO.features.title || 'Platform Features | Autonomous Multi-Agent Swarm - DevForge AI',
      metaDescription: PAGE_SEO.features.description || 'Explore DevForge AI features: Specialized agent swarms, AST code healing, real-time telemetry, and edge deployments.',
      metaKeywords: Array.isArray(PAGE_SEO.features.keywords) ? PAGE_SEO.features.keywords : [
        'AI agent swarm architecture',
        'autonomous code generation',
        'self healing code',
        'AST error validation',
        'real-time code streaming',
        'automated software testing',
        'github continuous integration'
      ],
      canonicalUrl: '/features',
      ogType: 'website',
      ogImage: SITE_CONFIG.defaultOgImage,
      noIndex: false,
      structuredData: PAGE_SEO.features.structuredData
    }
  },
  {
    id: 'templates',
    slug: '/templates',
    name: 'Starter Blueprints & Architecture Gallery',
    contentSummary: 'Production-ready full-stack software blueprints crafted by AI agents for SaaS, DevOps telemetry, AI knowledge bases, and marketplaces.',
    status: 'published',
    lastUpdated: '2026-09-08T00:00:00Z',
    seo: {
      metaTitle: PAGE_SEO.templates.title || 'App Starter Templates & Blueprint Gallery | DevForge AI',
      metaDescription: PAGE_SEO.templates.description || 'Browse production-ready full-stack application blueprints crafted by autonomous AI agents.',
      metaKeywords: Array.isArray(PAGE_SEO.templates.keywords) ? PAGE_SEO.templates.keywords : [
        'AI app templates',
        'SaaS starter blueprints',
        'React dashboard templates',
        'full-stack starter kits',
        'AI chatbot boilerplate'
      ],
      canonicalUrl: '/templates',
      ogType: 'website',
      ogImage: SITE_CONFIG.defaultOgImage,
      noIndex: false,
      structuredData: PAGE_SEO.templates.structuredData
    }
  },
  {
    id: 'docs',
    slug: '/docs',
    name: 'Documentation & Architecture Knowledge Base',
    contentSummary: 'Developer guides, agent swarm interaction protocols, REST API reference tables, and interactive FAQs with Google FAQPage Schema.',
    status: 'published',
    lastUpdated: '2026-09-08T00:00:00Z',
    seo: {
      metaTitle: PAGE_SEO.docs.title || 'Documentation & Architecture Guides | DevForge AI Knowledge Base',
      metaDescription: PAGE_SEO.docs.description || 'Developer documentation, prompt engineering guides, agent swarm architecture specifications, API references, and deployment pipelines.',
      metaKeywords: Array.isArray(PAGE_SEO.docs.keywords) ? PAGE_SEO.docs.keywords : [
        'DevForge AI documentation',
        'prompt engineering for coding',
        'AI software architecture guide',
        'developer API docs'
      ],
      canonicalUrl: '/docs',
      ogType: 'website',
      ogImage: SITE_CONFIG.defaultOgImage,
      noIndex: false,
      structuredData: PAGE_SEO.docs.structuredData
    }
  },
  {
    id: 'pricing',
    slug: '/pricing',
    name: 'Pricing & SRE Compute Plans',
    contentSummary: 'Pricing matrix for developer compute credits, team collaboration seats, dedicated enterprise containers, and GST-compliant invoicing.',
    status: 'published',
    lastUpdated: '2026-09-08T00:00:00Z',
    seo: {
      metaTitle: PAGE_SEO.billing.title || 'Pricing & SRE Developer Plans | DevForge AI',
      metaDescription: PAGE_SEO.billing.description || 'Transparent pricing for autonomous software generation. Flexible credit tiers, team collaboration, GST-compliant invoicing, and dedicated enterprise compute.',
      metaKeywords: Array.isArray(PAGE_SEO.billing.keywords) ? PAGE_SEO.billing.keywords : [
        'DevForge AI pricing',
        'AI coding subscription',
        'developer credits',
        'enterprise AI software engineering'
      ],
      canonicalUrl: '/pricing',
      ogType: 'website',
      ogImage: SITE_CONFIG.defaultOgImage,
      noIndex: false,
      structuredData: PAGE_SEO.billing.structuredData
    }
  },
  {
    id: 'marketplace',
    slug: '/marketplace',
    name: 'Swarm Marketplace & Plugin Ecosystem',
    contentSummary: 'Curated directory of specialized AI agents, prompt engineering blueprints, architectural plugins, and toolchains.',
    status: 'published',
    lastUpdated: '2026-09-08T00:00:00Z',
    seo: {
      metaTitle: PAGE_SEO.marketplace.title || 'AI Swarm Marketplace & Plugins | DevForge AI Ecosystem',
      metaDescription: PAGE_SEO.marketplace.description || 'Discover and publish specialized AI agents, prompt blueprints, architectural plugins, and development toolchains built for the DevForge ecosystem.',
      metaKeywords: Array.isArray(PAGE_SEO.marketplace.keywords) ? PAGE_SEO.marketplace.keywords : [
        'AI agent marketplace',
        'autonomous coder plugins',
        'software engineering blueprints',
        'developer tool marketplace'
      ],
      canonicalUrl: '/marketplace',
      ogType: 'website',
      ogImage: SITE_CONFIG.defaultOgImage,
      noIndex: false,
      structuredData: PAGE_SEO.marketplace.structuredData
    }
  },
  {
    id: 'projects',
    slug: '/projects',
    name: 'Workspace Projects & Cloud Repositories',
    contentSummary: 'Interactive workspace dashboard displaying active software builds, status filters, codebases, and deployment targets.',
    status: 'published',
    lastUpdated: '2026-09-08T00:00:00Z',
    seo: {
      metaTitle: PAGE_SEO.projects.title || 'Workspace & Cloud Projects Dashboard | DevForge AI',
      metaDescription: PAGE_SEO.projects.description || 'Manage, monitor, duplicate, and deploy your autonomous AI-engineered software projects and live applications.',
      metaKeywords: Array.isArray(PAGE_SEO.projects.keywords) ? PAGE_SEO.projects.keywords : [
        'cloud codebases',
        'AI project manager',
        'workspace projects',
        'live application deployments'
      ],
      canonicalUrl: '/projects',
      ogType: 'website',
      ogImage: SITE_CONFIG.defaultOgImage,
      noIndex: false
    }
  },
  {
    id: 'admin',
    slug: '/admin',
    name: 'SRE Admin & Financial Controller',
    contentSummary: 'Administrative command center for SRE cluster monitoring, tenant subscriptions, multi-LLM routing, and CMS SEO metadata.',
    status: 'published',
    lastUpdated: '2026-09-08T00:00:00Z',
    seo: {
      metaTitle: 'SRE Admin & Financial Controller | DevForge AI',
      metaDescription: 'System administration, telemetry oversight, and billing revenue telemetry.',
      metaKeywords: ['sre admin', 'financial controller', 'devforge administrative'],
      canonicalUrl: '/admin',
      ogType: 'website',
      ogImage: SITE_CONFIG.defaultOgImage,
      noIndex: true // Hidden from indexing
    }
  }
];

/**
 * Normalizes a URL path into a standard slug
 */
export function normalizeSlug(path: string): string {
  if (!path) return '/';
  const clean = path.split('?')[0].split('#')[0];
  if (clean === '' || clean === '/') return '/';
  return clean.startsWith('/') ? clean : `/${clean}`;
}

/**
 * Matches a slug or pageId to a default page fallback
 */
export function getDefaultCMSPage(identifier: string): CMSPage | undefined {
  const norm = normalizeSlug(identifier);
  return (
    DEFAULT_CMS_PAGES.find((p) => p.id === identifier) ||
    DEFAULT_CMS_PAGES.find((p) => p.slug === norm) ||
    DEFAULT_CMS_PAGES.find((p) => p.slug === identifier) ||
    (norm === '/billing' ? DEFAULT_CMS_PAGES.find((p) => p.id === 'pricing') : undefined)
  );
}

/**
 * Fetches all CMS pages from Firestore collection `cms_pages`.
 * Automatically seeds defaults if empty and user is logged in.
 */
export async function fetchCMSPages(): Promise<CMSPage[]> {
  try {
    if (isFirestoreQuotaExhausted()) {
      return DEFAULT_CMS_PAGES;
    }
    const collRef = collection(db, 'cms_pages');
    const snap = await getDocs(collRef);
    const pages: CMSPage[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as CMSPage;
      pages.push({
        ...data,
        id: docSnap.id
      });
    });

    if (pages.length > 0) {
      // Sort in consistent order matching DEFAULT_CMS_PAGES
      const orderMap = new Map(DEFAULT_CMS_PAGES.map((p, idx) => [p.id, idx]));
      return pages.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
    }

    return DEFAULT_CMS_PAGES;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    console.warn('Using local CMS defaults:', err?.message || err);
    return DEFAULT_CMS_PAGES;
  }
}

/**
 * Fetches a single CMS page by its slug (e.g. '/' or '/features')
 */
export async function fetchCMSPageBySlug(slug: string): Promise<CMSPage | null> {
  const norm = normalizeSlug(slug);
  const defaultFallback = getDefaultCMSPage(norm);
  if (isFirestoreQuotaExhausted()) {
    return defaultFallback || null;
  }

  try {
    if (!defaultFallback) return null;

    const docRef = doc(db, 'cms_pages', defaultFallback.id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as CMSPage;
    }
    return defaultFallback;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    return defaultFallback || null;
  }
}

/**
 * Fetches a single CMS page by its document ID (e.g. 'home', 'features')
 */
export async function fetchCMSPageById(id: string): Promise<CMSPage | null> {
  const defaultFallback = getDefaultCMSPage(id);
  if (isFirestoreQuotaExhausted()) {
    return defaultFallback || null;
  }

  try {
    const docRef = doc(db, 'cms_pages', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as CMSPage;
    }
    return defaultFallback || null;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    return defaultFallback || null;
  }
}

/**
 * Saves or creates an entire CMS Page record in Firestore
 */
export async function saveCMSPage(page: CMSPage): Promise<boolean> {
  if (isFirestoreQuotaExhausted()) {
    return true;
  }
  try {
    const docRef = doc(db, 'cms_pages', page.id);
    const payload = {
      ...page,
      lastUpdated: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    console.warn('Notice saving CMS page to Firestore:', err?.message || err);
    return false;
  }
}

/**
 * Updates specifically the SEO metadata fields for a given CMS page
 */
export async function updateCMSPageSEO(pageId: string, seoUpdates: Partial<CMSPageSEO>): Promise<boolean> {
  if (isFirestoreQuotaExhausted()) {
    return true;
  }
  try {
    const defaultPage = getDefaultCMSPage(pageId);
    const docRef = doc(db, 'cms_pages', pageId);
    const snap = await getDoc(docRef);

    let existingPage: CMSPage = defaultPage || {
      id: pageId,
      slug: `/${pageId}`,
      name: pageId,
      status: 'published',
      seo: {
        metaTitle: `${pageId} | DevForge AI`,
        metaDescription: SITE_CONFIG.defaultDescription,
        metaKeywords: SITE_CONFIG.defaultKeywords
      }
    };

    if (snap.exists()) {
      existingPage = snap.data() as CMSPage;
    }

    const updatedSEO: CMSPageSEO = {
      ...existingPage.seo,
      ...seoUpdates
    };

    await setDoc(
      docRef,
      {
        ...existingPage,
        seo: updatedSEO,
        lastUpdated: new Date().toISOString()
      },
      { merge: true }
    );

    return true;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    console.warn(`Notice updating SEO for CMS page ${pageId}:`, err?.message || err);
    return false;
  }
}

/**
 * Subscribes to real-time updates for a single CMS page
 */
export function subscribeToCMSPage(
  slugOrId: string,
  onUpdate: (page: CMSPage | null) => void
): () => void {
  const target = getDefaultCMSPage(slugOrId);
  if (isFirestoreQuotaExhausted()) {
    onUpdate(target || null);
    return () => {};
  }

  const pageId = target ? target.id : slugOrId.replace(/^\//, '') || 'home';

  try {
    const docRef = doc(db, 'cms_pages', pageId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate({ id: snap.id, ...snap.data() } as CMSPage);
        } else {
          onUpdate(target || null);
        }
      },
      (error: any) => {
        if (isQuotaExhaustedError(error)) {
          markFirestoreQuotaExhausted();
        }
        onUpdate(target || null);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    onUpdate(target || null);
    return () => {};
  }
}

/**
 * Subscribes to real-time updates for all CMS pages
 */
export function subscribeToAllCMSPages(onUpdate: (pages: CMSPage[]) => void): () => void {
  if (isFirestoreQuotaExhausted()) {
    onUpdate(DEFAULT_CMS_PAGES);
    return () => {};
  }

  try {
    const collRef = collection(db, 'cms_pages');
    const unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const pages: CMSPage[] = [];
        snap.forEach((d) => {
          pages.push({ id: d.id, ...d.data() } as CMSPage);
        });

        if (pages.length > 0) {
          const orderMap = new Map(DEFAULT_CMS_PAGES.map((p, idx) => [p.id, idx]));
          onUpdate(pages.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99)));
        } else {
          onUpdate(DEFAULT_CMS_PAGES);
        }
      },
      (error: any) => {
        if (isQuotaExhaustedError(error)) {
          markFirestoreQuotaExhausted();
        }
        onUpdate(DEFAULT_CMS_PAGES);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    onUpdate(DEFAULT_CMS_PAGES);
    return () => {};
  }
}

