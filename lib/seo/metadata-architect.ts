import type { Metadata } from 'next';
import { BRAND_CONFIG } from '@/config/brand.config';
import {
  FOUNDATION_RESOURCES,
  getResourceBySlug,
} from '@/lib/resources/seed-foundation';
import {
  TAXONOMY_CATEGORIES,
  getCategoryBySlug,
  getClassificationDescriptor,
  resourceBelongsToCategory,
} from '@/lib/taxonomy/registry';
import { sanitizeKebabSlug } from '@/lib/admin/cms-types';
import { DesignResource, TaxonomyCategory } from '@/types/encyclopedia';

export function getCanonicalSiteUrl(): string {
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://ais-pre-a2i2kjnalp3myfp2wqowfr-308519407982.asia-southeast1.run.app';
  return envUrl.replace(/\/+$/, '');
}

export function buildCanonicalUrl(pathname: string): string {
  const base = getCanonicalSiteUrl();
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${cleanPath}`;
}

/* ============================================================================
 * CANONICAL TECHNOLOGIES REGISTRY (/technologies/[techSlug])
 * ========================================================================== */

export interface CanonicalTechnologyEntry {
  slug: string;
  name: string;
  category:
    | 'W3C Web Standard'
    | 'Accessibility Specification'
    | 'UI & Rendering Runtime'
    | 'Animation & Graphics API'
    | 'Styling & Token Architecture';
  version: string;
  officialSpecUrl: string;
  shortDescription: string;
  architecturalOverview: string;
  keyCapabilities: string[];
  browserSupportSummary: string;
  accessibilityConsiderations: string;
  performanceGuidance: string;
  codeSpecimen: string;
  relatedCategorySlugs: string[];
}

export const CANONICAL_TECHNOLOGIES: CanonicalTechnologyEntry[] = [
  {
    slug: 'css-custom-properties',
    name: 'CSS Custom Properties (Variables)',
    category: 'Styling & Token Architecture',
    version: 'W3C Level 1',
    officialSpecUrl: 'https://www.w3.org/TR/css-variables-1/',
    shortDescription:
      'Cascading runtime CSS variables that power multi-tier semantic design token hierarchies, zero-flash theme polarity switching, and sub-2ms interactive parameter binding.',
    architecturalOverview:
      'CSS Custom Properties enable design systems to decouple primitive color/spacing scales from semantic component tokens. Because they participate in the DOM cascade, updating a single token on :root or a scoped container immediately recalculates dependent styles without JavaScript re-renders.',
    keyCapabilities: [
      'Three-tier token hierarchy (Primitive -> Semantic -> Component)',
      'Instant light/dark polarity switching via root scope overrides',
      'Direct DOM style binding for 120fps interactive parameter sliders',
      'Fallback resolution via var(--token-name, fallback-value)',
    ],
    browserSupportSummary:
      'Baseline Widely Available across Chrome 49+, Firefox 31+, Safari 9.1+, and Edge 15+.',
    accessibilityConsiderations:
      'Supports high-contrast theme overrides (@media (prefers-contrast: more)) and user-configured color polarity without stripping semantic focus rings.',
    performanceGuidance:
      'Scope frequently mutated interactive variables to the nearest component container rather than :root to minimize style recalculation blast radius.',
    codeSpecimen: `:root {\n  --primitive-indigo-600: #4f46e5;\n  --semantic-surface-interactive: var(--primitive-indigo-600);\n}\n.dark {\n  --primitive-indigo-600: #6366f1;\n}`,
    relatedCategorySlugs: ['design-systems', 'design-fundamentals', 'ui-components'],
  },
  {
    slug: 'wai-aria-1-2',
    name: 'WAI-ARIA 1.2 & Authoring Practices',
    category: 'Accessibility Specification',
    version: 'W3C Recommendation 1.2',
    officialSpecUrl: 'https://www.w3.org/TR/wai-aria-1.2/',
    shortDescription:
      'Web Accessibility Initiative Accessible Rich Internet Applications standard defining semantic roles, states, properties, and keyboard focus management contracts.',
    architecturalOverview:
      'WAI-ARIA bridges the gap between custom interactive UI components and assistive technologies by exposing explicit role contracts (dialog, combobox, tablist, treegrid), live region announcements, and roving tabindex focus graphs to the browser accessibility tree.',
    keyCapabilities: [
      'Composite widget keyboard navigation (roving tabindex & aria-activedescendant)',
      'Modal dialog focus trapping and deterministic trigger restoration',
      'Dynamic status announcements via aria-live="polite" and role="status"',
      'Hierarchical tree and disclosure state signaling (aria-expanded, aria-selected)',
    ],
    browserSupportSummary:
      'Supported across all evergreen browsers and major screen readers (NVDA, JAWS, VoiceOver, TalkBack).',
    accessibilityConsiderations:
      'First Rule of ARIA: Always prefer native HTML5 semantic elements (<button>, <dialog>, <nav>, <main>) before adding custom ARIA attributes.',
    performanceGuidance:
      'Batch DOM attribute updates on aria-activedescendant and avoid flooding aria-live regions during rapid keyboard filtering.',
    codeSpecimen: `<div role="tablist" aria-label="Component Views">\n  <button role="tab" aria-selected="true" aria-controls="panel-preview" id="tab-preview">Preview</button>\n</div>\n<div role="tabpanel" id="panel-preview" aria-labelledby="tab-preview">...</div>`,
    relatedCategorySlugs: [
      'accessibility-inclusive-design',
      'ui-components',
      'ux-interaction-patterns',
    ],
  },
  {
    slug: 'css-grid-subgrid',
    name: 'CSS Grid Layout & Subgrid Level 2',
    category: 'W3C Web Standard',
    version: 'W3C Level 2',
    officialSpecUrl: 'https://www.w3.org/TR/css-grid-2/',
    shortDescription:
      'Two-dimensional structural grid layout system supporting intrinsic track sizing, minmax() fluid responsiveness, and nested subgrid track alignment.',
    architecturalOverview:
      'CSS Grid Level 2 allows deeply nested card children to inherit their parent grid track definitions via grid-template-rows: subgrid and grid-template-columns: subgrid, guaranteeing horizontal alignment of headers, bodies, and footers across multi-column bento and editorial layouts.',
    keyCapabilities: [
      'Two-dimensional explicit and implicit track orchestration',
      'Subgrid track inheritance across nested component boundaries',
      'Intrinsic responsive layouts with repeat(auto-fit, minmax(280px, 1fr))',
      'Named grid lines and semantic grid-template-areas',
    ],
    browserSupportSummary:
      'Baseline Widely Available across Chrome 117+, Firefox 71+, Safari 16+, and Edge 117+.',
    accessibilityConsiderations:
      'Maintain logical DOM source order matching visual reading order so keyboard Tab traversal never jumps erratically across grid cells.',
    performanceGuidance:
      'Avoid animating grid-template-columns/rows on scroll; reserve layout track transitions for discrete user-triggered drawer expansions.',
    codeSpecimen: `.catalog-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));\n  gap: 1.5rem;\n}\n.catalog-card {\n  display: grid;\n  grid-row: span 3;\n  grid-template-rows: subgrid;\n}`,
    relatedCategorySlugs: [
      'layout-grid-systems',
      'responsive-adaptive-design',
      'design-fundamentals',
    ],
  },
  {
    slug: 'web-animations-api',
    name: 'Web Animations API (WAAPI) & Spring Physics',
    category: 'Animation & Graphics API',
    version: 'W3C Level 1',
    officialSpecUrl: 'https://www.w3.org/TR/web-animations-1/',
    shortDescription:
      'Native browser animation engine uniting declarative CSS compositor performance with imperative JavaScript playback, velocity continuation, and reduced-motion fallbacks.',
    architecturalOverview:
      'The Web Animations API exposes Element.animate() directly on the browser compositor thread. When paired with spring harmonic oscillator solvers or linear() easing curves, interfaces achieve interruptible, physics-accurate motion without main-thread frame drops.',
    keyCapabilities: [
      'Off-main-thread compositor execution for transform and opacity',
      'Spring easing approximation via CSS linear() multi-point stops',
      'Runtime playback scrubbing, reversal, and finish Promises',
      'Instant prefers-reduced-motion query integration',
    ],
    browserSupportSummary:
      'Baseline Widely Available across all modern desktop and mobile browsers.',
    accessibilityConsiderations:
      'Always inspect window.matchMedia("(prefers-reduced-motion: reduce)") and substitute spatial translations with instant or 120ms opacity cross-fades.',
    performanceGuidance:
      'Restrict animated properties strictly to transform, opacity, and filter to prevent layout thrashing and paint invalidation.',
    codeSpecimen: `const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;\nelement.animate(\n  [{ opacity: 0, transform: prefersReduced ? 'none' : 'translateY(8px)' }, { opacity: 1, transform: 'none' }],\n  { duration: prefersReduced ? 100 : 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }\n);`,
    relatedCategorySlugs: [
      'motion-animation',
      'microinteractions',
      'ux-interaction-patterns',
    ],
  },
  {
    slug: 'react-19',
    name: 'React 19 & Concurrent UI Architecture',
    category: 'UI & Rendering Runtime',
    version: '19.2',
    officialSpecUrl: 'https://react.dev/',
    shortDescription:
      'Component architecture utilizing Server Components, streaming Suspense boundaries, Actions, and concurrent transitions for responsive interactive applications.',
    architecturalOverview:
      'React 19 separates static and data-fetching workloads into Server Components while keeping interactive leaf nodes lightweight. Concurrent transitions (useTransition, useDeferredValue) keep high-frequency search and parameter controls responsive under 200ms INP.',
    keyCapabilities: [
      'Zero-bundle Server Components for indexable documentation & SEO pages',
      'Non-blocking UI updates via useTransition and useDeferredValue',
      'Declarative Suspense boundaries for lazy-loaded code editors and 3D scenes',
      'Strict hydration consistency across server and client renders',
    ],
    browserSupportSummary:
      'Runs across all evergreen browsers and server-renders clean HTML for search crawlers.',
    accessibilityConsiderations:
      'Use React useId() for deterministic SSR/CSR ARIA id pairing (aria-labelledby, aria-describedby, htmlFor).',
    performanceGuidance:
      'Push "use client" boundaries to interactive leaf components and dynamically import heavy third-party runtimes.',
    codeSpecimen: `const id = useId();\nreturn (\n  <div>\n    <label htmlFor={id}>Spring Stiffness</label>\n    <input id={id} type="range" min={80} max={400} />\n  </div>\n);`,
    relatedCategorySlugs: [
      'frontend-implementation-technologies',
      'ui-components',
      'design-systems',
    ],
  },
  {
    slug: 'svg-filter-primitives',
    name: 'SVG Vector Graphics & Filter Primitives',
    category: 'Animation & Graphics API',
    version: 'W3C SVG 2 / Filter Effects 1.0',
    officialSpecUrl: 'https://www.w3.org/TR/filter-effects-1/',
    shortDescription:
      'Resolution-independent vector geometry, stroke-dasharray path choreography, and GPU-accelerated feGaussianBlur, feColorMatrix, and feTurbulence shaders.',
    architecturalOverview:
      'SVG combines declarative DOM accessibility (<title>, <desc>, role="img") with programmable vector paths and hardware-accelerated filter pipelines for technical diagrams, morphing icons, and optical surface effects.',
    keyCapabilities: [
      'Resolution-independent geometric diagrams and interactive schematics',
      'Path drawing choreography via stroke-dasharray and stroke-dashoffset',
      'Composable filter graphs (feGaussianBlur, feColorMatrix, feBlend)',
      'Direct CSS Custom Property styling of fill, stroke, and stop-color',
    ],
    browserSupportSummary:
      'Universal support across all desktop and mobile browsers.',
    accessibilityConsiderations:
      'Include <title> and aria-labelledby on meaningful diagrams, and set aria-hidden="true" on purely decorative vector ornaments.',
    performanceGuidance:
      'Constrain filter region dimensions (x, y, width, height) and keep stdDeviation blur radii moderate to avoid mobile GPU fill-rate bottlenecks.',
    codeSpecimen: `<svg viewBox="0 0 240 80" role="img" aria-labelledby="svg-title">\n  <title id="svg-title">Bezier Easing Curve</title>\n  <path d="M 10 70 C 60 10, 140 10, 230 10" fill="none" stroke="currentColor" stroke-width="2" />\n</svg>`,
    relatedCategorySlugs: [
      'visual-styles',
      'motion-animation',
      'data-visualization-information-design',
    ],
  },
  {
    slug: 'threejs-webgl',
    name: 'Three.js & WebGL Spatial Shaders',
    category: 'Animation & Graphics API',
    version: 'r128 / WebGL 2.0',
    officialSpecUrl: 'https://threejs.org/docs/',
    shortDescription:
      'On-demand 3D scene graphs, physically based rendering (PBR) materials, custom GLSL vertex/fragment shaders, and interactive spatial viewports.',
    architecturalOverview:
      'Three.js abstracts WebGL 2.0 state management into a structured scene graph of cameras, lights, BufferGeometries, and ShaderMaterials. In production web applications, Three.js must be lazy-loaded on demand so non-3D pages pay zero bundle cost.',
    keyCapabilities: [
      'Physically Based Rendering (MeshStandardMaterial / MeshPhysicalMaterial)',
      'Custom GLSL vertex and fragment shaders with uniform time/pointer bindings',
      'Responsive devicePixelRatio clamping (Math.min(window.devicePixelRatio, 2))',
      'Deterministic WebGLRenderer and geometry disposal on unmount',
    ],
    browserSupportSummary:
      'Supported on all WebGL 2.0 capable desktop and mobile GPUs.',
    accessibilityConsiderations:
      'Provide a descriptive aria-label on the <canvas> element, keyboard camera controls, and a static or low-frequency render mode when prefers-reduced-motion is enabled.',
    performanceGuidance:
      'Never bundle Three.js in the root layout; load it exclusively when a 3D template is active and pause requestAnimationFrame when offscreen.',
    codeSpecimen: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));\nif (prefersReducedMotion) {\n  renderer.render(scene, camera); // Single static frame\n}`,
    relatedCategorySlugs: [
      '3d-spatial-webgl-design',
      'frontend-implementation-technologies',
      'motion-animation',
    ],
  },
  {
    slug: 'html5-canvas-2d',
    name: 'HTML5 Canvas 2D Rendering Context',
    category: 'Animation & Graphics API',
    version: 'WHATWG HTML Living Standard',
    officialSpecUrl:
      'https://html.spec.whatwg.org/multipage/canvas.html#2dcontext',
    shortDescription:
      'High-density immediate-mode 2D raster graphics API for interactive particle fields, real-time data visualizations, and physics simulations.',
    architecturalOverview:
      'CanvasRenderingContext2D provides low-overhead pixel and path drawing capable of rendering thousands of data points or spring-connected nodes at 60–120fps without DOM node proliferation.',
    keyCapabilities: [
      'Retina / HiDPI scaling via devicePixelRatio backing store matrix',
      'Immediate-mode vector paths, gradients, and composite blend modes',
      'Pointer velocity tracking and spatial hit-testing',
      'Zero DOM node overhead for high-cardinality datasets',
    ],
    browserSupportSummary:
      'Universal support across all browsers.',
    accessibilityConsiderations:
      'Expose underlying data values via accessible fallback tables or ARIA live summaries alongside the <canvas> element.',
    performanceGuidance:
      'Batch stroke() and fill() calls outside inner loops and use integer coordinates where possible to avoid sub-pixel antialiasing overhead.',
    codeSpecimen: `const dpr = window.devicePixelRatio || 1;\ncanvas.width = rect.width * dpr;\ncanvas.height = rect.height * dpr;\nctx.scale(dpr, dpr);`,
    relatedCategorySlugs: [
      'data-visualization-information-design',
      '3d-spatial-webgl-design',
      'frontend-implementation-technologies',
    ],
  },
];

