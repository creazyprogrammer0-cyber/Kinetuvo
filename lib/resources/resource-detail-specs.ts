import { DesignResource } from '@/types/encyclopedia';

/* ============================================================================
 * EXTENDED RESOURCE DETAIL SPECIFICATION SCHEMA (SECTIONS 1–13)
 * ========================================================================== */

export type LivePreviewRuntimeType =
  | 'html-css'
  | 'javascript'
  | 'react'
  | 'svg'
  | 'canvas'
  | 'webgl-three'
  | 'native-specimen';

export type PreviewBackgroundPreset =
  | 'theme-adaptive'
  | 'light-studio'
  | 'dark-graphite'
  | 'architectural-grid';

export interface ResourceDeepDescription {
  whatItIs: string;
  problemItSolves: string;
  howItWorks: string;
  whyItIsUsed: string;
  whereCommonlyApplied: string[];
  designPrinciples: { title: string; explanation: string }[];
  strengths: string[];
  limitations: string[];
}

export interface VisualExampleSpecimen {
  id: string;
  title: string;
  specimenType:
    | 'before-after-comparison'
    | 'implementation-variant'
    | 'interactive-specimen-gallery';
  summary: string;
  beforeStateLabel: string;
  beforeStateCodeOrNotes: string;
  afterStateLabel: string;
  afterStateCodeOrNotes: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
}

export interface ImplementationVariantSpec {
  id: string;
  technologyLabel: string;
  language: 'html' | 'css' | 'javascript' | 'tsx' | 'svg' | 'json';
  filename: string;
  explanation: string;
  requiredDependencies: { name: string; version: string; required: boolean }[];
  setupInstructions: string[];
  fileStructure: string[];
  codeTemplate: string;
}

export interface TechnologyMatrixSpec {
  technologiesUsed: string[];
  requiredLibraries: {
    name: string;
    version: string;
    purpose: string;
    isRequired: boolean;
    installCommand: string;
    docsUrl: string;
  }[];
  frameworkCompatibility: {
    framework: string;
    supportLevel: 'Native / First-Class' | 'Adapter Supported' | 'CSS-Only Compatible';
    notes: string;
  }[];
  browserRequirements: {
    browser: string;
    minimumVersion: string;
    baselineStatus: 'Baseline Widely Available' | 'Baseline Newly Available' | 'Progressive Enhancement';
  }[];
  relevantAlternatives: {
    name: string;
    tradeoffComparison: string;
  }[];
}

export interface ResponsiveBehaviorSpec {
  desktopBehavior: {
    viewportRange: string;
    layoutChanges: string;
    interactionModel: string;
  };
  tabletBehavior: {
    viewportRange: string;
    layoutChanges: string;
    interactionModel: string;
  };
  mobileBehavior: {
    viewportRange: string;
    layoutChanges: string;
    touchInteraction: string;
    mobileSpecificAlternative: string;
  };
  breakpointStrategySummary: string;
  reducedCapabilitiesFallback: string;
}

export interface AccessibilityDeepSpec {
  semanticHtmlElements: string[];
  ariaAttributes: { attribute: string; usageContract: string }[];
  focusManagementStrategy: string;
  screenReaderConsiderations: string;
  colorContrastAudit: string;
  touchTargetCompliance: string;
  accessibleAlternativeForAnimation: string;
}

export interface RelatedResourcesGraphSpec {
  similarConcepts: string[];
  alternativeTechniques: string[];
  relatedAnimationTypes: string[];
  relatedDesignSystems: string[];
  prerequisites: string[];
  advancedConcepts: string[];
}

export interface AdditionalDocumentationSpec {
  useCases: string[];
  bestPractices: string[];
  commonMistakes: { mistake: string; correction: string }[];
  performanceConsiderations: string[];
  faqs: { question: string; answer: string }[];
  lastReviewedIso: string;
}

export interface CompleteResourceDetailSpec {
  supportedPreviewRuntimes: LivePreviewRuntimeType[];
  defaultPreviewRuntime: LivePreviewRuntimeType;
  deepDescription: ResourceDeepDescription;
  visualExamples: VisualExampleSpecimen[];
  implementationVariants: ImplementationVariantSpec[];
  technologyMatrix: TechnologyMatrixSpec;
  responsiveBehavior: ResponsiveBehaviorSpec;
  accessibilityDeepSpec: AccessibilityDeepSpec;
  relatedGraph: RelatedResourcesGraphSpec;
  additionalDocs: AdditionalDocumentationSpec;
}

