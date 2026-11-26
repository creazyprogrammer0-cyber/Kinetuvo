import { NextRequest, NextResponse } from 'next/server';
import { getGlobalSearchProvider } from '@/lib/search/search-service';
import {
  EMPTY_GLOBAL_SEARCH_FILTERS,
  GlobalSearchFilters,
  GlobalSearchQueryRequest,
  GlobalSearchSortMode,
  SearchEntityKind,
} from '@/lib/search/types';
import {
  AudienceDifficulty,
  ResourceClassification,
} from '@/types/encyclopedia';

function parseListParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const query = params.get('q') || '';
    const sort =
      (params.get('sort') as GlobalSearchSortMode) || 'relevance';
    const page = Math.max(1, Number(params.get('page')) || 1);
    const pageSize = Math.max(1, Math.min(48, Number(params.get('pageSize')) || 8));
    const entityKindFilter =
      (params.get('kind') as SearchEntityKind | 'all') || 'all';
    const simulateError = params.get('simulateError') === 'true';

    const filters: GlobalSearchFilters = {
      categories: parseListParam(params, 'cat'),
      subcategories: parseListParam(params, 'sub'),
      resourceTypes: parseListParam(
        params,
        'type'
      ) as ResourceClassification[],
      designStyles: parseListParam(params, 'style'),
      technologies: parseListParam(params, 'tech'),
      frameworks: parseListParam(params, 'fw'),
      difficulties: parseListParam(
        params,
        'diff'
      ) as AudienceDifficulty[],
      implementationLanguages: parseListParam(params, 'lang') as (
        | 'css'
        | 'tsx'
        | 'html'
        | 'json'
        | 'ts'
      )[],
      mobileSupport: parseListParam(params, 'mobile'),
      accessibilitySupport: parseListParam(params, 'a11y') as (
        | 'AA'
        | 'AAA'
      )[],
      previewAvailability: parseListParam(params, 'preview') as (
        | 'runnable-code-demo'
        | 'visual-specimen'
      )[],
    };

    const provider = getGlobalSearchProvider();
    const response = await provider.search({
      query,
      filters,
      sort,
      page,
      pageSize,
      entityKindFilter,
      simulateError,
    });

    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Unexpected search service execution error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GlobalSearchQueryRequest>;
    const provider = getGlobalSearchProvider();

    const response = await provider.search({
      query: body.query || '',
      filters: {
        ...EMPTY_GLOBAL_SEARCH_FILTERS,
        ...(body.filters || {}),
      },
      sort: body.sort || 'relevance',
      page: body.page || 1,
      pageSize: body.pageSize || 8,
      entityKindFilter: body.entityKindFilter || 'all',
      realViewCounts: body.realViewCounts || {},
      realSaveCounts: body.realSaveCounts || {},
      simulateError: Boolean(body.simulateError),
    });

    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Unexpected search service execution error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
