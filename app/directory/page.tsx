import type { Metadata } from 'next';
import React from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { ResourceDirectoryBrowser } from '@/components/directory/ResourceDirectoryBrowser';
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
} from '@/lib/seo/metadata-architect';

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    'Resource Directory & Multi-Facet Taxonomy Explorer | Digital Design Encyclopedia',
  description:
    'Browse, search, and filter all interactive design monographs across 16 primary categories, WAI-ARIA accessibility specifications, and frontend implementation technologies.',
  alternates: {
    canonical: buildCanonicalUrl('/directory'),
  },
  openGraph: {
    title:
      'Resource Directory & Multi-Facet Taxonomy Explorer | Digital Design Encyclopedia',
    description:
      'Browse, search, and filter all interactive design monographs across 16 primary categories, WAI-ARIA accessibility specifications, and frontend implementation technologies.',
    url: buildCanonicalUrl('/directory'),
    type: 'website',
  },
};

export default function ResourceDirectoryPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { label: 'Encyclopedia Home', href: '/' },
    { label: 'Resource Directory & Taxonomy Explorer', href: '/directory' },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: 'Resource Directory & Taxonomy Explorer', isCurrent: true },
        ]}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <ResourceDirectoryBrowser />
      </main>

      <AppFooter />
    </div>
  );
}
