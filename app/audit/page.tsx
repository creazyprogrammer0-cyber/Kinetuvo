import React from 'react';
import type { Metadata } from 'next';
import { ValidationAuditConsole } from '@/components/audit/ValidationAuditConsole';
import { BRAND_CONFIG } from '@/config/brand.config';
import { buildCanonicalUrl, buildBreadcrumbJsonLd } from '@/lib/seo/metadata-architect';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `SEO, Accessibility (WCAG 2.2 AA), Core Web Vitals & Security Audit | ${BRAND_CONFIG.productName}`,
  description:
    'Live technical SEO verification, real browser Core Web Vitals (LCP, INP, CLS, FCP, TTFB) measurement via PerformanceObserver, WCAG 2.2 AA accessibility inspection, and security posture audit.',
  alternates: {
    canonical: buildCanonicalUrl('/audit'),
  },
  openGraph: {
    title: `Live SEO, WCAG 2.2 AA, Core Web Vitals & Security Audit | ${BRAND_CONFIG.productName}`,
    description:
      'Real-time verification of XML sitemap, robots.txt, canonical URLs, Schema.org JSON-LD, WCAG 2.2 AA landmarks, Core Web Vitals, and HTTP security headers.',
    url: buildCanonicalUrl('/audit'),
    siteName: BRAND_CONFIG.productName,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AuditPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { label: BRAND_CONFIG.productName, href: '/' },
    { label: 'SEO, Accessibility & Performance Audit', href: '/audit' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <ValidationAuditConsole />
    </>
  );
}
