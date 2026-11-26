import { NextRequest, NextResponse } from 'next/server';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import { TAXONOMY_CATEGORIES } from '@/lib/taxonomy/registry';
import {
  CANONICAL_TECHNOLOGIES,
  getCanonicalSiteUrl,
} from '@/lib/seo/metadata-architect';
import { sanitizeRichTextField } from '@/lib/admin/cms-types';

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const rateLimitStore = new Map<string, RateLimitBucket>();

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return 'local-client';
}

function checkRateLimit(clientId: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const existing = rateLimitStore.get(clientId);

  if (!existing || now >= existing.resetAtMs) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetAtMs: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterSeconds: 60,
    };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAtMs - now) / 1000)
      ),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - existing.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.resetAtMs - now) / 1000)
    ),
  };
}

function buildSecurityHeaders(
  remaining: number,
  retryAfterSeconds: number
): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store, max-age=0',
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
    'X-RateLimit-Remaining': String(remaining),
    'Retry-After': String(retryAfterSeconds),
    'Access-Control-Allow-Origin': getCanonicalSiteUrl(),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: buildSecurityHeaders(RATE_LIMIT_MAX_REQUESTS, 60),
  });
}

export async function GET(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rl = checkRateLimit(clientId);
  const headers = buildSecurityHeaders(rl.remaining, rl.retryAfterSeconds);

  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Rate limit exceeded. Please retry after the cooldown window.',
      },
      { status: 429, headers }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      timestampIso: new Date().toISOString(),
      canonicalBaseUrl: getCanonicalSiteUrl(),
      seoInventory: {
        indexableCategoriesCount: TAXONOMY_CATEGORIES.length,
        indexableResourcesCount: FOUNDATION_RESOURCES.length,
        indexableTechnologiesCount: CANONICAL_TECHNOLOGIES.length,
        canonicalPatterns: [
          '/categories/[categorySlug]',
          '/resources/[resourceSlug]',
          '/technologies/[techSlug]',
          '/playground',
        ],
        noindexProtectedPaths: [
          '/admin',
          '/dashboard',
          '/api/*',
          '/search?*',
          '/playground?experiment=*',
        ],
      },
      securityPosture: {
        cspEnforced: true,
        rateLimitingActive: true,
        rateLimitWindowSeconds: 60,
        rateLimitMaxRequests: RATE_LIMIT_MAX_REQUESTS,
        rateLimitRemaining: rl.remaining,
        secretsExposedInClientBundle: false,
        sandboxIframeIsolation:
          "sandbox='allow-scripts' with connect-src 'none'",
      },
    },
    { status: 200, headers }
  );
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rl = checkRateLimit(clientId);
  const headers = buildSecurityHeaders(rl.remaining, rl.retryAfterSeconds);

  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Rate limit exceeded. Please retry after the cooldown window.',
      },
      { status: 429, headers }
    );
  }

  try {
    const body = (await req.json()) as {
      candidateInput?: unknown;
      checkPath?: unknown;
    };

    const rawInput =
      typeof body?.candidateInput === 'string' ? body.candidateInput : '';
    const checkPath =
      typeof body?.checkPath === 'string'
        ? body.checkPath.trim().slice(0, 200)
        : '/resources/material-3-semantic-token-hierarchy';

    if (rawInput.length > 5000) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Payload exceeds maximum allowed length (5000 chars).',
        },
        { status: 400, headers }
      );
    }

    const sanitizedOutput = sanitizeRichTextField(rawInput, 1000);
    const hadDangerousMarkup = sanitizedOutput !== rawInput.trim();

    const isPrivateNoindexRoute =
      checkPath.startsWith('/admin') ||
      checkPath.startsWith('/dashboard') ||
      checkPath.startsWith('/api') ||
      checkPath.includes('?');

    return NextResponse.json(
      {
        ok: true,
        sanitizedOutput,
        xssVectorsNeutralized: hadDangerousMarkup,
        routeAudit: {
          path: checkPath,
          indexableBySearchEngines: !isPrivateNoindexRoute,
          robotsDirective: isPrivateNoindexRoute
            ? 'noindex, nofollow'
            : 'index, follow',
        },
      },
      { status: 200, headers }
    );
  } catch {
    // Never disclose internal stack traces or parser details
    return NextResponse.json(
      {
        ok: false,
        error: 'Malformed JSON request payload.',
      },
      { status: 400, headers }
    );
  }
}
