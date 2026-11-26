export interface BrandNavigationItem {
  id: string;
  label: string;
  sectionId: string;
  href?: string;
}

export interface BrandConfig {
  /** Temporary product name; swap here to rebrand the entire platform */
  productName: string;
  shortName: string;
  versionTag: string;
  tagline: string;
  missionStatement: string;
  primaryActionLabel: string;
  navigation: BrandNavigationItem[];
  principles: {
    id: string;
    title: string;
    description: string;
  }[];
  featureFlags: {
    enableLiveParameterLab: boolean;
    enableSandboxedCodePreview: boolean;
    enableReducedMotionSimulator: boolean;
    enableLocalCollections: boolean;
    enableFirebaseSync: boolean;
  };
}

export const BRAND_CONFIG: BrandConfig = {
  productName: 'Digital Design Encyclopedia',
  shortName: 'DDE',
  versionTag: 'Phase 1 · Design System & Component Architecture',
  tagline: 'Explore before reading. Demonstrate before explaining.',
  missionStatement:
    'An interactive knowledge and experimentation workbench for digital design systems, visual styles, UI/UX patterns, motion physics, and accessible code implementation.',
  primaryActionLabel: 'Design System Showcase',
  navigation: [
    { id: 'lab', label: 'Interactive Lab', sectionId: 'interactive-lab', href: '/#interactive-lab' },
    { id: 'taxonomy', label: 'Taxonomy', sectionId: 'taxonomy-explorer', href: '/#taxonomy-explorer' },
    { id: 'design-system', label: 'Design System', sectionId: 'design-system-showcase', href: '/design-system' },
    { id: 'architecture', label: 'Architecture', sectionId: 'architecture-blueprint', href: '/#architecture-blueprint' },
    { id: 'roadmap', label: 'Phased Plan', sectionId: 'phased-roadmap', href: '/#phased-roadmap' },
  ],
  principles: [
    {
      id: 'explore-first',
      title: '01. Explore Before Reading',
      description:
        'Every concept leads with a direct-manipulation stage where parameters can be tested in real time before diving into theory.',
    },
    {
      id: 'demonstrate-first',
      title: '02. Demonstrate Before Explaining',
      description:
        'Visual mechanics, layout grids, and motion curves are demonstrated through live interactive state transitions rather than static screenshots.',
    },
    {
      id: 'accessible-by-default',
      title: '03. Accessibility Over Decoration',
      description:
        'Every published pattern enforces WCAG AA/AAA contrast telemetry, full keyboard operability, and prefers-reduced-motion compliance.',
    },
    {
      id: 'traceable-truth',
      title: '04. Verifiable Attribution',
      description:
        'Strict separation between official design systems, methodologies, visual styles, and community examples with traceable source links.',
    },
  ],
  featureFlags: {
    enableLiveParameterLab: true,
    enableSandboxedCodePreview: true,
    enableReducedMotionSimulator: true,
    enableLocalCollections: true,
    enableFirebaseSync: false,
  },
};
