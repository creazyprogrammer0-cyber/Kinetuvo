'use client';

import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { HeroInteractiveShowcase } from '@/components/home/HeroInteractiveShowcase';
import { FeaturedExplorationSections } from '@/components/home/FeaturedExplorationSections';
import { InteractiveMiniDemosSection } from '@/components/home/InteractiveMiniDemosSection';
import { InteractiveConceptLab } from '@/components/workbench/InteractiveConceptLab';
import {
  ArchitecturalLayerSpec,
  DesignResource,
  PersonalCollection,
  TaxonomyCategory,
} from '@/types/encyclopedia';
import {
  DEFAULT_COLLECTION,
  loadPersonalCollection,
  toggleBookmarkInCollection,
  addParameterPresetToCollection,
} from '@/lib/collections/storage-adapter';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useToast } from '@/components/ui/InteractionPrimitives';

interface EncyclopediaFoundationShellProps {
  categories: TaxonomyCategory[];
  resources: DesignResource[];
  layers: ArchitecturalLayerSpec[];
}

export function EncyclopediaFoundationShell({
  categories,
  resources,
}: EncyclopediaFoundationShellProps) {
  const { isDarkTheme, reducedMotionSim } = useTheme();
  const { pushToast } = useToast();

  const [activeSection, setActiveSection] = useState<string>('interactive-lab');
  const [selectedResourceSlug, setSelectedResourceSlug] = useState<string>(
    resources[0]?.slug || 'material-3-semantic-token-hierarchy'
  );
  const [collection, setCollection] = useState<PersonalCollection>(
    DEFAULT_COLLECTION
  );

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setCollection(loadPersonalCollection());
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const handleNavigateSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({
        behavior: reducedMotionSim ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  const handleSelectAndLaunchResource = (slug: string) => {
    setSelectedResourceSlug(slug);
    handleNavigateSection('interactive-lab');
  };

  const handleToggleBookmark = (slug: string) => {
    const exists = collection.resourceSlugs.includes(slug);
    setCollection((prev) => toggleBookmarkInCollection(prev, slug));
    pushToast({
      tone: 'success',
      title: exists ? 'Bookmark Removed' : 'Saved to Personal Collection',
      description: `Resource "${slug}" updated in local storage.`,
    });
  };

  const handleSavePreset = (
    resourceSlug: string,
    resourceTitle: string,
    presetName: string,
    parameterValues: Record<string, number | string | boolean>
  ) => {
    setCollection((prev) =>
      addParameterPresetToCollection(prev, {
        resourceSlug,
        resourceTitle,
        presetName,
        parameterValues,
      })
    );
    pushToast({
      tone: 'success',
      title: 'Parameter Preset Snapshot Saved',
      description: `${resourceTitle.split('&')[0].trim()}: ${presetName}`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)] transition-colors">
      {/* Section 2: Global Header, Structured Mega Menu, Search (⌘K), Theme Toggle & User Account */}
      <AppHeader
        activeSection={activeSection}
        onNavigateSection={handleNavigateSection}
        onLaunchLab={() => handleNavigateSection('interactive-lab')}
        categories={categories}
        resources={resources}
        onSelectResource={handleSelectAndLaunchResource}
      />

      {/* Main Homepage Container (1360px max width) */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16"
      >
        {/* Sections 3 & 4: Hero Section, Live Interactive Visual Specimen & Global Search Preview */}
        <HeroInteractiveShowcase
          categories={categories}
          resources={resources}
          onExploreCategories={() => handleNavigateSection('explore-categories')}
          onSelectConceptForLab={handleSelectAndLaunchResource}
        />

        {/* Section 5 (A-H): Featured Exploration (16 Categories, Featured Systems, Motion of the Week, Interactive Components, Visual Styles, Playground Promo, Recently Added, Foundational Benchmarks) */}
        <FeaturedExplorationSections
          categories={categories}
          resources={resources}
          collection={collection}
          onSelectConceptForLab={handleSelectAndLaunchResource}
          onToggleBookmark={handleToggleBookmark}
        />

        {/* Section 6: Dedicated Interactive Showcase (7 Live Mini Demonstrations) */}
        <InteractiveMiniDemosSection />

        {/* Full Embedded Direct-Manipulation Concept Laboratory & Real-Time Property Inspector */}
        <div className="pt-8 border-t border-[var(--ds-border)]">
          <InteractiveConceptLab
            resources={resources}
            selectedSlug={selectedResourceSlug}
            onSelectResource={setSelectedResourceSlug}
            collection={collection}
            onToggleBookmark={handleToggleBookmark}
            onSavePreset={handleSavePreset}
            isDarkTheme={isDarkTheme}
            globalReducedMotionSim={reducedMotionSim}
          />
        </div>
      </main>

      {/* Section 7: Complete Homepage Footer */}
      <AppFooter />
    </div>
  );
}
