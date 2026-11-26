import {
  DesignResource,
  ResourceClassification,
  TaxonomyCategory,
  TaxonomySubcategoryNode,
} from '@/types/encyclopedia';

export interface ClassificationDescriptor {
  id: ResourceClassification;
  classification: ResourceClassification;
  label: string;
  pluralLabel: string;
  canonicalDefinition: string;
  verificationRequirement: string;
}

/**
 * All 12 Canonical Resource Types required by Section 6 (+ Community Examples).
 */
export const CLASSIFICATION_DESCRIPTORS_MAP: Record<
  ResourceClassification,
  ClassificationDescriptor
> = {
  'official-design-system': {
    id: 'official-design-system',
    classification: 'official-design-system',
    label: 'Official Design System',
    pluralLabel: 'Official Design Systems',
    canonicalDefinition:
      'Production-maintained, publicly documented multi-platform design languages created by verified organizations.',
    verificationRequirement:
      'Must link directly to official specification documentation and state accurate organization authorship and license terms.',
  },
  'visual-style': {
    id: 'visual-style',
    classification: 'visual-style',
    label: 'Visual Design Style',
    pluralLabel: 'Visual Design Styles',
    canonicalDefinition:
      'Distinctive visual languages defined by typographic proportions, surface treatments, border weights, and color contrast rules.',
    verificationRequirement:
      'Must provide objective visual parameters (contrast delta, border radius, shadow elevation) rather than subjective adjectives.',
  },
  'interaction-pattern': {
    id: 'interaction-pattern',
    classification: 'interaction-pattern',
    label: 'UI Pattern & UX Flow',
    pluralLabel: 'UI Patterns & UX Flows',
    canonicalDefinition:
      'Repeatable behavioral solutions to user interface tasks, state transitions, navigation flows, and feedback loops.',
    verificationRequirement:
      'Must document keyboard navigation bindings, focus management, and error/empty state handling.',
  },
  'ui-pattern': {
    id: 'ui-pattern',
    classification: 'ui-pattern',
    label: 'UI Pattern',
    pluralLabel: 'UI Patterns',
    canonicalDefinition:
      'Repeatable behavioral solutions to user interface tasks, command palettes, state transitions, and wayfinding flows.',
    verificationRequirement:
      'Must document keyboard navigation bindings, focus management, and error/empty state handling.',
  },
  'animation-technique': {
    id: 'animation-technique',
    classification: 'animation-technique',
    label: 'Motion Technique',
    pluralLabel: 'Motion Techniques',
    canonicalDefinition:
      'Mathematical choreographies, spring dynamics, layout projections (FLIP), and temporal easing curves.',
    verificationRequirement:
      'Must enforce compositor-only performance budgets and specify explicit prefers-reduced-motion behavior.',
  },
  'ui-component': {
    id: 'ui-component',
    classification: 'ui-component',
    label: 'Interactive Component',
    pluralLabel: 'Interactive Components',
    canonicalDefinition:
      'Modular, accessible interface building blocks implementing WAI-ARIA Authoring Practices and semantic HTML contracts.',
    verificationRequirement:
      'Must validate against W3C WAI-ARIA role, state, and keyboard interaction specifications.',
  },
  'interactive-component': {
    id: 'interactive-component',
    classification: 'interactive-component',
    label: 'Interactive Component',
    pluralLabel: 'Interactive Components (Ergonomic)',
    canonicalDefinition:
      'Touch-ergonomic and keyboard-accessible interface building blocks implementing WAI-ARIA and target-size contracts.',
    verificationRequirement:
      'Must validate against W3C WAI-ARIA role, state, and WCAG 2.2 target size specifications.',
  },
  'layout-technique': {
    id: 'layout-technique',
    classification: 'layout-technique',
    label: 'Layout Technique',
    pluralLabel: 'Layout Techniques',
    canonicalDefinition:
      'Spatial grid architectures, bento ratios, asymmetric hanglines, and responsive container compositions.',
    verificationRequirement:
      'Must specify column math, gutter rhythm, and multi-breakpoint reflow behavior.',
  },
  'typography-system': {
    id: 'typography-system',
    classification: 'typography-system',
    label: 'Typography System',
    pluralLabel: 'Typography Systems',
    canonicalDefinition:
      'Fluid type scales, variable font axes, modular harmonic ratios, and readable measure discipline.',
    verificationRequirement:
      'Must define fluid clamp() equations, line-height rhythm, and character-per-line (ch) measure bounds.',
  },
  'color-system': {
    id: 'color-system',
    classification: 'color-system',
    label: 'Color System',
    pluralLabel: 'Color Systems',
    canonicalDefinition:
      'Perceptually uniform color spaces (OKLCH/HSL), 60-30-10 surface polarity distributions, and accessible status tokens.',
    verificationRequirement:
      'Must verify WCAG 2.1 AA/AAA luminance contrast ratios across both Light and Dark polarities.',
  },
  'implementation-pattern': {
    id: 'implementation-pattern',
    classification: 'implementation-pattern',
    label: 'Implementation Pattern',
    pluralLabel: 'Implementation Patterns',
    canonicalDefinition:
      'Production frontend architecture patterns bridging design specifications and maintainable component code.',
    verificationRequirement:
      'Must include runnable, type-safe implementation templates with zero hardcoded magic values.',
  },
  'development-technology': {
    id: 'development-technology',
    classification: 'development-technology',
    label: 'Development Technology',
    pluralLabel: 'Development Technologies',
    canonicalDefinition:
      'Web platform primitives (CSS specifications, DOM APIs, rendering pipelines) that power modern design implementations.',
    verificationRequirement:
      'Must link to W3C / WHATWG / MDN specifications and document browser support baselines.',
  },
  'design-tool': {
    id: 'design-tool',
    classification: 'design-tool',
    label: 'Design Tool & Operations',
    pluralLabel: 'Design Tools',
    canonicalDefinition:
      'Token compilers, accessibility linters, specification formats, and design-to-code governance workflows.',
    verificationRequirement:
      'Must adhere to open W3C Design Tokens Community Group (DTCG) or standard CI/CD audit schemas.',
  },
  'design-methodology': {
    id: 'design-methodology',
    classification: 'design-methodology',
    label: 'Design Methodology',
    pluralLabel: 'Design Methodologies',
    canonicalDefinition:
      'Systematic architectural frameworks for structuring design principles, component hierarchies, or spatial composition.',
    verificationRequirement:
      'Must cite the original creator, publication era, and foundational structural axioms.',
  },
  'community-example': {
    id: 'community-example',
    classification: 'community-example',
    label: 'Community Example',
    pluralLabel: 'Community Examples',
    canonicalDefinition:
      'Open-source experimental demonstrations and creative coding studies contributed with explicit license attribution.',
    verificationRequirement:
      'Must clearly identify community authorship and open-source license without claiming official endorsement.',
  },
};

