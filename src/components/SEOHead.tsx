import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEOProps, SITE_CONFIG } from '../lib/seoConfig';

interface SEOHeadProps extends SEOProps {
  appName?: string;
}

export default function SEOHead({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage,
  noindex = false,
  structuredData,
}: SEOHeadProps) {
  const location = useLocation();

  useEffect(() => {
    // 1. Title
    const finalTitle = title ? `${title}` : `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`;
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
    const currentOrigin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : SITE_CONFIG.domain;
    const cleanCanonicalPath = canonical || location.pathname;
    const fullCanonicalUrl = cleanCanonicalPath.startsWith('http')
      ? cleanCanonicalPath
      : `${currentOrigin}${cleanCanonicalPath.startsWith('/') ? '' : '/'}${cleanCanonicalPath}`;

    setLinkTag('canonical', fullCanonicalUrl);

    // 3. Standard SEO Metas
    const finalDescription = description || SITE_CONFIG.defaultDescription;
    setMetaTag('name', 'description', finalDescription);

    const normalizedKeywords: string[] = Array.isArray(keywords)
      ? keywords
      : typeof keywords === 'string'
      ? keywords.split(',').map((k) => k.trim())
      : [];

    const finalKeywords = normalizedKeywords.length > 0
      ? Array.from(new Set([...normalizedKeywords, ...SITE_CONFIG.defaultKeywords])).join(', ')
      : SITE_CONFIG.defaultKeywords.join(', ');
    setMetaTag('name', 'keywords', finalKeywords);

    // Robots directive
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
    setMetaTag('name', 'robots', robotsContent);
    setMetaTag('name', 'googlebot', robotsContent);

    // Author & Application
    setMetaTag('name', 'author', 'DevForge AI Systems');
    setMetaTag('name', 'application-name', SITE_CONFIG.name);
    setMetaTag('name', 'theme-color', '#050505');

    // 4. Open Graph Tags
    const finalOgImage = ogImage || SITE_CONFIG.defaultOgImage;
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDescription);
    setMetaTag('property', 'og:type', ogType);
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

    const payload = structuredData || defaultWebsiteSchema;
    scriptElement.textContent = JSON.stringify(payload, null, 2);

  }, [title, description, keywords, canonical, ogType, ogImage, noindex, structuredData, location.pathname]);

  return null;
}