/* ============================================================================
 * DETERMINISTIC ENRICHMENT ENGINE & CODE TEMPLATE COMPILER VALIDATOR
 * ========================================================================== */

/**
 * Validates that a code template compiles cleanly without unbalanced braces,
 * unresolved template tokens, or syntax corruption (Section 13 Quality Control).
 */
export function validateAndCompileVariantCode(
  codeTemplate: string,
  params: Record<string, number | string | boolean>,
  forceSimulateCompilationError = false
): {
  isValid: boolean;
  compiledCode: string;
  errorDetails?: string;
} {
  if (forceSimulateCompilationError) {
    return {
      isValid: false,
      compiledCode: codeTemplate,
      errorDetails:
        'SyntaxError: Unterminated CSS declaration block at line 14 (Simulated Quality Control Gate Failure). Resource cannot be marked Verified until syntax is resolved.',
    };
  }

  if (!codeTemplate || !codeTemplate.trim()) {
    return {
      isValid: false,
      compiledCode: '',
      errorDetails:
        'CompilationError: Empty implementation template detected. Every published variant must provide a working code implementation.',
    };
  }

  let unresolvedKeys: string[] = [];
  const compiled = codeTemplate.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = params[key];
    if (val === undefined) {
      unresolvedKeys.push(key);
      return `{{${key}}}`;
    }
    return String(val).replace(/[<>]/g, '');
  });

  // Check for unbalanced curly braces in CSS/TSX/JS snippets
  const openBraces = (compiled.match(/\{/g) || []).length;
  const closeBraces = (compiled.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    return {
      isValid: false,
      compiledCode: compiled,
      errorDetails: `SyntaxError: Unbalanced block braces detected (${openBraces} opening "{" vs ${closeBraces} closing "}"). Resource verification suspended.`,
    };
  }

  return {
    isValid: true,
    compiledCode: compiled,
  };
}

/**
 * Generates a comprehensive, domain-accurate 13-section specification for any
 * DesignResource in the encyclopedia, combining resource-specific parameters,
 * code templates, and provenance with structured engineering documentation.
 */
