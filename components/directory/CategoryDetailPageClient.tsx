'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  FolderTree,
  Compass,
  Plus,
  Search,
  Sliders,
  Layers,
} from 'lucide-react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import {
  TAXONOMY_CATEGORIES,
  addCustomSubcategoryNode,
  flattenSubcategoryTree,
  getCategoryBySlug,
  getCategoryResourceCount,
  getClassificationDescriptor,
  loadCustomSubcategoryNodes,
  mergeSubcategoryTrees,
  resourceBelongsToCategory,
} from '@/lib/taxonomy/registry';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import {
  FeaturedResourceCard,
  ResourceCard,
  ResourceMetadata,
  SemanticAlert,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';
import {
  Button,
  Dialog,
  Drawer,
  useToast,
} from '@/components/ui/InteractionPrimitives';
import {
  RecursiveSubcategoryTree,
  ResourceDirectoryBrowser,
} from '@/components/directory/ResourceDirectoryBrowser';
import {
  DEFAULT_COLLECTION,
  loadPersonalCollection,
  toggleBookmarkInCollection,
} from '@/lib/collections/storage-adapter';
import { TaxonomySubcategoryNode } from '@/types/encyclopedia';
import { CANONICAL_TECHNOLOGIES } from '@/lib/seo/metadata-architect';

export function CategoryDetailPageClient({
  categorySlug,
}: {
  categorySlug: string;
}) {
  const { pushToast } = useToast();
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [mobileCatDrawerOpen, setMobileCatDrawerOpen] =
    useState<boolean>(false);

  // Runtime nested subcategory administration state
  const [customSubcategoryMap, setCustomSubcategoryMap] = useState<
    Record<string, TaxonomySubcategoryNode[]>
  >({});
  const [addSubcategoryModalOpen, setAddSubcategoryModalOpen] =
    useState<boolean>(false);
  const [newSubParentId, setNewSubParentId] = useState<string>('');
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubDesc, setNewSubDesc] = useState<string>('');

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setCollection(loadPersonalCollection());
      setCustomSubcategoryMap(loadCustomSubcategoryNodes());
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const category =
    getCategoryBySlug(categorySlug) || TAXONOMY_CATEGORIES[0];
  const descriptor = getClassificationDescriptor(category.classification);

  // Merge built-in deep subcategory tree with any runtime-added nested nodes
  const mergedSubcategoryTree = useMemo(() => {
    const customNodes = customSubcategoryMap[category.slug] || [];
    return mergeSubcategoryTrees(category.subcategoryTree || [], customNodes);
  }, [category.slug, category.subcategoryTree, customSubcategoryMap]);

  const flattenedSubNodes = useMemo(
    () => flattenSubcategoryTree(mergedSubcategoryTree),
    [mergedSubcategoryTree]
  );

  // All resources belonging to this category via primary or multi-category membership
  const categoryResources = useMemo(() => {
    const matched = FOUNDATION_RESOURCES.filter((r) =>
      resourceBelongsToCategory(r, category)
    );
    return matched.length > 0 ? matched : FOUNDATION_RESOURCES.slice(0, 3);
  }, [category]);

  // Featured resources in this category
  const featuredInCategory = useMemo(() => {
    const explicitFeatured = categoryResources.filter(
      (r) =>
        r.isFeatured ||
        (category.featuredResourceSlugs &&
          category.featuredResourceSlugs.includes(r.slug))
    );
    return explicitFeatured.length > 0
      ? explicitFeatured
      : categoryResources.slice(0, 1);
  }, [categoryResources, category.featuredResourceSlugs]);

  // Technology & Framework associations in this category
  const categoryTechnologies = useMemo(() => {
    const set = new Set<string>();
    categoryResources.forEach((r) => {
      (r.technologies || []).forEach((t) => set.add(t));
      (r.frameworks || []).forEach((f) => set.add(f));
    });
    return Array.from(set);
  }, [categoryResources]);

  // Difficulty distribution breakdown across this category
  const difficultyDistribution = useMemo(() => {
    const total = Math.max(1, categoryResources.length);
    const counts = {
      beginner: categoryResources.filter((r) => r.audienceLevel === 'beginner')
        .length,
      intermediate: categoryResources.filter(
        (r) => r.audienceLevel === 'intermediate'
      ).length,
      advanced: categoryResources.filter((r) => r.audienceLevel === 'advanced')
        .length,
      'all-levels': categoryResources.filter(
        (r) => r.audienceLevel === 'all-levels'
      ).length,
    };
    return [
      {
        id: 'beginner',
        label: 'Beginner',
        count: counts.beginner,
        percent: Math.round((counts.beginner / total) * 100),
      },
      {
        id: 'intermediate',
        label: 'Intermediate',
        count: counts.intermediate,
        percent: Math.round((counts.intermediate / total) * 100),
      },
      {
        id: 'advanced',
        label: 'Advanced',
        count: counts.advanced,
        percent: Math.round((counts.advanced / total) * 100),
      },
      {
        id: 'all-levels',
        label: 'All Levels',
        count: counts['all-levels'],
        percent: Math.round((counts['all-levels'] / total) * 100),
      },
    ];
  }, [categoryResources]);

  // Related categories
  const relatedCategories = useMemo(() => {
    const slugs = category.relatedCategorySlugs || [];
    const resolved = slugs
      .map((s) => getCategoryBySlug(s))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    return resolved.length > 0
      ? resolved
      : TAXONOMY_CATEGORIES.filter((c) => c.slug !== category.slug).slice(0, 3);
  }, [category]);

  // Filter resources by selected subcategory & quick in-category search
  const filteredCategoryResources = useMemo(() => {
    return categoryResources.filter((res) => {
      if (selectedSubcategory !== 'all') {
        const subCandidates = [
          res.subcategory || '',
          ...(res.nestedCategoryPath || []),
        ].map((s) => s.toLowerCase());
        const matchesSub = subCandidates.some((c) =>
          c.includes(selectedSubcategory.toLowerCase())
        );
        if (!matchesSub) return false;
      }
      if (categorySearchQuery.trim()) {
        const q = categorySearchQuery.toLowerCase();
        const text = [
          res.title,
          res.summary,
          res.subcategory || '',
          ...(res.technologies || []),
          ...(res.tags || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [categoryResources, selectedSubcategory, categorySearchQuery]);

  const handleToggleBookmark = (slug: string) => {
    setCollection((prev) => toggleBookmarkInCollection(prev, slug));
    pushToast({
      tone: 'success',
      title: 'Personal Collection Updated',
      description: `Bookmark toggled for ${slug}.`,
    });
  };

  const handleAddSubcategoryNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const parentNode = flattenedSubNodes.find((n) => n.id === newSubParentId);
    const depth = parentNode ? parentNode.depth + 1 : 2;
    const node: TaxonomySubcategoryNode = {
      id: `sub-${Date.now()}`,
      slug: newSubName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      name: newSubName.trim(),
      description:
        newSubDesc.trim() ||
        `Depth-${depth} nested subcategory node inside ${category.name}.`,
      depth,
      parentId: newSubParentId || undefined,
      tags: [`depth-${depth}`, category.slug],
      children: [],
    };

    const nextMap = addCustomSubcategoryNode(category.slug, node);
    setCustomSubcategoryMap({ ...nextMap });
    setNewSubName('');
    setNewSubDesc('');
    setAddSubcategoryModalOpen(false);
    pushToast({
      tone: 'success',
      title: `Created Depth-${depth} Subcategory`,
      description: `"${node.name}" added to ${category.name}.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          { label: 'Resource Directory', href: '/directory' },
          {
            label: `${String(category.orderIndex).padStart(2, '0')}. ${category.name}`,
            isCurrent: true,
          },
        ]}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10"
      >
        {/* Top Mobile Bar for Category Switching */}
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Full Resource Directory</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Compass className="w-3.5 h-3.5" />}
            onClick={() => setMobileCatDrawerOpen(true)}
          >
            Switch Category (16)
          </Button>
        </div>

        {/* 12-Column Architecture: Desktop Sticky Sidebar Navigation (3 Cols) + Category Content (9 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sticky Sidebar Category Navigation (All 16 Primary Categories) */}
          <aside
            aria-label="16 Primary Encyclopedia Categories"
            className="hidden lg:block lg:col-span-3 p-4 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] sticky top-20 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-2.5">
              <span className="text-[11px] font-mono font-bold text-[var(--ds-accent)]">
                16 PRIMARY CATEGORIES
              </span>
              <Link
                href="/directory"
                className="text-[11px] font-semibold text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
              >
                Directory →
              </Link>
            </div>

            <nav className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
              {TAXONOMY_CATEGORIES.map((cat) => {
                const isCurrent = cat.slug === category.slug;
                const count = getCategoryResourceCount(
                  cat,
                  FOUNDATION_RESOURCES
                );
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className={`px-2.5 py-2 rounded-[8px] text-xs flex items-center justify-between gap-2 transition-colors ${
                      isCurrent
                        ? 'bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-bold border border-[var(--ds-accent)]'
                        : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]'
                    }`}
                  >
                    <span className="truncate">
                      <span className="font-mono text-[10px] text-[var(--ds-accent)] mr-1.5 tabular-nums">
                        {String(cat.orderIndex).padStart(2, '0')}
                      </span>
                      {cat.name}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums shrink-0">
                      {count}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Category Monograph & Explorer (9 Columns) */}
          <div className="lg:col-span-9 space-y-10">
            {/* 1. CATEGORY INTRODUCTION, VISUAL COVER & OVERVIEW */}
            <section className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ResourceMetadata
                  items={[
                    `Primary Category ${String(category.orderIndex).padStart(2, '0')} of 16`,
                    descriptor.label,
                    `${categoryResources.length} Associated Resources`,
                    `${flattenedSubNodes.length} Nested Subcategory Nodes`,
                  ]}
                />
                <Link
                  href="/directory"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  All Categories & Directory
                </Link>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                <div className="xl:col-span-7 space-y-3">
                  <h1
                    style={{ fontSize: 'clamp(1.75rem, 2.6vw, 2.35rem)' }}
                    className="font-display font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
                  >
                    {String(category.orderIndex).padStart(2, '0')}.{' '}
                    {category.name}
                  </h1>
                  <p className="text-sm sm:text-base text-[var(--ds-foreground)]/90 font-medium leading-relaxed">
                    {category.shortDescription}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                    {category.overviewParagraph || category.architecturalScope}
                  </p>
                </div>

                {/* Visual Cover / Featured Visual Identity Specimen */}
                <div className="xl:col-span-5 p-5 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border-strong)] space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ds-accent)]">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Layers className="w-3.5 h-3.5" />
                      <span>CATEGORY VISUAL SPECIMEN</span>
                    </span>
                    <span className="tabular-nums">
                      TRACK {String(category.orderIndex).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-[8px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-2">
                    <div className="font-mono text-xs font-bold text-[var(--ds-foreground)]">
                      {category.featuredVisualMotif ||
                        category.architecturalScope}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2 rounded bg-[var(--ds-background)] border border-[var(--ds-border)] text-center">
                        <div className="font-mono text-xs font-bold text-[var(--ds-accent)] tabular-nums">
                          {category.subcategories.length}
                        </div>
                        <div className="text-[10px] text-[var(--ds-muted-foreground)]">
                          Core Tracks
                        </div>
                      </div>
                      <div className="p-2 rounded bg-[var(--ds-background)] border border-[var(--ds-border)] text-center">
                        <div className="font-mono text-xs font-bold text-[var(--ds-accent)] tabular-nums">
                          {flattenedSubNodes.length}
                        </div>
                        <div className="text-[10px] text-[var(--ds-muted-foreground)]">
                          Tree Nodes
                        </div>
                      </div>
                      <div className="p-2 rounded bg-[var(--ds-background)] border border-[var(--ds-border)] text-center">
                        <div className="font-mono text-xs font-bold text-[var(--ds-accent)] tabular-nums">
                          {categoryResources.length}
                        </div>
                        <div className="text-[10px] text-[var(--ds-muted-foreground)]">
                          Monographs
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Link href="/playground">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Code2 className="w-3.5 h-3.5" />}
                      >
                        Open in Playground
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => setAddSubcategoryModalOpen(true)}
                    >
                      Add Subcategory Node
                    </Button>
                  </div>
                </div>
              </div>

              {/* Technology Associations & Difficulty Distribution Split */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 border-t border-[var(--ds-border)]">
                {/* Technology Associations */}
                <div className="md:col-span-7 space-y-2">
                  <div className="text-xs font-mono font-bold text-[var(--ds-foreground)]">
                    TECHNOLOGY & SPECIFICATION ASSOCIATIONS
                  </div>
                  <div className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    {categoryTechnologies.length > 0
                      ? categoryTechnologies.join(' · ')
                      : 'W3C Web Standards · CSS Custom Properties · Semantic HTML5'}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    {CANONICAL_TECHNOLOGIES.slice(0, 4).map((tech) => (
                      <Link
                        key={tech.slug}
                        href={`/technologies/${tech.slug}`}
                        className="font-mono text-[11px] text-[var(--ds-accent)] hover:underline"
                      >
                        /technologies/{tech.slug}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Difficulty Distribution Breakdown */}
                <div className="md:col-span-5 space-y-2">
                  <div className="text-xs font-mono font-bold text-[var(--ds-foreground)]">
                    DIFFICULTY DISTRIBUTION
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {difficultyDistribution.map((d) => (
                      <div
                        key={d.id}
                        className="p-2 rounded-[6px] bg-[var(--ds-background)] border border-[var(--ds-border)] flex items-center justify-between text-xs"
                      >
                        <span className="text-[var(--ds-muted-foreground)]">
                          {d.label}
                        </span>
                        <span className="font-mono font-bold text-[var(--ds-foreground)] tabular-nums">
                          {d.count} ({d.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. MULTI-LEVEL SUBCATEGORY TREE NAVIGATION (UNLIMITED DEPTH 2, 3, 4+) */}
            <section className="p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ds-border)] pb-3">
                <div>
                  <TechnicalLabel
                    kicker="MULTI-LEVEL SUBCATEGORY HIERARCHY"
                    detail="Unlimited Nesting Depth (Level 2 → Level 3 → Level 4+)"
                  />
                  <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)] mt-1">
                    Subcategory & Child Concept Tree
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSubcategory !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSubcategory('all')}
                    >
                      Clear Track Filter
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<FolderTree className="w-3.5 h-3.5" />}
                    onClick={() => setAddSubcategoryModalOpen(true)}
                  >
                    Add Child Node
                  </Button>
                </div>
              </div>

              {/* Flat Quick-Filter Buttons for Top Subcategories */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory('all')}
                  className={`px-2.5 py-1 text-xs rounded-[6px] transition-colors ${
                    selectedSubcategory === 'all'
                      ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-semibold'
                      : 'bg-[var(--ds-muted)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                  }`}
                >
                  All Subcategories ({category.subcategories.length})
                </button>
                {category.subcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-2.5 py-1 text-xs rounded-[6px] transition-colors ${
                      selectedSubcategory === sub
                        ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-semibold'
                        : 'bg-[var(--ds-muted)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Recursive Multi-Level Tree */}
              {mergedSubcategoryTree.length > 0 && (
                <div className="pt-2">
                  <RecursiveSubcategoryTree
                    nodes={mergedSubcategoryTree}
                    selectedSubcategory={selectedSubcategory}
                    onSelectSubcategory={setSelectedSubcategory}
                  />
                </div>
              )}
            </section>

            {/* 3. FEATURED RESOURCES IN THIS CATEGORY */}
            {featuredInCategory.length > 0 && (
              <section className="space-y-4">
                <TechnicalLabel
                  kicker="FEATURED CATEGORY BENCHMARK"
                  detail={`Primary Reference Monograph in ${category.name}`}
                />
                <FeaturedResourceCard
                  resource={featuredInCategory[0]}
                  onLaunch={(slug) => {
                    window.location.href = `/resources/${slug}`;
                  }}
                />
              </section>
            )}

            {/* 4. SEARCH WITHIN CATEGORY & ALL RELATED RESOURCES */}
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--ds-border)] pb-3">
                <div>
                  <TechnicalLabel
                    kicker="CATEGORY RESOURCES & MULTI-CATEGORY MEMBERS"
                    detail={`Active Subcategory: ${
                      selectedSubcategory === 'all'
                        ? 'All Tracks'
                        : selectedSubcategory
                    }`}
                  />
                  <h2 className="font-display text-xl font-bold text-[var(--ds-foreground)] mt-1">
                    All Resources in {category.name} (
                    {filteredCategoryResources.length})
                  </h2>
                </div>

                {/* Search Within Category Input */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-[var(--ds-muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder={`Search within ${category.name}...`}
                    aria-label={`Search within ${category.name}`}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
                  />
                </div>
              </div>

              {filteredCategoryResources.length === 0 ? (
                <SemanticAlert
                  variant="warning"
                  title="No Resources Matched Your In-Category Filter"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubcategory('all');
                        setCategorySearchQuery('');
                      }}
                    >
                      Reset Category Search
                    </Button>
                  }
                >
                  No concepts in {category.name} matched &quot;
                  {categorySearchQuery || selectedSubcategory}&quot;. Reset the
                  track filter to view all {categoryResources.length} category
                  resources.
                </SemanticAlert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredCategoryResources.map((res) => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      isBookmarked={collection.resourceSlugs.includes(res.slug)}
                      onLaunch={(slug) => {
                        window.location.href = `/resources/${slug}`;
                      }}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 5. RELATED CATEGORIES */}
            <section className="space-y-4 pt-6 border-t border-[var(--ds-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <TechnicalLabel
                    kicker="ADJACENT KNOWLEDGE DOMAINS"
                    detail="Cross-Referenced Encyclopedia Categories"
                  />
                  <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)] mt-1">
                    Related Primary Categories
                  </h3>
                </div>
                <Link
                  href="/directory"
                  className="text-xs font-semibold text-[var(--ds-accent)] hover:underline"
                >
                  Open Multi-Category Directory →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedCategories.map((rel) => {
                  const relCount = getCategoryResourceCount(
                    rel,
                    FOUNDATION_RESOURCES
                  );
                  return (
                    <Link
                      key={rel.id}
                      href={`/categories/${rel.slug}`}
                      className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors flex flex-col justify-between space-y-2 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono text-[var(--ds-accent)]">
                          <span>
                            {String(rel.orderIndex).padStart(2, '0')} ·{' '}
                            {relCount} Resources
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <div className="font-display text-sm font-bold text-[var(--ds-foreground)] group-hover:text-[var(--ds-accent)]">
                          {rel.name}
                        </div>
                        <p className="text-xs text-[var(--ds-muted-foreground)] line-clamp-2">
                          {rel.shortDescription}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 6. EMBEDDED MULTI-FACET DIRECTORY SCOPED TO THIS CATEGORY */}
            <div className="pt-8 border-t border-[var(--ds-border)]">
              <ResourceDirectoryBrowser
                lockedCategorySlug={category.slug}
                title={`Advanced Multi-Facet Explorer — ${category.name}`}
                subtitle={`Combine difficulty, technology, framework, accessibility compliance, and demonstration format filters within ${category.name}.`}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Slide-In Category Navigation Drawer */}
      <Drawer
        isOpen={mobileCatDrawerOpen}
        onClose={() => setMobileCatDrawerOpen(false)}
        title="16 Primary Categories"
        subtitle="Switch active encyclopedia track"
        side="left"
      >
        <div className="space-y-1.5">
          {TAXONOMY_CATEGORIES.map((cat) => {
            const isCurrent = cat.slug === category.slug;
            const count = getCategoryResourceCount(cat, FOUNDATION_RESOURCES);
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                onClick={() => setMobileCatDrawerOpen(false)}
                className={`px-3 py-2.5 rounded-[8px] text-xs flex items-center justify-between ${
                  isCurrent
                    ? 'bg-[var(--ds-secondary)] font-bold text-[var(--ds-foreground)] border border-[var(--ds-accent)]'
                    : 'text-[var(--ds-muted-foreground)] hover:bg-[var(--ds-muted)]'
                }`}
              >
                <span>
                  <span className="font-mono text-[10px] text-[var(--ds-accent)] mr-1.5">
                    {String(cat.orderIndex).padStart(2, '0')}
                  </span>
                  {cat.name}
                </span>
                <span className="font-mono text-[10px] tabular-nums">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </Drawer>

      {/* Modal to Add Nested Subcategory Node at Depth 2, 3, 4+ */}
      <Dialog
        isOpen={addSubcategoryModalOpen}
        onClose={() => setAddSubcategoryModalOpen(false)}
        title={`Add Subcategory Node to ${category.name}`}
        description="Supports unlimited hierarchical depth (Level 2, Level 3, Level 4+) without code modifications."
      >
        <form onSubmit={handleAddSubcategoryNode} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="cat-parent-node"
              className="block text-xs font-semibold text-[var(--ds-foreground)]"
            >
              Parent Node (Leave at Root for Level 2, or pick any node to nest
              deeper)
            </label>
            <select
              id="cat-parent-node"
              value={newSubParentId}
              onChange={(e) => setNewSubParentId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
            >
              <option value="">
                Category Root (Level 2 Subcategory)
              </option>
              {flattenedSubNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {'—'.repeat(Math.max(1, n.depth - 1))} [Depth {n.depth}]{' '}
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cat-sub-name"
              className="block text-xs font-semibold text-[var(--ds-foreground)]"
            >
              Subcategory Name
            </label>
            <input
              id="cat-sub-name"
              type="text"
              required
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="e.g., Interruptible Gesture Velocity Continuation"
              className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cat-sub-desc"
              className="block text-xs font-semibold text-[var(--ds-foreground)]"
            >
              Description
            </label>
            <textarea
              id="cat-sub-desc"
              rows={2}
              value={newSubDesc}
              onChange={(e) => setNewSubDesc(e.target.value)}
              placeholder="Technical scope of this subcategory track..."
              className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddSubcategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              Save Subcategory Node
            </Button>
          </div>
        </form>
      </Dialog>

      <AppFooter />
    </div>
  );
}