export const CLASSIFICATION_DESCRIPTORS: ClassificationDescriptor[] = [
  CLASSIFICATION_DESCRIPTORS_MAP['official-design-system'],
  CLASSIFICATION_DESCRIPTORS_MAP['visual-style'],
  CLASSIFICATION_DESCRIPTORS_MAP['ui-pattern'],
  CLASSIFICATION_DESCRIPTORS_MAP['animation-technique'],
  CLASSIFICATION_DESCRIPTORS_MAP['ui-component'],
  CLASSIFICATION_DESCRIPTORS_MAP['layout-technique'],
  CLASSIFICATION_DESCRIPTORS_MAP['typography-system'],
  CLASSIFICATION_DESCRIPTORS_MAP['color-system'],
  CLASSIFICATION_DESCRIPTORS_MAP['implementation-pattern'],
  CLASSIFICATION_DESCRIPTORS_MAP['development-technology'],
  CLASSIFICATION_DESCRIPTORS_MAP['design-tool'],
  CLASSIFICATION_DESCRIPTORS_MAP['design-methodology'],
];

function slugifyNode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildTreeFromList(
  parentSlug: string,
  items: {
    name: string;
    description?: string;
    children?: {
      name: string;
      description?: string;
      children?: { name: string; description?: string }[];
    }[];
  }[]
): TaxonomySubcategoryNode[] {
  return items.map((item) => {
    const slug = `${parentSlug}--${slugifyNode(item.name)}`;
    return {
      id: `node-${slug}`,
      slug,
      name: item.name,
      description: item.description,
      depth: 2,
      parentSlug,
      children: item.children?.map((child) => {
        const childSlug = `${slug}--${slugifyNode(child.name)}`;
        return {
          id: `node-${childSlug}`,
          slug: childSlug,
          name: child.name,
          description: child.description,
          depth: 3,
          parentSlug: slug,
          children: child.children?.map((grandChild) => {
            const grandSlug = `${childSlug}--${slugifyNode(grandChild.name)}`;
            return {
              id: `node-${grandSlug}`,
              slug: grandSlug,
              name: grandChild.name,
              description: grandChild.description,
              depth: 4,
              parentSlug: childSlug,
            };
          }),
        };
      }),
    };
  });
}

/**
 * The 16 Primary Categories required by Section 1 & Section 2.
 * Supports unlimited nested hierarchy depth via subcategoryTree.
 */
