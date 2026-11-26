import { ArchitecturalLayerSpec, DesignResource } from '@/types/encyclopedia';

export const FOUNDATION_RESOURCES: DesignResource[] = [
  {
    id: 'res-semantic-token-architecture',
    slug: 'material-3-semantic-token-hierarchy',
    title: 'Material Design 3 — Semantic Color Role & Surface Elevation Tokens',
    classification: 'official-design-system',
    categorySlug: 'official-design-systems',
    categorySlugs: [
      'official-design-systems',
      'color-systems',
      'design-fundamentals',
      'design-engineering-implementation',
    ],
    subcategory: 'Google Material Design 3',
    nestedCategoryPath: [
      'Official Design Systems',
      'Platform & OS Systems',
      'Google Material Design 3',
      'Dynamic Color & Tonal Palettes',
    ],
    audienceLevel: 'all-levels',
    isFeatured: true,
    isCuratedPopularSample: true,
    curatedSelectionReason:
      'Curated Sample Benchmark · Reference 3-tier token architecture (Seed → Semantic → Component)',
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['CSS Custom Properties', 'W3C Design Tokens JSON', 'HSL / OKLCH Color'],
    frameworks: ['CSS Native', 'React', 'Web Components', 'Tailwind CSS'],
    tags: [
      'semantic-tokens',
      'material-3',
      'dark-mode-parity',
      'surface-hierarchy',
      'tonal-palettes',
    ],
    summary:
      'A three-tier design token architecture (Reference → System Semantic → Component) separating raw palette values from functional surface roles and accessible "on-surface" contrast pairs.',
    problemStatement:
      'Hardcoding hex colors directly into UI components breaks dark mode parity, causes split-brain contrast failures, and makes multi-brand theming unmaintainable.',
    whenToUse: [
      'Building multi-theme (Light / Dark / High-Contrast) product interfaces',
      'Maintaining white-label or configurable brand design systems',
      'Guaranteeing deterministic WCAG AA/AAA contrast between container surfaces and foreground text',
    ],
    whenToAvoid: [
      'Single-use static illustrations where semantic color inversion would distort meaning',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'token-surface-hierarchy',
    interactiveParameters: [
      {
        key: 'hueAngle',
        label: 'Primary Seed Hue',
        description: 'Rotates the primary tonal palette seed angle across the color wheel (deg).',
        controlType: 'range',
        defaultValue: 235,
        min: 0,
        max: 360,
        step: 2,
        unit: 'deg',
        cssVariable: '--demo-seed-hue',
      },
      {
        key: 'containerRadius',
        label: 'Corner Radius Token',
        description: 'Adjusts outer container radius; nested children compute r_inner = max(0, r_outer - padding/2).',
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
        label: 'Container Spatial Padding',
        description: 'Adjusts outer container padding (px) to demonstrate nested radius geometry math.',
        controlType: 'range',
        defaultValue: 16,
        min: 8,
        max: 28,
        step: 2,
        unit: 'px',
        cssVariable: '--demo-padding',
      },
      {
        key: 'surfaceContrastMode',
        label: 'Surface Polarity Role',
        description: 'Switches semantic token resolution between Light Canvas, Dark Slate, and High-Contrast AAA.',
        controlType: 'select',
        defaultValue: 'dark-slate',
        options: [
          { label: 'Light Canvas (60-30-10)', value: 'light-canvas' },
          { label: 'Dark Slate (Optical Compensated)', value: 'dark-slate' },
          { label: 'High Contrast (WCAG AAA 7:1+)', value: 'high-contrast' },
        ],
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'tokens.css',
        description: 'Live semantic CSS custom properties with nested border-radius spatial math.',
        codeTemplate: `:root {
  /* Tier 1: Seed Reference Token */
  --ref-primary-hue: {{hueAngle}};
  
  /* Tier 2: Semantic System Tokens */
  --sys-color-primary: hsl(var(--ref-primary-hue) 78% 48%);
  --sys-color-primary-container: hsl(var(--ref-primary-hue) 70% 92%);
  --sys-color-on-primary-container: hsl(var(--ref-primary-hue) 90% 14%);
  
  /* Tier 3: Spatial & Geometry Math */
  --comp-card-radius: {{containerRadius}}px;
  --comp-card-padding: {{surfacePadding}}px;
  --comp-inner-radius: max(0px, calc(var(--comp-card-radius) - var(--comp-card-padding) * 0.5));
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 7.2,
      ariaRoleContract: ['region', 'status'],
      keyboardInteractions: [
        {
          keyCombo: 'Tab / Shift + Tab',
          expectedBehavior: 'Moves focus sequentially across interactive token controls with 2px focus-visible ring.',
        },
        {
          keyCombo: 'ArrowLeft / ArrowRight',
          expectedBehavior: 'Increments or decrements active parameter slider by defined step unit.',
        },
      ],
      reducedMotionStrategy: 'Color and geometry updates apply instantaneously without interpolation lag.',
      responsiveBreakpointStrategy: 'Fluid token scaling using CSS clamp() across 320px–1440px viewports.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Google Material Design Team (Material Design 3 Specification)',
      officialUrl: 'https://m3.material.io/foundations/design-tokens/overview',
      licenseType: 'Apache-2.0 / Public Specification',
      firstPublishedYear: 2021,
      verificationStandard: 'official-specification',
      attributionNote:
        'Based on the Material Design 3 three-tier token taxonomy (Reference, System, Component) and W3C Design Tokens Community Group format.',
    },
    relatedResourceSlugs: [
      'ibm-carbon-2x-grid-and-layer-tokens',
      'apple-hig-vibrancy-and-spring-ergonomics',
      'swiss-modular-typographic-grid',
    ],
    createdAtIso: '2026-10-12T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-ibm-carbon-system',
    slug: 'ibm-carbon-2x-grid-and-layer-tokens',
    title: 'IBM Carbon Design System — 2x Grid & Contextual Layer Tokens',
    classification: 'official-design-system',
    categorySlug: 'official-design-systems',
    categorySlugs: [
      'official-design-systems',
      'layout-grid-systems',
      'color-systems',
      'design-operations-tooling',
    ],
    subcategory: 'IBM Carbon v11',
    nestedCategoryPath: [
      'Official Design Systems',
      'Enterprise & Cloud Systems',
      'IBM Carbon v11',
      'Contextual Layering ($layer-01..03)',
    ],
    audienceLevel: 'intermediate',
    isFeatured: true,
    isRecentlyAdded: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['CSS Grid', 'CSS Custom Properties', 'Sass Modules'],
    frameworks: ['React', 'Web Components', 'Vue', 'Angular'],
    tags: [
      'carbon-design-system',
      '2x-grid',
      'contextual-layers',
      'enterprise-ui',
      'theming',
    ],
    summary:
      'Enterprise design system built on the mathematical 2x Grid (8px/16px base units) and contextual $layer-01, $layer-02, $layer-03 tokens that automatically increment surface luminance as containers nest.',
    problemStatement:
      'In dense enterprise dashboards, nesting components inside containers of identical background color destroys boundary perception.',
    whenToUse: [
      'High-density B2B cloud consoles, developer tools, and data-intensive workflows',
      'Interfaces requiring four coordinated themes (White, Gray 10, Gray 90, Gray 100)',
    ],
    whenToAvoid: [
      'Minimal single-surface editorial pages with zero container nesting',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'token-surface-hierarchy',
    interactiveParameters: [
      {
        key: 'hueAngle',
        label: 'Carbon Interactive Accent Hue',
        description: 'Default IBM Blue sits at 218deg; test custom enterprise palette hues.',
        controlType: 'range',
        defaultValue: 218,
        min: 180,
        max: 270,
        step: 2,
        unit: 'deg',
      },
      {
        key: 'containerRadius',
        label: 'Architectural Corner Radius',
        description: 'Carbon defaults to orthogonal 0px corners for maximum tabular density.',
        controlType: 'range',
        defaultValue: 2,
        min: 0,
        max: 16,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfacePadding',
        label: '2x Mini-Unit Padding (8px Steps)',
        description: 'Demonstrates 8px/16px/24px spatial increments.',
        controlType: 'range',
        defaultValue: 16,
        min: 8,
        max: 32,
        step: 8,
        unit: 'px',
      },
      {
        key: 'surfaceContrastMode',
        label: 'Carbon Theme Polarity',
        description: 'Switch between Gray 10 (Light), Gray 90 (Dark), and High-Contrast.',
        controlType: 'select',
        defaultValue: 'dark-slate',
        options: [
          { label: 'Gray 10 (Light Enterprise)', value: 'light-canvas' },
          { label: 'Gray 90 / 100 (Dark Charcoal)', value: 'dark-slate' },
          { label: 'High Contrast AAA', value: 'high-contrast' },
        ],
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'carbon-layers.css',
        description: 'Contextual layer token hierarchy ($layer-01 -> $layer-02).',
        codeTemplate: `:root {
  --cds-interactive: hsl({{hueAngle}} 90% 50%);
  --cds-layer-radius: {{containerRadius}}px;
  --cds-spacing-05: {{surfacePadding}}px;
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 8.6,
      ariaRoleContract: ['region', 'grid'],
      keyboardInteractions: [
        {
          keyCombo: 'Tab / Arrow Keys',
          expectedBehavior: '2px high-contrast focus inset border on every interactive cell.',
        },
      ],
      reducedMotionStrategy: 'Uses 70ms–110ms productive easing curves or 0ms under reduced motion.',
      responsiveBreakpointStrategy: '16-column 2x grid collapsing to 8 columns on tablet and 4 on mobile.',
    },
    sourceAttribution: {
      authorOrOrganization: 'IBM Corporation (Carbon Design System v11)',
      officialUrl: 'https://carbondesignsystem.com/elements/2x-grid/overview/',
      licenseType: 'Apache-2.0 Open Source License',
      firstPublishedYear: 2017,
      verificationStandard: 'official-specification',
      attributionNote:
        'References IBM Carbon Design System v11 contextual layer model and 2x Grid specification.',
    },
    relatedResourceSlugs: [
      'material-3-semantic-token-hierarchy',
      'swiss-modular-typographic-grid',
    ],
    createdAtIso: '2026-11-18T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-apple-hig-ergonomics',
    slug: 'apple-hig-vibrancy-and-spring-ergonomics',
    title: 'Apple Human Interface Guidelines — Fluid Spring Ergonomics & Concentric Geometry',
    classification: 'official-design-system',
    categorySlug: 'official-design-systems',
    categorySlugs: [
      'official-design-systems',
      'mobile-design',
      'motion-animation',
      'design-fundamentals',
    ],
    subcategory: 'Apple Human Interface Guidelines',
    nestedCategoryPath: [
      'Official Design Systems',
      'Platform & OS Systems',
      'Apple Human Interface Guidelines',
      'Concentric Geometry & Fluid Gestures',
    ],
    audienceLevel: 'all-levels',
    isFeatured: true,
    isCuratedPopularSample: true,
    curatedSelectionReason:
      'Curated Sample Benchmark · Direct-manipulation velocity preservation & concentric curvature',
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['Spring Physics', 'Touch & Pointer Events', 'CSS Compositor'],
    frameworks: ['React', 'Motion', 'CSS Native'],
    tags: [
      'apple-hig',
      'concentric-radii',
      'touch-ergonomics',
      'gesture-continuation',
      'mobile-patterns',
    ],
    summary:
      'Cross-platform human interface principles emphasizing concentric hardware-to-software corner radii, interruptible spring gestures, and dynamic optical type tracking.',
    problemStatement:
      'Disjointed corner curves and non-interruptible linear animations break the illusion of direct physical manipulation.',
    whenToUse: [
      'Touch and pointer interfaces requiring responsive gesture continuation and concentric geometry',
    ],
    whenToAvoid: [
      'Low-powered e-ink or terminal environments without compositor acceleration',
    ],
    executionMode: 'interactive-motion-canvas',
    demoArchetype: 'spring-motion-physics',
    interactiveParameters: [
      {
        key: 'stiffness',
        label: 'Interactive Spring Stiffness',
        description: 'Controls responsiveness of gesture projection.',
        controlType: 'range',
        defaultValue: 380,
        min: 140,
        max: 600,
        step: 20,
        unit: 'N/m',
      },
      {
        key: 'damping',
        label: 'Critical Damping Coefficient',
        description: 'Tuned near ζ = 1.0 to eliminate distracting oscillation bounce.',
        controlType: 'range',
        defaultValue: 34,
        min: 12,
        max: 60,
        step: 2,
        unit: 'Ns/m',
      },
      {
        key: 'simulateReducedMotion',
        label: 'Simulate Reduce Motion Accessibility Setting',
        description: 'Replaces spatial sliding with crossfade state transition.',
        controlType: 'boolean',
        defaultValue: false,
      },
    ],
    codeTemplates: [
      {
        language: 'tsx',
        filename: 'FluidGestureSpring.tsx',
        description: 'Critically damped spring configuration with reduced-motion fallback.',
        codeTemplate: `const transition = prefersReducedMotion
  ? { duration: 0 }
  : { type: 'spring', stiffness: {{stiffness}}, damping: {{damping}} };`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 7.5,
      ariaRoleContract: ['button', 'region'],
      keyboardInteractions: [
        {
          keyCombo: 'Space / Enter',
          expectedBehavior: 'Triggers state transition with full keyboard focus visibility.',
        },
      ],
      reducedMotionStrategy: 'Honors system Reduce Motion preference automatically.',
      responsiveBreakpointStrategy: 'Enforces minimum 44x44pt touch target hit areas.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Apple Inc. (Human Interface Guidelines)',
      officialUrl: 'https://developer.apple.com/design/human-interface-guidelines',
      licenseType: 'Proprietary Public Documentation Reference',
      firstPublishedYear: 1987,
      verificationStandard: 'official-specification',
      attributionNote:
        'Educational analysis of publicly documented Apple HIG motion and concentric layout principles.',
    },
    relatedResourceSlugs: [
      'damped-harmonic-spring-choreography',
      'material-3-semantic-token-hierarchy',
    ],
    createdAtIso: '2026-10-20T00:00:00.000Z',
    updatedAtIso: '2026-11-22T00:00:00.000Z',
  },
  {
    id: 'res-swiss-modular-grid',
    slug: 'swiss-modular-typographic-grid',
    title: 'Swiss International Modular Grid & Asymmetric Hierarchy',
    classification: 'layout-technique',
    categorySlug: 'layout-grid-systems',
    categorySlugs: [
      'layout-grid-systems',
      'visual-design-styles',
      'typography-systems',
      'design-fundamentals',
    ],
    subcategory: 'Modular grids',
    nestedCategoryPath: [
      'Layout & Grid Systems',
      'Architectural Grids',
      'Modular grids',
      'Swiss Baseline & Hangline Grids',
    ],
    audienceLevel: 'intermediate',
    isFeatured: true,
    isCuratedPopularSample: true,
    curatedSelectionReason:
      'Curated Sample Benchmark · Foundational 20th-century editorial layout methodology',
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['CSS Grid Level 2', 'CSS Subgrid', 'Fluid Clamp Typography'],
    frameworks: ['CSS Native', 'Tailwind CSS', 'Next.js'],
    tags: [
      'swiss-grid',
      'modular-grid',
      'asymmetric-layout',
      'hangline',
      'editorial-design',
    ],
    summary:
      'Objective spatial organization using mathematical column divisions, strict horizontal hanglines, and asymmetric typographic scale contrast to establish clear visual reading order.',
    problemStatement:
      'Arbitrary centering and inconsistent spacing create visual clutter and weak scannability across complex information-dense layouts.',
    whenToUse: [
      'Editorial publications, technical documentation, and data-dense reference encyclopedias',
      'Architectural portfolios and specification sheets requiring clear visual hierarchy',
    ],
    whenToAvoid: [
      'Freeform spatial canvas applications where rigid orthogonal alignment restricts user node placement',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'swiss-typographic-grid',
    interactiveParameters: [
      {
        key: 'gridColumns',
        label: 'Modular Column Divisions',
        description: 'Number of equal vertical column tracks across the composition stage.',
        controlType: 'range',
        defaultValue: 6,
        min: 3,
        max: 12,
        step: 1,
        unit: 'cols',
      },
      {
        key: 'gridGap',
        label: 'Gutter Rhythm',
        description: 'Spatial separation between modular column tracks (px).',
        controlType: 'range',
        defaultValue: 16,
        min: 4,
        max: 32,
        step: 4,
        unit: 'px',
      },
      {
        key: 'headlineScale',
        label: 'Display Type Scale Ratio',
        description: 'Controls the typographic contrast ratio between primary headline and body measure.',
        controlType: 'range',
        defaultValue: 28,
        min: 18,
        max: 42,
        step: 2,
        unit: 'px',
      },
      {
        key: 'showGridOverlay',
        label: 'Expose Structural Grid Tracks',
        description: 'Toggles visible column guide overlays and baseline rhythm markers.',
        controlType: 'boolean',
        defaultValue: true,
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'swiss-grid.css',
        description: 'CSS Grid modular specification with asymmetric column spanning.',
        codeTemplate: `.swiss-modular-grid {
  display: grid;
  grid-template-columns: repeat({{gridColumns}}, minmax(0, 1fr));
  gap: {{gridGap}}px;
  align-items: start;
}

.swiss-display-title {
  font-size: {{headlineScale}}px;
  line-height: 1.08;
  letter-spacing: -0.02em;
  text-wrap: balance;
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 11.4,
      ariaRoleContract: ['article', 'heading'],
      keyboardInteractions: [
        {
          keyCombo: 'Tab',
          expectedBehavior: 'Logical DOM reading order matches visual top-to-bottom, left-to-right grid placement.',
        },
      ],
      reducedMotionStrategy: 'Static architectural layout; column track changes reflow cleanly.',
      responsiveBreakpointStrategy: 'Collapses from N modular columns on desktop to 2 columns on tablet and 1 column on mobile.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Josef Müller-Brockmann (Grid Systems in Graphic Design / Raster Systeme)',
      officialUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout',
      licenseType: 'Historical Design Canon / W3C CSS Grid Specification',
      firstPublishedYear: 1981,
      verificationStandard: 'historical-canon',
      attributionNote:
        'Principles derived from the Swiss International Typographic Style (Zürich / Basel schools) translated to W3C CSS Grid Layout Level 2.',
    },
    relatedResourceSlugs: ['material-3-semantic-token-hierarchy', 'high-contrast-neobrutalist-surface'],
    createdAtIso: '2026-10-05T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-spring-physics-motion',
    slug: 'damped-harmonic-spring-choreography',
    title: 'Damped Harmonic Spring Physics & Reduced-Motion Fallbacks',
    classification: 'animation-technique',
    categorySlug: 'motion-animation',
    categorySlugs: [
      'motion-animation',
      'advanced-motion',
      'accessibility-inclusive-design',
      'mobile-design',
    ],
    subcategory: 'Physics-based motion',
    nestedCategoryPath: [
      'Motion & Animation',
      'Physics, 3D & Generative Motion',
      'Physics-based motion',
      'Damped Harmonic Oscillators (Hooke’s Law)',
    ],
    audienceLevel: 'intermediate',
    isFeatured: true,
    isRecentlyAdded: true,
    isCuratedPopularSample: true,
    curatedSelectionReason:
      'Curated Sample Benchmark · Motion of the Week — Interruptible physical spring dynamics',
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['Spring Differential Solver', 'Web Animations API', 'CSS Transforms'],
    frameworks: ['React', 'Motion', 'TypeScript'],
    tags: [
      'spring-physics',
      'harmonic-oscillator',
      'reduced-motion',
      'micro-interactions',
      'choreography',
    ],
    summary:
      'Physically modeled interface motion driven by stiffness, damping ratio, and mass rather than fixed duration timers—preserving velocity continuity during mid-flight interruptions.',
    problemStatement:
      'Fixed-duration linear or basic easing curves feel robotic and snap abruptly when a user reverses an interaction mid-transition.',
    whenToUse: [
      'Direct-manipulation gestures, drawers, layout projection (FLIP), and tactile control feedback',
      'Micro-interactions requiring rapid initial response (<= 150ms perceived latency) and smooth settling',
    ],
    whenToAvoid: [
      'When prefers-reduced-motion: reduce is active (must automatically degrade to instant opacity crossfade)',
      'Ambient looping background animations that distract from primary reading tasks',
    ],
    executionMode: 'interactive-motion-canvas',
    demoArchetype: 'spring-motion-physics',
    interactiveParameters: [
      {
        key: 'stiffness',
        label: 'Spring Stiffness (k)',
        description: 'Tension force pulling the element toward its target equilibrium state.',
        controlType: 'range',
        defaultValue: 320,
        min: 100,
        max: 600,
        step: 20,
        unit: 'N/m',
      },
      {
        key: 'damping',
        label: 'Damping Coefficient (c)',
        description: 'Frictional resistance preventing endless oscillation. Lower values produce overshoot bounce.',
        controlType: 'range',
        defaultValue: 26,
        min: 8,
        max: 60,
        step: 2,
        unit: 'Ns/m',
      },
      {
        key: 'simulateReducedMotion',
        label: 'Simulate prefers-reduced-motion',
        description: 'Forces WCAG 2.3.3 reduced-motion mode, replacing spatial translation with instant state snap.',
        controlType: 'boolean',
        defaultValue: false,
      },
    ],
    codeTemplates: [
      {
        language: 'tsx',
        filename: 'SpringInteractiveStage.tsx',
        description: 'Motion component with explicit reduced-motion accessibility branch.',
        codeTemplate: `import { motion, useReducedMotion } from 'motion/react';

export function SpringCard({ isExpanded }: { isExpanded: boolean }) {
  const prefersReducedMotion = useReducedMotion() || {{simulateReducedMotion}};

  return (
    <motion.div
      animate={{
        scale: isExpanded ? 1.04 : 1,
        x: isExpanded ? 140 : 0,
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              type: 'spring',
              stiffness: {{stiffness}},
              damping: {{damping}},
            }
      }
    />
  );
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 8.5,
      ariaRoleContract: ['button', 'region'],
      keyboardInteractions: [
        {
          keyCombo: 'Space / Enter',
          expectedBehavior: 'Triggers spring state toggle identically to pointer click.',
        },
      ],
      reducedMotionStrategy:
        'Queries useReducedMotion() / @media (prefers-reduced-motion: reduce) to bypass spatial translation when enabled.',
      responsiveBreakpointStrategy: 'Restricts animation strictly to compositor properties (transform, opacity).',
    },
    sourceAttribution: {
      authorOrOrganization: 'Apple Human Interface Guidelines / Motion Library Specification',
      officialUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html',
      licenseType: 'W3C WCAG 2.1 SC 2.3.3 & MIT Open Source',
      firstPublishedYear: 2018,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Implements Hooke’s Law damped harmonic oscillator equations paired with W3C WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions).',
    },
    relatedResourceSlugs: ['wai-aria-combobox-keyboard-pattern', 'css-container-queries-intrinsic-card'],
    createdAtIso: '2026-11-20T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-wai-aria-combobox',
    slug: 'wai-aria-combobox-keyboard-pattern',
    title: 'WAI-ARIA 1.2 Accessible Combobox & Focus State Machine',
    classification: 'ui-component',
    categorySlug: 'ui-components',
    categorySlugs: [
      'ui-components',
      'accessibility-inclusive-design',
      'ux-interaction-patterns',
      'design-engineering-implementation',
    ],
    subcategory: 'Combobox & Autocomplete',
    nestedCategoryPath: [
      'UI Components',
      'Form & Data Entry Controls',
      'Combobox & Autocomplete',
      'Virtual Focus (aria-activedescendant)',
    ],
    audienceLevel: 'advanced',
    isFeatured: true,
    isRecentlyAdded: true,
    isCuratedPopularSample: true,
    curatedSelectionReason:
      'Curated Sample Benchmark · Gold-standard keyboard navigation & aria-activedescendant contract',
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['WAI-ARIA 1.2', 'DOM Focus Management', 'TypeScript State Machine'],
    frameworks: ['React', 'Radix Primitives', 'HTML5 Native'],
    tags: [
      'wai-aria',
      'combobox',
      'keyboard-navigation',
      'accessibility',
      'focus-ring',
    ],
    summary:
      'Composite input and popup listbox pattern maintaining DOM focus on the text input while managing virtual active-descendant keyboard navigation across filtered options.',
    problemStatement:
      'Custom dropdowns built with generic <div> elements trap screen reader users, swallow Escape/Arrow keys, and fail form submission semantics.',
    whenToUse: [
      'Command palettes, encyclopedia taxonomy search bars, and searchable select inputs with > 7 options',
    ],
    whenToAvoid: [
      'Simple binary or 3-option choices where a segmented button group or radio group eliminates popup clicks',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'accessible-combobox-pattern',
    interactiveParameters: [
      {
        key: 'focusRingWidth',
        label: 'Focus-Visible Ring Thickness',
        description: 'Thickness of the high-contrast keyboard focus outline (WCAG 2.4.11 Focus Appearance).',
        controlType: 'range',
        defaultValue: 2,
        min: 2,
        max: 4,
        step: 1,
        unit: 'px',
      },
      {
        key: 'focusRingOffset',
        label: 'Focus Ring Offset',
        description: 'Spatial separation between component boundary and focus outline (px).',
        controlType: 'range',
        defaultValue: 2,
        min: 0,
        max: 6,
        step: 1,
        unit: 'px',
      },
      {
        key: 'announceLiveCount',
        label: 'ARIA-Live Result Announcements',
        description: 'Enables polite aria-live region broadcasting filtered option counts to assistive technology.',
        controlType: 'boolean',
        defaultValue: true,
      },
    ],
    codeTemplates: [
      {
        language: 'tsx',
        filename: 'AccessibleCombobox.tsx',
        description: 'WAI-ARIA 1.2 Combobox markup with aria-activedescendant keyboard contract.',
        codeTemplate: `<div className="relative">
  <label id="concept-lookup-label" className="text-xs font-medium">
    Filter Design Patterns
  </label>
  <input
    role="combobox"
    aria-labelledby="concept-lookup-label"
    aria-expanded={isOpen}
    aria-controls="concept-listbox"
    aria-activedescendant={activeOptionId}
    aria-autocomplete="list"
    style={{
      outlineWidth: '{{focusRingWidth}}px',
      outlineOffset: '{{focusRingOffset}}px',
    }}
  />
  <ul id="concept-listbox" role="listbox" aria-label="Design Patterns">
    {/* Options with role="option" and aria-selected */}
  </ul>
</div>`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 9.1,
      ariaRoleContract: ['combobox', 'listbox', 'option', 'status'],
      keyboardInteractions: [
        {
          keyCombo: 'ArrowDown / ArrowUp',
          expectedBehavior: 'Cycles aria-activedescendant highlight through available listbox options without moving DOM focus from input.',
        },
        {
          keyCombo: 'Enter',
          expectedBehavior: 'Commits the currently highlighted active-descendant option and closes listbox.',
        },
        {
          keyCombo: 'Escape',
          expectedBehavior: 'Dismisses open listbox popup or clears filter query if already closed.',
        },
      ],
      reducedMotionStrategy: 'Popover opens without scale/slide translation when reduced motion is preferred.',
      responsiveBreakpointStrategy: 'Guarantees minimum 44px touch target height on coarse pointers.',
    },
    sourceAttribution: {
      authorOrOrganization: 'W3C Web Accessibility Initiative (WAI-ARIA Authoring Practices Guide)',
      officialUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
      licenseType: 'W3C Software and Document License',
      firstPublishedYear: 2014,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Follows the official W3C WAI-ARIA 1.2 Authoring Practices Guide (APG) Combobox Pattern state machine.',
    },
    relatedResourceSlugs: ['damped-harmonic-spring-choreography', 'material-3-semantic-token-hierarchy'],
    createdAtIso: '2026-11-15T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-css-container-queries',
    slug: 'css-container-queries-intrinsic-card',
    title: 'CSS Container Queries & Intrinsic Component Responsiveness',
    classification: 'development-technology',
    categorySlug: 'responsive-adaptive-design',
    categorySlugs: [
      'responsive-adaptive-design',
      'design-engineering-implementation',
      'layout-grid-systems',
      'ui-components',
    ],
    subcategory: 'CSS Container Queries (@container)',
    nestedCategoryPath: [
      'Responsive & Adaptive Design',
      'Intrinsic & Container-Driven Layout',
      'CSS Container Queries (@container)',
    ],
    audienceLevel: 'intermediate',
    isFeatured: true,
    isRecentlyAdded: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['CSS Containment Level 3', '@container inline-size', 'Container Query Units (cqi)'],
    frameworks: ['CSS Native', 'Tailwind CSS v4', 'React'],
    tags: [
      'container-queries',
      'intrinsic-design',
      'responsive-ui',
      'cqi-units',
      'modular-cards',
    ],
    summary:
      'Enables UI components to adapt their internal layout structure, density, and typography based on their parent container inline-size rather than global viewport media queries.',
    problemStatement:
      'Viewport @media queries fail when the same component is placed inside a narrow sidebar, a 3-column bento grid, and a wide main canvas.',
    whenToUse: [
      'Modular design system cards, data widgets, and reusable encyclopedia preview blocks placed in variable-width containers',
    ],
    whenToAvoid: [
      'Document-level page shells or top navigation headers that genuinely depend on the browser viewport dimensions',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'fluid-container-card',
    interactiveParameters: [
      {
        key: 'containerWidthPercent',
        label: 'Parent Container Inline-Size',
        description: 'Drag to resize the parent containment context and watch the component switch layout modes intrinsically.',
        controlType: 'range',
        defaultValue: 78,
        min: 32,
        max: 100,
        step: 2,
        unit: '%',
      },
      {
        key: 'breakpointThreshold',
        label: 'Horizontal Split Threshold',
        description: 'Container width (%) above which the card transitions from stacked vertical to horizontal split.',
        controlType: 'range',
        defaultValue: 60,
        min: 45,
        max: 80,
        step: 5,
        unit: '%',
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'container-query.css',
        description: 'W3C CSS Containment Level 3 @container query implementation.',
        codeTemplate: `.card-containment-host {
  container-type: inline-size;
  container-name: encyclopedia-card;
  width: {{containerWidthPercent}}%;
}

.intrinsic-card-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@container encyclopedia-card (min-width: 420px) {
  .intrinsic-card-layout {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AA',
      minContrastRatio: 7.4,
      ariaRoleContract: ['region'],
      keyboardInteractions: [
        {
          keyCombo: 'ArrowLeft / ArrowRight',
          expectedBehavior: 'Resizes container inline-size smoothly via keyboard slider to test reflow compliance (WCAG 1.4.10 Reflow).',
        },
      ],
      reducedMotionStrategy: 'Layout breakpoint changes occur cleanly without layout geometry animation.',
      responsiveBreakpointStrategy: 'Intrinsic container-relative adaptation across 240px to 960px host widths.',
    },
    sourceAttribution: {
      authorOrOrganization: 'W3C CSS Working Group (CSS Containment Module Level 3 / Miriam Suzanne)',
      officialUrl: 'https://www.w3.org/TR/css-contain-3/',
      licenseType: 'W3C Document License',
      firstPublishedYear: 2022,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Specified in W3C CSS Containment Module Level 3 (@container inline-size queries).',
    },
    relatedResourceSlugs: ['swiss-modular-typographic-grid', 'material-3-semantic-token-hierarchy'],
    createdAtIso: '2026-11-19T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-neobrutalist-contrast-study',
    slug: 'high-contrast-neobrutalist-surface',
    title: 'Architectural Neo-Brutalism & Hard-Edge Offset Mechanics',
    classification: 'visual-style',
    categorySlug: 'visual-design-styles',
    categorySlugs: [
      'visual-design-styles',
      'color-systems',
      'design-fundamentals',
    ],
    subcategory: 'Neo-brutalism',
    nestedCategoryPath: [
      'Visual Design Styles',
      'Structural & Raw Aesthetics',
      'Neo-brutalism',
      'Hard-Edge Offset Shadow Mechanics',
    ],
    audienceLevel: 'all-levels',
    isFeatured: true,
    isRecentlyAdded: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['CSS Box Model', 'Zero-Blur Box Shadow', 'High-Contrast Ink Tokens'],
    frameworks: ['CSS Native', 'Tailwind CSS'],
    tags: [
      'neo-brutalism',
      'brutalism',
      'hard-edge-shadows',
      'visual-style',
      'high-contrast',
    ],
    summary:
      'An unapologetic structural aesthetic defined by exposed 1px–3px solid ink borders, zero-blur geometric offset shadows, high-chroma accent surfaces, and raw typographic clarity.',
    problemStatement:
      'Overuse of diffused multi-layer drop shadows and low-contrast translucent blurs can reduce boundary legibility and homogenize digital interfaces.',
    whenToUse: [
      'Creative developer tooling, cultural archives, and distinctive design documentation requiring unblurred structural boundaries',
    ],
    whenToAvoid: [
      'Dense clinical medical monitors or enterprise accounting ledgers where heavy offset shadows add visual noise across 100+ table rows',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'neobrutalist-contrast-study',
    interactiveParameters: [
      {
        key: 'borderThickness',
        label: 'Structural Ink Border Weight',
        description: 'Controls the exposed solid perimeter border thickness (px).',
        controlType: 'range',
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        unit: 'px',
      },
      {
        key: 'shadowOffset',
        label: 'Hard Geometric Shadow Offset',
        description: 'X/Y displacement of the 0px-blur solid offset shadow (px).',
        controlType: 'range',
        defaultValue: 5,
        min: 0,
        max: 12,
        step: 1,
        unit: 'px',
      },
      {
        key: 'cornerRadius',
        label: 'Bevel / Corner Radius',
        description: 'Transitions from raw orthogonal architectural corners (0px) to softened industrial edges.',
        controlType: 'range',
        defaultValue: 4,
        min: 0,
        max: 16,
        step: 2,
        unit: 'px',
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'neobrutalist-surface.css',
        description: 'Zero-blur hard-edge box-shadow with active tactile press translation.',
        codeTemplate: `.neobrutal-card {
  border: {{borderThickness}}px solid #111827;
  border-radius: {{cornerRadius}}px;
  box-shadow: {{shadowOffset}}px {{shadowOffset}}px 0px 0px #111827;
  transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

.neobrutal-card:active {
  transform: translate({{shadowOffset}}px, {{shadowOffset}}px);
  box-shadow: 0px 0px 0px 0px #111827;
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 14.8,
      ariaRoleContract: ['region', 'button'],
      keyboardInteractions: [
        {
          keyCombo: 'Space / Enter',
          expectedBehavior: 'Demonstrates physical depress feedback where card translates into its hard shadow offset.',
        },
      ],
      reducedMotionStrategy: 'Hover/active displacement respects reduced-motion preferences.',
      responsiveBreakpointStrategy: 'Maintains crisp pixel-aligned borders across 1x and 2x Retina displays.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Architectural Brutalism (Alison & Peter Smithson) / Digital Web Adaptation Study',
      officialUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow',
      licenseType: 'Public Domain Architectural Study',
      firstPublishedYear: 1954,
      verificationStandard: 'historical-canon',
      attributionNote:
        'Analyzes the translation of mid-20th-century architectural Brutalism ("béton brut" / honest exposed structure) into modern CSS box-model mechanics.',
    },
    relatedResourceSlugs: ['swiss-modular-typographic-grid', 'material-3-semantic-token-hierarchy'],
    createdAtIso: '2026-11-10T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-fluid-typographic-scale',
    slug: 'fluid-modular-type-scale-clamp',
    title: 'Fluid Modular Typography Scale & OpenType Variable Axis Interpolation',
    classification: 'typography-system',
    categorySlug: 'typography-systems',
    categorySlugs: [
      'typography-systems',
      'responsive-adaptive-design',
      'design-fundamentals',
      'accessibility-inclusive-design',
    ],
    subcategory: 'Fluid Typography (CSS clamp)',
    nestedCategoryPath: [
      'Typography Systems',
      'Typographic Scale & Rhythm',
      'Fluid Typography (CSS clamp)',
    ],
    audienceLevel: 'beginner',
    isFeatured: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['CSS clamp()', 'OpenType Variable Fonts', 'tabular-nums'],
    frameworks: ['CSS Native', 'Tailwind CSS', 'Next.js'],
    tags: [
      'fluid-typography',
      'type-scale',
      'variable-fonts',
      'tabular-numerals',
      'vertical-rhythm',
    ],
    summary:
      'Continuous viewport-proportional typographic scaling using CSS clamp() paired with tabular-nums alignment and optical letter-spacing compensation across display and body sizes.',
    problemStatement:
      'Stepped media-query font jumps cause jarring text reflows at arbitrary tablet breakpoints and fail to preserve optimal 60ch–72ch reading measures.',
    whenToUse: [
      'Editorial encyclopedias, technical documentation, and multi-device design systems',
    ],
    whenToAvoid: [
      'Fixed-pixel bitmap displays requiring integer pixel font multiples',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'swiss-typographic-grid',
    interactiveParameters: [
      {
        key: 'gridColumns',
        label: 'Measure Columns',
        description: 'Column divisions governing line measure.',
        controlType: 'range',
        defaultValue: 4,
        min: 2,
        max: 8,
        step: 1,
        unit: 'cols',
      },
      {
        key: 'gridGap',
        label: 'Column Gutter',
        description: 'Gutter width in pixels.',
        controlType: 'range',
        defaultValue: 20,
        min: 8,
        max: 32,
        step: 4,
        unit: 'px',
      },
      {
        key: 'headlineScale',
        label: 'Fluid Display Peak Size',
        description: 'Maximum display headline size in the modular ratio.',
        controlType: 'range',
        defaultValue: 34,
        min: 20,
        max: 44,
        step: 2,
        unit: 'px',
      },
      {
        key: 'showGridOverlay',
        label: 'Show Baseline Rhythm Guides',
        description: 'Displays structural vertical & horizontal rhythm tracks.',
        controlType: 'boolean',
        defaultValue: true,
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'fluid-type-scale.css',
        description: 'Linear viewport interpolation using CSS clamp() and tabular numerals.',
        codeTemplate: `:root {
  --font-display-h1: clamp(1.85rem, 1.35rem + 2.1vw, {{headlineScale}}px);
  --font-body-measure: 65ch;
}

.metric-readout {
  font-variant-numeric: tabular-nums;
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 12.1,
      ariaRoleContract: ['article'],
      keyboardInteractions: [
        {
          keyCombo: 'Ctrl/Cmd + Plus',
          expectedBehavior: 'Supports 200% browser zoom without clipping text (WCAG 1.4.4 Resize Text).',
        },
      ],
      reducedMotionStrategy: 'Instantaneous typographic scale calculation.',
      responsiveBreakpointStrategy: 'Fluidly interpolates across 320px to 1440px viewports.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Robert Bringhurst (The Elements of Typographic Style) & W3C CSS Fonts Level 4',
      officialUrl: 'https://www.w3.org/TR/css-fonts-4/',
      licenseType: 'W3C Specification / Editorial Typographic Canon',
      firstPublishedYear: 1992,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Combines Bringhurst harmonic modular ratios with W3C CSS Values and Units Level 4 clamp() math.',
    },
    relatedResourceSlugs: ['swiss-modular-typographic-grid', 'material-3-semantic-token-hierarchy'],
    createdAtIso: '2026-10-14T00:00:00.000Z',
    updatedAtIso: '2026-11-21T00:00:00.000Z',
  },
  {
    id: 'res-oklch-perceptual-color-space',
    slug: 'oklch-perceptual-uniform-color-system',
    title: 'OKLCH Perceptually Uniform Color Spaces & APCA Contrast Predictability',
    classification: 'color-system',
    categorySlug: 'color-systems',
    categorySlugs: [
      'color-systems',
      'accessibility-inclusive-design',
      'design-fundamentals',
      'official-design-systems',
    ],
    subcategory: 'OKLCH & LCH Perceptual Uniformity',
    nestedCategoryPath: [
      'Color Systems',
      'Perceptual Color Spaces',
      'OKLCH & LCH Perceptual Uniformity',
    ],
    audienceLevel: 'intermediate',
    isFeatured: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['CSS Color Module Level 4', 'oklch()', 'color-mix()'],
    frameworks: ['CSS Native', 'Tailwind CSS v4'],
    tags: [
      'oklch',
      'color-spaces',
      'perceptual-lightness',
      'contrast-ratio',
      'gamut-mapping',
    ],
    summary:
      'Designs programmatic tonal palettes in OKLCH where changing Hue never unexpectedly alters perceived Lightness (L)—guaranteeing predictable contrast ratios across every color stop.',
    problemStatement:
      'In traditional HSL, yellow at 50% lightness has 4x higher perceived luminance than blue at 50% lightness, causing broken text contrast when swapping brand hues.',
    whenToUse: [
      'Multi-brand design systems, programmatic theme generators, and accessible status palettes',
    ],
    whenToAvoid: [
      'Legacy environments locked to pre-2020 rendering engines without CSS Color 4 fallbacks',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'token-surface-hierarchy',
    interactiveParameters: [
      {
        key: 'hueAngle',
        label: 'OKLCH Hue Angle (H)',
        description: 'Rotate hue 0-360deg while observing constant perceptual lightness.',
        controlType: 'range',
        defaultValue: 255,
        min: 0,
        max: 360,
        step: 5,
        unit: 'deg',
      },
      {
        key: 'containerRadius',
        label: 'Swatch Container Radius',
        description: 'Corner radius token.',
        controlType: 'range',
        defaultValue: 10,
        min: 0,
        max: 24,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfacePadding',
        label: 'Swatch Spatial Padding',
        description: 'Padding around nested contrast pairs.',
        controlType: 'range',
        defaultValue: 16,
        min: 8,
        max: 28,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfaceContrastMode',
        label: 'Polarity Target',
        description: 'Test OKLCH token pairs in Light, Dark, and High-Contrast modes.',
        controlType: 'select',
        defaultValue: 'light-canvas',
        options: [
          { label: 'Light Polarity (L=0.98 Surface)', value: 'light-canvas' },
          { label: 'Dark Polarity (L=0.14 Surface)', value: 'dark-slate' },
          { label: 'High-Contrast AAA (L=0.08 Surface)', value: 'high-contrast' },
        ],
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'oklch-palette.css',
        description: 'Perceptually uniform OKLCH palette tokens in CSS Color Level 4.',
        codeTemplate: `:root {
  --brand-hue: {{hueAngle}};
  /* Constant L=0.55 guarantees identical contrast across all hues */
  --color-accent-500: oklch(0.55 0.19 var(--brand-hue));
  --color-accent-100: oklch(0.93 0.04 var(--brand-hue));
  --color-accent-900: oklch(0.22 0.08 var(--brand-hue));
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 8.9,
      ariaRoleContract: ['region'],
      keyboardInteractions: [
        {
          keyCombo: 'ArrowLeft / ArrowRight',
          expectedBehavior: 'Rotates hue angle continuously with deterministic contrast preservation.',
        },
      ],
      reducedMotionStrategy: 'Immediate color update.',
      responsiveBreakpointStrategy: 'Responsiveswatch grid across all viewports.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Björn Ottosson (Oklab Color Space) & W3C CSS Color Module Level 4',
      officialUrl: 'https://www.w3.org/TR/css-color-4/#ok-lab',
      licenseType: 'Public Domain / W3C Specification',
      firstPublishedYear: 2020,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Based on Björn Ottosson’s 2020 Oklab perceptual color space formulation standardized in W3C CSS Color Level 4.',
    },
    relatedResourceSlugs: ['material-3-semantic-token-hierarchy', 'ibm-carbon-2x-grid-and-layer-tokens'],
    createdAtIso: '2026-10-28T00:00:00.000Z',
    updatedAtIso: '2026-11-23T00:00:00.000Z',
  },
  {
    id: 'res-command-palette-ux-pattern',
    slug: 'command-palette-keyboard-first-ux-pattern',
    title: 'Command Palette (⌘K) — Keyboard-First Discovery & Fuzzy Intent Routing',
    classification: 'ui-pattern',
    categorySlug: 'ux-interaction-patterns',
    categorySlugs: [
      'ux-interaction-patterns',
      'ui-components',
      'accessibility-inclusive-design',
    ],
    subcategory: 'Command Palettes (⌘K)',
    nestedCategoryPath: [
      'UX & Interaction Patterns',
      'Navigation & Wayfinding Patterns',
      'Command Palettes (⌘K)',
    ],
    audienceLevel: 'intermediate',
    isFeatured: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['KeyboardEvent Shortcut Listener', 'WAI-ARIA Combobox', 'Focus Trap'],
    frameworks: ['React', 'Next.js', 'TypeScript'],
    tags: [
      'command-palette',
      'keyboard-shortcuts',
      'wayfinding',
      'ux-pattern',
      'search-discovery',
    ],
    summary:
      'Modal command launcher invoked via ⌘K / Ctrl+K that unifies multi-taxonomy search, deep page navigation, and immediate workspace actions in a single keyboard-driven listbox.',
    problemStatement:
      'Deeply nested multi-level hierarchies require 3–5 sequential mouse clicks to traverse when users already know the concept or tool they want.',
    whenToUse: [
      'Knowledge encyclopedias, developer tools, and complex SaaS workspaces with > 20 routes or actions',
    ],
    whenToAvoid: [
      'As a replacement for visible primary navigation—command palettes must complement, never hide, core discoverability',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'accessible-combobox-pattern',
    interactiveParameters: [
      {
        key: 'focusRingWidth',
        label: 'Active Option Highlight Ring',
        description: 'Focus ring width around active command input.',
        controlType: 'range',
        defaultValue: 2,
        min: 2,
        max: 4,
        step: 1,
        unit: 'px',
      },
      {
        key: 'focusRingOffset',
        label: 'Focus Ring Offset',
        description: 'Spatial offset around command input.',
        controlType: 'range',
        defaultValue: 2,
        min: 0,
        max: 6,
        step: 1,
        unit: 'px',
      },
      {
        key: 'announceLiveCount',
        label: 'Announce Filtered Hit Count',
        description: 'Broadcasts result count via aria-live.',
        controlType: 'boolean',
        defaultValue: true,
      },
    ],
    codeTemplates: [
      {
        language: 'tsx',
        filename: 'useCommandShortcut.ts',
        description: 'Global Command+K / Ctrl+K listener with input target guard.',
        codeTemplate: `useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, []);`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 9.4,
      ariaRoleContract: ['dialog', 'combobox', 'listbox', 'option'],
      keyboardInteractions: [
        {
          keyCombo: 'Cmd/Ctrl + K',
          expectedBehavior: 'Toggles modal command palette and focuses search input.',
        },
        {
          keyCombo: 'Escape',
          expectedBehavior: 'Closes dialog and restores focus to trigger element.',
        },
      ],
      reducedMotionStrategy: 'Instant modal mount without scale zoom when reduced motion is active.',
      responsiveBreakpointStrategy: 'Full-width bottom/top sheet on mobile viewports.',
    },
    sourceAttribution: {
      authorOrOrganization: 'W3C WAI-ARIA Dialog & Combobox Authoring Practices',
      officialUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
      licenseType: 'W3C Document License',
      firstPublishedYear: 2019,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Composes W3C WAI-ARIA Modal Dialog focus containment with the Combobox active-descendant pattern.',
    },
    relatedResourceSlugs: ['wai-aria-combobox-keyboard-pattern', 'damped-harmonic-spring-choreography'],
    createdAtIso: '2026-11-04T00:00:00.000Z',
    updatedAtIso: '2026-11-23T00:00:00.000Z',
  },
  {
    id: 'res-flip-shared-element-choreography',
    slug: 'flip-layout-projection-and-view-transitions',
    title: 'FLIP Layout Projection & W3C View Transitions Choreography',
    classification: 'animation-technique',
    categorySlug: 'advanced-motion',
    categorySlugs: [
      'advanced-motion',
      'motion-animation',
      'design-engineering-implementation',
    ],
    subcategory: 'Shared-Element & FLIP Layout Projection',
    nestedCategoryPath: [
      'Advanced Motion',
      'Multi-Stage Choreography',
      'Shared-Element & FLIP Layout Projection',
    ],
    audienceLevel: 'advanced',
    isFeatured: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['FLIP Principle', 'W3C View Transitions API', 'Compositor Matrix3D'],
    frameworks: ['React', 'Motion', 'CSS Native'],
    tags: [
      'flip-animation',
      'view-transitions',
      'shared-element',
      'advanced-motion',
      '60fps-compositor',
    ],
    summary:
      'Measures First and Last DOM bounding boxes, applies an Inverted transform matrix, and Plays the transition on the GPU compositor thread without triggering expensive layout thrashing.',
    problemStatement:
      'Animating CSS width, height, top, or left directly forces synchronous browser layout recalculations on every frame, dropping frame rates below 30fps.',
    whenToUse: [
      'Expanding cards into full-screen detail views, reordering filtered grids, and shared-header tab indicators',
    ],
    whenToAvoid: [
      'Simultaneously projecting > 150 independent DOM nodes on low-memory mobile GPUs',
    ],
    executionMode: 'interactive-motion-canvas',
    demoArchetype: 'spring-motion-physics',
    interactiveParameters: [
      {
        key: 'stiffness',
        label: 'Projection Spring Stiffness',
        description: 'Stiffness of the inverted transform recovery spring.',
        controlType: 'range',
        defaultValue: 360,
        min: 140,
        max: 580,
        step: 20,
        unit: 'N/m',
      },
      {
        key: 'damping',
        label: 'Projection Damping',
        description: 'Prevents layout bounding-box overshoot.',
        controlType: 'range',
        defaultValue: 30,
        min: 12,
        max: 56,
        step: 2,
        unit: 'Ns/m',
      },
      {
        key: 'simulateReducedMotion',
        label: 'Bypass Spatial FLIP (Reduced Motion)',
        description: 'Disables transform inversion and performs instant DOM state swap.',
        controlType: 'boolean',
        defaultValue: false,
      },
    ],
    codeTemplates: [
      {
        language: 'tsx',
        filename: 'FlipProjection.tsx',
        description: 'Hardware-accelerated FLIP layout projection with reduced-motion guard.',
        codeTemplate: `<motion.div
  layout={!prefersReducedMotion}
  transition={{
    type: 'spring',
    stiffness: {{stiffness}},
    damping: {{damping}},
  }}
/>`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 8.8,
      ariaRoleContract: ['region', 'button'],
      keyboardInteractions: [
        {
          keyCombo: 'Space / Enter',
          expectedBehavior: 'Preserves DOM focus across layout projection state changes.',
        },
      ],
      reducedMotionStrategy: 'Sets layout={false} when prefers-reduced-motion is active.',
      responsiveBreakpointStrategy: 'Recalculates bounding client rects on viewport resize.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Paul Lewis (FLIP Technique) & W3C CSS View Transitions Module Level 1',
      officialUrl: 'https://www.w3.org/TR/css-view-transitions-1/',
      licenseType: 'W3C Document License',
      firstPublishedYear: 2015,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Documents the First-Last-Invert-Play (FLIP) compositor geometry pattern and W3C View Transitions API.',
    },
    relatedResourceSlugs: ['damped-harmonic-spring-choreography', 'apple-hig-vibrancy-and-spring-ergonomics'],
    createdAtIso: '2026-11-08T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-pbr-spatial-depth-lighting',
    slug: 'pbr-spatial-surfaces-and-perspective-depth',
    title: '3D Spatial UI Planes, Perspective Parallax & PBR Material Lighting',
    classification: 'development-technology',
    categorySlug: '3d-immersive-experiences',
    categorySlugs: [
      '3d-immersive-experiences',
      'advanced-motion',
      'visual-design-styles',
    ],
    subcategory: 'Spatial Computing UI & Depth Planes',
    nestedCategoryPath: [
      '3D & Immersive Experiences',
      'Spatial UI & Shader Craft',
      'Spatial Computing UI & Depth Planes',
    ],
    audienceLevel: 'advanced',
    isFeatured: true,
    demonstrationFormat: 'visual-specimen',
    publicationStatus: 'published',
    technologies: ['CSS 3D Transforms', 'WebGL / Three.js', 'PBR Roughness/Metalness'],
    frameworks: ['Three.js', 'React', 'CSS Native'],
    tags: [
      '3d-spatial-ui',
      'perspective-depth',
      'webgl',
      'pbr-materials',
      'immersive-design',
    ],
    summary:
      'Establishes legible Z-axis spatial hierarchy using physically based specular highlights, subtle rotational parallax, and orthographic/perspective depth planes without sacrificing text legibility.',
    problemStatement:
      'Unconstrained 3D camera rotations distort typography, cause vestibular discomfort, and break standard pointer hit-testing.',
    whenToUse: [
      'Spatial computing interfaces, hardware product configurators, and architectural depth diagrams',
    ],
    whenToAvoid: [
      'Long-form reading views or primary data entry forms',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'token-surface-hierarchy',
    interactiveParameters: [
      {
        key: 'hueAngle',
        label: 'Specular Key-Light Hue',
        description: 'Directional key-light hue angle illuminating the elevated spatial plane.',
        controlType: 'range',
        defaultValue: 225,
        min: 0,
        max: 360,
        step: 5,
        unit: 'deg',
      },
      {
        key: 'containerRadius',
        label: 'Spatial Plane Curvature',
        description: 'Outer bevel radius of the floating spatial window.',
        controlType: 'range',
        defaultValue: 16,
        min: 0,
        max: 28,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfacePadding',
        label: 'Z-Layer Inset Margin',
        description: 'Spatial offset between parent plane and elevated child layer.',
        controlType: 'range',
        defaultValue: 18,
        min: 8,
        max: 28,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfaceContrastMode',
        label: 'Ambient Environment Lighting',
        description: 'Simulates bright studio pass-through vs dark spatial environment.',
        controlType: 'select',
        defaultValue: 'dark-slate',
        options: [
          { label: 'Daylight Pass-Through', value: 'light-canvas' },
          { label: 'Dark Spatial Studio', value: 'dark-slate' },
          { label: 'High-Contrast Accessibility Plane', value: 'high-contrast' },
        ],
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'spatial-depth-plane.css',
        description: 'Perspective depth container with reduced-motion planar lock.',
        codeTemplate: `.spatial-stage {
  perspective: 1200px;
  transform-style: preserve-3d;
}

.spatial-window {
  border-radius: {{containerRadius}}px;
  padding: {{surfacePadding}}px;
  background: hsl({{hueAngle}} 35% 14% / 0.92);
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AA',
      minContrastRatio: 7.1,
      ariaRoleContract: ['region'],
      keyboardInteractions: [
        {
          keyCombo: 'Tab',
          expectedBehavior: 'Flattens 3D tilt when keyboard focus enters the plane for crisp reading.',
        },
      ],
      reducedMotionStrategy: 'Locks Z-axis tilt and parallax rotation to 0deg under prefers-reduced-motion.',
      responsiveBreakpointStrategy: 'Degrades gracefully to 2D elevation cards on narrow mobile viewports.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Khronos Group (glTF PBR Specification) & W3C CSS Transforms Level 2',
      officialUrl: 'https://www.w3.org/TR/css-transforms-2/',
      licenseType: 'W3C / Khronos Public Specification',
      firstPublishedYear: 2017,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'References W3C CSS Transforms Module Level 2 3D matrix projection and physically based surface lighting principles.',
    },
    relatedResourceSlugs: ['apple-hig-vibrancy-and-spring-ergonomics', 'damped-harmonic-spring-choreography'],
    createdAtIso: '2026-10-25T00:00:00.000Z',
    updatedAtIso: '2026-11-22T00:00:00.000Z',
  },
  {
    id: 'res-mobile-thumb-zone-sheet',
    slug: 'mobile-thumb-zone-ergonomics-and-bottom-sheets',
    title: 'Mobile Thumb-Zone Reachability & Detent Bottom Sheet Architecture',
    classification: 'interactive-component',
    categorySlug: 'mobile-design',
    categorySlugs: [
      'mobile-design',
      'ux-interaction-patterns',
      'responsive-adaptive-design',
      'ui-components',
    ],
    subcategory: 'One-Handed Reachability & Thumb Zones',
    nestedCategoryPath: [
      'Mobile Design',
      'Touch Ergonomics & Reachability',
      'One-Handed Reachability & Thumb Zones',
    ],
    audienceLevel: 'beginner',
    isFeatured: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['Touch Hit Targets (44x44pt)', 'CSS env(safe-area-inset-bottom)', 'Spring Detents'],
    frameworks: ['React', 'CSS Native', 'Tailwind CSS'],
    tags: [
      'mobile-design',
      'thumb-zone',
      'bottom-sheet',
      'touch-targets',
      'ergonomics',
    ],
    summary:
      'Positions primary interactive controls within the natural one-handed thumb arc while utilizing multi-detent bottom sheets and minimum 44x44px hit targets with 8px safety gutters.',
    problemStatement:
      'Placing frequent actions in the top-left corner of tall mobile viewports forces awkward two-handed grip shifts and causes high tap error rates.',
    whenToUse: [
      'Mobile web apps, progressive web applications, and responsive filter drawers',
    ],
    whenToAvoid: [
      'Desktop pointer workspaces where bottom-anchored bars disconnect controls from top toolbars',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'fluid-container-card',
    interactiveParameters: [
      {
        key: 'containerWidthPercent',
        label: 'Simulated Mobile Viewport Width',
        description: 'Test reachability density across compact 36% to wide 90% container widths.',
        controlType: 'range',
        defaultValue: 48,
        min: 32,
        max: 100,
        step: 2,
        unit: '%',
      },
      {
        key: 'breakpointThreshold',
        label: 'Adaptive Bottom-Bar Switch',
        description: 'Threshold below which actions dock into the bottom thumb zone.',
        controlType: 'range',
        defaultValue: 60,
        min: 45,
        max: 80,
        step: 5,
        unit: '%',
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'mobile-thumb-bar.css',
        description: 'Safe-area aware bottom action bar with WCAG 2.5.5 44px minimum target sizing.',
        codeTemplate: `.mobile-bottom-sheet-bar {
  min-height: 44px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  display: flex;
  gap: 8px;
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 8.2,
      ariaRoleContract: ['dialog', 'navigation'],
      keyboardInteractions: [
        {
          keyCombo: 'Escape',
          expectedBehavior: 'Collapses expanded bottom sheet detent back to trigger button.',
        },
      ],
      reducedMotionStrategy: 'Sheet snaps cleanly to detent height without velocity bounce.',
      responsiveBreakpointStrategy: 'Adapts from bottom sheet on < 768px to side popover on desktop.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Steven Hoober (Mobile Touch Ergonomics Research) & W3C WCAG 2.2 Target Size',
      officialUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
      licenseType: 'W3C Document License',
      firstPublishedYear: 2013,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Synthesizes empirical mobile grip research with W3C WCAG 2.2 SC 2.5.5 (Target Size Enhanced 44x44px) and SC 2.5.8.',
    },
    relatedResourceSlugs: ['apple-hig-vibrancy-and-spring-ergonomics', 'css-container-queries-intrinsic-card'],
    createdAtIso: '2026-11-01T00:00:00.000Z',
    updatedAtIso: '2026-11-23T00:00:00.000Z',
  },
  {
    id: 'res-headless-compound-component-pattern',
    slug: 'headless-compound-component-slot-architecture',
    title: 'Headless Compound Components, Polymorphic Slots & Zero-Runtime CSS Tokens',
    classification: 'implementation-pattern',
    categorySlug: 'design-engineering-implementation',
    categorySlugs: [
      'design-engineering-implementation',
      'ui-components',
      'accessibility-inclusive-design',
    ],
    subcategory: 'Compound Components & Slot Composition',
    nestedCategoryPath: [
      'Design Engineering & Implementation',
      'Component API Architecture',
      'Compound Components & Slot Composition',
    ],
    audienceLevel: 'advanced',
    isFeatured: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['React Context Composition', 'WAI-ARIA State Hook', 'TypeScript Discriminated Unions'],
    frameworks: ['React', 'TypeScript', 'Radix Primitives', 'Tailwind CSS'],
    tags: [
      'compound-components',
      'headless-ui',
      'design-engineering',
      'polymorphic-slots',
      'typescript-api',
    ],
    summary:
      'Decouples deterministic WAI-ARIA behavioral state machines and keyboard focus management from visual presentation tokens via composable compound sub-components.',
    problemStatement:
      'Monolithic "prop-apocalypse" UI components with 40+ boolean configuration flags become impossible to style, tree-shake, or extend cleanly.',
    whenToUse: [
      'Building multi-brand design system libraries where behavior is shared but visual skins vary',
    ],
    whenToAvoid: [
      'Static decorative elements with zero interactive state or ARIA relationships',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'accessible-combobox-pattern',
    interactiveParameters: [
      {
        key: 'focusRingWidth',
        label: 'Slot Focus Outline Width',
        description: 'Injected via compound context down to interactive trigger slot.',
        controlType: 'range',
        defaultValue: 2,
        min: 2,
        max: 4,
        step: 1,
        unit: 'px',
      },
      {
        key: 'focusRingOffset',
        label: 'Slot Focus Offset',
        description: 'Focus outline offset.',
        controlType: 'range',
        defaultValue: 2,
        min: 0,
        max: 6,
        step: 1,
        unit: 'px',
      },
      {
        key: 'announceLiveCount',
        label: 'Enable Status Portal Slot',
        description: 'Mounts the optional aria-live announcer sub-component.',
        controlType: 'boolean',
        defaultValue: true,
      },
    ],
    codeTemplates: [
      {
        language: 'tsx',
        filename: 'CompoundDisclosure.tsx',
        description: 'Composable Root / Trigger / Content compound pattern.',
        codeTemplate: `<Disclosure.Root defaultOpen>
  <Disclosure.Trigger className="focus-visible:outline-[{{focusRingWidth}}px]">
    Inspect Specification
  </Disclosure.Trigger>
  <Disclosure.Content>
    Decoupled state machine + zero-runtime CSS token styling.
  </Disclosure.Content>
</Disclosure.Root>`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 9.2,
      ariaRoleContract: ['button', 'region'],
      keyboardInteractions: [
        {
          keyCombo: 'Space / Enter',
          expectedBehavior: 'Toggles aria-expanded on Trigger and aria-hidden on Content slot.',
        },
      ],
      reducedMotionStrategy: 'Content slot mounts immediately without height animation.',
      responsiveBreakpointStrategy: 'Agnostic of layout; adapts to parent container.',
    },
    sourceAttribution: {
      authorOrOrganization: 'OpenUI Community Group & Headless Component Architecture Pattern',
      officialUrl: 'https://open-ui.org/',
      licenseType: 'W3C Community Contributor Agreement',
      firstPublishedYear: 2020,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Follows OpenUI component anatomy research and React compound component composition standards.',
    },
    relatedResourceSlugs: ['wai-aria-combobox-keyboard-pattern', 'material-3-semantic-token-hierarchy'],
    createdAtIso: '2026-11-12T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-w3c-dtcg-token-pipeline',
    slug: 'w3c-design-tokens-ci-cd-pipeline-tooling',
    title: 'W3C Design Tokens (DTCG) Pipeline — Figma Variables to Multi-Platform CSS/TS',
    classification: 'design-tool',
    categorySlug: 'design-operations-tooling',
    categorySlugs: [
      'design-operations-tooling',
      'official-design-systems',
      'design-engineering-implementation',
    ],
    subcategory: 'W3C Design Tokens Format (DTCG)',
    nestedCategoryPath: [
      'Design Operations & Tooling',
      'Design-to-Code Token Pipelines',
      'W3C Design Tokens Format (DTCG)',
    ],
    audienceLevel: 'intermediate',
    isFeatured: true,
    demonstrationFormat: 'visual-specimen',
    publicationStatus: 'published',
    technologies: ['W3C DTCG JSON ($value / $type)', 'Style Dictionary', 'Automated WCAG CI Audit'],
    frameworks: ['CSS Native', 'TypeScript', 'Tailwind CSS'],
    tags: [
      'design-ops',
      'w3c-design-tokens',
      'style-dictionary',
      'figma-variables',
      'governance',
    ],
    summary:
      'Automates the transformation of vendor-neutral W3C Design Tokens ($value, $type, $description) into typed CSS Custom Properties, TypeScript constants, and automated contrast regression tests.',
    problemStatement:
      'Manual copy-pasting of hex codes and spacing values between design tools and production repositories causes silent design drift across releases.',
    whenToUse: [
      'Cross-functional product teams synchronizing design token updates across web and native platforms',
    ],
    whenToAvoid: [
      'Throwaway one-page prototypes with no shared design system',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'token-surface-hierarchy',
    interactiveParameters: [
      {
        key: 'hueAngle',
        label: 'DTCG Source Token ($value.hue)',
        description: 'Simulates updating a source JSON token and compiling downstream CSS variables.',
        controlType: 'range',
        defaultValue: 242,
        min: 0,
        max: 360,
        step: 2,
        unit: 'deg',
      },
      {
        key: 'containerRadius',
        label: 'Compiled Dimension Token',
        description: 'Dimension token ($type: "dimension") compiled to px.',
        controlType: 'range',
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfacePadding',
        label: 'Compiled Spacing Token',
        description: 'Spacing scale token output.',
        controlType: 'range',
        defaultValue: 16,
        min: 8,
        max: 28,
        step: 4,
        unit: 'px',
      },
      {
        key: 'surfaceContrastMode',
        label: 'CI Contrast Gate Target',
        description: 'Verifies automated contrast assertion pass across theme outputs.',
        controlType: 'select',
        defaultValue: 'dark-slate',
        options: [
          { label: 'Light Build Artifact', value: 'light-canvas' },
          { label: 'Dark Build Artifact', value: 'dark-slate' },
          { label: 'High-Contrast AAA Artifact', value: 'high-contrast' },
        ],
      },
    ],
    codeTemplates: [
      {
        language: 'json',
        filename: 'color.tokens.json',
        description: 'W3C Design Tokens Community Group (DTCG) compliant JSON specification.',
        codeTemplate: `{
  "color": {
    "brand": {
      "primary": {
        "$type": "color",
        "$value": "hsl({{hueAngle}} 78% 48%)",
        "$description": "Primary interactive brand token"
      }
    }
  },
  "dimension": {
    "radius": {
      "card": { "$type": "dimension", "$value": "{{containerRadius}}px" }
    }
  }
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 7.8,
      ariaRoleContract: ['region'],
      keyboardInteractions: [
        {
          keyCombo: 'Tab',
          expectedBehavior: 'Navigates token pipeline inspector controls.',
        },
      ],
      reducedMotionStrategy: 'Static compiler preview.',
      responsiveBreakpointStrategy: 'Fluid token table layout.',
    },
    sourceAttribution: {
      authorOrOrganization: 'W3C Design Tokens Community Group (DTCG Format Specification)',
      officialUrl: 'https://tr.designtokens.org/format/',
      licenseType: 'W3C Community Final Specification Agreement',
      firstPublishedYear: 2022,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Adheres to the W3C Design Tokens Community Group (DTCG) file format specification ($type, $value, $description).',
    },
    relatedResourceSlugs: ['material-3-semantic-token-hierarchy', 'ibm-carbon-2x-grid-and-layer-tokens'],
    createdAtIso: '2026-11-05T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'res-gestalt-visual-hierarchy-methodology',
    slug: 'gestalt-proximity-and-figure-ground-methodology',
    title: 'Gestalt Perceptual Grouping, Law of Proximity & Figure-Ground Hierarchy',
    classification: 'design-methodology',
    categorySlug: 'design-fundamentals',
    categorySlugs: [
      'design-fundamentals',
      'layout-grid-systems',
      'ux-interaction-patterns',
    ],
    subcategory: 'Proximity, Similarity & Common Region',
    nestedCategoryPath: [
      'Design Fundamentals',
      'Perceptual Psychology & Gestalt Laws',
      'Proximity, Similarity & Common Region',
    ],
    audienceLevel: 'beginner',
    isFeatured: true,
    demonstrationFormat: 'runnable-code-demo',
    publicationStatus: 'published',
    technologies: ['Spatial Grouping Ratio', 'Whitespace Cadence', 'Luminance Figure-Ground'],
    frameworks: ['CSS Native', 'Design Theory'],
    tags: [
      'gestalt-psychology',
      'law-of-proximity',
      'visual-hierarchy',
      'design-fundamentals',
      'whitespace',
    ],
    summary:
      'Demonstrates how human visual perception automatically groups interface elements when intra-group spacing is strictly smaller than inter-group spacing (d_inner <= 0.5 * d_outer)—reducing reliance on heavy divider lines.',
    problemStatement:
      'When margins above and below headings or between cards are uniform, users cannot tell which label belongs to which content block without adding noisy borders everywhere.',
    whenToUse: [
      'Every digital interface: form field grouping, editorial section rhythm, and dashboard metric clusters',
    ],
    whenToAvoid: [
      'Never avoided—Gestalt grouping is a universal law of human visual perception',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'swiss-typographic-grid',
    interactiveParameters: [
      {
        key: 'gridColumns',
        label: 'Perceptual Cluster Columns',
        description: 'Number of visual clusters across the horizontal plane.',
        controlType: 'range',
        defaultValue: 3,
        min: 2,
        max: 6,
        step: 1,
        unit: 'cols',
      },
      {
        key: 'gridGap',
        label: 'Inter-Group Separation (d_outer)',
        description: 'Increase outer gap relative to inner padding to strengthen Gestalt proximity.',
        controlType: 'range',
        defaultValue: 24,
        min: 8,
        max: 32,
        step: 4,
        unit: 'px',
      },
      {
        key: 'headlineScale',
        label: 'Focal Point Scale Contrast',
        description: 'Dominant figure scale over subordinate ground captions.',
        controlType: 'range',
        defaultValue: 26,
        min: 18,
        max: 38,
        step: 2,
        unit: 'px',
      },
      {
        key: 'showGridOverlay',
        label: 'Highlight Common Region Boundaries',
        description: 'Reveals underlying structural enclosures.',
        controlType: 'boolean',
        defaultValue: true,
      },
    ],
    codeTemplates: [
      {
        language: 'css',
        filename: 'gestalt-proximity.css',
        description: 'Enforces d_inner < 0.5 * d_outer for unambiguous perceptual grouping.',
        codeTemplate: `.cluster-grid {
  display: grid;
  grid-template-columns: repeat({{gridColumns}}, minmax(0, 1fr));
  gap: {{gridGap}}px; /* Outer inter-group distance */
}

.cluster-item {
  display: flex;
  flex-direction: column;
  gap: calc({{gridGap}}px * 0.35); /* Inner intra-group distance */
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AAA',
      minContrastRatio: 11.2,
      ariaRoleContract: ['region', 'article'],
      keyboardInteractions: [
        {
          keyCombo: 'Tab',
          expectedBehavior: 'Focus traversal order mirrors perceptual visual grouping.',
        },
      ],
      reducedMotionStrategy: 'Static layout methodology.',
      responsiveBreakpointStrategy: 'Preserves inner-to-outer spacing ratio across all breakpoints.',
    },
    sourceAttribution: {
      authorOrOrganization: 'Max Wertheimer & Kurt Koffka (Berlin School of Gestalt Psychology)',
      officialUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      licenseType: 'Historical Scientific Canon',
      firstPublishedYear: 1923,
      verificationStandard: 'historical-canon',
      attributionNote:
        'Based on Max Wertheimer’s 1923 paper "Untersuchungen zur Lehre von der Gestalt II" and WCAG 1.3.1 Info and Relationships.',
    },
    relatedResourceSlugs: ['swiss-modular-typographic-grid', 'ibm-carbon-2x-grid-and-layer-tokens'],
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'res-draft-webgpu-compute-particles',
    slug: 'webgpu-compute-shader-ui-field-draft',
    title: 'WebGPU Compute Shader Force-Fields & Sub-Millisecond UI Particle Telegraphy',
    classification: 'development-technology',
    categorySlug: '3d-immersive-experiences',
    categorySlugs: [
      '3d-immersive-experiences',
      'advanced-motion',
      'design-engineering-implementation',
    ],
    subcategory: 'WebGL & WebGPU Pipelines',
    nestedCategoryPath: [
      '3D & Immersive Experiences',
      'WebGL & WebGPU Pipelines',
      'GLSL / WGSL Fragment & Vertex Shaders',
    ],
    audienceLevel: 'advanced',
    isFeatured: false,
    demonstrationFormat: 'visual-specimen',
    publicationStatus: 'draft-preview',
    technologies: ['W3C WebGPU API', 'WGSL Compute Shaders', 'Storage Buffers'],
    frameworks: ['WebGPU Native', 'TypeScript'],
    tags: [
      'webgpu',
      'wgsl-shaders',
      'compute-pipeline',
      'upcoming-monograph',
    ],
    summary:
      'Upcoming editorial monograph examining zero-copy GPU storage buffers and WGSL compute shaders for interactive spatial telemetry fields with automatic 2D Canvas reduced-motion fallback.',
    problemStatement:
      'CPU-bound JavaScript particle loops bottleneck main-thread responsiveness above 2,000 nodes.',
    whenToUse: [
      'High-density scientific simulations, node-graph force layout solvers, and spatial data canvases',
    ],
    whenToAvoid: [
      'Standard document interfaces where CSS or SVG handles motion with lower power draw',
    ],
    executionMode: 'parameterized-token-stage',
    demoArchetype: 'token-surface-hierarchy',
    interactiveParameters: [
      {
        key: 'hueAngle',
        label: 'Field Spectrum Hue',
        description: 'Preview parameter while WGSL sandbox monograph undergoes final WCAG verification.',
        controlType: 'range',
        defaultValue: 195,
        min: 0,
        max: 360,
        step: 5,
        unit: 'deg',
      },
      {
        key: 'containerRadius',
        label: 'Viewport Frame Radius',
        description: 'Canvas container radius.',
        controlType: 'range',
        defaultValue: 12,
        min: 0,
        max: 24,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfacePadding',
        label: 'Frame Inset',
        description: 'Canvas inset padding.',
        controlType: 'range',
        defaultValue: 16,
        min: 8,
        max: 28,
        step: 2,
        unit: 'px',
      },
      {
        key: 'surfaceContrastMode',
        label: 'Fallback Polarity',
        description: 'Canvas background polarity.',
        controlType: 'select',
        defaultValue: 'dark-slate',
        options: [
          { label: 'Light Canvas', value: 'light-canvas' },
          { label: 'Dark Slate', value: 'dark-slate' },
          { label: 'High Contrast', value: 'high-contrast' },
        ],
      },
    ],
    codeTemplates: [
      {
        language: 'ts',
        filename: 'webgpu-compute.wgsl.ts',
        description: 'WGSL compute shader kernel workgroup declaration.',
        codeTemplate: `@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  // Upcoming WGSL compute monograph (Draft Preview)
}`,
      },
    ],
    accessibilitySpec: {
      wcagComplianceLevel: 'AA',
      minContrastRatio: 7.0,
      ariaRoleContract: ['img', 'region'],
      keyboardInteractions: [
        {
          keyCombo: 'Space',
          expectedBehavior: 'Pauses GPU compute loop immediately.',
        },
      ],
      reducedMotionStrategy: 'Renders static analytical contour frame without continuous GPU tick.',
      responsiveBreakpointStrategy: 'Scales devicePixelRatio dynamically based on thermal budget.',
    },
    sourceAttribution: {
      authorOrOrganization: 'W3C GPU for the Web Working Group (WebGPU & WGSL Specification)',
      officialUrl: '',
      licenseType: 'W3C Candidate Recommendation Draft',
      firstPublishedYear: 2023,
      verificationStandard: 'w3c-standard',
      attributionNote:
        'Currently in editorial verification queue; external candidate specification link archived locally.',
      hasMissingExternalReference: true,
    },
    simulateBrokenMedia: true,
    relatedResourceSlugs: ['pbr-spatial-surfaces-and-perspective-depth', 'damped-harmonic-spring-choreography'],
    createdAtIso: '2026-11-23T00:00:00.000Z',
    updatedAtIso: '2026-11-24T00:00:00.000Z',
  },
];

export const ARCHITECTURAL_LAYERS: ArchitecturalLayerSpec[] = [
  {
    id: 'layer-shell',
    order: '01',
    layerName: 'Application Shell & Brand Configurator',
    directoryPath: '/config/brand.config.ts · /components/shell/*',
    responsibility:
      'Decouples product branding, global navigation mega-menu, theme polarity (Light/Dark), and user collection drawer from core encyclopedia logic.',
    keyEntitiesOrFiles: ['BRAND_CONFIG', 'AppHeader.tsx', 'AppFooter.tsx'],
    scalabilityGuarantee:
      'Allows instant rebranding from temporary product name ("Digital Design Encyclopedia") to permanent brand identity via a single configuration file.',
  },
  {
    id: 'layer-taxonomy',
    order: '02',
    layerName: 'Extensible 16-Category & 12-Classification Taxonomy Engine',
    directoryPath: '/types/encyclopedia.ts · /lib/taxonomy/registry.ts',
    responsibility:
      'Enforces strict typing, unlimited multi-level subcategory nesting, and verification criteria across 16 primary categories and 12 canonical resource types.',
    keyEntitiesOrFiles: ['ResourceClassification', 'TAXONOMY_CATEGORIES', 'TaxonomySubcategoryNode'],
    scalabilityGuarantee:
      'New categories, deep depth-N parent-child taxonomy nodes, and multi-category resources can be added dynamically without altering UI rendering components.',
  },
  {
    id: 'layer-sandbox',
    order: '03',
    layerName: 'Multi-Tier Live-Demo Execution Engine',
    directoryPath: '/lib/sandbox/execution-engine.ts · /components/workbench/InteractiveConceptLab.tsx',
    responsibility:
      'Executes real-time parameter manipulation via zero-latency CSS Custom Properties, deterministic code template interpolation, and CSP-locked sandboxed iframes.',
    keyEntitiesOrFiles: ['interpolateCodeTemplate()', 'buildSandboxedIframeSrcDoc()'],
    scalabilityGuarantee:
      'Eliminates server-side code execution vulnerabilities while running interactive demonstrations at 60fps.',
  },
  {
    id: 'layer-accessibility',
    order: '04',
    layerName: 'Accessibility, Reduced-Motion & Contrast Telemetry',
    directoryPath: '/app/globals.css · /types/encyclopedia.ts (AccessibilityAuditSpec)',
    responsibility:
      'Embeds WCAG AA/AAA contrast audits, WAI-ARIA role contracts, keyboard interaction matrices, and prefers-reduced-motion simulation into every published concept.',
    keyEntitiesOrFiles: ['AccessibilityAuditSpec', 'simulateReducedMotion'],
    scalabilityGuarantee:
      'Guarantees that animation and visual experimentation never degrade assistive technology or keyboard usability.',
  },
  {
    id: 'layer-persistence',
    order: '05',
    layerName: 'Personal Collections & Preset Storage Adapter',
    directoryPath: '/lib/collections/storage-adapter.ts',
    responsibility:
      'Provides a unified TypeScript repository interface for bookmarking concepts and saving custom parameter presets locally now, with seamless Firebase Firestore sync.',
    keyEntitiesOrFiles: ['PersonalCollection', 'SavedParameterPreset'],
    scalabilityGuarantee:
      'Zero breaking changes to UI components when transitioning from local browser persistence to authenticated cloud Firestore documents.',
  },
];

export function getResourceBySlug(slug: string): DesignResource | undefined {
  return FOUNDATION_RESOURCES.find((resource) => resource.slug === slug);
}
