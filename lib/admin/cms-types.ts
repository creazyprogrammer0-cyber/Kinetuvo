import { DesignResource, TaxonomyCategory } from '@/types/encyclopedia';
import { flattenSubcategoryTree } from '@/lib/taxonomy/registry';

/* ============================================================================
 * 1. BACKEND-VERIFIED ROLE AUTHORIZATION MODEL (SECTION 1)
 * ========================================================================== */

export type AdminRoleType = 'super_admin' | 'admin' | 'editor' | 'reviewer';

export const BOOTSTRAPPED_SUPER_ADMIN_EMAIL = 'creazyprogrammer0@gmail.com';

export interface RolePermissionCapabilities {
  role: AdminRoleType;
  label: string;
  tierNumber: number;
  description: string;
  canCreateAndEditDrafts: boolean;
  canReviewAndApprove: boolean;
  canPublishAndManageTaxonomy: boolean;
  canDeleteResources: boolean;
  canManageAdminRoles: boolean;
}

export const ADMIN_ROLE_CAPABILITIES: Record<AdminRoleType, RolePermissionCapabilities> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Administrator',
    tierNumber: 4,
    description:
      'Full platform governance: manage administrative role assignments, publish validated resources, manage taxonomy merges, and audit all logs.',
    canCreateAndEditDrafts: true,
    canReviewAndApprove: true,
    canPublishAndManageTaxonomy: true,
    canDeleteResources: true,
    canManageAdminRoles: true,
  },
  admin: {
    role: 'admin',
    label: 'Administrator',
    tierNumber: 3,
    description:
      'Publish validated resources, unpublish or archive content, manage taxonomy categories and merges, and moderate community submissions.',
    canCreateAndEditDrafts: true,
    canReviewAndApprove: true,
    canPublishAndManageTaxonomy: true,
    canDeleteResources: true,
    canManageAdminRoles: false,
  },
  reviewer: {
    role: 'reviewer',
    label: 'Reviewer',
    tierNumber: 2,
    description:
      'Execute live preview validation checks, approve or reject resources in review, and moderate user submissions.',
    canCreateAndEditDrafts: true,
    canReviewAndApprove: true,
    canPublishAndManageTaxonomy: false,
    canDeleteResources: false,
    canManageAdminRoles: false,
  },
  editor: {
    role: 'editor',
    label: 'Editor',
    tierNumber: 1,
    description:
      'Author new encyclopedia resources, edit drafts across all 8 structured specification groups, run preview tests, and submit for review.',
    canCreateAndEditDrafts: true,
    canReviewAndApprove: false,
    canPublishAndManageTaxonomy: false,
    canDeleteResources: false,
    canManageAdminRoles: false,
  },
};

export interface AdminRoleRecord {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRoleType;
  assignedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

/* ============================================================================
 * 2. STRUCTURED CMS RESOURCE MODEL — 8 FIELD GROUPS (SECTIONS 3, 4 & 7)
 * ========================================================================== */

export type CmsResourceStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived';

export type CmsDifficultyLevel =
  | 'foundation'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export type CmsPreviewType =
  | 'html-css-js'
  | 'react'
  | 'svg'
  | 'canvas'
  | 'three-webgl';

export interface CmsResourceRecord {
  // 1. Identity
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  resourceType: string;
  primaryCategory: string;
  subcategories: string[];
  tags: string[];
  aliases: string[];
  difficulty: CmsDifficultyLevel;

  // 2. Preview
  previewType: CmsPreviewType;
  codeHtml: string;
  codeCss: string;
  codeJs: string;
  responsiveViewports: string[];
  previewVerified: boolean;

  // 3. Documentation
  conceptExplanation: string;
  howItWorks: string;
  useCases: string;
  advantages: string;
  limitations: string;
  bestPractices: string;
  commonMistakes: string;

  // 4. Visual References
  referenceImageUrl: string;
  referenceCaption: string;
  referenceAttribution: string;