export function getAllCanonicalTechnologies(): CanonicalTechnologyEntry[] {
  return CANONICAL_TECHNOLOGIES;
}

export function getTechnologyBySlug(
  slug: string
): CanonicalTechnologyEntry | undefined {
  const clean = sanitizeKebabSlug(slug);
  return CANONICAL_TECHNOLOGIES.find((t) => t.slug === clean);
}

export function getResourcesForTechnology(
  tech: CanonicalTechnologyEntry
): DesignResource[] {
  const keywords = [
    tech.slug.replace(/-/g, ' '),
    tech.name.toLowerCase(),
    ...tech.slug.split('-').filter((w) => w.length > 2),
  ];

  const matched = FOUNDATION_RESOURCES.filter((res) => {
    const haystack = [
      ...(res.technologies || []),
      ...(res.frameworks || []),
      ...(res.tags || []),
      res.categorySlug,
      res.summary,
    ]
      .join(' ')
      .toLowerCase();

    return (
      tech.relatedCategorySlugs.includes(res.categorySlug) ||
      keywords.some((kw) => haystack.includes(kw))
    );
  });

  return matched.length > 0 ? matched : FOUNDATION_RESOURCES.slice(0, 4);
}

/* ============================================================================
 * DYNAMIC NEXT.JS METADATA GENERATORS (SECTIONS 1, 2, 3, 4)
 * ========================================================================== */

