import {
  AudienceDifficulty,
  DesignResource,
  ResourceClassification,
} from '@/types/encyclopedia';

/**
 * Searchable entity domain types (Section 1).
 */
export type SearchEntityKind =
  | 'resource'
  | 'design-system'
  | 'visual-style'
  | 'animation'
  | 'ui-component'
  | 'interaction-pattern'
  | 'technology'
  | 'category'
  | 'subcategory'
  | 'implementation-example';

/**
 * Supported sort modes (Section 4).
 * Never generates fake engagement metrics — 'most-viewed' and 'most-saved'
 * sort strictly by real recorded view/save counts from the metrics ledger.
 */
export type GlobalSearchSortMode =
  | 'relevance'
  | 'recently-added'
  | 'recently-updated'
  | 'alphabetical'
  | 'most-viewed'
  | 'most-saved';

/**
 * Multi-facet advanced filter state (Section 3 & Section 7).
 */
export interface GlobalSearchFilters {
  categories: string[];
  subcategories: string[];
  resourceTypes: ResourceClassification[];
  designStyles: string[];
  technologies: string[];
  frameworks: string[];
  difficulties: AudienceDifficulty[];
  implementationLanguages: ('css' | 'tsx' | 'html' | 'json' | 'ts')[];
  mobileSupport: string[];
  accessibilitySupport: ('AA' | 'AAA')[];
  previewAvailability: ('runnable-code-demo' | 'visual-specimen')[];
}

/**
 * Complete query payload sent to a SearchProvider implementation (Section 5).
 */
export interface GlobalSearchQueryRequest {
  query: string;
  filters: GlobalSearchFilters;
  sort: GlobalSearchSortMode;
  page: number;
  pageSize: number;
  entityKindFilter?: SearchEntityKind | 'all';
  /** Real user/server metrics map (slug -> count) for authentic engagement sorting */
  realViewCounts?: Record<string, number>;
  realSaveCounts?: Record<string, number>;
  /** QA testing flag to simulate provider error handling (Section 8) */
  simulateError?: boolean;
}

/**
 * Highlighted field match explanation (Section 1 & Section 6).
 */
export interface SearchFieldMatch {
  field:
    | 'title'
    | 'description'
    | 'tags'
    | 'aliases'
    | 'technologies'
    | 'category'
    | 'related-concepts'
    | 'implementation-code';
  matchedTerms: string[];
  snippet: string;
}

/**
 * Unified Search Result Item returned by the SearchProvider (Section 5 & Section 6).
 */
export interface GlobalSearchResultItem {
  id: string;
  slug: string;
  entityKind: SearchEntityKind;
  entityKindLabel: string;
  title: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  subcategory?: string;
  classification: ResourceClassification;
  difficulty: AudienceDifficulty;
  technologies: string[];
  frameworks: string[];
  implementationLanguages: ('css' | 'tsx' | 'html' | 'json' | 'ts')[];
  designStyle?: string;
  mobileSupport: string[];
  wcagLevel: 'AA' | 'AAA';
  previewAvailability: 'runnable-code-demo' | 'visual-specimen';
  demoArchetype?: DesignResource['demoArchetype'];
  tags: string[];
  aliases: string[];
  relatedConcepts: string[];
  href: string;
  playgroundHref?: string;
  relevanceScore: number;
  matchedTerms: string[];
  fieldMatches: SearchFieldMatch[];
  createdAtIso: string;
  updatedAtIso: string;
  /** Authentic recorded view count (0 if never viewed; never fabricated) */
  realViewCount: number;
  /** Authentic recorded save count (0 if never saved; never fabricated) */
  realSaveCount: number;
}

/**
 * Aggregated facet options and counts calculated from the index (Section 2 & Section 3).
 */
export interface SearchFacetBuckets {
  categories: { slug: string; name: string; count: number }[];
  subcategories: { name: string; categorySlug: string; count: number }[];
  resourceTypes: { id: ResourceClassification; label: string; count: number }[];
  designStyles: { name: string; count: number }[];
  technologies: { name: string; count: number }[];
  frameworks: { name: string; count: number }[];
  difficulties: { id: AudienceDifficulty; label: string; count: number }[];
  implementationLanguages: {
    id: 'css' | 'tsx' | 'html' | 'json' | 'ts';
    label: string;
    count: number;
  }[];
  mobileSupport: { name: string; count: number }[];
  accessibilitySupport: { id: 'AA' | 'AAA'; label: string; count: number }[];
  previewAvailability: {
    id: 'runnable-code-demo' | 'visual-specimen';
    label: string;
    count: number;
  }[];
}

/**
 * Trending search and popular category insights computed strictly from actual indexed data
 * and real recorded interactions (Section 2 & Section 4).
 */
export interface SearchDiscoveryInsights {
  trendingSearches: {
    term: string;
    reason: string;
    matchingResourceCount: number;
  }[];
  popularCategories: {
    slug: string;
    name: string;
    shortDescription: string;
    indexedResourceCount: number;
    subcategoryCount: number;
  }[];
  suggestions: {
    text: string;
    kind: SearchEntityKind;
    href: string;
    categoryName: string;
  }[];
}

/**
 * Paginated response envelope from the SearchProvider (Section 5 & Section 6).
 */
export interface GlobalSearchResponse {
  providerId: 'database-backed-index' | 'typesense-adapter';
  normalizedQuery: string;
  queryTokens: string[];
  items: GlobalSearchResultItem[];
  totalMatches: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  executionTimeMs: number;
  hasRealViewMetrics: boolean;
  hasRealSaveMetrics: boolean;
  facets: SearchFacetBuckets;
  insights: SearchDiscoveryInsights;
}

/**
 * Vendor-agnostic Search Provider Interface (Section 5).
 * Ready for drop-in Typesense / Meilisearch / PostgreSQL FTS adapters without changing UI code.
 */
export interface ISearchProvider {
  readonly providerId: 'database-backed-index' | 'typesense-adapter';
  search(request: GlobalSearchQueryRequest): Promise<GlobalSearchResponse>;
}

export const EMPTY_GLOBAL_SEARCH_FILTERS: GlobalSearchFilters = {
  categories: [],
  subcategories: [],
  resourceTypes: [],
  designStyles: [],
  technologies: [],
  frameworks: [],
  difficulties: [],
  implementationLanguages: [],
  mobileSupport: [],
  accessibilitySupport: [],
  previewAvailability: [],
};