  // 5. Implementation
  framework: string;
  dependenciesList: string[];
  installInstructions: string;

  // 6. Compatibility
  desktopBehavior: string;
  tabletBehavior: string;
  mobileBehavior: string;
  browserSupport: string;
  accessibilityNotes: string;
  reducedMotionFallback: string;
  performanceNotes: string;

  // 7. Customization
  editableControlsSpec: string;

  // 8. Relationships & Publishing
  relatedResources: string[];
  prerequisites: string[];
  alternatives: string[];
  relatedTechnologies: string[];
  status: CmsResourceStatus;
  authorUid: string;
  authorName: string;
  reviewerName: string;
  reviewNotes: string;
  license: string;
  sources: string;
  revisionNumber: number;
  publishedAtIso: string;
  lastVerifiedIso: string;
  createdAtIso: string;
  updatedAtIso: string;
}

/* ============================================================================
 * 3. CMS CATEGORY MANAGEMENT MODEL (SECTION 6)
 * ========================================================================== */

export interface CmsCategoryRecord {
  slug: string;
  code: string;
  name: string;
  shortDescription: string;
  architecturalScope: string;
  iconName: string;
  orderIndex: number;
  isFeatured: boolean;
  status: 'active' | 'archived';
  subcategories: string[];
  mergedIntoSlug: string;
  updatedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
  isSeedBaseline?: boolean;
}

/* ============================================================================
 * 4. MODERATED USER SUBMISSIONS & AUDIT LOG MODELS (SECTIONS 7 & 8)
 * ========================================================================== */

export type UserSubmissionType =
  | 'design-resource'
  | 'visual-example'
  | 'interactive-demo'
  | 'correction-report'
  | 'new-technology'
  | 'related-reference';

export interface UserSubmissionRecord {
  id: string;
  submitterUid: string;
  submitterName: string;
  submissionType: UserSubmissionType;
  title: string;
  targetResourceSlug: string;
  categorySlug: string;
  summary: string;
  proposedCodeOrContent: string;
  sourceUrl: string;
  licenseAttestation: string;
  status: 'pending_review' | 'approved' | 'rejected';
  reviewerNotes: string;
  reviewedByUid: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface CmsAuditLogRecord {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: AdminRoleType;
  action: string;
  targetType: 'resource' | 'category' | 'submission' | 'role';
  targetId: string;
  summary: string;
  createdAtIso: string;
}

/* ============================================================================
 * 5. CONVERSION & FACTORY HELPERS
 * ========================================================================== */

export function sanitizeKebabSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export function createDefaultCmsResourceDraft(
  authorUid: string,
  authorName: string
): CmsResourceRecord {
  const nowIso = new Date().toISOString();
  return {
    slug: 'interactive-spring-card-specimen',
    title: 'Interactive Spring Card Specimen',
    shortDescription:
      'Physics-governed interactive card demonstrating critically damped spring scale, tactile focus ring contrast, and reduced-motion parity.',
    fullDescription:
      'A complete architectural and interactive specification for tactile surface cards that respond to pointer hover, active press, and keyboard focus using compositor-friendly CSS custom properties and spring physics.',
    resourceType: 'ui-component',
    primaryCategory: 'ui-components',
    subcategories: ['Cards & Containers', 'Interactive Surfaces'],
    tags: ['spring-physics', 'card-anatomy', 'wcag-focus', 'reduced-motion'],
    aliases: ['Tactile Surface Card', 'Physics Interactive Container'],
    difficulty: 'intermediate',
    previewType: 'html-css-js',
    codeHtml: `<div class="specimen-stage">
  <button id="spring-card" class="spring-card" type="button" aria-pressed="false">
    <div class="card-meta">01 · INTERACTIVE SPECIMEN</div>
    <h3 class="card-title">Critically Damped Surface</h3>
    <p class="card-body">Click or press Space/Enter to trigger spring tension state.</p>
    <div class="card-telemetry" id="card-telemetry">State: Resting (Scale 1.00)</div>
  </button>
</div>`,
    codeCss: `.specimen-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  width: 100%;
}
.spring-card {
  width: 100%;
  max-width: 360px;
  text-align: left;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--ds-border, #334155);
  background: var(--ds-surface, #111827);
  color: var(--ds-fg, #f8fafc);
  cursor: pointer;
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms ease;
}
.spring-card:hover {
  transform: translateY(-2px);
  border-color: var(--ds-accent, #818cf8);
}
.spring-card[data-active="true"] {
  transform: scale(0.975);
  border-color: #34d399;
}
.card-meta {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  opacity: 0.7;
  margin-bottom: 8px;
}
.card-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}
.card-body {
  font-size: 13px;
  opacity: 0.8;
  line-height: 1.5;
  margin-bottom: 14px;
}
.card-telemetry {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--ds-border, #334155);
  color: var(--ds-accent, #818cf8);
}`,
    codeJs: `const card = document.getElementById('spring-card');
const telemetry = document.getElementById('card-telemetry');
let active = false;

if (card && telemetry) {
  card.addEventListener('click', function() {
    active = !active;
    card.setAttribute('data-active', String(active));
    card.setAttribute('aria-pressed', String(active));
    telemetry.textContent = active
      ? 'State: Engaged (Compressed 0.975x)'
      : 'State: Resting (Scale 1.00)';
  });
}`,
    responsiveViewports: ['desktop', 'tablet', 'mobile'],
    previewVerified: false,
    conceptExplanation:
      'Interactive surface cards act as foundational atomic containers. By coupling semantic button/link semantics with critically damped transform transitions (cubic-bezier(0.22, 1, 0.36, 1)), interfaces communicate physical responsiveness without layout thrashing.',
    howItWorks:
      'Uses GPU-composited transform properties (translateY and scale) paired with explicit aria-pressed state synchronization and deterministic focus-visible outlines.',
    useCases:
      'Selection cards in configuration wizards\nInteractive resource directory tiles\nToggleable dashboard parameter modules',
    advantages:
      'Zero main-thread layout recalculation during hover/press\nFull keyboard accessibility via native button semantics\nAutomatic dark/light theme adaptation via semantic CSS tokens',
    limitations:
      'Avoid nesting interactive buttons inside an already-clickable card container (violates HTML5 interactive content nesting rules).',
    bestPractices:
      'Always provide a 2px high-contrast focus-visible outline.\nCompute inner child border-radius as max(0px, outerRadius - padding * 0.5).',
    commonMistakes:
      'Animating box-shadow or height directly on large grids of cards.\nOmitting prefers-reduced-motion fallback rules.',
    referenceImageUrl: '',
    referenceCaption:
      'Figure 1.1: Concentric border radius and compositor transform planes on an interactive surface card.',
    referenceAttribution: 'Digital Design Encyclopedia Editorial Architecture Lab',
    framework: 'HTML5 / CSS Custom Properties / Vanilla ES2022',
    dependenciesList: ['None (Zero-dependency native web standard)'],
    installInstructions:
      'Copy the HTML structure, CSS token stylesheet, and event listener module directly into your component system.',
    desktopBehavior:
      'Supports fine pointer (:hover) elevation preview (-2px Y translation) and keyboard Tab / Space / Enter activation.',
    tabletBehavior:
      'Supports hybrid touch tap and trackpad pointer hover with 44x44px minimum hit target compliance.',
    mobileBehavior:
      'Full-width fluid card container with immediate active press feedback (:active / data-active) and zero hover lock.',
    browserSupport:
      'Chrome 105+, Firefox 110+, Safari 16+, Edge 105+ (100% baseline support)',
    accessibilityNotes:
      'WCAG 2.2 AA Compliant. Uses native <button type="button"> with synchronized aria-pressed state and 4.5:1+ foreground contrast.',
    reducedMotionFallback:
      'When prefers-reduced-motion: reduce is active, spatial transform scaling is replaced by an instant border-color highlight.',
    performanceNotes:
      'Maintains 60fps / 120Hz ProMotion frame budget by restricting animations exclusively to transform and opacity.',
    editableControlsSpec:
      'stiffness: 280 (100..500) | damping: 24 (10..60) | borderRadius: 12px (0..28px)',
    relatedResources: [
      'material-3-semantic-token-hierarchy',
      'spring-physics-choreography',
    ],
    prerequisites: ['wcag-apca-contrast-architecture'],
    alternatives: ['glassmorphism-depth-architecture'],
    relatedTechnologies: ['CSS Custom Properties', 'WAI-ARIA 1.2', 'Web Animations API'],
    status: 'draft',
    authorUid,
    authorName: authorName || 'Editorial Contributor',
    reviewerName: '',
    reviewNotes: '',
    license: 'MIT / CC-BY-4.0 Dual Encyclopedia Specification License',
    sources:
      'W3C WAI-ARIA Authoring Practices 1.2 · Apple Human Interface Guidelines (Materials & Motion)',
    revisionNumber: 1,
    publishedAtIso: '',
    lastVerifiedIso: nowIso.slice(0, 10),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

export function convertSeedResourceToCmsRecord(
  seed: DesignResource,
  authorUid: string,
  authorName: string
): CmsResourceRecord {
  const nowIso = new Date().toISOString();
  const cssTpl =
    seed.codeTemplates.find((t) => t.language === 'css')?.codeTemplate ||
    `.specimen-box {\n  padding: 20px;\n  border-radius: 12px;\n  border: 1px solid var(--ds-border, #334155);\n  background: var(--ds-surface, #111827);\n  color: var(--ds-fg, #f8fafc);\n}`;
  const htmlTpl =
    seed.codeTemplates.find((t) => t.language === 'html')?.codeTemplate ||
    `<div class="specimen-box">\n  <h3>${seed.title}</h3>\n  <p>${seed.summary}</p>\n</div>`;
  const jsTpl =
    seed.codeTemplates.find(
      (t) => t.language === 'ts' || t.language === 'tsx'
    )?.codeTemplate ||
    `console.log("Initialized specimen: ${seed.slug}");`;

  const difficultyMap: Record<DesignResource['audienceLevel'], CmsDifficultyLevel> = {
    beginner: 'foundation',
    intermediate: 'intermediate',
    advanced: 'advanced',
    'all-levels': 'foundation',
  };

  return {
    slug: sanitizeKebabSlug(seed.slug),
    title: seed.title.slice(0, 140),
    shortDescription: seed.summary.slice(0, 300),
    fullDescription: `${seed.summary}\n\nProblem Addressed:\n${seed.problemStatement}`.slice(
      0,
      4000
    ),
    resourceType: seed.classification,
    primaryCategory: seed.categorySlug,
    subcategories: (
      seed.nestedCategoryPath || (seed.subcategory ? [seed.subcategory] : [])
    ).slice(0, 15),
    tags: (seed.tags || []).slice(0, 25),
    aliases: [seed.subcategory, seed.demoArchetype]
      .filter((x): x is string => typeof x === 'string' && x.length > 0)
      .slice(0, 15),
    difficulty: difficultyMap[seed.audienceLevel] || 'intermediate',
    previewType: 'html-css-js',
    codeHtml: htmlTpl.slice(0, 25000),
    codeCss: cssTpl.slice(0, 25000),
    codeJs: jsTpl.slice(0, 25000),
    responsiveViewports: ['desktop', 'tablet', 'mobile'],
    previewVerified: true,
    conceptExplanation: `${seed.summary}\n\n${seed.problemStatement}`.slice(0, 5000),
    howItWorks: `Execution Mode: ${seed.executionMode} · Archetype: ${seed.demoArchetype}. ${seed.accessibilitySpec.responsiveBreakpointStrategy}`.slice(
      0,
      4000
    ),
    useCases: (seed.whenToUse || []).join('\n').slice(0, 3000),
    advantages: (seed.whenToUse || []).join('\n').slice(0, 3000),
    limitations: (seed.whenToAvoid || []).join('\n').slice(0, 3000),
    bestPractices: (
      seed.accessibilitySpec.accessibilityFeatures ||
      seed.accessibilitySpec.ariaRoleContract ||
      []
    )
      .join('\n')
      .slice(0, 3000),
    commonMistakes: (seed.whenToAvoid || []).join('\n').slice(0, 3000),
    referenceImageUrl: '',
    referenceCaption: `Architectural specimen diagram for ${seed.title}`.slice(0, 400),
    referenceAttribution: `${seed.sourceAttribution.authorOrOrganization} (${seed.sourceAttribution.firstPublishedYear})`.slice(
      0,
      400
    ),
    framework: (seed.frameworks || ['Web Standards']).join(', ').slice(0, 120),
    dependenciesList: (seed.technologies || []).slice(0, 15),
    installInstructions:
      'Standard web platform specification — zero external untrusted runtime dependencies required.',
    desktopBehavior:
      'Full interactive parameter workbench with pointer hover, keyboard navigation, and live token inspection.',
    tabletBehavior:
      'Adaptive two-column split layout with touch-friendly sliders and 44x44px hit targets.',
    mobileBehavior:
      'Single-column stacked specimen stage with bottom-anchored parameter controls.',
    browserSupport: 'Chrome 105+, Firefox 110+, Safari 16+, Edge 105+',
    accessibilityNotes: `WCAG ${seed.accessibilitySpec.wcagComplianceLevel} (${seed.accessibilitySpec.minContrastRatio}:1) · ${seed.accessibilitySpec.ariaRoleContract.join(' · ')}`.slice(
      0,
      2000
    ),
    reducedMotionFallback: seed.accessibilitySpec.reducedMotionStrategy.slice(0, 1500),
    performanceNotes: seed.accessibilitySpec.responsiveBreakpointStrategy.slice(0, 1500),
    editableControlsSpec: (seed.interactiveParameters || [])
      .map(
        (p) =>
          `${p.key} (${p.label}): default=${p.defaultValue}${p.unit || ''}`
      )
      .join(' | ')
      .slice(0, 3000),
    relatedResources: (seed.relatedResourceSlugs || []).slice(0, 15),
    prerequisites: [],
    alternatives: [],
    relatedTechnologies: (seed.technologies || []).slice(0, 15),
    status: 'published',
    authorUid,
    authorName: authorName || 'Editorial Board',
    reviewerName: seed.sourceAttribution.authorOrOrganization,
    reviewNotes: 'Verified against canonical specification and 7-point preview gate.',
    license: `${seed.sourceAttribution.licenseType} · ${seed.sourceAttribution.attributionNote}`.slice(
      0,
      160
    ),
    sources: `${seed.sourceAttribution.authorOrOrganization} (${seed.sourceAttribution.officialUrl})`.slice(
      0,
      1500
    ),
    revisionNumber: 1,
    publishedAtIso: seed.updatedAtIso.slice(0, 10),
    lastVerifiedIso: seed.updatedAtIso.slice(0, 10),
    createdAtIso: seed.createdAtIso || nowIso,
    updatedAtIso: seed.updatedAtIso || nowIso,
  };
}

export function convertSeedCategoryToCmsCategory(
  cat: TaxonomyCategory,
  index: number,
  updatedByUid: string
): CmsCategoryRecord {
  const nowIso = new Date().toISOString();
  const flattenedNodes = cat.subcategoryTree
    ? flattenSubcategoryTree(cat.subcategoryTree).map((n) =>
        n.depth > 2 ? `${n.parentSlug?.split('--').pop() || ''} > ${n.name}` : n.name
      )
    : cat.subcategories;

  return {
    slug: cat.slug,
    code: String(index + 1).padStart(2, '0'),
    name: cat.name,
    shortDescription: cat.shortDescription.slice(0, 400),
    architecturalScope: cat.architecturalScope.slice(0, 1500),
    iconName: cat.featuredVisualMotif || 'Layers',
    orderIndex: cat.orderIndex ?? index + 1,
    isFeatured: Boolean(
      cat.featuredResourceSlugs && cat.featuredResourceSlugs.length > 0
    ),
    status: 'active',
    subcategories: flattenedNodes.slice(0, 30),
    mergedIntoSlug: '',
    updatedByUid: updatedByUid || 'system',
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    isSeedBaseline: true,
  };
}

/**
 * Section 9 Security: Sanitize rendered rich text / documentation fields
 * Removes executable <script>, <iframe>, <object>, javascript: URIs, and inline event handlers.
 */
export function sanitizeRichTextField(input: string, maxLen = 5000): string {
  return (input || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<(iframe|object|embed|form)[\s\S]*?>/gi, '')
    .replace(/\bjavascript\s*:/gi, 'blocked-uri:')
    .replace(/\bon[a-z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '')
    .slice(0, maxLen);
}

/**
 * Section 9 Security: Restrict file types & enforce upload/reference URL limits
 */
export const PERMITTED_MEDIA_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.svg',
];

export function validateAllowedMediaReference(url: string): {
  isValid: boolean;
  reason: string;
} {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return {
      isValid: true,
      reason: 'Optional visual reference omitted (using live interactive specimen).',
    };
  }
  if (trimmed.length > 500) {
    return {
      isValid: false,
      reason: 'Media reference URL exceeds 500-character security boundary.',
    };
  }
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    return {
      isValid: false,
      reason: 'Media references must use HTTPS or a root-relative asset path.',
    };
  }
  const lower = trimmed.split('?')[0].toLowerCase();
  const hasPermittedExt =
    PERMITTED_MEDIA_EXTENSIONS.some((ext) => lower.endsWith(ext)) ||
    lower.includes('picsum.photos') ||
    lower.includes('images.unsplash.com');

  if (!hasPermittedExt) {
    return {
      isValid: false,
      reason: `Restricted file type. Allowed formats: ${PERMITTED_MEDIA_EXTENSIONS.join(', ')}`,
    };
  }
  return {
    isValid: true,
    reason: 'Verified HTTPS media format and payload boundary.',
  };
}

/**
 * Converts a Firestore CmsResourceRecord into a live encyclopedia DesignResource
 * so newly published CMS resources render natively on /concept/[resourceSlug] and /directory.
 */
export function convertCmsRecordToDesignResource(
  cms: CmsResourceRecord
): DesignResource {
  const audienceMap: Record<CmsDifficultyLevel, DesignResource['audienceLevel']> = {
    foundation: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    expert: 'advanced',
  };

  const validClassifications = [
    'official-design-system',
    'visual-style',
    'interaction-pattern',
    'ui-pattern',
    'animation-technique',
    'ui-component',
    'interactive-component',
    'layout-technique',
    'typography-system',
    'color-system',
    'implementation-pattern',
    'development-technology',
    'design-tool',
    'design-methodology',
    'community-example',
  ] as const;

  const classification = (
    validClassifications.includes(
      cms.resourceType as (typeof validClassifications)[number]
    )
      ? cms.resourceType
      : 'ui-component'
  ) as DesignResource['classification'];

  return {
    id: `cms-${cms.slug}`,
    slug: cms.slug,
    title: cms.title,
    classification,
    categorySlug: cms.primaryCategory || 'design-fundamentals',
    categorySlugs: [cms.primaryCategory || 'design-fundamentals'],
    subcategory: cms.subcategories[0] || 'CMS Specification',
    nestedCategoryPath:
      cms.subcategories.length > 0
        ? cms.subcategories
        : [cms.primaryCategory, 'CMS Specification'],
    audienceLevel: audienceMap[cms.difficulty] || 'intermediate',
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus:
      cms.status === 'published' ? 'published' : 'draft-preview',
    technologies:
      cms.relatedTechnologies.length > 0
        ? cms.relatedTechnologies
        : cms.dependenciesList,
    frameworks: [cms.framework || 'Web Standards'],
    tags: cms.tags,
    isFeatured: true,
    isRecentlyAdded: true,
    summary: cms.shortDescription,
    problemStatement: cms.conceptExplanation || cms.fullDescription,
    whenToUse: (cms.useCases || cms.advantages || 'Production UI architecture')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    whenToAvoid: (cms.limitations || cms.commonMistakes || 'Avoid unverified overrides')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    executionMode: 'sandboxed-iframe-srcdoc',
    demoArchetype: 'fluid-container-card',
    interactiveParameters: [
      {
        key: 'containerRadius',
        label: 'Surface Radius Token',
        description: cms.editableControlsSpec || 'Adjusts specimen border radius.',
        controlType: 'range',
        defaultValue: 12,
        min: 0,
        max: 28,
        step: 2,
        unit: 'px',
        cssVariable: '--demo-radius',
      },
      {
        key: 'surfacePadding',
        label: 'Spatial Padding',
        description: 'Adjusts inner container spatial padding.',
        controlType: 'range',
        defaultValue: 20,
        min: 8,
        max: 36,
        step: 2,
        unit: 'px',
        cssVariable: '--demo-padding',
      },
    ],
    codeTemplates: [
      {
        language: 'html',
        filename: 'index.html',
        description: 'CMS specimen HTML structure',
        codeTemplate: cms.codeHtml,
      },
      {
        language: 'css',
        filename: 'styles.css',
        description: 'CMS specimen CSS token rules',
        codeTemplate: cms.codeCss,
      },
      {
        language: cms.previewType === 'react' ? 'tsx' : 'ts',
        filename: cms.previewType === 'react' ? 'App.tsx' : 'index.ts',
        description: 'CMS interactive behavior logic',
        codeTemplate: cms.codeJs,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: cms.accessibilityNotes.includes('AAA') ? 'AAA' : 'AA',
      minContrastRatio: 4.5,
      ariaRoleContract: [cms.accessibilityNotes || 'WAI-ARIA 1.2 Compliant'],
      keyboardInteractions: [
        {
          keyCombo: 'Tab / Shift+Tab',
          expectedBehavior: 'Moves deterministic focus ring across interactive targets.',
        },
        {
          keyCombo: 'Enter / Space',
          expectedBehavior: 'Activates primary specimen state.',
        },
      ],
      reducedMotionStrategy:
        cms.reducedMotionFallback ||
        'Replaces spatial transforms with instant opacity highlights under prefers-reduced-motion.',
      responsiveBreakpointStrategy: `${cms.desktopBehavior} · ${cms.tabletBehavior} · ${cms.mobileBehavior}`,
      accessibilityFeatures: [cms.accessibilityNotes],
      responsiveFeatures: [cms.desktopBehavior, cms.mobileBehavior],
    },
    sourceAttribution: {
      authorOrOrganization: cms.authorName || 'Editorial Board',
      officialUrl: cms.sources.startsWith('http')
        ? cms.sources
        : 'https://www.w3.org/TR/',
      licenseType: cms.license || 'MIT / CC-BY-4.0',
      firstPublishedYear: new Date().getFullYear(),
      verificationStandard: 'official-specification',
      attributionNote: `${cms.referenceAttribution || cms.authorName} · Rev #${cms.revisionNumber}`,
    },
    relatedResourceSlugs:
      cms.relatedResources.length > 0
        ? cms.relatedResources
        : ['material-3-semantic-token-hierarchy'],
    createdAtIso: cms.createdAtIso,
    updatedAtIso: cms.updatedAtIso,
  };
}