export function buildResourceSeoMetadata(resourceSlug: string): Metadata {
  const resource =
    getResourceBySlug(resourceSlug) || FOUNDATION_RESOURCES[0];
  const category = getCategoryBySlug(resource.categorySlug);
  const descriptor = getClassificationDescriptor(resource.classification);

  const seoTitle = `${resource.title} — ${
    category ? category.name : descriptor.label
  } | ${BRAND_CONFIG.productName}`;
  const seoDescription = `${resource.summary} Explore live interactive demonstration, WCAG ${resource.accessibilitySpec.wcagComplianceLevel} accessibility specifications, and production code implementation.`.slice(
    0,
    160
  );
  const canonicalUrl = buildCanonicalUrl(`/resources/${resource.slug}`);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      resource.title,
      ...(resource.tags || []),
      ...(resource.technologies || []),
      category?.name || 'Digital Design',
      descriptor.label,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: seoTitle,
      description: seoDescription,
      siteName: BRAND_CONFIG.productName,
      publishedTime: resource.lastVerifiedDate,
      authors: [resource.sourceAttribution.creatorOrMaintainer],
      tags: resource.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
    },
  };
}

export function buildCategorySeoMetadata(categorySlug: string): Metadata {
  const category =
    getCategoryBySlug(categorySlug) || TAXONOMY_CATEGORIES[0];
  const resourcesInCat = FOUNDATION_RESOURCES.filter((r) =>
    resourceBelongsToCategory(r, category)
  );

  const seoTitle = `${category.name} (${String(category.orderIndex).padStart(
    2,
    '0'
  )}) — Design Taxonomy & Live Specimens | ${BRAND_CONFIG.productName}`;
  const seoDescription = `${category.shortDescription} Browse ${resourcesInCat.length} interactive design monographs and ${category.subcategories.length} subcategories including ${category.subcategories
    .slice(0, 3)
    .join(', ')}.`.slice(0, 160);
  const canonicalUrl = buildCanonicalUrl(`/categories/${category.slug}`);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      category.name,
      ...category.subcategories,
      ...(category.tags || []),
      BRAND_CONFIG.productName,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: seoTitle,
      description: seoDescription,
      siteName: BRAND_CONFIG.productName,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
    },
  };
}