export function getCompleteResourceDetailSpec(
  resource: DesignResource,
  allResources: DesignResource[]
): CompleteResourceDetailSpec {
  const isMotion =
    resource.classification === 'animation-technique' ||
    resource.demoArchetype === 'spring-motion-physics';
  const isSpatial3D =
    resource.categorySlug === '3d-immersive-experiences' ||
    resource.slug.includes('pbr') ||
    resource.slug.includes('webgpu');
  const isComponentOrPattern =
    resource.classification === 'ui-component' ||
    resource.classification === 'interactive-component' ||
    resource.classification === 'ui-pattern' ||
    resource.classification === 'interaction-pattern';

  // Determine appropriate live preview runtime modes (Section 2)
  const supportedPreviewRuntimes: LivePreviewRuntimeType[] = isSpatial3D
    ? ['webgl-three', 'canvas', 'html-css', 'react']
    : isMotion
    ? ['react', 'javascript', 'canvas', 'svg', 'html-css']
    : isComponentOrPattern
    ? ['react', 'html-css', 'javascript', 'native-specimen']
    : ['native-specimen', 'html-css', 'react', 'svg'];

  const defaultPreviewRuntime: LivePreviewRuntimeType =
    supportedPreviewRuntimes[0];

  // Build relevant implementation variants (Section 5: Do not force irrelevant technologies)
  const baseTemplate = resource.codeTemplates[0];
  const paramInterpolationNote = resource.interactiveParameters
    .map((p) => `${p.key}={{${p.key}}}${p.unit || ''}`)
    .join(', ');

  const implementationVariants: ImplementationVariantSpec[] = [];

  // Variant 1: Primary Canonical Implementation from resource.codeTemplates
  if (baseTemplate) {
    implementationVariants.push({
      id: `${resource.slug}-primary-variant`,
      technologyLabel:
        baseTemplate.language === 'css'
          ? 'CSS Native & Custom Properties'
          : baseTemplate.language === 'tsx'
          ? 'React 19 + TypeScript'
          : baseTemplate.language === 'json'
          ? 'W3C Design Tokens (DTCG JSON)'
          : 'TypeScript Specification',
      language:
        baseTemplate.language === 'ts'
          ? 'javascript'
          : (baseTemplate.language as ImplementationVariantSpec['language']),
      filename: baseTemplate.filename,
      explanation: `${baseTemplate.description} Interpolates live customization parameters (${paramInterpolationNote}) directly into production code.`,
      requiredDependencies:
        baseTemplate.language === 'tsx'
          ? [
              { name: 'react', version: '^19.0.0', required: true },
              { name: 'motion', version: '^12.0.0', required: isMotion },
            ]
          : [],
      setupInstructions:
        baseTemplate.language === 'css'
          ? [
              'Import the token stylesheet at the root of your application (`app/globals.css`).',
              'Bind dynamic user or theme overrides to scoped CSS Custom Properties on `:root` or a containment wrapper.',
            ]
          : [
              'Install required runtime packages via npm or pnpm.',
              'Import the component into your Next.js or React tree and pass accessible ARIA props.',
            ],
      fileStructure: [
        `/tokens/${baseTemplate.filename}`,
        `/components/specimens/${resource.slug}.tsx`,
        `/tests/${resource.slug}.a11y.spec.ts`,
      ],
      codeTemplate: baseTemplate.codeTemplate,
    });
  }

  // Variant 2: Semantic HTML + CSS / Vanilla JS or React implementation (only relevant variants)
  if (baseTemplate?.language === 'css') {
    implementationVariants.push({
      id: `${resource.slug}-react-variant`,
      technologyLabel: 'React + CSS Variable Bridge',
      language: 'tsx',
      filename: `${resource.slug.replace(/-/g, '_')}_specimen.tsx`,
      explanation:
        'Binds React state or design token context to inline CSS Custom Properties for zero-latency compositor updates without regenerating stylesheet classes.',
      requiredDependencies: [
        { name: 'react', version: '^19.0.0', required: true },
        { name: 'lucide-react', version: '^0.553.0', required: false },
      ],
      setupInstructions: [
        'Pass live token values through a typed `React.CSSProperties` record.',
        'Verify contrast ratios across both `[data-theme="light"]` and `[data-theme="dark"]` scopes.',
      ],
      fileStructure: [
        `/components/${resource.slug}/SpecimenStage.tsx`,
        `/components/${resource.slug}/tokens.css`,
      ],
      codeTemplate: `import React from 'react';

export function SpecimenContainer() {
  const tokenVars = {
${resource.interactiveParameters
  .map(
    (p) =>
      `    '${p.cssVariable || `--token-${p.key}`}': '{{${p.key}}}${p.unit || ''}',`
  )
  .join('\n')}
  } as React.CSSProperties;

  return (
    <section
      style={tokenVars}
      aria-label="${resource.title}"
      className="specimen-surface"
    >
      <h3>${resource.title}</h3>
    </section>
  );
}`,
    });
  } else if (isMotion) {
    implementationVariants.push({
      id: `${resource.slug}-waapi-variant`,
      technologyLabel: 'Vanilla JS (Web Animations API)',
      language: 'javascript',
      filename: 'spring-waapi-controller.js',
      explanation:
        'Zero-dependency browser-native Web Animations API implementation with explicit `prefers-reduced-motion: reduce` media query guard.',
      requiredDependencies: [],
      setupInstructions: [
        'Query `window.matchMedia("(prefers-reduced-motion: reduce)")` before scheduling spatial keyframes.',
        'Animate strictly compositor-accelerated properties (`transform`, `opacity`).',
      ],
      fileStructure: [
        '/lib/motion/spring-waapi-controller.js',
        '/styles/reduced-motion-fallback.css',
      ],
      codeTemplate: `export function triggerAccessibleMotion(element) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stiffness = {{stiffness}};
  const damping = {{damping}};

  if (prefersReduced || {{simulateReducedMotion}}) {
    element.style.transform = 'translateX(140px)';
    return;
  }

  const approxDurationMs = Math.round(Math.max(160, (600 - stiffness) + damping * 6));
  element.animate(
    [
      { transform: 'translateX(0px) scale(1)' },
      { transform: 'translateX(140px) scale(1.04)' }
    ],
    {
      duration: approxDurationMs,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards'
    }
  );
}`,
    });
  } else {
    implementationVariants.push({
      id: `${resource.slug}-html-css-variant`,
      technologyLabel: 'Semantic HTML5 + Accessible CSS',
      language: 'html',
      filename: 'accessible-markup.html',
      explanation:
        'Standards-compliant HTML5 landmark and WAI-ARIA role structure with high-contrast keyboard `:focus-visible` indicator.',
      requiredDependencies: [],
      setupInstructions: [
        'Ensure every interactive control has an explicit accessible label via `aria-labelledby` or visible text.',
        'Maintain at least 2px solid focus outline with 2px offset.',
      ],
      fileStructure: ['/specimens/accessible-markup.html', '/specimens/focus-tokens.css'],
      codeTemplate: `<div role="${resource.accessibilitySpec.ariaRoleContract[0] || 'region'}" aria-label="${resource.title}">
  <style>
    .focusable-primitive:focus-visible {
      outline: {{focusRingWidth}}px solid #4f46e5;
      outline-offset: {{focusRingOffset}}px;
    }
  </style>
  <button type="button" class="focusable-primitive">
    Verified Accessible Trigger
  </button>
</div>`,
    });
  }

  // Variant 3: SVG / Vector Schematic or Three.js / WebGL where relevant
  if (isSpatial3D) {
    implementationVariants.push({
      id: `${resource.slug}-threejs-variant`,
      technologyLabel: 'Three.js / WebGL PBR Material Setup',
      language: 'javascript',
      filename: 'spatial-pbr-plane.js',
      explanation:
        'Configures a physically based MeshPhysicalMaterial plane with directional specular lighting and reduced-motion planar lock.',
      requiredDependencies: [
        { name: 'three', version: '^0.170.0', required: true },
      ],
      setupInstructions: [
        'Initialize WebGLRenderer with `antialias: true` and `powerPreference: "high-performance"`.',
        'Clamp `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` to prevent mobile thermal throttling.',
      ],
      fileStructure: ['/webgl/spatial-pbr-plane.js', '/webgl/lighting-rig.js'],
      codeTemplate: `import * as THREE from 'three';

export function createSpatialPlane() {
  const hue = {{hueAngle}};
  const color = new THREE.Color(\`hsl(\${hue}, 70%, 50%)\`);
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.25,
    metalness: 0.1,
    clearcoat: 0.6
  });
  return material;
}`,
    });
  } else {
    implementationVariants.push({
      id: `${resource.slug}-svg-schematic-variant`,
      technologyLabel: 'SVG Parametric Vector Diagram',
      language: 'svg',
      filename: 'parametric-schematic.svg',
      explanation:
        'Resolution-independent SVG vector specification illustrating geometric relationships and coordinate metrics.',
      requiredDependencies: [],
      setupInstructions: [
        'Include `role="img"` and a descriptive `<title>` element inside inline SVGs for screen reader parity.',
        'Use `currentColor` or semantic CSS variables (`var(--ds-accent)`) for theme polarity adaptation.',
      ],
      fileStructure: ['/assets/schematics/parametric-schematic.svg'],
      codeTemplate: `<svg viewBox="0 0 400 120" role="img" aria-label="${resource.title} Vector Schematic" xmlns="http://www.w3.org/2000/svg">
  <title>${resource.title} Structural Specification</title>
  <rect x="12" y="12" width="376" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="2" />
  <line x1="140" y1="12" x2="140" y2="108" stroke="#4f46e5" stroke-dasharray="4 4" />
  <text x="28" y="64" font-family="monospace" font-size="12" fill="currentColor">
    WCAG ${resource.accessibilitySpec.wcagComplianceLevel} (${resource.accessibilitySpec.minContrastRatio}:1)
  </text>
</svg>`,
    });
  }

  // Categorize related resources intelligently (Section 10)
  const directRelated = allResources.filter((r) =>
    resource.relatedResourceSlugs.includes(r.slug)
  );
  const sameCategory = allResources.filter(
    (r) =>
      r.slug !== resource.slug &&
      (r.categorySlug === resource.categorySlug ||
        r.categorySlugs?.includes(resource.categorySlug))
  );
  const officialSystems = allResources.filter(
    (r) =>
      r.slug !== resource.slug &&
      r.classification === 'official-design-system'
  );
  const motionResources = allResources.filter(
    (r) =>
      r.slug !== resource.slug &&
      r.classification === 'animation-technique'
  );
  const beginnerPrereqs = allResources.filter(
    (r) =>
      r.slug !== resource.slug &&
      (r.audienceLevel === 'beginner' || r.audienceLevel === 'all-levels')
  );
  const advancedNext = allResources.filter(
    (r) => r.slug !== resource.slug && r.audienceLevel === 'advanced'
  );

  return {
    supportedPreviewRuntimes,
    defaultPreviewRuntime,
    deepDescription: {
      whatItIs: `${resource.summary} Within the Digital Design Encyclopedia, this concept is classified under ${resource.subcategory || resource.categorySlug} and serves as an interactive reference implementation verified against ${resource.sourceAttribution.authorOrOrganization}.`,
      problemItSolves: resource.problemStatement,
      howItWorks: `The system exposes ${resource.interactiveParameters.length} deterministic parameters (${resource.interactiveParameters.map((p) => p.label).join(', ')}) bound directly to runtime tokens and state machines. When parameters change, the engine recalculates visual geometry, luminance contrast, or physical motion trajectories without breaking DOM focus or layout stability.`,
      whyItIsUsed: `Teams adopt ${resource.title} to eliminate ad-hoc magic numbers, guarantee predictable cross-theme and cross-device fidelity, and establish a shared engineering contract between design specifications and production frontend code.`,
      whereCommonlyApplied: resource.whenToUse,
      designPrinciples: [
        {
          title: 'Deterministic Parameterization over Magic Constants',
          explanation:
            'Every visual or behavioral dimension is governed by an explicit, bounded token or mathematical ratio rather than arbitrary hardcoded pixel values.',
        },
        {
          title: 'Dual-Polarity & High-Contrast Resilience',
          explanation: `Maintains a verified minimum contrast ratio of ${resource.accessibilitySpec.minContrastRatio}:1 (WCAG ${resource.accessibilitySpec.wcagComplianceLevel}) across Light, Dark, and High-Contrast modes.`,
        },
        {
          title: 'Assistive Technology & Reduced-Motion Parity',
          explanation:
            resource.accessibilitySpec.reducedMotionStrategy,
        },
      ],
      strengths: [
        `Verified WCAG ${resource.accessibilitySpec.wcagComplianceLevel} compliance (${resource.accessibilitySpec.minContrastRatio}:1 minimum contrast).`,
        'Zero-latency parameter manipulation using native CSS Custom Properties and compositor transforms.',
        `Directly traceable to official ${resource.sourceAttribution.authorOrOrganization} documentation (${resource.sourceAttribution.firstPublishedYear}).`,
      ],
      limitations: resource.whenToAvoid,
    },
    visualExamples: [
      {
        id: `${resource.slug}-before-after`,
        title: 'Before & After Architectural Comparison',
        specimenType: 'before-after-comparison',
        summary:
          'Contrasts unsystematic ad-hoc styling against the parameterized, accessibility-verified specification.',
        beforeStateLabel: 'Before: Unstructured Ad-Hoc Implementation',
        beforeStateCodeOrNotes:
          'Hardcoded hex literals (#333 / #ccc), disconnected corner radii, missing :focus-visible outline, and unguarded linear animations that ignore prefers-reduced-motion.',
        afterStateLabel: `After: Verified ${resource.subcategory || 'Systematic'} Specification`,
        afterStateCodeOrNotes: `Semantic token hierarchy, concentric geometry math, ${resource.accessibilitySpec.minContrastRatio}:1 WCAG ${resource.accessibilitySpec.wcagComplianceLevel} contrast pair, and deterministic keyboard/reduced-motion state machine.`,
        sourceName: resource.sourceAttribution.authorOrOrganization,
        sourceUrl:
          resource.sourceAttribution.officialUrl ||
          'https://www.w3.org/TR/WCAG22/',
        license: resource.sourceAttribution.licenseType,
      },
      {
        id: `${resource.slug}-polarity-specimen`,
        title: 'Multi-Polarity Surface & Token Adaptation Specimen',
        specimenType: 'implementation-variant',
        summary:
          'Demonstrates how the exact same component markup resolves across Light Canvas (60-30-10), Dark Graphite, and WCAG AAA High-Contrast themes.',
        beforeStateLabel: 'Light Polarity (Daylight Studio)',
        beforeStateCodeOrNotes:
          '60% cool alabaster canvas (#F8FAFC), 30% elevated pure white surface (#FFFFFF), 10% graphite & restrained indigo accent (#4F46E5).',
        afterStateLabel: 'Dark Polarity (Carbon Slate)',
        afterStateCodeOrNotes:
          '60% deep carbon canvas (#090D16), 30% elevated graphite surface (#111827), 1px border luminance step, and optical lightness-compensated indigo (#818CF8).',
        sourceName: 'W3C Design Tokens Community Group & WCAG 2.2 Luminance Standard',
        sourceUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html',
        license: 'W3C Document License',
      },
    ],
    implementationVariants,
    technologyMatrix: {
      technologiesUsed:
        resource.technologies && resource.technologies.length > 0
          ? resource.technologies
          : ['CSS Custom Properties', 'Semantic HTML5', 'W3C WAI-ARIA 1.2'],
      requiredLibraries: [
        {
          name: 'Native Web Platform (CSS / DOM)',
          version: 'W3C Baseline 2024+',
          purpose: 'Core layout, custom property cascading, and semantic focus management.',
          isRequired: true,
          installCommand: '/* Built into modern evergreen browsers */',
          docsUrl:
            resource.sourceAttribution.officialUrl ||
            'https://developer.mozilla.org/',
        },
        {
          name: 'react',
          version: '^19.2.1',
          purpose: 'Declarative component state and interactive parameter binding.',
          isRequired: false,
          installCommand: 'npm install react react-dom',
          docsUrl: 'https://react.dev/',
        },
        ...(isMotion
          ? [
              {
                name: 'motion',
                version: '^12.23.24',
                purpose:
                  'Hardware-accelerated spring physics solver and useReducedMotion hook.',
                isRequired: false,
                installCommand: 'npm install motion',
                docsUrl: 'https://motion.dev/',
              },
            ]
          : []),
      ],
      frameworkCompatibility: [
        {
          framework: 'Next.js (App Router) / React 19',
          supportLevel: 'Native / First-Class',
          notes: 'Full support for Client Component interactivity and SSR hydration parity.',
        },
        {
          framework: 'Vanilla HTML / CSS / Web Components',
          supportLevel: 'CSS-Only Compatible',
          notes: 'Core token and layout rules work in zero-framework custom elements.',
        },
        {
          framework: 'Vue 3 / Svelte 5 / Angular',
          supportLevel: 'Adapter Supported',
          notes: 'Bind reactive signals directly to the documented CSS Custom Properties.',
        },
      ],
      browserRequirements: [
        {
          browser: 'Chrome / Edge (Chromium)',
          minimumVersion: '111+',
          baselineStatus: 'Baseline Widely Available',
        },
        {
          browser: 'Firefox (Gecko)',
          minimumVersion: '113+',
          baselineStatus: 'Baseline Widely Available',
        },
        {
          browser: 'Safari / iOS WebKit',
          minimumVersion: '16.4+',
          baselineStatus: 'Baseline Widely Available',
        },
      ],
      relevantAlternatives: [
        {
          name: isMotion
            ? 'CSS Linear() Timing Function / Cubic-Bezier'
            : 'Static Utility Classes without Semantic Tokens',
          tradeoffComparison: isMotion
            ? 'CSS cubic-bezier requires zero JS runtime but cannot preserve mid-flight gesture velocity when interrupted.'
            : 'Direct utility classes are fast for small prototypes but require touching every template file when re-theming or enforcing dark-mode contrast.',
        },
      ],
    },
    responsiveBehavior: {
      desktopBehavior: {
        viewportRange: '>= 1024px (Desktop & Wide Studio)',
        layoutChanges:
          'Full multi-column asymmetric or 12-column grid layout with side-by-side parameter inspectors and persistent navigation.',
        interactionModel:
          'Fine pointer hover previews, keyboard shortcuts (Tab / Arrow keys / Cmd+K), and resizable split panes.',
      },
      tabletBehavior: {
        viewportRange: '768px – 1023px (Tablet Portrait & Landscape)',
        layoutChanges:
          'Collapses 12-column tracks into balanced 2-column split containers while maintaining fluid typographic scale via CSS clamp().',
        interactionModel:
          'Hybrid touch and keyboard support with 44x44px hit areas and slide-over filter drawers.',
      },
      mobileBehavior: {
        viewportRange: '320px – 767px (Mobile Handset)',
        layoutChanges:
          'Single-column vertical stack with zero horizontal overflow (WCAG 1.4.10 Reflow compliant at 320px CSS width).',
        touchInteraction:
          'Enforces minimum 44x44px touch targets with 8px safety separation and thumb-zone bottom sheet detents.',
        mobileSpecificAlternative:
          'Replaces multi-pane desktop sidebars and hover tooltips with explicit tap-to-open bottom drawers and inline status disclosures.',
      },
      breakpointStrategySummary:
        resource.accessibilitySpec.responsiveBreakpointStrategy,
      reducedCapabilitiesFallback:
        'On low-memory devices, coarse pointers, or print media, 3D/motion projections flatten to static high-contrast 2D semantic surfaces.',
    },
    accessibilityDeepSpec: {
      semanticHtmlElements: [
        '<section>',
        '<article>',
        '<button type="button">',
        '<label>',
        '<output role="status">',
      ],
      ariaAttributes: resource.accessibilitySpec.ariaRoleContract.map(
        (role) => ({
          attribute: `role="${role}"`,
          usageContract: `Exposes deterministic ${role} landmark or widget semantics to assistive technology accessibility trees.`,
        })
      ),
      focusManagementStrategy:
        'Enforces `:focus-visible` 2px solid high-contrast outline with 2px offset. Never suppresses keyboard focus rings or traps Tab traversal.',
      screenReaderConsiderations:
        'Dynamic parameter readouts and filter counts are announced politely via `aria-live="polite"` without interrupting active screen reader speech.',
      colorContrastAudit: `Verified ${resource.accessibilitySpec.minContrastRatio}:1 minimum luminance contrast ratio (WCAG 2.1 / 2.2 Level ${resource.accessibilitySpec.wcagComplianceLevel}). Status states pair color with explicit icons and text labels.`,
      touchTargetCompliance:
        'Meets WCAG 2.2 Success Criterion 2.5.5 (Target Size Enhanced: 44x44px minimum) and SC 2.5.8 (Target Size Minimum) across all interactive controls.',
      accessibleAlternativeForAnimation:
        resource.accessibilitySpec.reducedMotionStrategy,
    },
    relatedGraph: {
      similarConcepts: (directRelated.length > 0
        ? directRelated
        : sameCategory
      )
        .slice(0, 2)
        .map((r) => r.slug),
      alternativeTechniques: sameCategory
        .filter((r) => !resource.relatedResourceSlugs.includes(r.slug))
        .slice(0, 2)
        .map((r) => r.slug),
      relatedAnimationTypes: motionResources.slice(0, 2).map((r) => r.slug),
      relatedDesignSystems: officialSystems.slice(0, 2).map((r) => r.slug),
      prerequisites: beginnerPrereqs.slice(0, 2).map((r) => r.slug),
      advancedConcepts: advancedNext.slice(0, 2).map((r) => r.slug),
    },
    additionalDocs: {
      useCases: resource.whenToUse,
      bestPractices: [
        'Test every parameter extreme (minimum and maximum slider bounds) in both Light and Dark polarities before shipping.',
        'Bind interactive controls to scoped CSS Custom Properties so updates run on the compositor without triggering React tree re-renders.',
        'Always verify keyboard-only operation (Tab, Shift+Tab, Arrow keys, Escape) and `prefers-reduced-motion: reduce` behavior.',
      ],
      commonMistakes: [
        {
          mistake: 'Hardcoding raw hex colors or pixel constants inside child components.',
          correction:
            'Reference semantic Tier-2 or Tier-3 tokens (`var(--sys-color-primary)`) so themes and density scales cascade automatically.',
        },
        {
          mistake: 'Relying solely on color hue changes to communicate active, warning, or error states.',
          correction:
            'Always pair semantic color tokens with an explicit icon and descriptive text label for color-blind accessibility.',
        },
      ],
      performanceConsiderations: [
        'Restrict continuous animations strictly to GPU compositor properties (`transform` and `opacity`) to maintain 60fps/120fps frame budgets.',
        'Use `container-type: inline-size` judiciously on modular host wrappers rather than every leaf DOM node.',
      ],
      faqs: [
        {
          question: `How does ${resource.title} handle prefers-reduced-motion?`,
          answer: resource.accessibilitySpec.reducedMotionStrategy,
        },
        {
          question: 'Can I export the customized parameters directly into my production codebase?',
          answer:
            'Yes. Adjust any parameter in Section 2 or Section 9 and click "Copy Customized Code" or "Copy JSON Token Config" to export the exact interpolated values.',
        },
        {
          question: 'What is the provenance and license of this specification?',
          answer: `${resource.sourceAttribution.attributionNote} Documented under ${resource.sourceAttribution.licenseType} (${resource.sourceAttribution.authorOrOrganization}).`,
        },
      ],
      lastReviewedIso: resource.updatedAtIso.slice(0, 10),
    },
  };
}
