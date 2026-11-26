'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Code2,
  AlertTriangle,
  Sparkles,
  Clock,
  TrendingUp,
  Layers,
  Check,
  Share2,
  Bug,
} from 'lucide-react';
import {
  EMPTY_GLOBAL_SEARCH_FILTERS,
  GlobalSearchFilters,
  GlobalSearchResponse,
  GlobalSearchResultItem,
  GlobalSearchSortMode,
  SearchEntityKind,
} from '@/lib/search/types';
import {
  clearRecentSearchTerms,
  loadRealResourceViewCounts,
  loadRecentSearchTerms,
  recordRealResourceView,
  recordRealSearchQueryExecution,
  saveRecentSearchTerm,
} from '@/lib/search/metrics-ledger';
import {
  DEFAULT_COLLECTION,
  loadPersonalCollection,
  toggleBookmarkInCollection,
} from '@/lib/collections/storage-adapter';
import {
  AudienceDifficulty,
  PersonalCollection,
  ResourceClassification,
} from '@/types/encyclopedia';
import { useToast } from '@/components/ui/InteractionPrimitives';
import {
  ResourceMetadata,
  SemanticAlert,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';
import { LoadingSkeleton } from '@/components/ui/TechnicalPrimitives';

/* ============================================================================
 * 1. SAFE SEARCH TERM HIGHLIGHTER (SECTION 6)
 * ========================================================================== */

export function HighlightedText({
  text,
  tokens,
}: {
  text: string;
  tokens: string[];
}) {
  if (!tokens || tokens.length === 0 || !text) {
    return <>{text}</>;
  }

  const validTokens = tokens
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (validTokens.length === 0) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${validTokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) => {
        const isMatch = validTokens.some(
          (vt) => new RegExp(`^${vt}$`, 'i').test(part)
        );
        return isMatch ? (
          <mark
            key={idx}
            className="rounded-xs bg-[var(--ds-accent)]/20 px-0.5 font-semibold text-[var(--ds-foreground)] underline decoration-[var(--ds-accent)] decoration-1 underline-offset-2"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        );
      })}
    </>
  );
}

/* ============================================================================
 * 2. LIVE MINI SPECIMEN THUMBNAIL FOR SEARCH RESULTS (SECTION 6)
 * ========================================================================== */

function SearchResultSpecimenThumbnail({
  item,
}: {
  item: GlobalSearchResultItem;
}) {
  if (item.entityKind === 'category' || item.entityKind === 'subcategory') {
    return (
      <div className="flex h-28 w-full flex-col justify-between rounded border border-[var(--ds-border)] bg-[var(--ds-background)] p-3 font-mono text-[11px]">
        <div className="flex items-center justify-between text-[var(--ds-accent)]">
          <span>TAXONOMY NODE</span>
          <span>{item.wcagLevel}</span>
        </div>
        <div className="my-auto space-y-1">
          <div className="h-1.5 w-3/4 rounded-xs bg-[var(--ds-accent)]/40" />
          <div className="h-1.5 w-1/2 rounded-xs bg-[var(--ds-border-strong)]" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-[var(--ds-muted-foreground)]">
          <span>{item.entityKindLabel}</span>
          <span>{item.technologies[0] || 'Architecture'}</span>
        </div>
      </div>
    );
  }

  switch (item.demoArchetype) {
    case 'spring-motion-physics':
      return (
        <div className="flex h-28 w-full flex-col justify-between rounded border border-[var(--ds-border)] bg-[var(--ds-background)] p-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--ds-muted-foreground)]">
            <span>SPRING HARMONIC</span>
            <span>60 FPS</span>
          </div>
          <div className="my-auto flex items-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-[var(--ds-accent)] bg-[var(--ds-accent)]/20" />
            <div className="h-0.5 flex-1 bg-gradient-to-r from-[var(--ds-accent)] to-transparent" />
            <div className="h-4 w-4 rounded-xs border border-[var(--ds-border-strong)]" />
          </div>
          <div className="font-mono text-[10px] text-[var(--ds-accent)]">
            stiffness: 280 · damping: 22
          </div>
        </div>
      );
    case 'swiss-typographic-grid':
      return (
        <div className="flex h-28 w-full flex-col justify-between rounded border border-[var(--ds-border)] bg-[var(--ds-background)] p-3">
          <div className="grid h-full grid-cols-4 gap-1.5">
            <div className="col-span-2 flex flex-col justify-between border-r border-[var(--ds-border)] pr-1.5">
              <span className="font-mono text-[10px] font-bold text-[var(--ds-accent)]">
                01 / GRID
              </span>
              <span className="font-display text-xs font-bold leading-tight text-[var(--ds-foreground)]">
                Aa Bb
              </span>
            </div>
            <div className="col-span-2 flex flex-col justify-end space-y-1">
              <div className="h-1.5 w-full bg-[var(--ds-foreground)]/20" />
              <div className="h-1.5 w-4/5 bg-[var(--ds-foreground)]/20" />
              <div className="h-1.5 w-2/3 bg-[var(--ds-accent)]/40" />
            </div>
          </div>
        </div>
      );
    case 'neobrutalist-contrast-study':
      return (
        <div className="flex h-28 w-full flex-col justify-between rounded border-2 border-[var(--ds-foreground)] bg-[var(--ds-surface)] p-3 shadow-[3px_3px_0px_var(--ds-foreground)]">
          <div className="font-mono text-[10px] font-bold uppercase text-[var(--ds-foreground)]">
            HARD-EDGE OFFSET
          </div>
          <div className="inline-flex w-fit border border-[var(--ds-foreground)] bg-[var(--ds-accent)] px-2 py-0.5 font-mono text-[10px] font-bold text-white">
            AAA 9.4:1
          </div>
        </div>
      );
    default:
      return (
        <div className="flex h-28 w-full flex-col justify-between rounded border border-[var(--ds-border)] bg-[var(--ds-background)] p-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--ds-muted-foreground)]">
            <span>{item.previewAvailability === 'runnable-code-demo' ? 'LIVE DEMO' : 'SPECIMEN'}</span>
            <span>WCAG {item.wcagLevel}</span>
          </div>
          <div className="my-auto flex items-center gap-1.5">
            <div className="h-7 flex-1 rounded-xs border border-[var(--ds-accent)] bg-[var(--ds-accent)]/10 px-2 py-1 font-mono text-[10px] text-[var(--ds-accent)]">
              --ds-token
            </div>
            <div className="h-7 w-7 rounded-xs border border-[var(--ds-border-strong)] bg-[var(--ds-surface)]" />
          </div>
          <div className="font-mono text-[10px] text-[var(--ds-muted-foreground)] truncate">
            {item.technologies.slice(0, 3).join(' · ')}
          </div>
        </div>
      );
  }
}

