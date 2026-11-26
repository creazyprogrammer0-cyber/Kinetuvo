'use client';

import React from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { GlobalSearchDiscoveryHub } from '@/components/search/GlobalSearchDiscoveryHub';

export default function GlobalSearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          {
            label: 'Global Search & Multi-Facet Discovery',
            isCurrent: true,
          },
        ]}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GlobalSearchDiscoveryHub />
      </main>

      <AppFooter />
    </div>
  );
}