export const TAXONOMY_CATEGORIES: TaxonomyCategory[] = [
  {
    id: 'cat-01-design-fundamentals',
    slug: 'design-fundamentals',
    name: 'Design Fundamentals',
    classification: 'design-methodology',
    shortDescription:
      'First principles of visual perception, Gestalt grouping laws, spatial hierarchy, figure-ground tension, and cognitive load reduction.',
    overview:
      'Design Fundamentals establishes the perceptual and mathematical axioms upon which every digital interface rests—bridging human visual cognition, Gestalt psychology, proportional scale, and structural hierarchy.',
    architecturalScope: 'Gestalt Grouping · Visual Weight · Spatial Tension · Figure-Ground',
    subcategories: [
      'Visual Hierarchy',
      'Gestalt Principles',
      'Balance & Proportion',
      'Contrast & Scale',
      'Cognitive Load & Hick’s Law',
      'Fitts’s Law & Target Ergonomics',
      'White Space & Negative Field',
      'Affordances & Signifiers',
    ],
    subcategoryTree: buildTreeFromList('design-fundamentals', [
      {
        name: 'Visual Hierarchy',
        description: 'Directing ocular scanning paths via size, contrast, and spatial isolation.',
        children: [
          {
            name: 'Focal Anchor Discipline',
            description: 'Establishing a single dominant visual anchor per viewport frame.',
            children: [
              {
                name: 'Primary vs Secondary Weight Ratios',
                description: 'Quantifying luminance and scale deltas between primary CTAs and supporting prose.',
              },
            ],
          },
          { name: 'F-Pattern & Z-Pattern Scanning' },
        ],
      },
      {
        name: 'Gestalt Principles',
        description: 'Proximity, similarity, continuity, closure, and common region in UI layout.',
        children: [
          { name: 'Law of Proximity in Whitespace Grouping' },
          { name: 'Law of Common Region vs Hairline Borders' },
        ],
      },
      { name: 'Balance & Proportion' },
      { name: 'Contrast & Scale' },
      { name: 'Cognitive Load & Hick’s Law' },
      { name: 'Fitts’s Law & Target Ergonomics' },
      { name: 'White Space & Negative Field' },
      { name: 'Affordances & Signifiers' },
    ]),
    tags: ['First Principles', 'Gestalt', 'Visual Weight', 'Ergonomics', 'Hierarchy'],
    featuredResourceSlugs: ['gestalt-proximity-and-spatial-grouping', 'swiss-modular-typographic-grid'],
    relatedCategorySlugs: ['layout-grid-systems', 'typography-systems', 'color-systems'],
    technologyAssociations: ['CSS Box Model', 'CSS Grid', 'Semantic HTML5'],
    featuredVisualMotif: 'gestalt-proximity-matrix',
    parentSlug: null,
    orderIndex: 1,
  },
  {
    id: 'cat-02-official-design-systems',
    slug: 'official-design-systems',
    legacyAliases: ['design-systems'],
    name: 'Official Design Systems',
    classification: 'official-design-system',
    shortDescription:
      'Production-maintained enterprise design languages, multi-tier semantic token architectures, and cross-platform component specifications.',
    overview:
      'An authoritative comparative study of publicly documented enterprise and platform design systems—examining how Google Material Design 3, IBM Carbon, Apple HIG, and open-source systems structure semantic tokens, theming polarities, and accessibility governance.',
    architecturalScope: 'Reference -> System -> Component Tokens · Multi-Brand Governance',
    subcategories: [
      'Material Design 3 (Google)',
      'Human Interface Guidelines (Apple)',
      'Carbon Design System (IBM)',
      'Fluent 2 (Microsoft)',
      'Spectrum (Adobe)',
      'Polaris (Shopify)',
      'Atlassian Design System',
      'Primer (GitHub)',
      'Lightning (Salesforce)',
    ],
    subcategoryTree: buildTreeFromList('official-design-systems', [
      {
        name: 'Material Design 3 (Google)',
        description: 'Dynamic tonal color roles and three-tier token hierarchy.',
        children: [
          {
            name: 'Three-Tier Token Architecture',
            children: [
              { name: 'Reference Seed Palettes' },
              { name: 'System Semantic Surface Roles' },
              { name: 'Component-Scoped Tokens' },
            ],
          },
          { name: 'Surface Tonal Elevation' },
        ],
      },
      {
        name: 'Carbon Design System (IBM)',
        description: 'Enterprise 2x grid and contextual $layer-01 / $layer-02 stacking.',
        children: [
          { name: '2x Mini-Unit Spatial Grid' },
          { name: 'Contextual Layer Luminance' },
        ],
      },
      { name: 'Human Interface Guidelines (Apple)' },
      { name: 'Fluent 2 (Microsoft)' },
      { name: 'Spectrum (Adobe)' },
      { name: 'Polaris (Shopify)' },
      { name: 'Atlassian Design System' },
      { name: 'Primer (GitHub)' },
    ]),
    tags: ['Design Tokens', 'Enterprise Systems', 'Material 3', 'IBM Carbon', 'Apple HIG'],
    featuredResourceSlugs: [
      'material-3-semantic-token-hierarchy',
      'ibm-carbon-2x-grid-and-layer-tokens',
      'apple-hig-vibrancy-and-spring-ergonomics',
    ],
    relatedCategorySlugs: ['design-operations-tooling', 'color-systems', 'ui-components'],
    technologyAssociations: ['W3C Design Tokens JSON', 'CSS Custom Properties', 'Style Dictionary'],
    featuredVisualMotif: 'token-tier-cascade',
    parentSlug: null,
    orderIndex: 2,
  },
  {
    id: 'cat-03-visual-design-styles',
    slug: 'visual-design-styles',
    legacyAliases: ['visual-aesthetics'],
    name: 'Visual Design Styles',
    classification: 'visual-style',
    shortDescription:
      'Comparative surface physics, historical design movements, and digital aesthetics from Swiss International Style to Neo-Brutalism.',
    overview:
      'Visual Design Styles codifies aesthetic movements into measurable engineering parameters—analyzing border thicknesses, shadow blur radii, surface contrast deltas, and typographic proportions.',
    architecturalScope: 'Surface Contrast · Border Weight · Shadow Physics · Historical Movements',
    subcategories: [
      'Minimalism',
      'Maximalism',
      'Brutalism',
      'Neo-brutalism',
      'Glassmorphism',
      'Neumorphism',
      'Skeuomorphism',
      'Claymorphism',
      'Flat design',
      'Material-inspired styles',
      'Swiss International Style',
      'Bauhaus',
      'Editorial design',
      'Retro-futurism',
      'Y2K',
      'Experimental typography',
    ],
    subcategoryTree: buildTreeFromList('visual-design-styles', [
      {
        name: 'Swiss International Style',
        description: 'Objective asymmetric grid layouts and stark sans-serif hierarchy.',
        children: [
          {
            name: 'Zürich Modular Grid School',
            children: [{ name: 'Mathematical Column Ratios & Hanglines' }],
          },
          { name: 'Basel Typographic Tension' },
        ],
      },
      {
        name: 'Neo-brutalism',
        description: 'Exposed 2px–3px solid ink borders and 0px-blur geometric offset shadows.',
        children: [
          { name: 'Hard-Edge Offset Surfaces' },
          { name: 'High-Chroma Structural Containers' },
        ],
      },
      { name: 'Minimalism' },
      { name: 'Maximalism' },
      { name: 'Brutalism' },
      { name: 'Glassmorphism' },
      { name: 'Neumorphism' },
      { name: 'Skeuomorphism' },
      { name: 'Claymorphism' },
      { name: 'Flat design' },
      { name: 'Material-inspired styles' },
      { name: 'Bauhaus' },
      { name: 'Editorial design' },
      { name: 'Retro-futurism' },
      { name: 'Y2K' },
      { name: 'Experimental typography' },
    ]),
    tags: ['Swiss Style', 'Neo-Brutalism', 'Bauhaus', 'Editorial', 'Surface Physics'],
    featuredResourceSlugs: ['high-contrast-neobrutalist-surface', 'swiss-modular-typographic-grid'],
    relatedCategorySlugs: ['design-fundamentals', 'typography-systems', 'color-systems'],
    technologyAssociations: ['CSS Box-Shadow', 'Backdrop-Filter', 'CSS Borders & Filters'],
    featuredVisualMotif: 'aesthetic-surface-comparator',
    parentSlug: null,
    orderIndex: 3,
  },
  {
    id: 'cat-04-layout-grid-systems',
    slug: 'layout-grid-systems',
    legacyAliases: ['grid-methodologies'],
    name: 'Layout & Grid Systems',
    classification: 'layout-technique',
    shortDescription:
      'Modular grids, asymmetric bento compositions, split-screen workspaces, and intrinsic responsive grid architectures.',
    overview:
      'Layout & Grid Systems explores mathematical spatial partitioning—from classical 12-column editorial grids and Swiss hanglines to modern CSS Grid bento matrices and multi-pane dashboard shells.',
    architecturalScope: 'Modular Columns · Bento Matrices · Split Workspaces · Subgrid',
    subcategories: [
      'Modular grids',
      'Bento layouts',
      'Masonry layouts',
      'Asymmetric layouts',
      'Split screens',
      'Editorial layouts',
      'Full-screen compositions',
      'Dashboard layouts',
      'Responsive grid systems',
    ],
    subcategoryTree: buildTreeFromList('layout-grid-systems', [
      {
        name: 'Modular grids',
        description: 'Equal horizontal and vertical divisions creating deterministic spatial zones.',
        children: [
          {
            name: 'Swiss Hangline Grids',
            children: [{ name: 'Asymmetric Column Spanning (1:2 / 1:3)' }],
          },
          { name: '8px / 2x Baseline Rhythm' },
        ],
      },
      {
        name: 'Bento layouts',
        description: 'Compartmentalized rectangular cells with proportional span hierarchy.',
        children: [
          { name: 'Asymmetric Bento Span Matrices' },
          { name: 'Intrinsic Responsive Bento Reflow' },
        ],
      },
      { name: 'Masonry layouts' },
      { name: 'Asymmetric layouts' },
      { name: 'Split screens' },
      { name: 'Editorial layouts' },
      { name: 'Full-screen compositions' },
      { name: 'Dashboard layouts' },
      { name: 'Responsive grid systems' },
    ]),
    tags: ['CSS Grid', 'Bento Grid', 'Modular Grid', 'Split Screen', 'Subgrid'],
    featuredResourceSlugs: ['swiss-modular-typographic-grid', 'asymmetric-bento-grid-architecture'],
    relatedCategorySlugs: ['responsive-adaptive-design', 'design-fundamentals', 'visual-design-styles'],
    technologyAssociations: ['CSS Grid Layout Level 2', 'CSS Subgrid', 'CSS Flexbox'],
    featuredVisualMotif: 'modular-grid-tracks',
    parentSlug: null,
    orderIndex: 4,
  },
  {
    id: 'cat-05-typography-systems',
    slug: 'typography-systems',
    name: 'Typography Systems',
    classification: 'typography-system',
    shortDescription:
      'Fluid clamp() scales, variable font axes, modular harmonic ratios, kinetic type, and tabular numeral alignment.',
    overview:
      'Typography Systems governs legibility, voice, and scannability—providing mathematical formulas for fluid viewport scaling, variable font interpolation, measure containment (60ch–75ch), and tabular numeric alignment.',
    architecturalScope: 'Fluid clamp() · Variable Axes · Modular Scales · Tabular Numerals',
    subcategories: [
      'Fluid typography',
      'Variable typography',
      'Modular scales',
      'Kinetic typography',
      'Editorial typography',
      'Typographic hierarchy',
      'Responsive typography',
      'Display typography',
    ],
    subcategoryTree: buildTreeFromList('typography-systems', [
      {
        name: 'Fluid typography',
        description: 'Continuous interpolation between minimum and maximum viewport widths.',
        children: [
          {
            name: 'CSS clamp() Linear Slope Equations',
            children: [{ name: 'WCAG 1.4.4 200% Zoom Compliance' }],
          },
          { name: 'Container-Query Relative Type (cqi)' },
        ],
      },
      {
        name: 'Variable typography',
        description: 'Dynamic manipulation of weight (wght), width (wdth), and optical size (opsz).',
        children: [{ name: 'Dark Mode Optical Weight Compensation' }],
      },
      { name: 'Modular scales' },
      { name: 'Kinetic typography' },
      { name: 'Editorial typography' },
      { name: 'Typographic hierarchy' },
      { name: 'Responsive typography' },
      { name: 'Display typography' },
    ]),
    tags: ['Fluid Type', 'Variable Fonts', 'Modular Scale', 'Tabular Numerals', 'Measure'],
    featuredResourceSlugs: ['fluid-clamp-modular-type-scale', 'swiss-modular-typographic-grid'],
    relatedCategorySlugs: ['design-fundamentals', 'layout-grid-systems', 'accessibility-inclusive-design'],
    technologyAssociations: ['CSS clamp()', 'OpenType Variable Fonts', 'font-variant-numeric'],
    featuredVisualMotif: 'fluid-type-curve',
    parentSlug: null,
    orderIndex: 5,
  },
  {
    id: 'cat-06-color-systems',
    slug: 'color-systems',
    legacyAliases: ['color-perception'],
    name: 'Color Systems',
    classification: 'color-system',
    shortDescription:
      'Perceptually uniform OKLCH palettes, 60-30-10 surface distribution, dual-polarity dark mode optics, and semantic status tokens.',
    overview:
      'Color Systems bridges human color perception and systematic token engineering—preventing split-brain dark mode failures and hue-only state signaling while guaranteeing WCAG AA/AAA luminance contrast.',
    architecturalScope: '60-30-10 Budget · OKLCH Uniformity · Dual-Theme Polarity · Contrast Math',
    subcategories: [
      'Perceptual Color Spaces (OKLCH / LCH)',
      'Semantic Color Tokens',
      '60-30-10 Surface Distribution',
      'Dark Mode Optical Compensation',
      'Accessible Status & Semantic Palettes',
      'Tonal Surface Elevation',
      'High-Contrast Mode Adaptation',
      'Color-Blind Safe Dual Coding',
    ],
    subcategoryTree: buildTreeFromList('color-systems', [
      {
        name: 'Perceptual Color Spaces (OKLCH / LCH)',
        description: 'Predictable lightness and chroma steps across hue rotations.',
        children: [
          {
            name: 'Constant Perceived Luminance',
            children: [{ name: 'Automated Contrast Ratio Guarantees' }],
          },
        ],
      },
      { name: 'Semantic Color Tokens' },
      { name: '60-30-10 Surface Distribution' },
      { name: 'Dark Mode Optical Compensation' },
      { name: 'Accessible Status & Semantic Palettes' },
      { name: 'Tonal Surface Elevation' },
      { name: 'High-Contrast Mode Adaptation' },
      { name: 'Color-Blind Safe Dual Coding' },
    ]),
    tags: ['OKLCH', 'Semantic Tokens', 'Dark Mode', 'WCAG Contrast', '60-30-10 Rule'],
    featuredResourceSlugs: ['material-3-semantic-token-hierarchy', 'oklch-perceptual-color-token-engine'],
    relatedCategorySlugs: ['official-design-systems', 'accessibility-inclusive-design', 'design-operations-tooling'],
    technologyAssociations: ['CSS Color Module Level 4', 'OKLCH / HSL', 'CSS Custom Properties'],
    featuredVisualMotif: 'oklch-luminance-spectrum',
    parentSlug: null,
    orderIndex: 6,
  },
  {
    id: 'cat-07-ui-components',
    slug: 'ui-components',
    legacyAliases: ['accessible-primitives'],
    name: 'UI Components',
    classification: 'ui-component',
    shortDescription:
      'Accessible interface primitives—buttons, comboboxes, modal dialogs, tabs, data tables, and toast notification regions.',
    overview:
      'UI Components catalogs production-grade interactive building blocks engineered with deterministic WAI-ARIA role contracts, roving tabindex focus management, and complete interactive states (hover, focus-visible, active, loading, disabled).',
    architecturalScope: 'WAI-ARIA Widgets · Focus Traps · Roving Tabindex · State Completeness',
    subcategories: [
      'Combobox & Autocomplete',
      'Modal Dialogs & Sheets',
      'Tabs & Segmented Controls',
      'Buttons & Tactile Triggers',
      'Accordions & Disclosures',
      'Dropdown & Context Menus',
      'Data Tables & Telemetry Grids',
      'Toast & Live-Region Alerts',
      'Tooltips & Popovers',
    ],
    subcategoryTree: buildTreeFromList('ui-components', [
      {
        name: 'Combobox & Autocomplete',
        description: 'Composite text input paired with virtual aria-activedescendant listbox.',
        children: [
          {
            name: 'WAI-ARIA 1.2 Combobox State Machine',
            children: [{ name: 'Keyboard Arrow & Escape Contract' }],
          },
        ],
      },
      { name: 'Modal Dialogs & Sheets' },
      { name: 'Tabs & Segmented Controls' },
      { name: 'Buttons & Tactile Triggers' },
      { name: 'Accordions & Disclosures' },
      { name: 'Dropdown & Context Menus' },
      { name: 'Data Tables & Telemetry Grids' },
      { name: 'Toast & Live-Region Alerts' },
      { name: 'Tooltips & Popovers' },
    ]),
    tags: ['WAI-ARIA', 'Combobox', 'Modal Dialog', 'Tabs', 'Data Table', 'Primitives'],
    featuredResourceSlugs: ['wai-aria-combobox-keyboard-pattern', 'high-density-tabular-telemetry-grid'],
    relatedCategorySlugs: ['accessibility-inclusive-design', 'ux-interaction-patterns', 'official-design-systems'],
    technologyAssociations: ['WAI-ARIA 1.2 APG', 'React 19 Primitives', 'Radix / Headless Architecture'],
    featuredVisualMotif: 'aria-state-machine',
    parentSlug: null,
    orderIndex: 7,
  },
  {
    id: 'cat-08-ux-interaction-patterns',
    slug: 'ux-interaction-patterns',
    legacyAliases: ['interaction-patterns', 'navigation-architecture', 'forms-validation'],
    name: 'UX & Interaction Patterns',
    classification: 'interaction-pattern',
    shortDescription:
      'Command palettes (⌘K), progressive disclosure, faceted filtering, form validation recovery, and optimistic UI workflows.',
    overview:
      'UX & Interaction Patterns examines repeatable behavioral architectures that solve complex user tasks—from keyboard-first command palettes and multi-select faceted search to non-blocking form validation and empty-state recovery.',
    architecturalScope: 'Command Palettes · Faceted Search · Progressive Disclosure · Form Ergonomics',
    subcategories: [
      'Command Palettes (⌘K)',
      'Faceted Filtering & Sorting',
      'Progressive Disclosure',
      'Mega Menus & Global Navigation',
      'Inline Form Validation & Error Recovery',
      'Empty, Loading & Error State Choreography',
      'Optimistic UI Updates',
      'Resizable Split Workspaces',
      'Drag-and-Drop Keyboard Parity',
    ],
    subcategoryTree: buildTreeFromList('ux-interaction-patterns', [
      {
        name: 'Command Palettes (⌘K)',
        description: 'Keyboard-invoked modal search and action dispatchers.',
        children: [
          {
            name: 'Multi-Domain Scoped Filtering',
            children: [{ name: 'Recent Query Persistence & Zero-Result Recovery' }],
          },
        ],
      },
      { name: 'Faceted Filtering & Sorting' },
      { name: 'Progressive Disclosure' },
      { name: 'Mega Menus & Global Navigation' },
      { name: 'Inline Form Validation & Error Recovery' },
      { name: 'Empty, Loading & Error State Choreography' },
      { name: 'Optimistic UI Updates' },
      { name: 'Resizable Split Workspaces' },
    ]),
    tags: ['Command Palette', 'Faceted Search', 'Navigation', 'Form Validation', 'Empty States'],
    featuredResourceSlugs: ['command-palette-keyboard-dispatcher', 'wai-aria-combobox-keyboard-pattern'],
    relatedCategorySlugs: ['ui-components', 'accessibility-inclusive-design', 'mobile-design'],
    technologyAssociations: ['URLSearchParams State Sync', 'KeyboardEvent Listeners', 'ARIA Live Regions'],
    featuredVisualMotif: 'interaction-flow-graph',
    parentSlug: null,
    orderIndex: 8,
  },
  {
    id: 'cat-09-motion-animation',
    slug: 'motion-animation',
    legacyAliases: ['motion-choreography', 'micro-interactions'],
    name: 'Motion & Animation',
    classification: 'animation-technique',
    shortDescription:
      'Entrance/exit transitions, physics-based springs, hover micro-interactions, kinetic text, and SVG/Canvas motion.',
    overview:
      'Motion & Animation codifies temporal design—demonstrating how damped harmonic springs, easing curves, and spatial transitions clarify state changes while strictly honoring compositor budgets and prefers-reduced-motion.',
    architecturalScope: 'Spring Physics · Micro-Interactions (<=150ms) · Easing Curves · Reduced Motion',
    subcategories: [
      'Entrance animations',
      'Exit animations',
      'Scroll animations',
      'Hover animations',
      'Text animations',
      'Page transitions',
      'Loading animations',
      'SVG animations',
      'Canvas animations',
      'Physics-based motion',
      '3D motion',
      'Background animations',
      'Cursor animations',
      'Micro-interactions',
      'Animation choreography',
    ],
    subcategoryTree: buildTreeFromList('motion-animation', [
      {
        name: 'Physics-based motion',
        description: 'Hooke’s Law damped harmonic oscillators preserving gesture momentum.',
        children: [
          {
            name: 'Damped Harmonic Spring Oscillators',
            children: [
              { name: 'Critically Damped Equilibrium (ζ ≈ 1.0)' },
              { name: 'Underdamped Elastic Overshoot (ζ < 0.8)' },
            ],
          },
          { name: 'Interruptible Mid-Flight Retargeting' },
        ],
      },
      {
        name: 'Micro-interactions',
        description: 'Sub-180ms tactile feedback confirming user intent.',
        children: [{ name: 'Magnetic Cursor Attraction Fields' }, { name: 'Mechanical Latch Depress' }],
      },
      { name: 'Entrance animations' },
      { name: 'Exit animations' },
      { name: 'Scroll animations' },
      { name: 'Hover animations' },
      { name: 'Text animations' },
      { name: 'Page transitions' },
      { name: 'Loading animations' },
      { name: 'SVG animations' },
      { name: 'Canvas animations' },
      { name: '3D motion' },
      { name: 'Background animations' },
      { name: 'Cursor animations' },
      { name: 'Animation choreography' },
    ]),
    tags: ['Spring Physics', 'Micro-Interactions', 'Easing Curves', 'Kinetic Type', 'Reduced Motion'],
    featuredResourceSlugs: ['damped-harmonic-spring-choreography', 'apple-hig-vibrancy-and-spring-ergonomics'],
    relatedCategorySlugs: ['advanced-motion', '3d-immersive-experiences', 'accessibility-inclusive-design'],
    technologyAssociations: ['Motion (Framer Motion)', 'CSS Transitions & Keyframes', 'Web Animations API'],
    featuredVisualMotif: 'spring-oscillator-wave',
    parentSlug: null,
    orderIndex: 9,
  },
  {
    id: 'cat-10-advanced-motion',
    slug: 'advanced-motion',
    legacyAliases: ['scroll-timelines'],
    name: 'Advanced Motion',
    classification: 'animation-technique',
    shortDescription:
      'FLIP layout projection, scroll-driven timeline scrubbing, shared-element view transitions, and procedural SVG morphing.',
    overview:
      'Advanced Motion focuses on multi-stage spatial choreography—including First-Last-Invert-Play (FLIP) layout projections, scroll-progress keyframe scrubbing, and W3C View Transitions that bridge complex DOM mutations at 60fps.',
    architecturalScope: 'FLIP Layout Projection · Scroll-Driven Timelines · View Transitions API',
    subcategories: [
      'FLIP Layout Projection',
      'Scroll-Driven Timeline Scrubbing',
      'Shared-Element View Transitions',
      'Staggered Cascade Choreography',
      'Procedural SVG Path Morphing',
      'Gesture Velocity Projection',
      'Pinned Diagrammatic Storytelling',
      'Canvas Particle Field Dynamics',
    ],
    subcategoryTree: buildTreeFromList('advanced-motion', [
      {
        name: 'FLIP Layout Projection',
        description: 'First, Last, Invert, Play technique for 60fps layout geometry transitions using transform.',
        children: [
          {
            name: 'Scale-Corrected Border & Child Compensation',
            children: [{ name: 'Inverse Matrix Transform Math' }],
          },
        ],
      },
      {
        name: 'Scroll-Driven Timeline Scrubbing',
        description: 'Binding animation progress directly to scroll offset or timeline scrubbers.',
      },
      { name: 'Shared-Element View Transitions' },
      { name: 'Staggered Cascade Choreography' },
      { name: 'Procedural SVG Path Morphing' },
      { name: 'Gesture Velocity Projection' },
      { name: 'Pinned Diagrammatic Storytelling' },
    ]),
    tags: ['FLIP Technique', 'Scroll Timeline', 'View Transitions', 'GSAP / Motion', 'Choreography'],
    featuredResourceSlugs: ['flip-layout-projection-choreography', 'damped-harmonic-spring-choreography'],
    relatedCategorySlugs: ['motion-animation', '3d-immersive-experiences', 'design-engineering-implementation'],
    technologyAssociations: ['FLIP Transform Projection', 'CSS Scroll-Driven Animations', 'View Transitions API'],
    featuredVisualMotif: 'flip-projection-matrix',
    parentSlug: null,
    orderIndex: 10,
  },
  {
    id: 'cat-11-3d-immersive-experiences',
    slug: '3d-immersive-experiences',
    legacyAliases: ['spatial-3d-canvas'],
    name: '3D & Immersive Experiences',
    classification: 'development-technology',
    shortDescription:
      'Isometric 3D CSS perspective stacks, interactive WebGL/Three.js viewports, shader surfaces, and spatial UI layers.',
    overview:
      '3D & Immersive Experiences explores depth, perspective projection, and lighting in digital interfaces—from lightweight CSS 3D exploded component inspectors to hardware-accelerated Three.js scenes.',
    architecturalScope: '3D CSS Perspective · Exploded Layer Stacks · Three.js / WebGL · Shaders',
    subcategories: [
      '3D CSS Perspective & Exploded Views',
      'Interactive Three.js Product Stages',
      'Isometric Architectural Diagrams',
      'WebGL Fragment Shader Surfaces',
      'Spatial Computing & Depth Layers',
      'Lighting, Matcap & PBR Materials',
      'Performance & Fallback Governance',
    ],
    subcategoryTree: buildTreeFromList('3d-immersive-experiences', [
      {
        name: '3D CSS Perspective & Exploded Views',
        description: 'Using transform-style: preserve-3d to inspect multi-layer component architecture.',
        children: [
          {
            name: 'Isometric Z-Axis Layer Separation',
            children: [{ name: 'Interactive Pitch & Yaw Camera Controls' }],
          },
        ],
      },
      { name: 'Interactive Three.js Product Stages' },
      { name: 'Isometric Architectural Diagrams' },
      { name: 'WebGL Fragment Shader Surfaces' },
      { name: 'Spatial Computing & Depth Layers' },
      { name: 'Lighting, Matcap & PBR Materials' },
    ]),
    tags: ['3D CSS', 'Isometric', 'Three.js', 'WebGL', 'Spatial UI'],
    featuredResourceSlugs: ['isometric-3d-dom-layer-projection'],
    relatedCategorySlugs: ['advanced-motion', 'design-engineering-implementation', 'visual-design-styles'],
    technologyAssociations: ['CSS 3D Transforms', 'Three.js / WebGL', 'SVG Isometric Projection'],
    featuredVisualMotif: 'isometric-layer-stack',
    parentSlug: null,
    orderIndex: 11,
  },
  {
    id: 'cat-12-responsive-adaptive-design',
    slug: 'responsive-adaptive-design',
    name: 'Responsive & Adaptive Design',
    classification: 'layout-technique',
    shortDescription:
      'W3C CSS Container Queries, intrinsic component adaptation, fluid space/type clamp(), and multi-breakpoint reflow.',
    overview:
      'Responsive & Adaptive Design moves beyond brittle viewport-only media queries toward intrinsic web design—where components adapt autonomously to their parent container inline-size, pointer precision, and user display preferences.',
    architecturalScope: '@container Queries · Intrinsic Reflow · Fluid Spacing · Pointer Media Queries',
    subcategories: [
      'CSS Container Queries (@container)',
      'Intrinsic Web Design Principles',
      'Fluid Spacing & Viewport Clamp',
      'Multi-Breakpoint Reflow (WCAG 1.4.10)',
      'Container Style & State Queries',
      'Pointer & Hover Capability Queries',
      'Foldable & Multi-Screen Adaptation',
    ],
    subcategoryTree: buildTreeFromList('responsive-adaptive-design', [
      {
        name: 'CSS Container Queries (@container)',
        description: 'Querying parent container inline-size rather than global window width.',
        children: [
          {
            name: 'Intrinsic Card Split Thresholds',
            children: [{ name: 'Container Query Units (cqi / cqw)' }],
          },
        ],
      },
      { name: 'Intrinsic Web Design Principles' },
      { name: 'Fluid Spacing & Viewport Clamp' },
      { name: 'Multi-Breakpoint Reflow (WCAG 1.4.10)' },
      { name: 'Pointer & Hover Capability Queries' },
    ]),
    tags: ['Container Queries', 'Intrinsic Design', 'Responsive Reflow', 'Fluid Layout', 'Breakpoints'],
    featuredResourceSlugs: ['css-container-queries-intrinsic-card', 'fluid-clamp-modular-type-scale'],
    relatedCategorySlugs: ['layout-grid-systems', 'mobile-design', 'typography-systems'],
    technologyAssociations: ['W3C CSS Containment Level 3', 'CSS Media Queries Level 5', 'CSS Grid auto-fit'],
    featuredVisualMotif: 'container-query-resizer',
    parentSlug: null,
    orderIndex: 12,
  },
  {
    id: 'cat-13-mobile-design',
    slug: 'mobile-design',
    name: 'Mobile Design',
    classification: 'interaction-pattern',
    shortDescription:
      'Thumb-zone ergonomics, >=44px touch targets, bottom sheet drawers, sticky viewport caps (<=15%), and coarse-pointer patterns.',
    overview:
      'Mobile Design treats handheld touch interfaces as a first-class ergonomic discipline rather than a shrunken desktop layout—enforcing strict sticky surface budgets, comfortable thumb-arc reachability, and touch-friendly filter drawers.',
    architecturalScope: 'Thumb-Zone Reachability · >=44px Touch Targets · 15% Sticky Cap · Sheet Drawers',
    subcategories: [
      'Thumb-Zone Ergonomics & Reachability',
      'Touch Target Sizing (>=44x44px)',
      'Slide-Over & Bottom Sheet Drawers',
      '15% Mobile Sticky Viewport Governance',
      'Mobile Filter & Facet Patterns',
      'Coarse Pointer & Swipe Gestures',
      'Responsive Table-to-Card Transformation',
    ],
    subcategoryTree: buildTreeFromList('mobile-design', [
      {
        name: 'Thumb-Zone Ergonomics & Reachability',
        description: 'Placing primary interactive controls within natural one-handed thumb arcs.',
        children: [
          {
            name: 'Bottom Action Bars vs Top Drawers',
            children: [{ name: '15% Maximum Sticky Viewport Height Budget' }],
          },
        ],
      },
      { name: 'Touch Target Sizing (>=44x44px)' },
      { name: 'Slide-Over & Bottom Sheet Drawers' },
      { name: '15% Mobile Sticky Viewport Governance' },
      { name: 'Mobile Filter & Facet Patterns' },
    ]),
    tags: ['Mobile UX', 'Touch Targets', 'Thumb Zone', 'Sheet Drawers', 'Sticky Budget'],
    featuredResourceSlugs: ['mobile-touch-target-and-sticky-governance', 'css-container-queries-intrinsic-card'],
    relatedCategorySlugs: ['responsive-adaptive-design', 'ux-interaction-patterns', 'accessibility-inclusive-design'],
    technologyAssociations: ['Pointer Events API', 'CSS @media (pointer: coarse)', 'Viewport Units (dvh)'],
    featuredVisualMotif: 'mobile-thumb-ergonomics',
    parentSlug: null,
    orderIndex: 13,
  },
  {
    id: 'cat-14-accessibility-inclusive-design',
    slug: 'accessibility-inclusive-design',
    name: 'Accessibility & Inclusive Design',
    classification: 'implementation-pattern',
    shortDescription:
      'WCAG 2.1/2.2 AA & AAA compliance, deterministic keyboard focus rings, prefers-reduced-motion, and screen reader ARIA contracts.',
    overview:
      'Accessibility & Inclusive Design ensures every digital pattern is operable by everyone—enforcing mathematical luminance contrast, visible focus indicators, reduced-motion parity, and semantic WAI-ARIA state machines.',
    architecturalScope: 'WCAG AA/AAA Contrast · Focus Appearance · Reduced Motion · Screen Reader ARIA',
    subcategories: [
      'WCAG 2.1 / 2.2 Contrast & Luminance',
      'Keyboard Navigation & Focus Appearance',
      'Reduced-Motion Parity (WCAG 2.3.3)',
      'WAI-ARIA Authoring Practices (APG)',
      'Color-Blind Safe Dual Signaling',
      'Screen Reader Live Regions (aria-live)',
      'Form Error Identification & Recovery',
      'Cognitive Accessibility & Plain Language',
    ],
    subcategoryTree: buildTreeFromList('accessibility-inclusive-design', [
      {
        name: 'Keyboard Navigation & Focus Appearance',
        description: 'Deterministic Tab order, roving tabindex, and high-contrast focus-visible outlines.',
        children: [
          {
            name: 'WCAG 2.4.11 Focus Appearance',
            children: [{ name: '2px Minimum Outline + Offset Separation' }],
          },
        ],
      },
      {
        name: 'Reduced-Motion Parity (WCAG 2.3.3)',
        description: 'Eliminating spatial Vestibular triggers while preserving state clarity.',
      },
      { name: 'WCAG 2.1 / 2.2 Contrast & Luminance' },
      { name: 'WAI-ARIA Authoring Practices (APG)' },
      { name: 'Color-Blind Safe Dual Signaling' },
      { name: 'Screen Reader Live Regions (aria-live)' },
    ]),
    tags: ['WCAG AAA', 'WAI-ARIA', 'Keyboard Focus', 'Reduced Motion', 'Inclusive Design'],
    featuredResourceSlugs: [
      'wai-aria-combobox-keyboard-pattern',
      'damped-harmonic-spring-choreography',
      'material-3-semantic-token-hierarchy',
    ],
    relatedCategorySlugs: ['ui-components', 'color-systems', 'ux-interaction-patterns'],
    technologyAssociations: ['W3C WCAG 2.1 / 2.2', 'WAI-ARIA 1.2', 'prefers-reduced-motion'],
    featuredVisualMotif: 'wcag-contrast-auditor',
    parentSlug: null,
    orderIndex: 14,
  },
  {
    id: 'cat-15-design-engineering-implementation',
    slug: 'design-engineering-implementation',
    legacyAliases: ['platform-technologies', 'creative-coding', 'data-visualization'],
    name: 'Design Engineering & Implementation',
    classification: 'implementation-pattern',
    shortDescription:
      'Production CSS architecture, CSP-isolated code sandboxes, high-density telemetry grids, and zero-runtime token compilation.',
    overview:
      'Design Engineering & Implementation operates at the intersection of visual craft and systems engineering—covering type-safe component APIs, CSS custom property interpolation, and secure client-side code sandboxes.',
    architecturalScope: 'CSS Custom Properties · CSP Iframe Sandboxes · Type-Safe APIs · Telemetry Grids',
    subcategories: [
      'CSS Custom Property Runtime Engines',
      'Sandboxed Code Execution (CSP / Iframe)',
      'Component API & Variant Architecture',
      'High-Density Data & Telemetry Grids',
      'Zero-CLS Skeleton & Layout Stability',
      'SVG Procedural Diagram Generation',
      'Performance & Compositor Budgets',
    ],
    subcategoryTree: buildTreeFromList('design-engineering-implementation', [
      {
        name: 'CSS Custom Property Runtime Engines',
        description: 'Zero-latency reactive styling by binding UI controls directly to scoped CSS variables.',
        children: [
          {
            name: 'Concentric Nested Border-Radius Math',
            children: [{ name: 'calc(var(--outer-radius) - var(--padding) * 0.5)' }],
          },
        ],
      },
      { name: 'Sandboxed Code Execution (CSP / Iframe)' },
      { name: 'Component API & Variant Architecture' },
      { name: 'High-Density Data & Telemetry Grids' },
      { name: 'Zero-CLS Skeleton & Layout Stability' },
    ]),
    tags: ['Design Engineering', 'CSS Custom Properties', 'Code Sandbox', 'TypeScript', 'Performance'],
    featuredResourceSlugs: [
      'css-container-queries-intrinsic-card',
      'high-density-tabular-telemetry-grid',
    ],
    relatedCategorySlugs: ['official-design-systems', 'responsive-adaptive-design', 'design-operations-tooling'],
    technologyAssociations: ['TypeScript 5.9 Strict', 'Tailwind CSS v4', 'Content-Security-Policy'],
    featuredVisualMotif: 'sandbox-execution-pipeline',
    parentSlug: null,
    orderIndex: 15,
  },
  {
    id: 'cat-16-design-operations-tooling',
    slug: 'design-operations-tooling',
    name: 'Design Operations & Tooling',
    classification: 'design-tool',
    shortDescription:
      'W3C Design Tokens Community Group (DTCG) schemas, automated accessibility linting, taxonomy governance, and white-label configuration.',
    overview:
      'Design Operations & Tooling provides the infrastructure that scales a design system across teams—standardizing JSON token interchange formats, provenance verification workflows, and extensible taxonomy management.',
    architecturalScope: 'W3C DTCG Token Schema · Provenance Auditing · White-Label Config · CI Linting',
    subcategories: [
      'W3C Design Tokens Format (DTCG)',
      'Multi-Brand & White-Label Architecture',
      'Automated Accessibility & Contrast Auditing',
      'Taxonomy Governance & Extensibility',
      'Design-to-Code Token Pipelines',
      'Component Documentation & Spec Contracts',
      'Versioning & Deprecation Lifecycles',
    ],
    subcategoryTree: buildTreeFromList('design-operations-tooling', [
      {
        name: 'W3C Design Tokens Format (DTCG)',
        description: 'Vendor-neutral JSON schema ($value, $type, $description) for design token interchange.',
        children: [
          {
            name: 'Cross-Platform Token Compilation',
            children: [{ name: 'CSS Variables / iOS Swift / Android XML Targets' }],
          },
        ],
      },
      { name: 'Multi-Brand & White-Label Architecture' },
      { name: 'Automated Accessibility & Contrast Auditing' },
      { name: 'Taxonomy Governance & Extensibility' },
      { name: 'Design-to-Code Token Pipelines' },
    ]),
    tags: ['W3C DTCG', 'DesignOps', 'Token Pipeline', 'Governance', 'White-Label'],
    featuredResourceSlugs: ['w3c-dtcg-design-token-pipeline', 'material-3-semantic-token-hierarchy'],
    relatedCategorySlugs: ['official-design-systems', 'design-engineering-implementation', 'color-systems'],
    technologyAssociations: ['W3C DTCG Specification', 'JSON Schema', 'Automated axe-core Audits'],
    featuredVisualMotif: 'dtcg-token-compiler',
    parentSlug: null,
    orderIndex: 16,
  },
];