/* ============================================================================
 * 3. URL PARAMETER SERIALIZATION HELPERS (SECTION 7)
 * ========================================================================== */

function readUrlList(params: URLSearchParams, key: string): string[] {
  const val = params.get(key);
  if (!val) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSearchStateFromWindowUrl(): {
  query: string;
  sort: GlobalSearchSortMode;
  page: number;
  entityKind: SearchEntityKind | 'all';
  filters: GlobalSearchFilters;
} {
  if (typeof window === 'undefined') {
    return {
      query: '',
      sort: 'relevance',
      page: 1,
      entityKind: 'all',
      filters: EMPTY_GLOBAL_SEARCH_FILTERS,
    };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get('q') || '',
    sort: (params.get('sort') as GlobalSearchSortMode) || 'relevance',
    page: Math.max(1, Number(params.get('page')) || 1),
    entityKind: (params.get('kind') as SearchEntityKind | 'all') || 'all',
    filters: {
      categories: readUrlList(params, 'cat'),
      subcategories: readUrlList(params, 'sub'),
      resourceTypes: readUrlList(params, 'type') as ResourceClassification[],
      designStyles: readUrlList(params, 'style'),
      technologies: readUrlList(params, 'tech'),
      frameworks: readUrlList(params, 'fw'),
      difficulties: readUrlList(params, 'diff') as AudienceDifficulty[],
      implementationLanguages: readUrlList(params, 'lang') as (
        | 'css'
        | 'tsx'
        | 'html'
        | 'json'
        | 'ts'
      )[],
      mobileSupport: readUrlList(params, 'mobile'),
      accessibilitySupport: readUrlList(params, 'a11y') as ('AA' | 'AAA')[],
      previewAvailability: readUrlList(params, 'preview') as (
        | 'runnable-code-demo'
        | 'visual-specimen'
      )[],
    },
  };
}

function buildUrlQueryString(state: {
  query: string;
  sort: GlobalSearchSortMode;
  page: number;
  entityKind: SearchEntityKind | 'all';
  filters: GlobalSearchFilters;
}): string {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set('q', state.query.trim());
  if (state.sort !== 'relevance') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.entityKind !== 'all') params.set('kind', state.entityKind);

  const f = state.filters;
  if (f.categories.length > 0) params.set('cat', f.categories.join(','));
  if (f.subcategories.length > 0) params.set('sub', f.subcategories.join(','));
  if (f.resourceTypes.length > 0) params.set('type', f.resourceTypes.join(','));
  if (f.designStyles.length > 0) params.set('style', f.designStyles.join(','));
  if (f.technologies.length > 0) params.set('tech', f.technologies.join(','));
  if (f.frameworks.length > 0) params.set('fw', f.frameworks.join(','));
  if (f.difficulties.length > 0) params.set('diff', f.difficulties.join(','));
  if (f.implementationLanguages.length > 0) {
    params.set('lang', f.implementationLanguages.join(','));
  }
  if (f.mobileSupport.length > 0) {
    params.set('mobile', f.mobileSupport.join(','));
  }
  if (f.accessibilitySupport.length > 0) {
    params.set('a11y', f.accessibilitySupport.join(','));
  }
  if (f.previewAvailability.length > 0) {
    params.set('preview', f.previewAvailability.join(','));
  }

  return params.toString();
}

const ENTITY_KIND_TABS: { id: SearchEntityKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All Indexed Entities' },
  { id: 'design-system', label: 'Design Systems' },
  { id: 'visual-style', label: 'Visual Styles' },
  { id: 'animation', label: 'Animations & Motion' },
  { id: 'ui-component', label: 'UI Components' },
  { id: 'interaction-pattern', label: 'Interaction Patterns' },
  { id: 'technology', label: 'Technologies' },
  { id: 'category', label: 'Categories' },
  { id: 'subcategory', label: 'Subcategories' },
  { id: 'implementation-example', label: 'Implementation Examples' },
];

/* ============================================================================
 * 4. MAIN GLOBAL SEARCH & DISCOVERY HUB COMPONENT
 * ========================================================================== */

