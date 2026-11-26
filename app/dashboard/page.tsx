'use client';

import React from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { UserLibraryDashboard } from '@/components/dashboard/UserLibraryDashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: 'Personal Design Library & User Workspace', isCurrent: true },
        ]}
      />
      <main className="flex-1">
        <UserLibraryDashboard />
      </main>
      <AppFooter />
    </div>
  );
}