export function buildTechnologySeoMetadata(techSlug: string): Metadata {
  const tech = getTechnologyBySlug(techSlug) || CANONICAL_TECHNOLOGIES[0];
  const seoTitle = `${tech.name} (${tech.version}) — Frontend Implementation Guide | ${BRAND_CONFIG.productName}`;
  const seoDescription = `${tech.shortDescription} Includes browser compatibility, WCAG 2.2 AA accessibility patterns, performance budgets, and interactive encyclopedia specimens.`.slice(
    0,
    160
  );
  const canonicalUrl = buildCanonicalUrl(`/technologies/${tech.slug}`);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      tech.name,
      tech.category,
      tech.version,
      'Frontend Architecture',
      'Web Standards',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: seoTitle,
      description: seoDescription,
      siteName: BRAND_CONFIG.productName,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
    },
  };
}

/* ============================================================================
 * SCHEMA.ORG JSON-LD STRUCTURED DATA BUILDERS (SECTION 2)
 * ========================================================================== */

export function buildSiteOrganizationJsonLd() {
  const siteUrl = getCanonicalSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: BRAND_CONFIG.productName,
        url: siteUrl,
        description: BRAND_CONFIG.missionStatement,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: BRAND_CONFIG.productName,
        description: BRAND_CONFIG.tagline,
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

export function buildBreadcrumbJsonLd(
  items: { label: string; href?: string }[]
) {
  const siteUrl = getCanonicalSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      ...(item.href
        ? {
            item: item.href.startsWith('http')
              ? item.href
              : `${siteUrl}${item.href.startsWith('/') ? item.href : `/${item.href}`}`,
          }
        : {}),
    })),
  };
}

