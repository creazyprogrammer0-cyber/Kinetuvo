'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Plus,
  ChevronRight,
  ChevronDown,
  Code2,
  Eye,
  SlidersHorizontal,
  X,
  FolderTree,
  AlertCircle,
} from 'lucide-react';
import {
  AudienceDifficulty,
  DemonstrationFormat,
  DesignResource,
  ResourceClassification,
  TaxonomyCategory,
  TaxonomySubcategoryNode,
} from '@/types/encyclopedia';
import {
  CLASSIFICATION_DESCRIPTORS,
  TAXONOMY_CATEGORIES,
  addCustomSubcategoryNode,
  flattenSubcategoryTree,
  getCategoryResourceCount,
  loadCustomSubcategoryNodes,
  mergeSubcategoryTrees,
  resourceBelongsToCategory,
} from '@/lib/taxonomy/registry';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import {
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
import { LoadingSkeleton } from '@/components/ui/TechnicalPrimitives';
import {
  DEFAULT_COLLECTION,
  loadPersonalCollection,
  toggleBookmarkInCollection,
} from '@/lib/collections/storage-adapter';
import {
  collection as fsCollection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/client';
import {
  CmsDifficultyLevel,
  CmsPreviewType,
  CmsResourceRecord,
  CmsResourceStatus,
  convertCmsRecordToDesignResource,
} from '@/lib/admin/cms-types';

export type DirectorySortMode =
  | 'most-relevant'
  | 'recently-added'
  | 'recently-updated'
  | 'alphabetical'
  | 'popular-verified';

export interface ResourceDirectoryBrowserProps {
  initialCategorySlug?: string;
  initialSubcategory?: string;
  lockedCategorySlug?: string;
  title?: string;
  subtitle?: string;
}

const DIFFICULTY_OPTIONS: { id: AudienceDifficulty; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'all-levels', label: 'All Levels' },
];

function getUrlParamList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  const val = new URLSearchParams(window.location.search).get(key);
  return val ? val.split(',').filter(Boolean) : [];
}

function getUrlParamSingle(key: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(key) || '';
}