export function GlobalSearchDiscoveryHub() {
  const router = useRouter();
  const { pushToast } = useToast();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // SSR-safe deterministic initial states
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState<GlobalSearchSortMode>('relevance');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(8);
  const [entityKind, setEntityKind] = useState<SearchEntityKind | 'all'>('all');
  const [filters, setFilters] = useState<GlobalSearchFilters>(
    EMPTY_GLOBAL_SEARCH_FILTERS
  );

  // Local persisted state hydrated after mount
  const [collection, setCollection] =
    useState<PersonalCollection>(DEFAULT_COLLECTION);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [realViewCounts, setRealViewCounts] = useState<Record<string, number>>(
    {}
  );

  // Server search response, loading, error, and keyboard selection state
  const [searchResponse, setSearchResponse] =
    useState<GlobalSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [keyboardSelectedIndex, setKeyboardSelectedIndex] =
    useState<number>(-1);
  const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] =
    useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // 1. Hydrate URL parameters and localStorage on client mount + bind popstate for Browser Back/Forward (Section 7)
  useEffect(() => {
    const syncFromUrlAndStorage = () => {
      const parsed = parseSearchStateFromWindowUrl();
      setQuery(parsed.query);
      setDebouncedQuery(parsed.query);
      setSort(parsed.sort);
      setPage(parsed.page);
      setEntityKind(parsed.entityKind);
      setFilters(parsed.filters);
      setCollection(loadPersonalCollection());
      setRecentSearches(loadRecentSearchTerms());
      setRealViewCounts(loadRealResourceViewCounts());
      setHydrated(true);
    };

    const raf = window.requestAnimationFrame(syncFromUrlAndStorage);
    window.addEventListener('popstate', syncFromUrlAndStorage);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('popstate', syncFromUrlAndStorage);
    };
  }, []);

  // 2. Debounce query typing (180ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // 3. Synchronize state to URL query parameters without breaking browser Back/Forward history (Section 7)
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const nextQs = buildUrlQueryString({
      query: debouncedQuery,
      sort,
      page,
      entityKind,
      filters,
    });
    const currentQs = window.location.search.replace(/^\?/, '');
    if (nextQs !== currentQs) {
      const nextUrl = nextQs
        ? `${window.location.pathname}?${nextQs}`
        : window.location.pathname;
      window.history.pushState(null, '', nextUrl);
    }
  }, [hydrated, debouncedQuery, sort, page, entityKind, filters]);

  // 4. Derive real save counts map from the user's personal collection (1 if bookmarked + count of saved presets)
  const realSaveCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slug of collection.resourceSlugs) {
      counts[slug] = (counts[slug] || 0) + 1;
    }
    for (const preset of collection.savedPresets) {
      counts[preset.resourceSlug] = (counts[preset.resourceSlug] || 0) + 1;
    }
    return counts;
  }, [collection]);

  // 5. Execute server-backed search query via `/api/search` (Section 5: never loads entire database into browser memory)
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const fetchSearchResults = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: debouncedQuery,
            filters,
            sort,
            page,
            pageSize,
            entityKindFilter: entityKind,
            realViewCounts,
            realSaveCounts,
            simulateError,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Search API returned HTTP ${res.status}`);
        }

        if (!cancelled) {
          setSearchResponse(data as GlobalSearchResponse);
          setKeyboardSelectedIndex(-1);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Unable to execute global search query.'
          );
          setIsLoading(false);
        }
      }
    };

    fetchSearchResults();
    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    debouncedQuery,
    filters,
    sort,
    page,
    pageSize,
    entityKind,
    realViewCounts,
    realSaveCounts,
    simulateError,
  ]);

  // 6. Global `/` keyboard shortcut to focus search bar (Section 2)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // 7. Toggle multi-value facet helper
  const toggleArrayFilter = useCallback(
    <K extends keyof GlobalSearchFilters>(
      facetKey: K,
      value: GlobalSearchFilters[K][number]
    ) => {
      setPage(1);
      setFilters((prev) => {
        const currentList = prev[facetKey] as unknown as string[];
        const strVal = String(value);
        const exists = currentList.includes(strVal);
        const nextList = exists
          ? currentList.filter((item) => item !== strVal)
          : [...currentList, strVal];
        return {
          ...prev,
          [facetKey]: nextList,
        };
      });
    },
    []
  );

  const clearAllFilters = useCallback(() => {
    setFilters(EMPTY_GLOBAL_SEARCH_FILTERS);
    setEntityKind('all');
    setPage(1);
  }, []);

  const handleApplySearchTerm = useCallback((term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    setPage(1);
    if (term.trim()) {
      setRecentSearches(saveRecentSearchTerm(term.trim()));
      recordRealSearchQueryExecution(term.trim());
    }
  }, []);

  const handleNavigateToResult = useCallback(
    (item: GlobalSearchResultItem) => {
      if (query.trim()) {
        setRecentSearches(saveRecentSearchTerm(query.trim()));
        recordRealSearchQueryExecution(query.trim());
      }
      const nextViews = recordRealResourceView(item.slug);
      setRealViewCounts(nextViews);
      router.push(item.href);
    },
    [query, router]
  );

  const handleToggleBookmark = useCallback(
    (slug: string, title: string) => {
      const updated = toggleBookmarkInCollection(collection, slug);
      setCollection(updated);
      pushToast({
        tone: 'success',
        title: updated.resourceSlugs.includes(slug)
          ? 'Saved to Personal Collection'
          : 'Removed from Personal Collection',
        description: title,
      });
    },
    [collection, pushToast]
  );

  const handleShareSearchUrl = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  }, []);

  // Build flat list of active filter chips so users can remove individual filters (Section 3)
  const activeFilterChips = useMemo(() => {
    const chips: {
      facetKey: keyof GlobalSearchFilters;
      facetLabel: string;
      value: string;
    }[] = [];

    filters.categories.forEach((v) =>
      chips.push({ facetKey: 'categories', facetLabel: 'Category', value: v })
    );
    filters.subcategories.forEach((v) =>
      chips.push({
        facetKey: 'subcategories',
        facetLabel: 'Subcategory',
        value: v,
      })
    );
    filters.resourceTypes.forEach((v) =>
      chips.push({
        facetKey: 'resourceTypes',
        facetLabel: 'Resource Type',
        value: v,
      })
    );
    filters.designStyles.forEach((v) =>
      chips.push({
        facetKey: 'designStyles',
        facetLabel: 'Design Style',
        value: v,
      })
    );
    filters.technologies.forEach((v) =>
      chips.push({
        facetKey: 'technologies',
        facetLabel: 'Technology',
        value: v,
      })
    );
    filters.frameworks.forEach((v) =>
      chips.push({ facetKey: 'frameworks', facetLabel: 'Framework', value: v })
    );
    filters.difficulties.forEach((v) =>
      chips.push({
        facetKey: 'difficulties',
        facetLabel: 'Difficulty',
        value: v,
      })
    );
    filters.implementationLanguages.forEach((v) =>
      chips.push({
        facetKey: 'implementationLanguages',
        facetLabel: 'Language',
        value: v,
      })
    );
    filters.mobileSupport.forEach((v) =>
      chips.push({
        facetKey: 'mobileSupport',
        facetLabel: 'Mobile Support',
        value: v,
      })
    );
    filters.accessibilitySupport.forEach((v) =>
      chips.push({
        facetKey: 'accessibilitySupport',
        facetLabel: 'WCAG',
        value: v,
      })
    );
    filters.previewAvailability.forEach((v) =>
      chips.push({
        facetKey: 'previewAvailability',
        facetLabel: 'Preview',
        value: v,
      })
    );

    return chips;
  }, [filters]);

  // Keyboard navigation handler inside the search input (ArrowDown, ArrowUp, Enter, Escape)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = searchResponse?.items || [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        setKeyboardSelectedIndex((prev) =>
          prev < items.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        setKeyboardSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : items.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (
        keyboardSelectedIndex >= 0 &&
        keyboardSelectedIndex < items.length
      ) {
        e.preventDefault();
        handleNavigateToResult(items[keyboardSelectedIndex]);
      } else if (query.trim()) {
        setRecentSearches(saveRecentSearchTerm(query.trim()));
        recordRealSearchQueryExecution(query.trim());
      }
    } else if (e.key === 'Escape') {
      if (query) {
        setQuery('');
        setDebouncedQuery('');
      }
    }
  };

  // Reusable Filter Facets Sidebar Content (Desktop & Mobile Drawer)
  const renderAdvancedFilterFacets = () => {
    const facets = searchResponse?.facets;
    if (!facets) return null;

    return (
      <div className="space-y-6 text-xs">
        {/* 1. Primary Category */}
        <div className="space-y-2">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            01. Primary Category
          </div>
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {facets.categories.map((cat) => {
              const checked = filters.categories.includes(cat.slug);
              return (
                <label
                  key={cat.slug}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('categories', cat.slug)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="truncate text-[var(--ds-foreground)]">
                      {cat.name}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {cat.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 2. Subcategory */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            02. Subcategory
          </div>
          <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
            {facets.subcategories.map((sub) => {
              const checked = filters.subcategories.includes(sub.name);
              return (
                <label
                  key={sub.name}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('subcategories', sub.name)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="truncate text-[var(--ds-foreground)]">
                      {sub.name}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {sub.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. Resource Type */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            03. Resource Type
          </div>
          <div className="space-y-1">
            {facets.resourceTypes.map((rt) => {
              const checked = filters.resourceTypes.includes(rt.id);
              return (
                <label
                  key={rt.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('resourceTypes', rt.id)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="truncate text-[var(--ds-foreground)]">
                      {rt.label}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {rt.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 4. Design Style */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            04. Design Style
          </div>
          <div className="space-y-1">
            {facets.designStyles.map((ds) => {
              const checked = filters.designStyles.includes(ds.name);
              return (
                <label
                  key={ds.name}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('designStyles', ds.name)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="truncate text-[var(--ds-foreground)]">
                      {ds.name}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {ds.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 5. Technology */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            05. Technology
          </div>
          <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
            {facets.technologies.map((tech) => {
              const checked = filters.technologies.includes(tech.name);
              return (
                <label
                  key={tech.name}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('technologies', tech.name)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="truncate text-[var(--ds-foreground)]">
                      {tech.name}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {tech.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 6. Framework */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            06. Framework
          </div>
          <div className="space-y-1">
            {facets.frameworks.map((fw) => {
              const checked = filters.frameworks.includes(fw.name);
              return (
                <label
                  key={fw.name}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayFilter('frameworks', fw.name)}
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="truncate text-[var(--ds-foreground)]">
                      {fw.name}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {fw.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 7. Difficulty */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            07. Difficulty
          </div>
          <div className="space-y-1">
            {facets.difficulties.map((diff) => {
              const checked = filters.difficulties.includes(diff.id);
              return (
                <label
                  key={diff.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('difficulties', diff.id)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="text-[var(--ds-foreground)]">
                      {diff.label}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {diff.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 8. Implementation Language */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            08. Implementation Language
          </div>
          <div className="space-y-1">
            {facets.implementationLanguages.map((lang) => {
              const checked = filters.implementationLanguages.includes(lang.id);
              return (
                <label
                  key={lang.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('implementationLanguages', lang.id)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="text-[var(--ds-foreground)]">
                      {lang.label}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {lang.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 9. Mobile Support */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            09. Mobile & Touch Support
          </div>
          <div className="space-y-1">
            {facets.mobileSupport.map((ms) => {
              const checked = filters.mobileSupport.includes(ms.name);
              return (
                <label
                  key={ms.name}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('mobileSupport', ms.name)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="truncate text-[var(--ds-foreground)]">
                      {ms.name}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {ms.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 10. Accessibility Support */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            10. Accessibility Compliance
          </div>
          <div className="space-y-1">
            {facets.accessibilitySupport.map((a11y) => {
              const checked = filters.accessibilitySupport.includes(a11y.id);
              return (
                <label
                  key={a11y.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('accessibilitySupport', a11y.id)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="text-[var(--ds-foreground)]">
                      {a11y.label}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {a11y.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 11. Preview Availability */}
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-4">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
            11. Preview Availability
          </div>
          <div className="space-y-1">
            {facets.previewAvailability.map((pa) => {
              const checked = filters.previewAvailability.includes(pa.id);
              return (
                <label
                  key={pa.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 hover:bg-[var(--ds-background)]"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleArrayFilter('previewAvailability', pa.id)
                      }
                      className="accent-[var(--ds-accent)]"
                    />
                    <span className="text-[var(--ds-foreground)]">
                      {pa.label}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ds-muted-foreground)]">
                    {pa.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. Primary Search Input Console & Discovery Insights */}
      <section className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <ResourceMetadata
              items={[
                'Global Encyclopedia Search & Discovery',
                '10 Indexed Entity Domains',
                '11 Multi-Facet Filters',
                'Vendor-Agnostic Search Provider',
              ]}
            />
            <h1
              style={{ fontSize: 'clamp(1.625rem, 2.5vw, 2.25rem)' }}
              className="font-display font-bold tracking-tight text-[var(--ds-foreground)]"
            >
              Global Search & Multi-Facet Discovery Engine
            </h1>
            <p className="text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
              Query across resources, design systems, visual styles, animations,
              UI components, interaction patterns, technologies, categories,
              subcategories, and implementation examples. Use{' '}
              <kbd className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-1.5 py-0.5 font-mono text-xs text-[var(--ds-foreground)]">
                /
              </kbd>{' '}
              to focus search and{' '}
              <kbd className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-1.5 py-0.5 font-mono text-xs text-[var(--ds-foreground)]">
                ↑
              </kbd>{' '}
              <kbd className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-1.5 py-0.5 font-mono text-xs text-[var(--ds-foreground)]">
                ↓
              </kbd>{' '}
              <kbd className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-1.5 py-0.5 font-mono text-xs text-[var(--ds-foreground)]">
                Enter
              </kbd>{' '}
              for keyboard navigation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShareSearchUrl}
              className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-3 py-2 text-xs font-medium text-[var(--ds-foreground)] hover:border-[var(--ds-border-strong)]"
            >
              {copiedShareLink ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Share2 className="h-3.5 w-3.5 text-[var(--ds-accent)]" />
              )}
              <span>{copiedShareLink ? 'Search Link Copied' : 'Share Search URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileFilterDrawerOpen((v) => !v)}
              className="inline-flex lg:hidden items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-3 py-2 text-xs font-semibold text-[var(--ds-foreground)]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--ds-accent)]" />
              <span>Filters ({activeFilterChips.length})</span>
            </button>
          </div>
        </div>

        {/* Prominent Global Search Bar */}
        <div className="relative">
          <div className="flex items-center rounded-md border-2 border-[var(--ds-border-strong)] bg-[var(--ds-background)] px-4 py-3 focus-within:border-[var(--ds-accent)]">
            <Search className="h-5 w-5 text-[var(--ds-accent)] shrink-0" />
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Global Encyclopedia Search Query"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search titles, descriptions, tags, aliases, technologies (e.g., Spring Physics, WAI-ARIA Combobox, Neobrutalism, CSS Grid, Container Queries)..."
              className="ml-3 w-full bg-transparent text-sm sm:text-base text-[var(--ds-foreground)] placeholder:text-[var(--ds-muted-foreground)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                  setPage(1);
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search query"
                className="ml-2 inline-flex items-center gap-1 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 font-mono text-xs text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Entity Domain Scope Selector Tabs (Section 1) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {ENTITY_KIND_TABS.map((tab) => {
            const isActive = entityKind === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setEntityKind(tab.id);
                  setPage(1);
                }}
                className={`whitespace-nowrap shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-semibold'
                    : 'bg-[var(--ds-background)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] border border-[var(--ds-border)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Discovery Row: Recent Searches, Trending Searches (From Real Index Coverage), and Live Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[var(--ds-border)] text-xs">
          {/* Recent Searches */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted-foreground)]">
                <Clock className="h-3.5 w-3.5 text-[var(--ds-accent)]" />
                <span>Recent Searches</span>
              </span>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecentSearches(clearRecentSearchTerms())}
                  className="font-mono text-[11px] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] underline"
                >
                  Clear History
                </button>
              )}
            </div>
            {recentSearches.length === 0 ? (
              <p className="text-[var(--ds-muted-foreground)]">
                No recent queries recorded in this browser session.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleApplySearchTerm(term)}
                    className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Trending Searches Based Strictly on Indexed Data Density */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted-foreground)]">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--ds-accent)]" />
              <span>Trending Indexed Topics (Actual Corpus Density)</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(searchResponse?.insights.trendingSearches || []).map((ts) => (
                <button
                  key={ts.term}
                  type="button"
                  title={ts.reason}
                  onClick={() => handleApplySearchTerm(ts.term)}
                  className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
                >
                  <span>{ts.term}</span>{' '}
                  <span className="text-[10px] text-[var(--ds-muted-foreground)] tabular-nums">
                    ({ts.matchingResourceCount})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Autocomplete Suggestions */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted-foreground)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--ds-accent)]" />
              <span>Direct Concept Suggestions</span>
            </span>
            <div className="flex flex-col space-y-1">
              {(searchResponse?.insights.suggestions || [])
                .slice(0, 3)
                .map((sug) => (
                  <Link
                    key={sug.href}
                    href={sug.href}
                    className="flex items-center justify-between rounded px-2 py-1 text-xs text-[var(--ds-foreground)] hover:bg-[var(--ds-background)]"
                  >
                    <span className="truncate font-medium">{sug.text}</span>
                    <span className="ml-2 shrink-0 font-mono text-[10px] text-[var(--ds-muted-foreground)]">
                      {sug.categoryName} →
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Section 8 Validation & QA Test Suite Bar */}
      <section className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-[var(--ds-accent)]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
              Search Validation Presets (Section 8 Verification)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                clearAllFilters();
                setSimulateError(false);
                handleApplySearchTerm(
                  'Multi-Brand Semantic Token Architecture'
                );
              }}
              className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
            >
              1. Exact Title
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllFilters();
                setSimulateError(false);
                handleApplySearchTerm(' harmonic spring ');
              }}
              className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
            >
              2. Partial Title
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllFilters();
                setSimulateError(false);
                handleApplySearchTerm('WAI-ARIA');
              }}
              className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
            >
              3. Tag Search
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllFilters();
                setSimulateError(false);
                handleApplySearchTerm('Container Queries');
              }}
              className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
            >
              4. Technology Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulateError(false);
                setQuery('');
                setDebouncedQuery('');
                setEntityKind('all');
                setPage(1);
                setFilters({
                  ...EMPTY_GLOBAL_SEARCH_FILTERS,
                  accessibilitySupport: ['AAA'],
                  previewAvailability: ['runnable-code-demo'],
                });
              }}
              className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
            >
              5. Combined Filters (AAA + Runnable Demo)
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllFilters();
                setSimulateError(false);
                handleApplySearchTerm('xyznonexistentdesignconcept999');
              }}
              className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
            >
              6. No Results State
            </button>
            <button
              type="button"
              onClick={() => setSimulateError((prev) => !prev)}
              className={`rounded border px-2.5 py-1 font-mono text-xs ${
                simulateError
                  ? 'border-rose-500 bg-rose-500/10 font-bold text-rose-500'
                  : 'border-[var(--ds-border)] bg-[var(--ds-background)] text-[var(--ds-foreground)] hover:border-rose-500'
              }`}
            >
              7. {simulateError ? 'Restore Search Service' : 'Simulate Provider Error'}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Main Two-Column Search Layout: 11 Advanced Facets Left + Results & Sorting Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (Desktop): 11 Advanced Filter Facets */}
        <aside
          aria-label="Advanced Search Filters"
          className="hidden lg:block lg:col-span-3 rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--ds-accent)]" />
              <h2 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                Advanced Filters
              </h2>
            </div>
            {activeFilterChips.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="font-mono text-xs text-[var(--ds-accent)] hover:underline"
              >
                Reset All ({activeFilterChips.length})
              </button>
            )}
          </div>

          {renderAdvancedFilterFacets()}
        </aside>

        {/* Mobile Collapsible Filter Panel */}
        {mobileFilterDrawerOpen && (
          <div className="lg:hidden rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
              <span className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                Advanced Filters ({activeFilterChips.length} active)
              </span>
              <button
                type="button"
                onClick={() => setMobileFilterDrawerOpen(false)}
                className="rounded border border-[var(--ds-border)] px-2.5 py-1 text-xs"
              >
                Done
              </button>
            </div>
            {renderAdvancedFilterFacets()}
          </div>
        )}

        {/* RIGHT COLUMN: Active Filter Bar, Sorting Bar, Paginated Search Results & Popular Categories */}
        <div className="lg:col-span-9 space-y-6">
          {/* Active Filter Bar + Sort Selector */}
          <div className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-[var(--ds-muted-foreground)] font-mono tabular-nums">
                {isLoading ? (
                  <span>Querying indexed corpus...</span>
                ) : searchResponse ? (
                  <span>
                    Showing{' '}
                    <strong className="text-[var(--ds-foreground)]">
                      {searchResponse.items.length}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-[var(--ds-foreground)]">
                      {searchResponse.totalMatches}
                    </strong>{' '}
                    indexed matches · Provider:{' '}
                    <span className="text-[var(--ds-accent)]">
                      {searchResponse.providerId}
                    </span>{' '}
                    ({searchResponse.executionTimeMs}ms)
                  </span>
                ) : (
                  <span>Search service standby</span>
                )}
              </div>

              {/* Sort Selector (Section 4: Authentic Metrics Enforcement) */}
              <div className="flex items-center gap-2 text-xs">
                <label
                  htmlFor="global-search-sort"
                  className="font-mono text-[var(--ds-muted-foreground)]"
                >
                  Sort by:
                </label>
                <select
                  id="global-search-sort"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as GlobalSearchSortMode);
                    setPage(1);
                  }}
                  className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1.5 font-mono text-xs text-[var(--ds-foreground)] focus:border-[var(--ds-accent)] focus:outline-none"
                >
                  <option value="relevance">Relevance (Multi-Field Rank)</option>
                  <option value="recently-added">Recently Added</option>
                  <option value="recently-updated">Recently Updated</option>
                  <option value="alphabetical">Alphabetical (A–Z)</option>
                  <option value="most-viewed">
                    Most Viewed (
                    {searchResponse?.hasRealViewMetrics
                      ? 'Session Verified'
                      : '0 Views Recorded Yet'}
                    )
                  </option>
                  <option value="most-saved">
                    Most Saved (
                    {searchResponse?.hasRealSaveMetrics
                      ? `${collection.resourceSlugs.length} Bookmarked`
                      : '0 Saved Yet'}
                    )
                  </option>
                </select>
              </div>
            </div>

            {/* Active Filters Bar with Individual Removal & Clear All (Section 3) */}
            {(activeFilterChips.length > 0 ||
              entityKind !== 'all' ||
              debouncedQuery) && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--ds-border)]">
                <span className="font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                  Active Constraints:
                </span>

                {debouncedQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setDebouncedQuery('');
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-accent)] bg-[var(--ds-secondary)]/50 px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)]"
                  >
                    <span>Query: &ldquo;{debouncedQuery}&rdquo;</span>
                    <X className="h-3 w-3" />
                  </button>
                )}

                {entityKind !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEntityKind('all');
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-accent)] bg-[var(--ds-secondary)]/50 px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)]"
                  >
                    <span>Domain: {entityKind}</span>
                    <X className="h-3 w-3" />
                  </button>
                )}

                {activeFilterChips.map((chip) => (
                  <button
                    key={`${chip.facetKey}-${chip.value}`}
                    type="button"
                    onClick={() =>
                      toggleArrayFilter(
                        chip.facetKey,
                        chip.value as never
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border-strong)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)] hover:border-rose-500"
                  >
                    <span>
                      {chip.facetLabel}: {chip.value}
                    </span>
                    <X className="h-3 w-3 text-[var(--ds-muted-foreground)]" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setDebouncedQuery('');
                    clearAllFilters();
                  }}
                  className="ml-auto inline-flex items-center gap-1 font-mono text-xs font-semibold text-[var(--ds-accent)] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear All Constraints</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Error State (Section 5 & Section 8) */}
          {errorMessage && (
            <SemanticAlert
              variant="error"
              title="Search Service Error Intercepted"
              action={
                <button
                  type="button"
                  onClick={() => setSimulateError(false)}
                  className="rounded bg-[var(--ds-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--ds-primary-foreground)]"
                >
                  Reset Error Simulation & Retry
                </button>
              }
            >
              {errorMessage}
            </SemanticAlert>
          )}

          {/* Search Loading State (Section 2) */}
          {isLoading && !errorMessage && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <LoadingSkeleton key={n} variant="card" />
              ))}
            </div>
          )}

          {/* No Results State (Section 2 & Section 8) */}
          {!isLoading &&
            !errorMessage &&
            searchResponse &&
            searchResponse.items.length === 0 && (
              <div className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-8 text-center space-y-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ds-border)] bg-[var(--ds-background)] text-[var(--ds-muted-foreground)]">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="space-y-1 max-w-lg mx-auto">
                  <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                    No Indexed Resources Match Your Query & Filter Constraints
                  </h3>
                  <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    No results found for{' '}
                    {debouncedQuery ? (
                      <span className="font-mono font-semibold text-[var(--ds-foreground)]">
                        &ldquo;{debouncedQuery}&rdquo;
                      </span>
                    ) : (
                      'the active filter combination'
                    )}
                    . Try removing one or more filters or selecting a verified
                    indexed topic below.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setDebouncedQuery('');
                      clearAllFilters();
                    }}
                    className="rounded bg-[var(--ds-primary)] px-4 py-2 text-xs font-semibold text-[var(--ds-primary-foreground)]"
                  >
                    Reset All Search Filters
                  </button>
                  {(searchResponse.insights.trendingSearches || [])
                    .slice(0, 4)
                    .map((ts) => (
                      <button
                        key={ts.term}
                        type="button"
                        onClick={() => {
                          clearAllFilters();
                          handleApplySearchTerm(ts.term);
                        }}
                        className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-3 py-2 font-mono text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
                      >
                        Try &ldquo;{ts.term}&rdquo;
                      </button>
                    ))}
                </div>
              </div>
            )}

          {/* Results List Experience (Section 6) */}
          {!isLoading &&
            !errorMessage &&
            searchResponse &&
            searchResponse.items.length > 0 && (
              <div className="space-y-4">
                {searchResponse.items.map((item, idx) => {
                  const isKeyboardHighlighted = idx === keyboardSelectedIndex;
                  const isBookmarked = collection.resourceSlugs.includes(
                    item.slug
                  );
                  const queryTokens = searchResponse.queryTokens;

                  return (
                    <article
                      key={item.id}
                      className={`rounded-md border p-5 transition-colors ${
                        isKeyboardHighlighted
                          ? 'border-[var(--ds-accent)] bg-[var(--ds-secondary)]/30'
                          : 'border-[var(--ds-border)] bg-[var(--ds-surface)] hover:border-[var(--ds-border-strong)]'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        {/* Left 3 Columns: Interactive Specimen / Thumbnail Preview */}
                        <div className="md:col-span-3">
                          <SearchResultSpecimenThumbnail item={item} />
                        </div>

                        {/* Right 9 Columns: Title, Description, Category, Tech Labels, Matched Terms */}
                        <div className="md:col-span-9 space-y-2.5">
                          {/* Quiet Unboxed Metadata Header (Zero-Pill Discipline) */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ds-muted-foreground)]">
                            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                              <span className="font-semibold text-[var(--ds-accent)]">
                                {item.entityKindLabel}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{item.categoryName}</span>
                              {item.subcategory && (
                                <>
                                  <span aria-hidden="true">/</span>
                                  <span>{item.subcategory}</span>
                                </>
                              )}
                              <span aria-hidden="true">·</span>
                              <span>Difficulty: {item.difficulty}</span>
                              <span aria-hidden="true">·</span>
                              <span>WCAG {item.wcagLevel}</span>
                            </div>

                            <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
                              {item.realViewCount > 0 && (
                                <span>{item.realViewCount} views</span>
                              )}
                              {item.realSaveCount > 0 && (
                                <span>{item.realSaveCount} saved</span>
                              )}
                              <span>Rank {item.relevanceScore}</span>
                            </div>
                          </div>

                          {/* Highlighted Resource Title */}
                          <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                            <button
                              type="button"
                              onClick={() => handleNavigateToResult(item)}
                              className="text-left hover:text-[var(--ds-accent)] focus:outline-none"
                            >
                              <HighlightedText
                                text={item.title}
                                tokens={queryTokens}
                              />
                            </button>
                          </h3>

                          {/* Highlighted Relevant Description */}
                          <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                            <HighlightedText
                              text={item.description}
                              tokens={queryTokens}
                            />
                          </p>

                          {/* Technology Labels & Implementation Languages (Unboxed Monospace List) */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                            <span className="font-semibold text-[var(--ds-foreground)]">
                              Technologies:
                            </span>
                            <span>
                              <HighlightedText
                                text={[
                                  ...item.technologies,
                                  ...item.frameworks,
                                ].join(' · ')}
                                tokens={queryTokens}
                              />
                            </span>
                            {item.designStyle && (
                              <>
                                <span aria-hidden="true">|</span>
                                <span>Style: {item.designStyle}</span>
                              </>
                            )}
                          </div>

                          {/* Relevant Matching Terms & Field Match Explanation (Section 6) */}
                          {(item.matchedTerms.length > 0 ||
                            item.tags.length > 0) && (
                            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                              {item.matchedTerms.length > 0 ? (
                                <>
                                  <span className="font-semibold text-[var(--ds-accent)]">
                                    Matched Terms:
                                  </span>
                                  <span>
                                    {item.matchedTerms.join(' · ')}
                                  </span>
                                  {item.fieldMatches.length > 0 && (
                                    <span className="text-[var(--ds-muted-foreground)]">
                                      (in{' '}
                                      {item.fieldMatches
                                        .map((fm) => fm.field)
                                        .join(', ')}
                                      )
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold text-[var(--ds-foreground)]">
                                    Tags:
                                  </span>
                                  <span>
                                    <HighlightedText
                                      text={item.tags.slice(0, 6).join(' · ')}
                                      tokens={queryTokens}
                                    />
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Action Links: Inspect Monograph, Launch Playground, Bookmark */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--ds-border)]">
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleNavigateToResult(item)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ds-accent)] hover:underline"
                              >
                                <span>
                                  {item.entityKind === 'category' ||
                                  item.entityKind === 'subcategory'
                                    ? 'Explore Taxonomy Node'
                                    : 'Inspect Full Specification'}
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </button>

                              {item.playgroundHref && (
                                <Link
                                  href={item.playgroundHref}
                                  className="inline-flex items-center gap-1 text-xs font-mono text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                                >
                                  <Code2 className="h-3.5 w-3.5 text-[var(--ds-accent)]" />
                                  <span>Open in Playground</span>
                                </Link>
                              )}
                            </div>

                            {item.entityKind !== 'category' &&
                              item.entityKind !== 'subcategory' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleBookmark(item.slug, item.title)
                                  }
                                  className="inline-flex items-center gap-1 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 text-xs text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
                                >
                                  {isBookmarked ? (
                                    <>
                                      <BookmarkCheck className="h-3.5 w-3.5 text-[var(--ds-accent)]" />
                                      <span>Saved</span>
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="h-3.5 w-3.5 text-[var(--ds-muted-foreground)]" />
                                      <span>Save</span>
                                    </>
                                  )}
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Pagination Bar (Section 5, Section 6 & Section 7) */}
                {searchResponse.totalPages > 1 && (
                  <nav
                    aria-label="Search results pagination"
                    className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] px-4 py-3 text-xs"
                  >
                    <div className="font-mono text-[var(--ds-muted-foreground)] tabular-nums">
                      Page{' '}
                      <strong className="text-[var(--ds-foreground)]">
                        {searchResponse.page}
                      </strong>{' '}
                      of{' '}
                      <strong className="text-[var(--ds-foreground)]">
                        {searchResponse.totalPages}
                      </strong>{' '}
                      ({searchResponse.totalMatches} total matches)
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={!searchResponse.hasPreviousPage}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1.5 font-mono text-xs text-[var(--ds-foreground)] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Previous</span>
                      </button>

                      {Array.from(
                        { length: searchResponse.totalPages },
                        (_, idx) => idx + 1
                      ).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setPage(pageNum)}
                          className={`rounded px-2.5 py-1.5 font-mono text-xs tabular-nums ${
                            pageNum === searchResponse.page
                              ? 'bg-[var(--ds-primary)] font-bold text-[var(--ds-primary-foreground)]'
                              : 'border border-[var(--ds-border)] bg-[var(--ds-background)] text-[var(--ds-foreground)]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={!searchResponse.hasNextPage}
                        onClick={() =>
                          setPage((p) =>
                            Math.min(searchResponse.totalPages, p + 1)
                          )
                        }
                        className="inline-flex items-center gap-1 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1.5 font-mono text-xs text-[var(--ds-foreground)] disabled:opacity-40"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </nav>
                )}
              </div>
            )}

          {/* Popular Categories Based on Actual Indexed Data (Section 2) */}
          {searchResponse && (
            <section className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <TechnicalLabel
                    kicker="POPULAR CATEGORIES (ACTUAL CORPUS METRICS)"
                    detail="Ranked by Indexed Specifications & Nested Subcategory Breadth"
                  />
                  <h2 className="font-display text-base font-bold text-[var(--ds-foreground)] mt-1">
                    Popular Encyclopedia Categories
                  </h2>
                </div>
                <Link
                  href="/directory"
                  className="font-mono text-xs text-[var(--ds-accent)] hover:underline"
                >
                  View Complete 16-Category Taxonomy →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResponse.insights.popularCategories.map((cat) => (
                  <div
                    key={cat.slug}
                    className="flex flex-col justify-between rounded border border-[var(--ds-border)] bg-[var(--ds-background)] p-3.5 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-[var(--ds-muted-foreground)] tabular-nums">
                        <span className="text-[var(--ds-accent)] font-semibold">
                          {cat.indexedResourceCount} specs
                        </span>
                        <span>{cat.subcategoryCount} subcategories</span>
                      </div>
                      <h3 className="mt-1 font-display text-sm font-bold text-[var(--ds-foreground)]">
                        {cat.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[var(--ds-muted-foreground)]">
                        {cat.shortDescription}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--ds-border)] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            categories: [cat.slug],
                          }));
                          setPage(1);
                        }}
                        className="font-mono text-[11px] font-semibold text-[var(--ds-accent)] hover:underline"
                      >
                        Filter Search by Category
                      </button>
                      <Link
                        href={`/taxonomy/${cat.slug}`}
                        className="font-mono text-[11px] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                      >
                        Open →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