const CUSTOM_TAXONOMY_STORAGE_KEY = 'dde_custom_taxonomy_nodes_v1';

/**
 * Resolves a category by its canonical slug OR any legacy alias slug.
 */
export function getCategoryBySlug(slug: string): TaxonomyCategory | undefined {
  return TAXONOMY_CATEGORIES.find(
    (category) =>
      category.slug === slug ||
      (category.legacyAliases && category.legacyAliases.includes(slug))
  );
}

export function getClassificationDescriptor(
  classification: ResourceClassification
): ClassificationDescriptor {
  return (
    CLASSIFICATION_DESCRIPTORS_MAP[classification] ||
    CLASSIFICATION_DESCRIPTORS_MAP['official-design-system']
  );
}

/**
 * Checks whether a resource belongs to a given category (supporting multi-category membership and legacy aliases).
 */
export function resourceBelongsToCategory(
  resource: DesignResource,
  category: TaxonomyCategory
): boolean {
  const validSlugs = new Set([
    category.slug,
    ...(category.legacyAliases || []),
  ]);
  if (validSlugs.has(resource.categorySlug)) return true;
  if (
    resource.categorySlugs &&
    resource.categorySlugs.some((s) => validSlugs.has(s))
  ) {
    return true;
  }
  return false;
}

