'use client';

import React, { useState, useEffect, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
import { useAuthLibrary } from '@/components/providers/AuthLibraryProvider';
import { useToast } from '@/components/ui/InteractionPrimitives';
import { getFirebaseDb } from '@/lib/firebase/client';
import {
  CmsDifficultyLevel,
  CmsPreviewType,
  CmsResourceRecord,
  CmsResourceStatus,
  convertCmsRecordToDesignResource,
} from '@/lib/admin/cms-types';
import { DesignResource } from '@/types/encyclopedia';

export default function ConceptDetailPage({
  params,
}: {
  params: Promise<{ resourceSlug: string }>;
}) {
  const { resourceSlug } = use(params);
  const { isDarkTheme, reducedMotionSim } = useTheme();
  const { bookmarkedSlugs, toggleBookmark, recordRecentlyViewed } =
    useAuthLibrary();
  const { pushToast } = useToast();

  const [cmsOverrideResource, setCmsOverrideResource] =
    useState<DesignResource | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCmsDoc = async () => {
      try {
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, 'cms_resources', resourceSlug));
        if (!isMounted || !snap.exists()) return;
        const d = snap.data();
        const cmsRecord: CmsResourceRecord = {
          slug: String(d.slug || snap.id),
          title: String(d.title || ''),
          shortDescription: String(d.shortDescription || ''),
          fullDescription: String(d.fullDescription || ''),
          resourceType: String(d.resourceType || 'ui-component'),
          primaryCategory: String(d.primaryCategory || 'design-fundamentals'),
          subcategories: Array.isArray(d.subcategories)
            ? d.subcategories.map(String)
            : [],
          tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
          aliases: Array.isArray(d.aliases) ? d.aliases.map(String) : [],
          difficulty: (d.difficulty as CmsDifficultyLevel) || 'intermediate',
          previewType: (d.previewType as CmsPreviewType) || 'html-css-js',
          codeHtml: String(d.codeHtml || ''),
          codeCss: String(d.codeCss || ''),
          codeJs: String(d.codeJs || ''),
          responsiveViewports: Array.isArray(d.responsiveViewports)
            ? d.responsiveViewports.map(String)
            : ['desktop', 'tablet', 'mobile'],
          previewVerified: Boolean(d.previewVerified),
          conceptExplanation: String(d.conceptExplanation || ''),
          howItWorks: String(d.howItWorks || ''),
          useCases: String(d.useCases || ''),
          advantages: String(d.advantages || ''),
          limitations: String(d.limitations || ''),
          bestPractices: String(d.bestPractices || ''),
          commonMistakes: String(d.commonMistakes || ''),
          referenceImageUrl: String(d.referenceImageUrl || ''),
          referenceCaption: String(d.referenceCaption || ''),
          referenceAttribution: String(d.referenceAttribution || ''),
          framework: String(d.framework || 'Web Standards'),
          dependenciesList: Array.isArray(d.dependenciesList)
            ? d.dependenciesList.map(String)
            : [],
          installInstructions: String(d.installInstructions || ''),
          desktopBehavior: String(d.desktopBehavior || ''),
          tabletBehavior: String(d.tabletBehavior || ''),
          mobileBehavior: String(d.mobileBehavior || ''),
          browserSupport: String(d.browserSupport || ''),
          accessibilityNotes: String(d.accessibilityNotes || ''),
          reducedMotionFallback: String(d.reducedMotionFallback || ''),
          performanceNotes: String(d.performanceNotes || ''),
          editableControlsSpec: String(d.editableControlsSpec || ''),
          relatedResources: Array.isArray(d.relatedResources)
            ? d.relatedResources.map(String)
            : [],
          prerequisites: Array.isArray(d.prerequisites)
            ? d.prerequisites.map(String)
            : [],
          alternatives: Array.isArray(d.alternatives)
            ? d.alternatives.map(String)
            : [],
          relatedTechnologies: Array.isArray(d.relatedTechnologies)
            ? d.relatedTechnologies.map(String)
            : [],
          status: (d.status as CmsResourceStatus) || 'published',
          authorUid: String(d.authorUid || ''),
          authorName: String(d.authorName || ''),
          reviewerName: String(d.reviewerName || ''),
          reviewNotes: String(d.reviewNotes || ''),
          license: String(d.license || ''),
          sources: String(d.sources || ''),
          revisionNumber: Number(d.revisionNumber || 1),
          publishedAtIso: String(d.publishedAtIso || ''),
          lastVerifiedIso: String(d.lastVerifiedIso || ''),
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
        setCmsOverrideResource(convertCmsRecordToDesignResource(cmsRecord));
      } catch {
        // Fallback to seed registry if document doesn't exist or is a private draft
      }
    };
    void fetchCmsDoc();
    return () => {
      isMounted = false;
    };
  }, [resourceSlug]);

  const activeResource =
    cmsOverrideResource ||
    getResourceBySlug(resourceSlug) ||
    FOUNDATION_RESOURCES[0];
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setCollection(loadPersonalCollection());
      recordRealResourceView(activeResource.slug);
      void recordRecentlyViewed(activeResource.slug);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [activeResource.slug, recordRecentlyViewed]);

  const parentCategory = getCategoryBySlug(activeResource.categorySlug);

  const syncedCollection = {
    ...collection,
    resourceSlugs: bookmarkedSlugs,
  };

  const handleToggleBookmark = (slug: string) => {
    setCollection((prev) => toggleBookmarkInCollection(prev, slug));
    void toggleBookmark(slug).then((res) => {
      pushToast({
        tone: 'success',
        title: res.saved
          ? 'Saved to Personal Library'
          : 'Removed from Personal Library',
        description: `Bookmark updated for ${slug}.`,
      });
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
            href: `/taxonomy/${
              parentCategory ? parentCategory.slug : activeResource.categorySlug
            }`,
          },
          { label: activeResource.title, isCurrent: true },
        ]}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourceDetailTemplate
          resource={activeResource}
          allResources={
            cmsOverrideResource
              ? [cmsOverrideResource, ...FOUNDATION_RESOURCES]
              : FOUNDATION_RESOURCES
          }
          collection={syncedCollection}
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
