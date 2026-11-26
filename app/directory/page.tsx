'use client';

import React from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { ResourceDirectoryBrowser } from '@/components/directory/ResourceDirectoryBrowser';

export default function ResourceDirectoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: 'Resource Directory & Taxonomy Explorer', isCurrent: true },
        ]}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourceDirectoryBrowser />
      </main>

      <AppFooter />
    </div>
  );
}
