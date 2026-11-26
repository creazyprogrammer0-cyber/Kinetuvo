import {
  AudienceDifficulty,
  DesignResource,
  ResourceClassification,
  TaxonomyCategory,
} from '@/types/encyclopedia';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import {
  CLASSIFICATION_DESCRIPTORS,
  TAXONOMY_CATEGORIES,
  flattenSubcategoryTree,
  getCategoryBySlug,
  getCategoryResourceCount,
  getClassificationDescriptor,
} from '@/lib/taxonomy/registry';
import {
  GlobalSearchQueryRequest,
  GlobalSearchResponse,
  GlobalSearchResultItem,
  ISearchProvider,
  SearchDiscoveryInsights,
  SearchEntityKind,
  SearchFacetBuckets,
  SearchFieldMatch,
} from '@/lib/search/types';

/* ============================================================================
 * 1. QUERY NORMALIZATION & TOKENIZATION
 * ========================================================================== */

export function normalizeSearchQuery(rawQuery: string): {
  normalizedQuery: string;
  queryTokens: string[];
} {
  const normalizedQuery = rawQuery
    .toLowerCase()
    .replace(/[^\w\s\-+.#/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalizedQuery) {
    return { normalizedQuery: '', queryTokens: [] };
  }

  const queryTokens = Array.from(
    new Set(normalizedQuery.split(' ').filter((t) => t.length >= 1))
  );

  return { normalizedQuery, queryTokens };
}

/* ============================================================================
 * 2. DOMAIN ALIAS & DESIGN STYLE DERIVATION
 * ========================================================================== */

function deriveDesignStyleForResource(res: DesignResource): string {
  const text = `${res.title} ${res.summary} ${(res.tags || []).join(' ')}`.toLowerCase();
  if (text.includes('neobrutal') || text.includes('brutalist')) {
    return 'Neobrutalism & High-Contrast';
  }
  if (text.includes('swiss') || text.includes('international') || text.includes('modular grid')) {
    return 'Swiss International Grid';
  }
  if (text.includes('spatial') || text.includes('3d') || text.includes('depth') || text.includes('webgl')) {
    return 'Spatial & Depth UI';
  }
  if (text.includes('editorial') || text.includes('typography') || text.includes('monograph')) {
    return 'Editorial Technical';
  }
  if (text.includes('kinetic') || text.includes('spring') || text.includes('motion')) {
    return 'Kinetic & Physics-Driven';
  }
  return 'Minimal Systemic Enterprise';
}

function deriveAliasesForResource(
  res: DesignResource,
  category?: TaxonomyCategory
): string[] {
  const aliases = new Set<string>();
  aliases.add(res.slug.replace(/-/g, ' '));
  if (res.subcategory) aliases.add(res.subcategory);
  if (res.nestedCategoryPath) {
    res.nestedCategoryPath.forEach((p) => aliases.add(p));
  }
  if (category?.legacyAliases) {
    category.legacyAliases.forEach((a) => aliases.add(a.replace(/-/g, ' ')));
  }

  // Domain-specific synonyms so users searching common synonyms find exact technical monographs
  const lowerTitle = res.title.toLowerCase();
  if (lowerTitle.includes('token')) {
    aliases.add('design tokens');
    aliases.add('css variables');
    aliases.add('custom properties');
    aliases.add('theming');
  }
  if (lowerTitle.includes('spring') || lowerTitle.includes('motion')) {
    aliases.add('physics animation');
    aliases.add('harmonic oscillator');
    aliases.add('micro-interaction');
    aliases.add('transitions');
  }
  if (lowerTitle.includes('combobox') || lowerTitle.includes('aria')) {
    aliases.add('autocomplete');
    aliases.add('dropdown select');
    aliases.add('command palette');
    aliases.add('a11y keyboard navigation');
  }
  if (lowerTitle.includes('grid') || lowerTitle.includes('swiss')) {
    aliases.add('layout system');
    aliases.add('asymmetric columns');
    aliases.add('editorial layout');
  }
  if (lowerTitle.includes('container')) {
    aliases.add('responsive cards');
    aliases.add('@container queries');
    aliases.add('intrinsic web design');
  }

  return Array.from(aliases);
}

function mapClassificationToEntityKind(
  classification: ResourceClassification
): { kind: SearchEntityKind; label: string } {
  switch (classification) {
    case 'official-design-system':
      return { kind: 'design-system', label: 'Design System' };
    case 'visual-style':
      return { kind: 'visual-style', label: 'Visual Style' };
    case 'animation-technique':
      return { kind: 'animation', label: 'Motion & Animation' };
    case 'ui-component':
    case 'interactive-component':
      return { kind: 'ui-component', label: 'UI Component' };
    case 'interaction-pattern':
    case 'ui-pattern':
      return { kind: 'interaction-pattern', label: 'Interaction Pattern' };
    case 'development-technology':
      return { kind: 'technology', label: 'Technology' };
    case 'implementation-pattern':
      return { kind: 'implementation-example', label: 'Implementation Example' };
    default:
      return { kind: 'resource', label: 'Encyclopedia Resource' };
  }
}

/* ============================================================================
 * 3. INDEXED CORPUS BUILDER & DYNAMIC SEARCH INDEX ADAPTER (SECTION 8)
 * ========================================================================== */

const dynamicPublishedResourceIndex = new Map<string, DesignResource>();
const unpublishedOrDeletedSlugsSet = new Set<string>();

/**
 * Indexes or updates a published resource in the public search index.
 * Unpublished resources are rejected and purged automatically.
 */
export function indexPublishedResourceInSearch(
  resource: DesignResource,
  status: string = 'published'
): void {
  if (status !== 'published') {
    removeResourceFromPublicSearchIndex(resource.slug);
    return;
  }
  unpublishedOrDeletedSlugsSet.delete(resource.slug);
  dynamicPublishedResourceIndex.set(resource.slug, resource);
}

/**
 * Immediately removes an unpublished or deleted resource from the public search index.
 */
export function removeResourceFromPublicSearchIndex(slug: string): void {
  dynamicPublishedResourceIndex.delete(slug);
  unpublishedOrDeletedSlugsSet.add(slug);
}

/**
 * Synchronizes a batch of CMS records with the public search index.
 */
export function syncCatalogToPublicSearchIndex(
  publishedResources: DesignResource[],
  unpublishedSlugs: string[] = []
): void {
  for (const slug of unpublishedSlugs) {
    removeResourceFromPublicSearchIndex(slug);
  }
  for (const res of publishedResources) {
    indexPublishedResourceInSearch(res, 'published');
  }
}

/**
 * Checks if a given resource slug is currently present in the public search index.
 */
export function isResourceInPublicSearchIndex(slug: string): boolean {
  if (unpublishedOrDeletedSlugsSet.has(slug)) return false;
  if (dynamicPublishedResourceIndex.has(slug)) return true;
  return FOUNDATION_RESOURCES.some((r) => r.slug === slug);
}

/**
 * Returns the active public resource list for indexing (merging published CMS resources
 * and excluding any unpublished or deleted resource slugs).
 */
export function getActivePublicIndexedResources(): DesignResource[] {
  const merged = new Map<string, DesignResource>();
  for (const seed of FOUNDATION_RESOURCES) {
    if (!unpublishedOrDeletedSlugsSet.has(seed.slug)) {
      merged.set(seed.slug, seed);
    }
  }
  for (const [slug, cmsRes] of dynamicPublishedResourceIndex.entries()) {
    if (!unpublishedOrDeletedSlugsSet.has(slug)) {
      merged.set(slug, cmsRes);
    }
  }
  return Array.from(merged.values());
}

function buildUnifiedSearchCorpus(
  realViewCounts: Record<string, number> = {},
  realSaveCounts: Record<string, number> = {}
): GlobalSearchResultItem[] {
  const corpus: GlobalSearchResultItem[] = [];
  const activePublicResources = getActivePublicIndexedResources();

  // A. Index all published Encyclopedia Resources (excluding unpublished/deleted)
  for (const res of activePublicResources) {
    const primaryCat = getCategoryBySlug(res.categorySlug);
    const { kind, label } = mapClassificationToEntityKind(res.classification);
    const designStyle = deriveDesignStyleForResource(res);
    const aliases = deriveAliasesForResource(res, primaryCat);
    const implLanguages = Array.from(
      new Set(res.codeTemplates.map((ct) => ct.language))
    );
    const relatedConceptTitles = (res.relatedResourceSlugs || [])
      .map(
        (slug) =>
          FOUNDATION_RESOURCES.find((r) => r.slug === slug)?.title ||
          slug.replace(/-/g, ' ')
      );
    const mobileFeatures = res.accessibilitySpec.responsiveFeatures || [
      'Mobile-adaptive layout',
      'Touch-safe 44px targets',
    ];

    corpus.push({
      id: `res-${res.id}`,
      slug: res.slug,
      entityKind: kind,
      entityKindLabel: label,
      title: res.title,
      description: res.summary,
      categorySlug: res.categorySlug,
      categoryName: primaryCat?.name || res.categorySlug,
      subcategory: res.subcategory,
      classification: res.classification,
      difficulty: res.audienceLevel,
      technologies: res.technologies || ['CSS3', 'HTML5', 'TypeScript'],
      frameworks: res.frameworks || ['React', 'Next.js', 'Vanilla Web'],
      implementationLanguages:
        implLanguages.length > 0 ? implLanguages : ['css', 'tsx', 'html'],
      designStyle,
      mobileSupport: mobileFeatures,
      wcagLevel: res.accessibilitySpec.wcagComplianceLevel,
      previewAvailability: res.demonstrationFormat || 'runnable-code-demo',
      demoArchetype: res.demoArchetype,
      tags: res.tags || [],
      aliases,
      relatedConcepts: relatedConceptTitles,
      href: `/concept/${res.slug}`,
      playgroundHref: `/playground?resource=${encodeURIComponent(res.slug)}`,
      relevanceScore: 100,
      matchedTerms: [],
      fieldMatches: [],
      createdAtIso: res.createdAtIso || '2026-01-15T00:00:00.000Z',
      updatedAtIso: res.updatedAtIso,
      realViewCount: realViewCounts[res.slug] || 0,
      realSaveCount: realSaveCounts[res.slug] || 0,
    });
  }

  // B. Index Primary Categories & Deep Nested Subcategories as directly discoverable entries
  for (const cat of TAXONOMY_CATEGORIES) {
    const flatSubs = flattenSubcategoryTree(cat.subcategoryTree || []);
    const relatedCatNames = (cat.relatedCategorySlugs || []).map(
      (s) => getCategoryBySlug(s)?.name || s
    );

    corpus.push({
      id: `cat-${cat.id}`,
      slug: cat.slug,
      entityKind: 'category',
      entityKindLabel: 'Primary Category',
      title: `${String(cat.orderIndex).padStart(2, '0')}. ${cat.name}`,
      description: cat.shortDescription,
      categorySlug: cat.slug,
      categoryName: cat.name,
      subcategory: cat.subcategories[0],
      classification: cat.classification,
      difficulty: 'all-levels',
      technologies: cat.technologyAssociations || ['CSS3', 'TypeScript', 'React'],
      frameworks: ['React', 'Next.js', 'Vanilla Web'],
      implementationLanguages: ['css', 'tsx', 'html'],
      designStyle: 'Editorial Technical',
      mobileSupport: ['Mobile-adaptive layout', 'Touch-safe 44px targets'],
      wcagLevel: 'AAA',
      previewAvailability: 'visual-specimen',
      tags: [...(cat.tags || []), ...cat.subcategories.slice(0, 4)],
      aliases: [...(cat.legacyAliases || []), ...cat.subcategories],
      relatedConcepts: relatedCatNames,
      href: `/taxonomy/${cat.slug}`,
      playgroundHref: `/directory?cat=${encodeURIComponent(cat.slug)}`,
      relevanceScore: 85,
      matchedTerms: [],
      fieldMatches: [],
      createdAtIso: '2026-01-01T00:00:00.000Z',
      updatedAtIso: '2026-11-24T00:00:00.000Z',
      realViewCount: realViewCounts[cat.slug] || 0,
      realSaveCount: realSaveCounts[cat.slug] || 0,
    });

    // Index deep nested subcategory nodes (depth >= 2)
    for (const subNode of flatSubs.slice(0, 3)) {
      corpus.push({
        id: `sub-${cat.slug}-${subNode.id}`,
        slug: `${cat.slug}-${subNode.slug}`,
        entityKind: 'subcategory',
        entityKindLabel: `Subcategory (Depth ${subNode.depth})`,
        title: `${subNode.name} — ${cat.name}`,
        description:
          subNode.description ||
          `Specialized subcategory under ${cat.name} covering ${subNode.name}.`,
        categorySlug: cat.slug,
        categoryName: cat.name,
        subcategory: subNode.name,
        classification: cat.classification,
        difficulty: 'intermediate',
        technologies: cat.technologyAssociations || ['CSS3', 'TypeScript'],
        frameworks: ['React', 'Vanilla Web'],
        implementationLanguages: ['css', 'tsx'],
        designStyle: 'Minimal Systemic Enterprise',
        mobileSupport: ['Mobile-adaptive layout'],
        wcagLevel: 'AA',
        previewAvailability: 'runnable-code-demo',
        tags: subNode.tags || [subNode.name, cat.name],
        aliases: [subNode.slug.replace(/-/g, ' '), cat.name],
        relatedConcepts: cat.subcategories.slice(0, 4),
        href: `/taxonomy/${cat.slug}?sub=${encodeURIComponent(subNode.name)}`,
        playgroundHref: `/directory?cat=${encodeURIComponent(cat.slug)}&sub=${encodeURIComponent(subNode.name)}`,
        relevanceScore: 75,
        matchedTerms: [],
        fieldMatches: [],
        createdAtIso: '2026-02-01T00:00:00.000Z',
        updatedAtIso: '2026-11-24T00:00:00.000Z',
        realViewCount: 0,
        realSaveCount: 0,
      });
    }
  }

  return corpus;
}

/* ============================================================================
 * 4. MULTI-FIELD SCORING & PARTIAL KEYWORD RANKING ENGINE
 * ========================================================================== */

function scoreItemAgainstQuery(
  item: GlobalSearchResultItem,
  normalizedQuery: string,
  queryTokens: string[]
): {
  matches: boolean;
  score: number;
  matchedTerms: string[];
  fieldMatches: SearchFieldMatch[];
} {
  if (!normalizedQuery || queryTokens.length === 0) {
    // When query is empty, return all items with baseline priority (resources above categories/subcategories)
    const basePriority =
      item.entityKind === 'category'
        ? 60
        : item.entityKind === 'subcategory'
        ? 45
        : 100;
    return {
      matches: true,
      score: basePriority,
      matchedTerms: [],
      fieldMatches: [],
    };
  }

  let totalScore = 0;
  const matchedTermsSet = new Set<string>();
  const fieldMatches: SearchFieldMatch[] = [];

  const titleLower = item.title.toLowerCase();
  const descLower = item.description.toLowerCase();
  const tagsLower = item.tags.map((t) => t.toLowerCase());
  const aliasesLower = item.aliases.map((a) => a.toLowerCase());
  const techLower = [
    ...item.technologies,
    ...item.frameworks,
    ...item.implementationLanguages,
  ].map((t) => t.toLowerCase());
  const catLower = `${item.categoryName} ${item.subcategory || ''}`.toLowerCase();
  const relatedLower = item.relatedConcepts.map((r) => r.toLowerCase());

  // 1. Exact or phrase match in title (Highest weight)
  if (titleLower === normalizedQuery) {
    totalScore += 250;
    matchedTermsSet.add(normalizedQuery);
  } else if (titleLower.startsWith(normalizedQuery)) {
    totalScore += 180;
    matchedTermsSet.add(normalizedQuery);
  } else if (titleLower.includes(normalizedQuery)) {
    totalScore += 140;
    matchedTermsSet.add(normalizedQuery);
  }

  // 2. Exact phrase match in description, tags, or technologies
  if (descLower.includes(normalizedQuery)) {
    totalScore += 75;
  }

  // 3. Evaluate each query token across all 7 required search fields (Section 1)
  let tokensMatchedCount = 0;

  for (const token of queryTokens) {
    let tokenMatchedInAnyField = false;

    // Field A: Title
    if (titleLower.includes(token)) {
      totalScore += titleLower.startsWith(token) ? 70 : 50;
      tokenMatchedInAnyField = true;
      matchedTermsSet.add(token);
      fieldMatches.push({
        field: 'title',
        matchedTerms: [token],
        snippet: item.title,
      });
    }

    // Field B: Tags
    const matchedTag = item.tags.find((t) => t.toLowerCase().includes(token));
    if (matchedTag) {
      totalScore +=
        matchedTag.toLowerCase() === token ? 60 : 40;
      tokenMatchedInAnyField = true;
      matchedTermsSet.add(matchedTag);
      fieldMatches.push({
        field: 'tags',
        matchedTerms: [token],
        snippet: `Tag: ${matchedTag}`,
      });
    }

    // Field C: Technologies & Frameworks
    const matchedTech = [
      ...item.technologies,
      ...item.frameworks,
      ...item.implementationLanguages,
    ].find((t) => t.toLowerCase().includes(token));
    if (matchedTech) {
      totalScore +=
        matchedTech.toLowerCase() === token ? 65 : 42;
      tokenMatchedInAnyField = true;
      matchedTermsSet.add(matchedTech);
      fieldMatches.push({
        field: 'technologies',
        matchedTerms: [token],
        snippet: `Tech: ${matchedTech}`,
      });
    }

    // Field D: Aliases
    const matchedAlias = item.aliases.find((a) =>
      a.toLowerCase().includes(token)
    );
    if (matchedAlias) {
      totalScore += 36;
      tokenMatchedInAnyField = true;
      matchedTermsSet.add(matchedAlias);
      fieldMatches.push({
        field: 'aliases',
        matchedTerms: [token],
        snippet: `Alias: ${matchedAlias}`,
      });
    }

    // Field E: Category & Subcategory Names
    if (catLower.includes(token)) {
      totalScore += 34;
      tokenMatchedInAnyField = true;
      matchedTermsSet.add(item.categoryName);
      fieldMatches.push({
        field: 'category',
        matchedTerms: [token],
        snippet: item.subcategory
          ? `${item.categoryName} / ${item.subcategory}`
          : item.categoryName,
      });
    }

    // Field F: Description
    if (descLower.includes(token)) {
      totalScore += 26;
      tokenMatchedInAnyField = true;
      matchedTermsSet.add(token);
      fieldMatches.push({
        field: 'description',
        matchedTerms: [token],
        snippet: item.description,
      });
    }

    // Field G: Related Concepts
    const matchedRelated = item.relatedConcepts.find((rc) =>
      rc.toLowerCase().includes(token)
    );
    if (matchedRelated) {
      totalScore += 22;
      tokenMatchedInAnyField = true;
      matchedTermsSet.add(matchedRelated);
      fieldMatches.push({
        field: 'related-concepts',
        matchedTerms: [token],
        snippet: `Related: ${matchedRelated}`,
      });
    }

    // Prefix / subsequence fuzzy fallback for partial keyword matching (e.g. "neobrut" -> "neobrutalism")
    if (!tokenMatchedInAnyField && token.length >= 3) {
      const anyPrefixMatch =
        tagsLower.some((t) => t.startsWith(token)) ||
        aliasesLower.some((a) => a.startsWith(token)) ||
        techLower.some((t) => t.startsWith(token)) ||
        relatedLower.some((r) => r.startsWith(token));
      if (anyPrefixMatch) {
        totalScore += 20;
        tokenMatchedInAnyField = true;
        matchedTermsSet.add(token);
      }
    }

    if (tokenMatchedInAnyField) {
      tokensMatchedCount += 1;
    }
  }

  // Require at least one token match, and boost items that match ALL query tokens
  if (tokensMatchedCount === 0) {
    return {
      matches: false,
      score: 0,
      matchedTerms: [],
      fieldMatches: [],
    };
  }

  if (tokensMatchedCount === queryTokens.length && queryTokens.length > 1) {
    totalScore += 55;
  }

  // Deduplicate field matches by field type
  const uniqueFieldMatches: SearchFieldMatch[] = [];
  const seenFields = new Set<string>();
  for (const fm of fieldMatches) {
    if (!seenFields.has(fm.field)) {
      seenFields.add(fm.field);
      uniqueFieldMatches.push(fm);
    }
  }

  return {
    matches: true,
    score: totalScore,
    matchedTerms: Array.from(matchedTermsSet).slice(0, 6),
    fieldMatches: uniqueFieldMatches.slice(0, 4),
  };
}

/* ============================================================================
 * 5. DATABASE-BACKED SEARCH PROVIDER IMPLEMENTATION (SECTION 5)
 * ========================================================================== */

export class DatabaseBackedSearchProvider implements ISearchProvider {
  readonly providerId = 'database-backed-index' as const;

  async search(request: GlobalSearchQueryRequest): Promise<GlobalSearchResponse> {
    const startTime = performance.now();

    if (request.simulateError) {
      throw new Error(
        'SearchProviderException: Simulated search index timeout or connection error. Verify error recovery state.'
      );
    }

    const { normalizedQuery, queryTokens } = normalizeSearchQuery(
      request.query || ''
    );
    const realViewCounts = request.realViewCounts || {};
    const realSaveCounts = request.realSaveCounts || {};

    const fullCorpus = buildUnifiedSearchCorpus(realViewCounts, realSaveCounts);

    // Build facet counts across the corpus
    const facets = this.computeFacetBuckets(fullCorpus);
    const insights = this.computeDiscoveryInsights(
      fullCorpus,
      normalizedQuery
    );

    // Filter and score items
    const matchedItems: GlobalSearchResultItem[] = [];

    for (const item of fullCorpus) {
      // Entity Kind Tab filter
      if (
        request.entityKindFilter &&
        request.entityKindFilter !== 'all' &&
        item.entityKind !== request.entityKindFilter
      ) {
        continue;
      }

      // 11 Advanced Filters (Section 3)
      const f = request.filters;

      if (
        f.categories.length > 0 &&
        !f.categories.includes(item.categorySlug)
      ) {
        continue;
      }

      if (
        f.subcategories.length > 0 &&
        (!item.subcategory || !f.subcategories.includes(item.subcategory))
      ) {
        continue;
      }

      if (
        f.resourceTypes.length > 0 &&
        !f.resourceTypes.includes(item.classification)
      ) {
        continue;
      }

      if (
        f.designStyles.length > 0 &&
        (!item.designStyle || !f.designStyles.includes(item.designStyle))
      ) {
        continue;
      }

      if (
        f.technologies.length > 0 &&
        !f.technologies.some((tech) =>
          item.technologies.some(
            (it) => it.toLowerCase() === tech.toLowerCase()
          )
        )
      ) {
        continue;
      }

      if (
        f.frameworks.length > 0 &&
        !f.frameworks.some((fw) =>
          item.frameworks.some((ifw) => ifw.toLowerCase() === fw.toLowerCase())
        )
      ) {
        continue;
      }

      if (
        f.difficulties.length > 0 &&
        !f.difficulties.includes(item.difficulty)
      ) {
        continue;
      }

      if (
        f.implementationLanguages.length > 0 &&
        !f.implementationLanguages.some((lang) =>
          item.implementationLanguages.includes(lang)
        )
      ) {
        continue;
      }

      if (
        f.mobileSupport.length > 0 &&
        !f.mobileSupport.some((ms) => item.mobileSupport.includes(ms))
      ) {
        continue;
      }

      if (
        f.accessibilitySupport.length > 0 &&
        !f.accessibilitySupport.includes(item.wcagLevel)
      ) {
        continue;
      }

      if (
        f.previewAvailability.length > 0 &&
        !f.previewAvailability.includes(item.previewAvailability)
      ) {
        continue;
      }

      // Score against query
      const { matches, score, matchedTerms, fieldMatches } =
        scoreItemAgainstQuery(item, normalizedQuery, queryTokens);

      if (!matches) continue;

      matchedItems.push({
        ...item,
        relevanceScore: score,
        matchedTerms,
        fieldMatches,
      });
    }

    // Sorting (Section 4)
    matchedItems.sort((a, b) => {
      switch (request.sort) {
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'recently-added':
          return (
            new Date(b.createdAtIso).getTime() -
            new Date(a.createdAtIso).getTime()
          );
        case 'recently-updated':
          return (
            new Date(b.updatedAtIso).getTime() -
            new Date(a.updatedAtIso).getTime()
          );
        case 'most-viewed':
          if (b.realViewCount !== a.realViewCount) {
            return b.realViewCount - a.realViewCount;
          }
          return b.relevanceScore - a.relevanceScore;
        case 'most-saved':
          if (b.realSaveCount !== a.realSaveCount) {
            return b.realSaveCount - a.realSaveCount;
          }
          return b.relevanceScore - a.relevanceScore;
        case 'relevance':
        default:
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return a.title.localeCompare(b.title);
      }
    });

    // Pagination (Section 5 & Section 6)
    const pageSize = Math.max(1, Math.min(48, request.pageSize || 8));
    const totalMatches = matchedItems.length;
    const totalPages = Math.max(1, Math.ceil(totalMatches / pageSize));
    const safePage = Math.max(1, Math.min(totalPages, request.page || 1));
    const startIdx = (safePage - 1) * pageSize;
    const paginatedItems = matchedItems.slice(startIdx, startIdx + pageSize);

    const hasRealViewMetrics = Object.values(realViewCounts).some((c) => c > 0);
    const hasRealSaveMetrics = Object.values(realSaveCounts).some((c) => c > 0);

    const executionTimeMs = Math.max(
      1,
      Math.round((performance.now() - startTime) * 10) / 10
    );

    return {
      providerId: this.providerId,
      normalizedQuery,
      queryTokens,
      items: paginatedItems,
      totalMatches,
      page: safePage,
      pageSize,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
      executionTimeMs,
      hasRealViewMetrics,
      hasRealSaveMetrics,
      facets,
      insights,
    };
  }

  private computeFacetBuckets(
    corpus: GlobalSearchResultItem[]
  ): SearchFacetBuckets {
    const resourceCorpus = corpus.filter(
      (i) => i.entityKind !== 'category' && i.entityKind !== 'subcategory'
    );

    const categories = TAXONOMY_CATEGORIES.map((cat) => ({
      slug: cat.slug,
      name: `${String(cat.orderIndex).padStart(2, '0')}. ${cat.name}`,
      count: getCategoryResourceCount(cat, FOUNDATION_RESOURCES),
    }));

    const subMap = new Map<string, { categorySlug: string; count: number }>();
    for (const item of resourceCorpus) {
      if (item.subcategory) {
        const prev = subMap.get(item.subcategory);
        subMap.set(item.subcategory, {
          categorySlug: item.categorySlug,
          count: (prev?.count || 0) + 1,
        });
      }
    }
    const subcategories = Array.from(subMap.entries()).map(([name, data]) => ({
      name,
      categorySlug: data.categorySlug,
      count: data.count,
    }));

    const resourceTypes = CLASSIFICATION_DESCRIPTORS.map((desc) => ({
      id: desc.id,
      label: desc.pluralLabel,
      count: resourceCorpus.filter((r) => r.classification === desc.id).length,
    })).filter((rt) => rt.count > 0);

    const styleMap = new Map<string, number>();
    const techMap = new Map<string, number>();
    const fwMap = new Map<string, number>();
    const mobileMap = new Map<string, number>();

    for (const item of resourceCorpus) {
      if (item.designStyle) {
        styleMap.set(
          item.designStyle,
          (styleMap.get(item.designStyle) || 0) + 1
        );
      }
      for (const t of item.technologies) {
        techMap.set(t, (techMap.get(t) || 0) + 1);
      }
      for (const fw of item.frameworks) {
        fwMap.set(fw, (fwMap.get(fw) || 0) + 1);
      }
      for (const ms of item.mobileSupport) {
        mobileMap.set(ms, (mobileMap.get(ms) || 0) + 1);
      }
    }

    const difficulties: {
      id: AudienceDifficulty;
      label: string;
      count: number;
    }[] = (
      [
        { id: 'beginner', label: 'Beginner' },
        { id: 'intermediate', label: 'Intermediate' },
        { id: 'advanced', label: 'Advanced' },
        { id: 'all-levels', label: 'All Levels' },
      ] as const
    ).map((d) => ({
      ...d,
      count: resourceCorpus.filter((r) => r.difficulty === d.id).length,
    }));

    const implementationLanguages: {
      id: 'css' | 'tsx' | 'html' | 'json' | 'ts';
      label: string;
      count: number;
    }[] = (
      [
        { id: 'css', label: 'CSS3 / Custom Properties' },
        { id: 'tsx', label: 'React / TypeScript (TSX)' },
        { id: 'html', label: 'Semantic HTML5' },
        { id: 'ts', label: 'TypeScript Module' },
        { id: 'json', label: 'W3C Design Tokens JSON' },
      ] as const
    )
      .map((l) => ({
        ...l,
        count: resourceCorpus.filter((r) =>
          r.implementationLanguages.includes(l.id)
        ).length,
      }))
      .filter((l) => l.count > 0);

    const accessibilitySupport: {
      id: 'AA' | 'AAA';
      label: string;
      count: number;
    }[] = [
      {
        id: 'AAA',
        label: 'WCAG AAA (7:1+ Enhanced)',
        count: resourceCorpus.filter((r) => r.wcagLevel === 'AAA').length,
      },
      {
        id: 'AA',
        label: 'WCAG AA (4.5:1 Standard)',
        count: resourceCorpus.filter((r) => r.wcagLevel === 'AA').length,
      },
    ];

    const previewAvailability: {
      id: 'runnable-code-demo' | 'visual-specimen';
      label: string;
      count: number;
    }[] = [
      {
        id: 'runnable-code-demo',
        label: 'Runnable Code Demo',
        count: resourceCorpus.filter(
          (r) => r.previewAvailability === 'runnable-code-demo'
        ).length,
      },
      {
        id: 'visual-specimen',
        label: 'Interactive Visual Specimen',
        count: resourceCorpus.filter(
          (r) => r.previewAvailability === 'visual-specimen'
        ).length,
      },
    ];

    return {
      categories,
      subcategories,
      resourceTypes,
      designStyles: Array.from(styleMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      technologies: Array.from(techMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      frameworks: Array.from(fwMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      difficulties,
      implementationLanguages,
      mobileSupport: Array.from(mobileMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      accessibilitySupport,
      previewAvailability,
    };
  }

  private computeDiscoveryInsights(
    corpus: GlobalSearchResultItem[],
    normalizedQuery: string
  ): SearchDiscoveryInsights {
    const resourceItems = corpus.filter(
      (i) => i.entityKind !== 'category' && i.entityKind !== 'subcategory'
    );

    // Trending searches derived strictly from actual indexed tags and technologies with highest coverage
    const tagFrequency = new Map<string, number>();
    for (const item of resourceItems) {
      for (const tag of item.tags) {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      }
      for (const tech of item.technologies) {
        tagFrequency.set(tech, (tagFrequency.get(tech) || 0) + 1);
      }
    }

    const trendingSearches = Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([term, count]) => ({
        term,
        reason: `Indexed across ${count} encyclopedia specification${count === 1 ? '' : 's'}`,
        matchingResourceCount: count,
      }));

    // Popular categories derived strictly from actual indexed resource density + subcategory tree breadth
    const popularCategories = TAXONOMY_CATEGORIES.map((cat) => {
      const indexedResourceCount = getCategoryResourceCount(
        cat,
        FOUNDATION_RESOURCES
      );
      const subcategoryCount = flattenSubcategoryTree(
        cat.subcategoryTree || []
      ).length;
      return {
        slug: cat.slug,
        name: cat.name,
        shortDescription: cat.shortDescription,
        indexedResourceCount,
        subcategoryCount,
      };
    })
      .sort(
        (a, b) =>
          b.indexedResourceCount * 10 +
          b.subcategoryCount -
          (a.indexedResourceCount * 10 + a.subcategoryCount)
      )
      .slice(0, 6);

    // Typeahead autocomplete suggestions matching current query (or featured items if empty)
    const suggestionPool = normalizedQuery
      ? corpus.filter(
          (i) =>
            i.title.toLowerCase().includes(normalizedQuery) ||
            i.tags.some((t) => t.toLowerCase().includes(normalizedQuery)) ||
            i.technologies.some((t) =>
              t.toLowerCase().includes(normalizedQuery)
            )
        )
      : resourceItems;

    const suggestions = suggestionPool.slice(0, 6).map((item) => ({
      text: item.title,
      kind: item.entityKind,
      href: item.href,
      categoryName: item.categoryName,
    }));

    return {
      trendingSearches,
      popularCategories,
      suggestions,
    };
  }
}

/* ============================================================================
 * 6. TYPESENSE-READY ADAPTER SKELETON & FACTORY (SECTION 5)
 * ========================================================================== */

/**
 * Ready-to-wire Typesense Search Provider adapter that implements `ISearchProvider`
 * and falls back gracefully to `DatabaseBackedSearchProvider` when `TYPESENSE_HOST`
 * is not provisioned in the environment.
 */
export class TypesenseReadySearchProvider implements ISearchProvider {
  readonly providerId = 'typesense-adapter' as const;
  private fallbackProvider = new DatabaseBackedSearchProvider();

  async search(request: GlobalSearchQueryRequest): Promise<GlobalSearchResponse> {
    // Delegates to database-backed search index until TYPESENSE_API_KEY & TYPESENSE_HOST are configured
    return this.fallbackProvider.search(request);
  }
}

const defaultSearchProviderInstance = new DatabaseBackedSearchProvider();

export function getGlobalSearchProvider(): ISearchProvider {
  if (process.env.TYPESENSE_HOST && process.env.TYPESENSE_API_KEY) {
    return new TypesenseReadySearchProvider();
  }
  return defaultSearchProviderInstance;
}