/**
 * Computes accurate resource count for a category across all multi-category associations.
 */
export function getCategoryResourceCount(
  category: TaxonomyCategory,
  resources: DesignResource[]
): number {
  return resources.filter((res) => resourceBelongsToCategory(res, category))
    .length;
}

/**
 * Recursively flattens a multi-level subcategory tree (depth 2, 3, 4+) into a linear array.
 */
export function flattenSubcategoryTree(
  nodes: TaxonomySubcategoryNode[]
): TaxonomySubcategoryNode[] {
  const result: TaxonomySubcategoryNode[] = [];
  const walk = (list: TaxonomySubcategoryNode[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return result;
}

/**
 * Merges runtime-added custom subcategory nodes into a category's recursive subcategory tree at any depth.
 */
export function mergeSubcategoryTrees(
  baseTree: TaxonomySubcategoryNode[],
  customNodes: TaxonomySubcategoryNode[]
): TaxonomySubcategoryNode[] {
  if (!customNodes || customNodes.length === 0) return baseTree;

  const cloneTree = (
    nodes: TaxonomySubcategoryNode[]
  ): TaxonomySubcategoryNode[] =>
    nodes.map((n) => ({
      ...n,
      children: n.children ? cloneTree(n.children) : [],
    }));

  const cloned = cloneTree(baseTree);

  const insertIntoNode = (
    list: TaxonomySubcategoryNode[],
    targetParentId: string,
    childNode: TaxonomySubcategoryNode
  ): boolean => {
    for (const item of list) {
      if (item.id === targetParentId || item.slug === targetParentId) {
        item.children = [...(item.children || []), childNode];
        return true;
      }
      if (
        item.children &&
        insertIntoNode(item.children, targetParentId, childNode)
      ) {
        return true;
      }
    }
    return false;
  };

  for (const custom of customNodes) {
    const parentId = custom.parentId || custom.parentSlug;
    if (!parentId || !insertIntoNode(cloned, parentId, custom)) {
      cloned.push(custom);
    }
  }

  return cloned;
}

/**
 * Runtime Admin Taxonomy Expansion (Section 2: "Build the taxonomy so administrators can create new categories without code modifications").
 */
export function loadCustomSubcategoryNodes(): Record<
  string,
  TaxonomySubcategoryNode[]
> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_TAXONOMY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TaxonomySubcategoryNode[]>;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function addCustomSubcategoryNode(
  categorySlug: string,
  node: TaxonomySubcategoryNode
): Record<string, TaxonomySubcategoryNode[]> {
  const current = loadCustomSubcategoryNodes();
  const existing = current[categorySlug] || [];
  const updated: Record<string, TaxonomySubcategoryNode[]> = {
    ...current,
    [categorySlug]: [...existing, node],
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        CUSTOM_TAXONOMY_STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return updated;
}
