/**
 * Authentic Search & Resource Engagement Metrics Ledger (Section 2 & Section 4).
 *
 * Rules:
 * - Never fabricates random view counts or save numbers.
 * - Starts at 0 for all unvisited items, and increments strictly when a user
 *   actually views a resource, saves a bookmark, or executes a search query.
 */

const VIEW_COUNTS_STORAGE_KEY = 'dde_real_resource_view_counts_v1';
const SEARCH_QUERY_COUNTS_STORAGE_KEY = 'dde_real_search_query_counts_v1';
const RECENT_SEARCHES_STORAGE_KEY = 'dde_recent_searches_v1';

export function loadRealResourceViewCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(VIEW_COUNTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordRealResourceView(resourceSlug: string): Record<string, number> {
  if (typeof window === 'undefined' || !resourceSlug) return {};
  const current = loadRealResourceViewCounts();
  const next = {
    ...current,
    [resourceSlug]: (current[resourceSlug] || 0) + 1,
  };
  try {
    window.localStorage.setItem(VIEW_COUNTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage quota fallback
  }
  return next;
}

export function loadRealSearchQueryCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SEARCH_QUERY_COUNTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordRealSearchQueryExecution(query: string): Record<string, number> {
  const clean = query.trim();
  if (typeof window === 'undefined' || clean.length < 2) {
    return loadRealSearchQueryCounts();
  }
  const current = loadRealSearchQueryCounts();
  const next = {
    ...current,
    [clean]: (current[clean] || 0) + 1,
  };
  try {
    window.localStorage.setItem(
      SEARCH_QUERY_COUNTS_STORAGE_KEY,
      JSON.stringify(next)
    );
  } catch {
    // Storage quota fallback
  }
  return next;
}

export function loadRecentSearchTerms(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentSearchTerm(term: string): string[] {
  const clean = term.trim();
  if (typeof window === 'undefined' || !clean) return loadRecentSearchTerms();
  const current = loadRecentSearchTerms();
  const next = [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    8
  );
  try {
    window.localStorage.setItem(
      RECENT_SEARCHES_STORAGE_KEY,
      JSON.stringify(next)
    );
  } catch {
    // Storage quota fallback
  }
  return next;
}

export function clearRecentSearchTerms(): string[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return [];
}