export function buildResourceTechArticleJsonLd(
  resource: DesignResource,
  category?: TaxonomyCategory
) {
  const canonicalUrl = buildCanonicalUrl(`/resources/${resource.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': ['TechArticle', 'LearningResource'],
    headline: resource.title,
    name: resource.title,
    description: resource.summary,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    datePublished: resource.lastVerifiedDate,
    dateModified: resource.lastVerifiedDate,
    educationalLevel: resource.audienceLevel,
    learningResourceType: 'Interactive Design Specification & Code Specimen',
    proficiencyLevel: resource.audienceLevel,
    keywords: (resource.tags || []).join(', '),
    about: category ? category.name : resource.classification,
    author: {
      '@type': 'Organization',
      name: resource.sourceAttribution.creatorOrMaintainer,
      url: resource.sourceAttribution.officialDocsUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND_CONFIG.productName,
      url: getCanonicalSiteUrl(),
    },
    license: resource.sourceAttribution.licenseType,
  };
}

export function buildCategoryCollectionJsonLd(
  category: TaxonomyCategory,
  resources: DesignResource[]
) {
  const canonicalUrl = buildCanonicalUrl(`/categories/${category.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} — ${BRAND_CONFIG.productName}`,
    description: category.shortDescription,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: resources.length,
      itemListElement: resources.map((res, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: res.title,
        url: buildCanonicalUrl(`/resources/${res.slug}`),
      })),
    },
  };
}

export function buildTechnologyArticleJsonLd(
  tech: CanonicalTechnologyEntry,
  relatedResources: DesignResource[]
) {
  const canonicalUrl = buildCanonicalUrl(`/technologies/${tech.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${tech.name} (${tech.version}) — Frontend Architecture & Accessibility Guide`,
    name: tech.name,
    description: tech.shortDescription,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    about: {
      '@type': 'ComputerLanguage',
      name: tech.name,
      url: tech.officialSpecUrl,
    },
    mentions: relatedResources.map((r) => ({
      '@type': 'TechArticle',
      name: r.title,
      url: buildCanonicalUrl(`/resources/${r.slug}`),
    })),
  };
}