export function ResourceDirectoryBrowser({
  initialCategorySlug,
  initialSubcategory,
  lockedCategorySlug,
  title = 'Encyclopedia Resource Directory & Multi-Facet Explorer',
  subtitle = 'Filter across 16 primary categories, deep nested subcategories, 12 canonical resource types, difficulty levels, technologies, frameworks, and accessibility compliance.',
}: ResourceDirectoryBrowserProps) {
  const { pushToast } = useToast();
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [publishedCmsResources, setPublishedCmsResources] = useState<
    DesignResource[]
  >([]);

  // Multi-select filter states initialized deterministically for SSR parity
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (lockedCategorySlug) return [lockedCategorySlug];
    return initialCategorySlug ? [initialCategorySlug] : [];
  });
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    () => (initialSubcategory ? [initialSubcategory] : [])
  );
  const [selectedClassifications, setSelectedClassifications] = useState<
    ResourceClassification[]
  >([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    AudienceDifficulty[]
  >([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(
    []
  );
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [selectedResponsiveSupport, setSelectedResponsiveSupport] = useState<
    string[]
  >([]);
  const [selectedAccessibilityLevels, setSelectedAccessibilityLevels] =
    useState<('AA' | 'AAA')[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDemoFormats, setSelectedDemoFormats] = useState<
    DemonstrationFormat[]
  >([]);
  const [includeDraftResources, setIncludeDraftResources] =
    useState<boolean>(true);
  const [sortMode, setSortMode] = useState<DirectorySortMode>('most-relevant');

  // Edge state / QA inspector toggles (Section 7)
  const [simulateLoadingState, setSimulateLoadingState] =
    useState<boolean>(false);
  const [simulateEmptyLibraryState, setSimulateEmptyLibraryState] =
    useState<boolean>(false);
  const [simulateBrokenMediaState, setSimulateBrokenMediaState] =
    useState<boolean>(false);

  // Mobile filter drawer & Admin runtime taxonomy modal
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [adminTaxonomyModalOpen, setAdminTaxonomyModalOpen] =
    useState<boolean>(false);
  const [customSubcategoryMap, setCustomSubcategoryMap] = useState<
    Record<string, TaxonomySubcategoryNode[]>
  >({});

  // Admin modal fields for runtime taxonomy creation (Depth 2, 3, 4+)
  const [adminTargetCategorySlug, setAdminTargetCategorySlug] =
    useState<string>(
      lockedCategorySlug ||
        initialCategorySlug ||
        TAXONOMY_CATEGORIES[0].slug
    );
  const [adminParentNodeId, setAdminParentNodeId] = useState<string>('');
  const [adminNodeName, setAdminNodeName] = useState<string>('');
  const [adminNodeDescription, setAdminNodeDescription] = useState<string>('');

  // Hydrate URL query parameters and localStorage after client mount
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setCollection(loadPersonalCollection());
      setCustomSubcategoryMap(loadCustomSubcategoryNodes());

      const q = getUrlParamSingle('q');
      if (q) setSearchQuery(q);

      if (!lockedCategorySlug) {
        const cat = getUrlParamList('cat');
        if (cat.length > 0) setSelectedCategories(cat);
      }

      const sub = getUrlParamList('sub');
      if (sub.length > 0) setSelectedSubcategories(sub);

      const type = getUrlParamList('type') as ResourceClassification[];
      if (type.length > 0) setSelectedClassifications(type);

      const diff = getUrlParamList('diff') as AudienceDifficulty[];
      if (diff.length > 0) setSelectedDifficulties(diff);

      const tech = getUrlParamList('tech');
      if (tech.length > 0) setSelectedTechnologies(tech);

      const fw = getUrlParamList('fw');
      if (fw.length > 0) setSelectedFrameworks(fw);

      const a11y = getUrlParamList('a11y') as ('AA' | 'AAA')[];
      if (a11y.length > 0) setSelectedAccessibilityLevels(a11y);

      const tag = getUrlParamList('tag');
      if (tag.length > 0) setSelectedTags(tag);

      const sort = getUrlParamSingle('sort') as DirectorySortMode;
      if (sort) setSortMode(sort);

      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [lockedCategorySlug]);

  // Subscribe to published CMS resources in Firestore (/cms_resources where status == 'published')
  useEffect(() => {
    try {
      const db = getFirebaseDb();
      const q = query(
        fsCollection(db, 'cms_resources'),
        where('status', '==', 'published')
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: DesignResource[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            const cmsRecord: CmsResourceRecord = {
              slug: String(d.slug || docSnap.id),
              title: String(d.title || ''),
              shortDescription: String(d.shortDescription || ''),
              fullDescription: String(d.fullDescription || ''),
              resourceType: String(d.resourceType || 'ui-component'),
              primaryCategory: String(d.primaryCategory || 'ui-components'),
              subcategories: Array.isArray(d.subcategories)
                ? d.subcategories.map(String)
                : [],
              tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
              aliases: Array.isArray(d.aliases) ? d.aliases.map(String) : [],
              difficulty:
                (d.difficulty as CmsDifficultyLevel) || 'intermediate',
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
            list.push(convertCmsRecordToDesignResource(cmsRecord));
          });
          setPublishedCmsResources(list);
        },
        () => {
          // Non-fatal fallback to baseline seed resources
        }
      );
      return () => unsub();
    } catch {
      return undefined;
    }
  }, []);

  // Merge published CMS resources with baseline FOUNDATION_RESOURCES (CMS overrides seed if same slug)
  const allDirectoryResources = useMemo<DesignResource[]>(() => {
    if (publishedCmsResources.length === 0) return FOUNDATION_RESOURCES;
    const cmsSlugSet = new Set(publishedCmsResources.map((r) => r.slug));
    const seedRemaining = FOUNDATION_RESOURCES.filter(
      (r) => !cmsSlugSet.has(r.slug)
    );
    return [...publishedCmsResources, ...seedRemaining];
  }, [publishedCmsResources]);

  // Synchronize filter state back to URL query parameters without reload
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (!lockedCategorySlug && selectedCategories.length > 0) {
      params.set('cat', selectedCategories.join(','));
    }
    if (selectedSubcategories.length > 0) {
      params.set('sub', selectedSubcategories.join(','));
    }
    if (selectedClassifications.length > 0) {
      params.set('type', selectedClassifications.join(','));
    }
    if (selectedDifficulties.length > 0) {
      params.set('diff', selectedDifficulties.join(','));
    }
    if (selectedTechnologies.length > 0) {
      params.set('tech', selectedTechnologies.join(','));
    }
    if (selectedFrameworks.length > 0) {
      params.set('fw', selectedFrameworks.join(','));
    }
    if (selectedAccessibilityLevels.length > 0) {
      params.set('a11y', selectedAccessibilityLevels.join(','));
    }
    if (selectedTags.length > 0) {
      params.set('tag', selectedTags.join(','));
    }
    if (sortMode !== 'most-relevant') {
      params.set('sort', sortMode);
    }

    const queryStr = params.toString();
    const nextUrl = queryStr
      ? `${window.location.pathname}?${queryStr}`
      : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [
    hydrated,
    searchQuery,
    lockedCategorySlug,
    selectedCategories,
    selectedSubcategories,
    selectedClassifications,
    selectedDifficulties,
    selectedTechnologies,
    selectedFrameworks,
    selectedAccessibilityLevels,
    selectedTags,
    sortMode,
  ]);

  // Build dynamic categories with any runtime-added nested subcategory nodes
  const categoriesWithCustomNodes: TaxonomyCategory[] = useMemo(() => {
    return TAXONOMY_CATEGORIES.map((cat) => {
      const customNodes = customSubcategoryMap[cat.slug] || [];
      const mergedTree = mergeSubcategoryTrees(
        cat.subcategoryTree || [],
        customNodes
      );
      return {
        ...cat,
        subcategoryTree: mergedTree,
      };
    });
  }, [customSubcategoryMap]);

  // Extract distinct technologies, frameworks, tags, and subcategories
  const allTechnologies = useMemo(() => {
    const set = new Set<string>();
    allDirectoryResources.forEach((r) =>
      (r.technologies || []).forEach((t) => set.add(t))
    );
    return Array.from(set).sort();
  }, [allDirectoryResources]);

  const allFrameworks = useMemo(() => {
    const set = new Set<string>();
    allDirectoryResources.forEach((r) =>
      (r.frameworks || []).forEach((f) => set.add(f))
    );
    return Array.from(set).sort();
  }, [allDirectoryResources]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    allDirectoryResources.forEach((r) =>
      (r.tags || []).forEach((t) => set.add(t))
    );
    return Array.from(set).sort();
  }, [allDirectoryResources]);

  const availableSubcategoryNames = useMemo(() => {
    const targetCats =
      selectedCategories.length > 0
        ? categoriesWithCustomNodes.filter((c) =>
            selectedCategories.includes(c.slug)
          )
        : categoriesWithCustomNodes;

    const names = new Set<string>();
    targetCats.forEach((cat) => {
      cat.subcategories.forEach((s) => names.add(s));
      flattenSubcategoryTree(cat.subcategoryTree || []).forEach((node) =>
        names.add(node.name)
      );
    });
    return Array.from(names);
  }, [categoriesWithCustomNodes, selectedCategories]);

  // Toggle helper for multi-select arrays
  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    if (simulateEmptyLibraryState) return [];

    const filtered = allDirectoryResources.filter((res) => {
      if (!includeDraftResources && res.publicationStatus === 'draft-preview') {
        return false;
      }

      // 1. Category filter (supports multi-category membership without duplicate records)
      if (selectedCategories.length > 0) {
        const matchesCat = selectedCategories.some((catSlug) => {
          const catObj = categoriesWithCustomNodes.find(
            (c) =>
              c.slug === catSlug ||
              (c.legacyAliases && c.legacyAliases.includes(catSlug))
          );
          return catObj
            ? resourceBelongsToCategory(res, catObj)
            : res.categorySlug === catSlug ||
                (res.categorySlugs && res.categorySlugs.includes(catSlug));
        });
        if (!matchesCat) return false;
      }

      // 2. Subcategory filter (checks subcategory and nestedCategoryPath)
      if (selectedSubcategories.length > 0) {
        const resSubNames = [
          res.subcategory || '',
          ...(res.nestedCategoryPath || []),
        ].map((s) => s.toLowerCase());
        const matchesSub = selectedSubcategories.some((sub) =>
          resSubNames.some((candidate) =>
            candidate.includes(sub.toLowerCase())
          )
        );
        if (!matchesSub) return false;
      }

      // 3. Resource classification (12 canonical types)
      if (
        selectedClassifications.length > 0 &&
        !selectedClassifications.includes(res.classification)
      ) {
        return false;
      }

      // 4. Difficulty level
      if (
        selectedDifficulties.length > 0 &&
        !selectedDifficulties.includes(res.audienceLevel)
      ) {
        return false;
      }

      // 5. Technology
      if (selectedTechnologies.length > 0) {
        const resTech = res.technologies || [];
        if (!selectedTechnologies.some((t) => resTech.includes(t))) {
          return false;
        }
      }

      // 6. Framework
      if (selectedFrameworks.length > 0) {
        const resFw = res.frameworks || [];
        if (!selectedFrameworks.some((f) => resFw.includes(f))) {
          return false;
        }
      }

      // 7. Responsive support
      if (selectedResponsiveSupport.length > 0) {
        const strategy =
          res.accessibilitySpec.responsiveBreakpointStrategy.toLowerCase();
        const matchesResp = selectedResponsiveSupport.some((mode) => {
          if (mode === 'fluid-clamp') {
            return strategy.includes('fluid') || strategy.includes('clamp');
          }
          if (mode === 'container-intrinsic') {
            return (
              strategy.includes('container') || strategy.includes('intrinsic')
            );
          }
          if (mode === 'touch-ergonomic') {
            return (
              strategy.includes('44') ||
              strategy.includes('touch') ||
              strategy.includes('mobile')
            );
          }
          return true;
        });
        if (!matchesResp) return false;
      }

      // 8. Accessibility compliance level (WCAG AA / AAA)
      if (
        selectedAccessibilityLevels.length > 0 &&
        !selectedAccessibilityLevels.includes(
          res.accessibilitySpec.wcagComplianceLevel
        )
      ) {
        return false;
      }

      // 9. Tags
      if (selectedTags.length > 0) {
        const resTags = res.tags || [];
        if (!selectedTags.some((tag) => resTags.includes(tag))) {
          return false;
        }
      }

      // 10. Demonstration format (Runnable Code Demo vs Visual Specimen)
      if (selectedDemoFormats.length > 0) {
        const format = res.demonstrationFormat || 'runnable-code-demo';
        if (!selectedDemoFormats.includes(format)) {
          return false;
        }
      }

      // 11. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          res.title,
          res.summary,
          res.subcategory || '',
          ...(res.nestedCategoryPath || []),
          ...(res.technologies || []),
          ...(res.frameworks || []),
          ...(res.tags || []),
          res.sourceAttribution.authorOrOrganization,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    // Sort results
    return [...filtered].sort((a, b) => {
      if (sortMode === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortMode === 'recently-added') {
        const aTime = Date.parse(a.createdAtIso || a.updatedAtIso);
        const bTime = Date.parse(b.createdAtIso || b.updatedAtIso);
        return bTime - aTime;
      }
      if (sortMode === 'recently-updated') {
        return Date.parse(b.updatedAtIso) - Date.parse(a.updatedAtIso);
      }
      if (sortMode === 'popular-verified') {
        // Real verified telemetry only: sort by curated benchmark flag + real interactive parameter count + contrast ratio
        const aScore =
          (a.isCuratedPopularSample ? 100 : 0) +
          a.interactiveParameters.length * 10 +
          a.accessibilitySpec.minContrastRatio;
        const bScore =
          (b.isCuratedPopularSample ? 100 : 0) +
          b.interactiveParameters.length * 10 +
          b.accessibilitySpec.minContrastRatio;
        return bScore - aScore;
      }
      // most-relevant
      const aRel = (a.isFeatured ? 20 : 0) + a.interactiveParameters.length;
      const bRel = (b.isFeatured ? 20 : 0) + b.interactiveParameters.length;
      return bRel - aRel;
    });
  }, [
    allDirectoryResources,
    simulateEmptyLibraryState,
    includeDraftResources,
    selectedCategories,
    categoriesWithCustomNodes,
    selectedSubcategories,
    selectedClassifications,
    selectedDifficulties,
    selectedTechnologies,
    selectedFrameworks,
    selectedResponsiveSupport,
    selectedAccessibilityLevels,
    selectedTags,
    selectedDemoFormats,
    searchQuery,
    sortMode,
  ]);

  const activeFilterCount =
    (lockedCategorySlug ? 0 : selectedCategories.length) +
    selectedSubcategories.length +
    selectedClassifications.length +
    selectedDifficulties.length +
    selectedTechnologies.length +
    selectedFrameworks.length +
    selectedResponsiveSupport.length +
    selectedAccessibilityLevels.length +
    selectedTags.length +
    selectedDemoFormats.length +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    if (!lockedCategorySlug) setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedClassifications([]);
    setSelectedDifficulties([]);
    setSelectedTechnologies([]);
    setSelectedFrameworks([]);
    setSelectedResponsiveSupport([]);
    setSelectedAccessibilityLevels([]);
    setSelectedTags([]);
    setSelectedDemoFormats([]);
    setSimulateEmptyLibraryState(false);
    setSimulateLoadingState(false);
  };

  const handleToggleBookmark = (slug: string) => {
    setCollection((prev) => toggleBookmarkInCollection(prev, slug));
    pushToast({
      tone: 'success',
      title: 'Personal Collection Updated',
      description: `Saved state updated for ${slug}.`,
    });
  };

  const handleCreateCustomSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNodeName.trim()) return;

    const targetCat = categoriesWithCustomNodes.find(
      (c) => c.slug === adminTargetCategorySlug
    );
    const parentFlatten = flattenSubcategoryTree(
      targetCat?.subcategoryTree || []
    );
    const parentObj = parentFlatten.find((n) => n.id === adminParentNodeId);
    const depth = parentObj ? parentObj.depth + 1 : 2;

    const newNode: TaxonomySubcategoryNode = {
      id: `custom-${Date.now()}`,
      slug: adminNodeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      name: adminNodeName.trim(),
      description:
        adminNodeDescription.trim() ||
        `Dynamic depth-${depth} subcategory node added via Taxonomy Engine.`,
      depth,
      parentId: adminParentNodeId || undefined,
      tags: ['custom-taxonomy-node', `depth-${depth}`],
      children: [],
    };

    const nextMap = addCustomSubcategoryNode(adminTargetCategorySlug, newNode);
    setCustomSubcategoryMap({ ...nextMap });
    setAdminNodeName('');
    setAdminNodeDescription('');
    setAdminTaxonomyModalOpen(false);

    pushToast({
      tone: 'success',
      title: `Added Depth-${depth} Subcategory Node`,
      description: `"${newNode.name}" is now live in ${targetCat?.name} without code modifications.`,
    });
  };

  // Reusable Filter Controls Sidebar Content (shared between desktop sticky sidebar and mobile drawer)
  const renderFilterFacets = () => (
    <div className="space-y-6 text-xs">
      {/* 1. Primary Category Multi-Select (hidden if locked to a single category page) */}
      {!lockedCategorySlug && (
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono font-bold text-[var(--ds-foreground)]">
            <span>01. PRIMARY CATEGORIES (16)</span>
            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="text-[11px] text-[var(--ds-accent)] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 border border-[var(--ds-border)] rounded-[8px] p-2 bg-[var(--ds-background)]">
            {categoriesWithCustomNodes.map((cat) => {
              const isChecked = selectedCategories.includes(cat.slug);
              const count = getCategoryResourceCount(cat, FOUNDATION_RESOURCES);
              return (
                <label
                  key={cat.id}
                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-semibold'
                      : 'hover:bg-[var(--ds-muted)] text-[var(--ds-muted-foreground)]'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        setSelectedCategories((prev) =>
                          toggleArrayItem(prev, cat.slug)
                        )
                      }
                      className="accent-[var(--ds-primary)] rounded"
                    />
                    <span className="truncate">
                      <span className="font-mono text-[10px] text-[var(--ds-accent)] mr-1">
                        {String(cat.orderIndex).padStart(2, '0')}
                      </span>
                      {cat.name}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] tabular-nums shrink-0">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Subcategory Multi-Select */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono font-bold text-[var(--ds-foreground)]">
          <span>02. SUBCATEGORIES & DEEP NODES</span>
          {selectedSubcategories.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSubcategories([])}
              className="text-[11px] text-[var(--ds-accent)] hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        <div className="max-h-44 overflow-y-auto space-y-1 pr-1 border border-[var(--ds-border)] rounded-[8px] p-2 bg-[var(--ds-background)]">
          {availableSubcategoryNames.slice(0, 28).map((subName) => {
            const isChecked = selectedSubcategories.includes(subName);
            return (
              <label
                key={subName}
                className={`flex items-center gap-2 px-2 py-1 rounded-[6px] cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-semibold'
                    : 'hover:bg-[var(--ds-muted)] text-[var(--ds-muted-foreground)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    setSelectedSubcategories((prev) =>
                      toggleArrayItem(prev, subName)
                    )
                  }
                  className="accent-[var(--ds-primary)] rounded"
                />
                <span className="truncate">{subName}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Resource Type (All 12 Canonical Classifications) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono font-bold text-[var(--ds-foreground)]">
          <span>03. RESOURCE TYPE (12 TYPES)</span>
          {selectedClassifications.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedClassifications([])}
              className="text-[11px] text-[var(--ds-accent)] hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        <div className="space-y-1 border border-[var(--ds-border)] rounded-[8px] p-2 bg-[var(--ds-background)]">
          {CLASSIFICATION_DESCRIPTORS.map((desc) => {
            const isChecked = selectedClassifications.includes(desc.id);
            return (
              <label
                key={desc.id}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-[6px] cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-semibold'
                    : 'hover:bg-[var(--ds-muted)] text-[var(--ds-muted-foreground)]'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      setSelectedClassifications((prev) =>
                        toggleArrayItem(prev, desc.id)
                      )
                    }
                    className="accent-[var(--ds-primary)] rounded"
                  />
                  <span className="truncate">{desc.pluralLabel}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Demonstration Format (Runnable Code Demo vs Visual Specimen) */}
      <div className="space-y-2">
        <div className="font-mono font-bold text-[var(--ds-foreground)]">
          04. DEMONSTRATION FORMAT
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            {
              id: 'runnable-code-demo' as DemonstrationFormat,
              label: 'Runnable Code Demo',
              icon: <Code2 className="w-3.5 h-3.5 text-[var(--ds-accent)]" />,
            },
            {
              id: 'visual-specimen' as DemonstrationFormat,
              label: 'Visual Specimen',
              icon: <Eye className="w-3.5 h-3.5 text-[var(--ds-muted-foreground)]" />,
            },
          ].map((fmt) => {
            const isChecked = selectedDemoFormats.includes(fmt.id);
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() =>
                  setSelectedDemoFormats((prev) => toggleArrayItem(prev, fmt.id))
                }
                className={`px-3 py-2 rounded-[6px] border text-left flex items-center justify-between transition-colors ${
                  isChecked
                    ? 'bg-[var(--ds-secondary)] border-[var(--ds-accent)] font-semibold text-[var(--ds-foreground)]'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {fmt.icon}
                  <span>{fmt.label}</span>
                </span>
                <span className="font-mono text-[10px]">
                  {isChecked ? 'Active' : 'Filter'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Difficulty Level */}
      <div className="space-y-2">
        <div className="font-mono font-bold text-[var(--ds-foreground)]">
          05. DIFFICULTY LEVEL
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {DIFFICULTY_OPTIONS.map((diff) => {
            const isChecked = selectedDifficulties.includes(diff.id);
            return (
              <button
                key={diff.id}
                type="button"
                onClick={() =>
                  setSelectedDifficulties((prev) =>
                    toggleArrayItem(prev, diff.id)
                  )
                }
                className={`px-2.5 py-1.5 rounded-[6px] border text-xs transition-colors ${
                  isChecked
                    ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-primary)] font-semibold'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                }`}
              >
                {diff.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Technology & 7. Framework */}
      <div className="space-y-2">
        <div className="font-mono font-bold text-[var(--ds-foreground)]">
          06. TECHNOLOGY & SPECIFICATION
        </div>
        <div className="max-h-36 overflow-y-auto space-y-1 border border-[var(--ds-border)] rounded-[8px] p-2 bg-[var(--ds-background)]">
          {allTechnologies.map((tech) => {
            const isChecked = selectedTechnologies.includes(tech);
            return (
              <label
                key={tech}
                className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-[var(--ds-muted)] cursor-pointer text-[var(--ds-muted-foreground)]"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    setSelectedTechnologies((prev) =>
                      toggleArrayItem(prev, tech)
                    )
                  }
                  className="accent-[var(--ds-primary)]"
                />
                <span className="truncate">{tech}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-mono font-bold text-[var(--ds-foreground)]">
          07. FRAMEWORK
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allFrameworks.map((fw) => {
            const isChecked = selectedFrameworks.includes(fw);
            return (
              <button
                key={fw}
                type="button"
                onClick={() =>
                  setSelectedFrameworks((prev) => toggleArrayItem(prev, fw))
                }
                className={`px-2.5 py-1 rounded-[6px] border text-[11px] transition-colors ${
                  isChecked
                    ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-primary)] font-semibold'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                }`}
              >
                {fw}
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. Responsive Support & 9. Accessibility Support */}
      <div className="space-y-2">
        <div className="font-mono font-bold text-[var(--ds-foreground)]">
          08. RESPONSIVE & ACCESSIBILITY SUPPORT
        </div>
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {(['AAA', 'AA'] as const).map((lvl) => {
              const isChecked = selectedAccessibilityLevels.includes(lvl);
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() =>
                    setSelectedAccessibilityLevels((prev) =>
                      toggleArrayItem(prev, lvl)
                    )
                  }
                  className={`px-2.5 py-1.5 rounded-[6px] border text-xs font-mono transition-colors ${
                    isChecked
                      ? 'bg-[var(--ds-secondary)] border-[var(--ds-accent)] font-bold text-[var(--ds-foreground)]'
                      : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)]'
                  }`}
                >
                  WCAG {lvl} Verified
                </button>
              );
            })}
          </div>
          {[
            { id: 'fluid-clamp', label: 'Fluid Clamp / Viewport Adaptation' },
            {
              id: 'container-intrinsic',
              label: 'Intrinsic @container Query Ready',
            },
            {
              id: 'touch-ergonomic',
              label: 'Touch Target >= 44px Ergonomics',
            },
          ].map((resp) => {
            const isChecked = selectedResponsiveSupport.includes(resp.id);
            return (
              <label
                key={resp.id}
                className="flex items-center gap-2 px-2 py-1 rounded bg-[var(--ds-background)] border border-[var(--ds-border)] cursor-pointer text-[var(--ds-muted-foreground)]"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    setSelectedResponsiveSupport((prev) =>
                      toggleArrayItem(prev, resp.id)
                    )
                  }
                  className="accent-[var(--ds-primary)]"
                />
                <span>{resp.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 10. Tags */}
      <div className="space-y-2">
        <div className="font-mono font-bold text-[var(--ds-foreground)]">
          09. SEMANTIC TAGS
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
          {allTags.map((tag) => {
            const isChecked = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) => toggleArrayItem(prev, tag))
                }
                className={`px-2 py-1 rounded-[4px] border font-mono text-[10px] transition-colors ${
                  isChecked
                    ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-primary)] font-semibold'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <section aria-label={title} className="space-y-6">
      {/* Header Bar with Search, Sorting, and Admin Taxonomy Extensibility */}
      <div className="p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="ENCYCLOPEDIA TAXONOMY & DIRECTORY"
              detail="16 Categories · Unlimited Subcategory Depth · 12 Resource Types"
            />
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setAdminTaxonomyModalOpen(true)}
            >
              Add Nested Subcategory Node
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="w-3.5 h-3.5" />}
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden"
            >
              Filters ({activeFilterCount})
            </Button>
          </div>
        </div>

        {/* Search Input + Sort Selector + Resilience State Inspector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-[var(--ds-border)]">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[var(--ds-muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter resources by title, subcategory, technology, tag, or author..."
              aria-label="Search encyclopedia directory"
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <label
              htmlFor="directory-sort-select"
              className="text-xs font-mono text-[var(--ds-muted-foreground)] whitespace-nowrap"
            >
              Sort by:
            </label>
            <select
              id="directory-sort-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as DirectorySortMode)}
              className="w-full px-2.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
            >
              <option value="most-relevant">Most Relevant</option>
              <option value="recently-added">Recently Added</option>
              <option value="recently-updated">Recently Updated</option>
              <option value="alphabetical">Alphabetical (A–Z)</option>
              <option value="popular-verified">
                Popular (Verified Telemetry Only)
              </option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ds-muted-foreground)] cursor-pointer">
              <input
                type="checkbox"
                checked={includeDraftResources}
                onChange={(e) => setIncludeDraftResources(e.target.checked)}
                className="accent-[var(--ds-primary)]"
              />
              <span>Show Upcoming Drafts</span>
            </label>
          </div>
        </div>

        {/* Active Filters Bar & Clear All */}
        {activeFilterCount > 0 && (
          <div
            role="status"
            aria-label="Active directory filters"
            className="pt-3 border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-mono text-[11px] font-semibold text-[var(--ds-muted-foreground)] mr-1">
                Active Filters ({activeFilterCount}):
              </span>

              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-mono text-[11px]"
                >
                  <span>Query: &quot;{searchQuery}&quot;</span>
                  <X className="w-3 h-3" />
                </button>
              )}

              {!lockedCategorySlug &&
                selectedCategories.map((catSlug) => (
                  <button
                    key={catSlug}
                    type="button"
                    onClick={() =>
                      setSelectedCategories((p) =>
                        p.filter((c) => c !== catSlug)
                      )
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-mono text-[11px]"
                  >
                    <span>Cat: {catSlug}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}

              {selectedSubcategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() =>
                    setSelectedSubcategories((p) => p.filter((s) => s !== sub))
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-mono text-[11px]"
                >
                  <span>Sub: {sub}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}

              {selectedClassifications.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() =>
                    setSelectedClassifications((p) =>
                      p.filter((c) => c !== cls)
                    )
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-mono text-[11px]"
                >
                  <span>Type: {cls}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}

              {selectedDifficulties.map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() =>
                    setSelectedDifficulties((p) => p.filter((d) => d !== diff))
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-mono text-[11px]"
                >
                  <span>Level: {diff}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}

              {selectedTechnologies.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() =>
                    setSelectedTechnologies((p) => p.filter((t) => t !== tech))
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-mono text-[11px]"
                >
                  <span>Tech: {tech}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}

              {selectedFrameworks.map((fw) => (
                <button
                  key={fw}
                  type="button"
                  onClick={() =>
                    setSelectedFrameworks((p) => p.filter((f) => f !== fw))
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-mono text-[11px]"
                >
                  <span>Framework: {fw}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}

              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setSelectedTags((p) => p.filter((t) => t !== tag))
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-mono text-[11px]"
                >
                  <span>#{tag}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={clearAllFilters}
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Section 7 Edge & Resilience State Inspector Bar */}
        <div className="pt-3 border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono text-[11px] text-[var(--ds-muted-foreground)] inline-flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
            <span>UI State & Edge-Case Verification Bar:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulateLoadingState((p) => !p)}
              className={`px-2.5 py-1 rounded-[6px] border font-mono text-[11px] transition-colors ${
                simulateLoadingState
                  ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-primary)] font-semibold'
                  : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)]'
              }`}
            >
              {simulateLoadingState
                ? 'Loading Skeletons: ON'
                : 'Simulate Loading State'}
            </button>
            <button
              type="button"
              onClick={() => setSimulateEmptyLibraryState((p) => !p)}
              className={`px-2.5 py-1 rounded-[6px] border font-mono text-[11px] transition-colors ${
                simulateEmptyLibraryState
                  ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-primary)] font-semibold'
                  : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)]'
              }`}
            >
              {simulateEmptyLibraryState
                ? 'Empty Archive State: ON'
                : 'Simulate Empty Archive'}
            </button>
            <button
              type="button"
              onClick={() => setSimulateBrokenMediaState((p) => !p)}
              className={`px-2.5 py-1 rounded-[6px] border font-mono text-[11px] transition-colors ${
                simulateBrokenMediaState
                  ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-primary)] font-semibold'
                  : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)]'
              }`}
            >
              {simulateBrokenMediaState
                ? 'Media Fallback: ON'
                : 'Simulate Broken Media Fallback'}
            </button>
          </div>
        </div>
      </div>

      {/* Main 12-Column Layout: Sticky Multi-Select Facet Sidebar + Resource Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Facet Sidebar (3 Columns) */}
        <aside
          aria-label="Multi-select resource filters"
          className="hidden lg:block lg:col-span-3 p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
        >
          {renderFilterFacets()}
        </aside>

        {/* Main Resource Directory Results (9 Columns) */}
        <div className="lg:col-span-9 space-y-5">
          {/* Result Telemetry Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--ds-border)]">
            <ResourceMetadata
              items={[
                `${filteredAndSortedResources.length} Matching ${
                  filteredAndSortedResources.length === 1
                    ? 'Resource'
                    : 'Resources'
                }`,
                `Sort: ${sortMode.replace('-', ' ')}`,
                `${
                  filteredAndSortedResources.filter(
                    (r) =>
                      (r.demonstrationFormat || 'runnable-code-demo') ===
                      'runnable-code-demo'
                  ).length
                } Runnable Code Demos`,
              ]}
            />
            {sortMode === 'popular-verified' && (
              <span className="text-[11px] font-mono text-[var(--ds-accent)]">
                Sorted by Verified Contrast & Parameter Telemetry (Zero Fake
                View Counts)
              </span>
            )}
          </div>

          {/* STATE 1: LOADING RESOURCES SKELETON */}
          {simulateLoadingState ? (
            <div
              role="status"
              aria-label="Loading design resources"
              className="space-y-4"
            >
              <SemanticAlert
                variant="info"
                title="Loading Encyclopedia Resources..."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSimulateLoadingState(false)}
                  >
                    Exit Loading Preview
                  </Button>
                }
              >
                Hydrating multi-category taxonomy relationships, interactive
                parameter descriptors, and WCAG audit specifications.
              </SemanticAlert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LoadingSkeleton variant="card" />
                <LoadingSkeleton variant="card" />
                <LoadingSkeleton variant="card" />
                <LoadingSkeleton variant="card" />
              </div>
            </div>
          ) : simulateEmptyLibraryState ? (
            /* STATE 2: NO RESOURCES FOUND (EMPTY ARCHIVE) */
            <div className="p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] text-center space-y-4">
              <AlertCircle className="w-8 h-8 text-[var(--ds-accent)] mx-auto" />
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                  No Resources Published in This Scope Yet
                </h3>
                <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                  This taxonomy track is ready to accept verified design
                  systems, interactive components, or motion specifications. You
                  can restore the seed encyclopedia catalog or submit a new
                  concept specification.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSimulateEmptyLibraryState(false)}
                >
                  Restore Encyclopedia Catalog
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = '/info/submit-resource';
                  }}
                >
                  Submit a Design Resource
                </Button>
              </div>
            </div>
          ) : filteredAndSortedResources.length === 0 ? (
            /* STATE 3: NO MATCHING FILTERS */
            <div className="p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] text-center space-y-4">
              <Filter className="w-8 h-8 text-[var(--ds-warning)] mx-auto" />
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                  No Matching Resources for Current Filter Combination
                </h3>
                <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                  None of the resources matched all {activeFilterCount} active
                  multi-select constraints simultaneously. Try removing a
                  technology or tag filter, or reset all filters below.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={clearAllFilters}
                >
                  Clear All Filters ({activeFilterCount})
                </Button>
              </div>
            </div>
          ) : (
            /* RESOURCE DIRECTORY CARDS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAndSortedResources.map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  forceBrokenMedia={simulateBrokenMediaState}
                  isBookmarked={collection.resourceSlugs.includes(res.slug)}
                  onLaunch={(slug) => {
                    window.location.href = `/concept/${slug}`;
                  }}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Multi-Select Resource Filters"
        subtitle={`${filteredAndSortedResources.length} matching resources`}
        side="left"
      >
        <div className="space-y-6">
          {renderFilterFacets()}
          <div className="pt-4 border-t border-[var(--ds-border)] flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply Filters ({filteredAndSortedResources.length})
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Runtime Admin Taxonomy Expansion Modal (Add Depth 2, 3, 4+ Subcategory Node without Code Modifications) */}
      <Dialog
        isOpen={adminTaxonomyModalOpen}
        onClose={() => setAdminTaxonomyModalOpen(false)}
        title="Taxonomy Administration — Add Nested Subcategory Node"
        description="Dynamically extend any of the 16 primary categories with depth 2, 3, 4+ child subcategory nodes at runtime without modifying source code."
      >
        <form onSubmit={handleCreateCustomSubcategory} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-cat-select"
              className="block text-xs font-semibold text-[var(--ds-foreground)]"
            >
              1. Target Primary Category
            </label>
            <select
              id="admin-cat-select"
              value={adminTargetCategorySlug}
              onChange={(e) => {
                setAdminTargetCategorySlug(e.target.value);
                setAdminParentNodeId('');
              }}
              className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
            >
              {categoriesWithCustomNodes.map((c) => (
                <option key={c.id} value={c.slug}>
                  {String(c.orderIndex).padStart(2, '0')}. {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-parent-node"
              className="block text-xs font-semibold text-[var(--ds-foreground)]"
            >
              2. Parent Subcategory Node (Optional — Select to Nest Depth 3, 4,
              5+)
            </label>
            <select
              id="admin-parent-node"
              value={adminParentNodeId}
              onChange={(e) => setAdminParentNodeId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
            >
              <option value="">
                Root of Category (Creates Depth-2 Subcategory)
              </option>
              {flattenSubcategoryTree(
                categoriesWithCustomNodes.find(
                  (c) => c.slug === adminTargetCategorySlug
                )?.subcategoryTree || []
              ).map((node) => (
                <option key={node.id} value={node.id}>
                  {'—'.repeat(Math.max(1, node.depth - 1))} [Depth {node.depth}]{' '}
                  {node.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-node-name"
              className="block text-xs font-semibold text-[var(--ds-foreground)]"
            >
              3. New Subcategory Title
            </label>
            <input
              id="admin-node-name"
              type="text"
              required
              value={adminNodeName}
              onChange={(e) => setAdminNodeName(e.target.value)}
              placeholder="e.g., Spring Velocity Interruption Choreography"
              className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-node-desc"
              className="block text-xs font-semibold text-[var(--ds-foreground)]"
            >
              4. Architectural Scope & Description
            </label>
            <textarea
              id="admin-node-desc"
              rows={2}
              value={adminNodeDescription}
              onChange={(e) => setAdminNodeDescription(e.target.value)}
              placeholder="Describe the design principles, specifications, or implementations covered by this node..."
              className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdminTaxonomyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<FolderTree className="w-3.5 h-3.5" />}
            >
              Create Subcategory Node
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}

/* ============================================================================
 * RECURSIVE MULTI-LEVEL SUBCATEGORY TREE EXPLORER (UNLIMITED DEPTH 2, 3, 4+)
 * ========================================================================== */

export interface RecursiveSubcategoryTreeProps {
  nodes: TaxonomySubcategoryNode[];
  selectedSubcategory: string;
  onSelectSubcategory: (name: string) => void;
}

export function RecursiveSubcategoryTree({
  nodes,
  selectedSubcategory,
  onSelectSubcategory,
}: RecursiveSubcategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    nodes.forEach((n) => {
      initial[n.id] = true;
      n.children?.forEach((c) => {
        initial[c.id] = true;
      });
    });
    return initial;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: TaxonomySubcategoryNode) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = Boolean(expandedIds[node.id]);
    const isSelected =
      selectedSubcategory.toLowerCase() === node.name.toLowerCase();

    return (
      <li key={node.id} className="space-y-1.5">
        <div
          className={`flex items-start justify-between gap-2 p-2.5 rounded-[8px] border transition-colors ${
            isSelected
              ? 'bg-[var(--ds-secondary)] border-[var(--ds-accent)]'
              : 'bg-[var(--ds-background)] border-[var(--ds-border)] hover:border-[var(--ds-border-strong)]'
          }`}
        >
          <div className="flex items-start gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                aria-label={
                  isExpanded
                    ? `Collapse ${node.name}`
                    : `Expand ${node.name}`
                }
                onClick={() => toggleExpand(node.id)}
                className="p-0.5 mt-0.5 rounded hover:bg-[var(--ds-muted)] text-[var(--ds-accent)]"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4 h-4 inline-flex items-center justify-center font-mono text-[10px] text-[var(--ds-muted-foreground)] mt-0.5">
                •
              </span>
            )}

            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSelectSubcategory(isSelected ? 'all' : node.name)
                  }
                  className="font-display text-xs font-bold text-[var(--ds-foreground)] hover:text-[var(--ds-accent)] text-left"
                >
                  {node.name}
                </button>
                <span className="font-mono text-[10px] text-[var(--ds-subtle-foreground)] tabular-nums">
                  Depth {node.depth}
                  {hasChildren ? ` · ${node.children!.length} Child Nodes` : ''}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ds-muted-foreground)] leading-snug">
                {node.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectSubcategory(isSelected ? 'all' : node.name)}
            className="px-2 py-1 rounded text-[10px] font-mono font-semibold bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] text-[var(--ds-foreground)] shrink-0"
          >
            {isSelected ? 'Filtered' : 'Filter Track'}
          </button>
        </div>

        {hasChildren && isExpanded && (
          <ul className="pl-5 border-l border-dashed border-[var(--ds-border-strong)] space-y-1.5 ml-2.5">
            {node.children!.map((child) => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul className="space-y-2" aria-label="Multi-level subcategory hierarchy">
      {nodes.map((node) => renderNode(node))}
    </ul>
  );
}
