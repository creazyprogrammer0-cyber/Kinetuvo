'use client';

import React from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { AdminCmsWorkbench } from '@/components/admin/AdminCmsWorkbench';

export default function AdminCmsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          {
            label: 'Administration Dashboard & Content Management System',
            isCurrent: true,
          },
        ]}
      />
      <main className="flex-1">
        <AdminCmsWorkbench />
      </main>
      <AppFooter />
    </div>
  );
}
