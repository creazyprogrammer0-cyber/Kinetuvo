'use client';

import React, { useState, useEffect, use } from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { ResourceDetailTemplate } from '@/components/resources/ResourceDetailTemplate';
import {
  FOUNDATION_RESOURCES,
  getResourceBySlug,
} from '@/lib/resources/seed-foundation';
import { getCategoryBySlug } from '@/lib/taxonomy/registry';
import {
  DEFAULT_COLLECTION,
  loadPersonalCollection,
  toggleBookmarkInCollection,
  addParameterPresetToCollection,
} from '@/lib/collections/storage-adapter';
import { recordRealResourceView } from '@/lib/search/metrics-ledger';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useToast } from '@/components/ui/InteractionPrimitives';

export default function ConceptDetailPage({
  params,
}: {
  params: Promise<{ resourceSlug: string }>;
}) {
  const { resourceSlug } = use(params);
  const { isDarkTheme, reducedMotionSim } = useTheme();
  const { pushToast } = useToast();

  const activeResource =
    getResourceBySlug(resourceSlug) || FOUNDATION_RESOURCES[0];
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setCollection(loadPersonalCollection());
      recordRealResourceView(activeResource.slug);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [activeResource.slug]);

  const parentCategory = getCategoryBySlug(activeResource.categorySlug);

  const handleToggleBookmark = (slug: string) => {
    setCollection((prev) => toggleBookmarkInCollection(prev, slug));
    pushToast({
      tone: 'success',
      title: 'Personal Collection Updated',
      description: `Bookmark toggled for ${slug}.`,
    });
  };

  const handleSavePreset = (
    slug: string,
    title: string,
    presetName: string,
    parameterValues: Record<string, number | string | boolean>
  ) => {
    setCollection((prev) =>
      addParameterPresetToCollection(prev, {
        resourceSlug: slug,
        resourceTitle: title,
        presetName,
        parameterValues,
      })
    );
    pushToast({
      tone: 'success',
      title: 'Parameter Preset Snapshot Saved',
      description: `${title}: ${presetName}`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: 'Resource Directory', href: '/directory' },
          {
            label: parentCategory ? parentCategory.name : 'Taxonomy',
            href: `/taxonomy/${parentCategory ? parentCategory.slug : activeResource.categorySlug}`,
          },
          { label: activeResource.title, isCurrent: true },
        ]}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourceDetailTemplate
          resource={activeResource}
          allResources={FOUNDATION_RESOURCES}
          collection={collection}
          onToggleBookmark={handleToggleBookmark}
          onSavePreset={handleSavePreset}
          isDarkTheme={isDarkTheme}
          globalReducedMotionSim={reducedMotionSim}
        />
      </main>

      <AppFooter />
    </div>
  );
}
