import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SEOProps, SITE_CONFIG } from '../lib/seoConfig';
import { subscribeToCMSPage, normalizeSlug, getDefaultCMSPage } from '../lib/cmsService';
import { CMSPage } from '../types';

export interface SEOHeadProps extends SEOProps {
  appName?: string;
  pageSlug?: string;
  pageId?: string;
}

/**
 * Custom React Hook that dynamically updates the browser document head,
 * metadata tags, canonical link, Open Graph, Twitter Cards, and JSON-LD structured data.
 * Real-time synced with Firestore CMS page SEO metadata.
 */
export function useDocumentHead({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage,
  noindex = false,
  structuredData,
  pageSlug,
  pageId,
}: SEOHeadProps) {
  const location = useLocation();
  const activeSlug = pageSlug || location.pathname;
  const targetIdentifier = pageId || activeSlug;

  // Initialize with static default CMS page if available to avoid flicker
  const initialDefault = getDefaultCMSPage(targetIdentifier);
  const [cmsPage, setCmsPage] = useState<CMSPage | null>(initialDefault || null);

  // Subscribe to real-time CMS Page updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCMSPage(targetIdentifier, (updatedPage) => {
      if (updatedPage) {
        setCmsPage(updatedPage);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [targetIdentifier]);

  useEffect(() => {
    // Determine final values: CMS metadata takes precedence when present, falling back to component props, then site defaults
    const cmsSeo = cmsPage?.seo;

    // 1. Title
    const rawTitle = cmsSeo?.metaTitle || title;
    const finalTitle = rawTitle ? `${rawTitle}` : `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`;
    document.title = finalTitle;

    // Helper to safely set or create a meta tag
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to safely set or create a link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Canonical URL
    const currentOrigin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : SITE_CONFIG.domain;

    const rawCanonical = cmsSeo?.canonicalUrl || canonical || activeSlug;
    const fullCanonicalUrl = rawCanonical.startsWith('http')
      ? rawCanonical
      : `${currentOrigin}${rawCanonical.startsWith('/') ? '' : '/'}${rawCanonical}`;

    setLinkTag('canonical', fullCanonicalUrl);

    // 3. Standard SEO Description & Keywords
    const finalDescription = cmsSeo?.metaDescription || description || SITE_CONFIG.defaultDescription;
    setMetaTag('name', 'description', finalDescription);

    const rawKeywords = cmsSeo?.metaKeywords || keywords;
    const normalizedKeywords: string[] = Array.isArray(rawKeywords)
      ? rawKeywords
      : typeof rawKeywords === 'string'
      ? rawKeywords.split(',').map((k) => k.trim())
      : [];

    const finalKeywords =
      normalizedKeywords.length > 0
        ? Array.from(new Set([...normalizedKeywords, ...SITE_CONFIG.defaultKeywords])).join(', ')
        : SITE_CONFIG.defaultKeywords.join(', ');
    setMetaTag('name', 'keywords', finalKeywords);

    // Robots directive
    const isNoIndex = cmsSeo?.noIndex !== undefined ? cmsSeo.noIndex : noindex;
    const robotsContent = isNoIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
    setMetaTag('name', 'robots', robotsContent);
    setMetaTag('name', 'googlebot', robotsContent);

    // Author & Application
    setMetaTag('name', 'author', 'DevForge AI Systems');
    setMetaTag('name', 'application-name', SITE_CONFIG.name);
    setMetaTag('name', 'theme-color', '#050505');

    // 4. Open Graph Tags
    const finalOgType = cmsSeo?.ogType || ogType;
    const finalOgImage = cmsSeo?.ogImage || ogImage || SITE_CONFIG.defaultOgImage;
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDescription);
    setMetaTag('property', 'og:type', finalOgType);
    setMetaTag('property', 'og:url', fullCanonicalUrl);
    setMetaTag('property', 'og:image', finalOgImage);
    setMetaTag('property', 'og:site_name', SITE_CONFIG.name);
    setMetaTag('property', 'og:locale', 'en_US');

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDescription);
    setMetaTag('name', 'twitter:image', finalOgImage);
    setMetaTag('name', 'twitter:site', SITE_CONFIG.twitterHandle);
    setMetaTag('name', 'twitter:creator', SITE_CONFIG.twitterHandle);

    // 6. Structured Data (JSON-LD)
    const scriptId = 'devforge-seo-structured-data';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    const defaultWebsiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: currentOrigin,
      description: SITE_CONFIG.defaultDescription,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${currentOrigin}/projects?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    const finalStructuredData = cmsSeo?.structuredData || structuredData || defaultWebsiteSchema;
    scriptElement.textContent = JSON.stringify(finalStructuredData, null, 2);
  }, [
    cmsPage,
    title,
    description,
    keywords,
    canonical,
    ogType,
    ogImage,
    noindex,
    structuredData,
    activeSlug
  ]);

  return {
    currentTitle: cmsPage?.seo?.metaTitle || title || `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
    currentDescription: cmsPage?.seo?.metaDescription || description || SITE_CONFIG.defaultDescription,
    currentKeywords: cmsPage?.seo?.metaKeywords || keywords || SITE_CONFIG.defaultKeywords,
    cmsPage
  };
}

/**
 * Dynamic Document Head Updater Component
 * Renders in each page component to dynamically inject SEO meta tags, title, OpenGraph, and JSON-LD schema.
 */
export default function SEOHead(props: SEOHeadProps) {
  useDocumentHead(props);
  return null;
}

// Named alias for explicit semantic use
export const DynamicHeadUpdater = SEOHead;
