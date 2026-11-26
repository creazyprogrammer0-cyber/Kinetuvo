export interface SemanticColorToken {
  id: string;
  cssVar: string;
  roleName: string;
  category: 'surface' | 'typography' | 'brand-accent' | 'status' | 'interaction-border';
  lightHex: string;
  darkHex: string;
  contrastNote: string;
  usageGuideline: string;
}

export interface TypographyScaleToken {
  id: string;
  role: string;
  fontFamily: 'display' | 'sans' | 'mono';
  cssSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
  maxMeasure: string;
  sampleText: string;
  usage: string;
}

export interface SpacingScaleToken {
  token: string;
  rem: string;
  px: number;
  structuralUse: string;
}

export interface LayoutDimensionToken {
  name: string;
  cssVariable: string;
  value: string;
  purpose: string;
}

export interface MotionTokenSpec {
  id: string;
  name: string;
  cssVariable: string;
  value: string;
  category: 'duration' | 'easing' | 'spring';
  usage: string;
}

export const SEMANTIC_COLOR_TOKENS: SemanticColorToken[] = [
  {
    id: 'background',
    cssVar: '--ds-background',
    roleName: 'Background Canvas',
    category: 'surface',
    lightHex: '#F6F8FA',
    darkHex: '#0B0F17',
    contrastNote: '60% Dominant Neutral Canvas',
    usageGuideline: 'Primary page viewport background field.',
  },
  {
    id: 'surface',
    cssVar: '--ds-surface',
    roleName: 'Surface Container',
    category: 'surface',
    lightHex: '#FFFFFF',
    darkHex: '#111827',
    contrastNote: '30% Structural Card & Panel Surface',
    usageGuideline: 'Default container surface for encyclopedia cards, tables, and sidebars.',
  },
  {
    id: 'surface-elevated',
    cssVar: '--ds-surface-elevated',
    roleName: 'Surface Elevated',
    category: 'surface',
    lightHex: '#FFFFFF',
    darkHex: '#1A2333',
    contrastNote: 'Single-elevation overlay plane',
    usageGuideline: 'Used for popovers, mega-menus, dialogs, and drawers.',
  },
  {
    id: 'muted',
    cssVar: '--ds-muted',
    roleName: 'Muted Surface',
    category: 'surface',
    lightHex: '#F1F5F9',
    darkHex: '#1E293B',
    contrastNote: 'Subtle secondary container backdrop',
    usageGuideline: 'Segmented control tracks, code block headers, and sunken wells.',
  },
  {
    id: 'foreground',
    cssVar: '--ds-foreground',
    roleName: 'Foreground Primary Ink',
    category: 'typography',
    lightHex: '#111827',
    darkHex: '#F8FAFC',
    contrastNote: '15.4:1 (Light) / 16.8:1 (Dark) — WCAG AAA',
    usageGuideline: 'Headings, primary prose, and active navigation labels.',
  },
  {
    id: 'muted-foreground',
    cssVar: '--ds-muted-foreground',
    roleName: 'Muted Secondary Ink',
    category: 'typography',
    lightHex: '#4B5563',
    darkHex: '#CBD5E1',
    contrastNote: '7.1:1 (Light) / 11.2:1 (Dark) — WCAG AAA',
    usageGuideline: 'Supporting body descriptions, parameter explanations, and subtitles.',
  },
  {
    id: 'primary',
    cssVar: '--ds-primary',
    roleName: 'Primary Brand Accent',
    category: 'brand-accent',
    lightHex: '#4338CA',
    darkHex: '#6366F1',
    contrastNote: '8.2:1 (Light) / 7.4:1 (Dark) — Restrained Blue-Violet',
    usageGuideline: '10% Accent budget: Primary action buttons and active selection indicators.',
  },
  {
    id: 'secondary',
    cssVar: '--ds-secondary',
    roleName: 'Secondary Tonal Surface',
    category: 'brand-accent',
    lightHex: '#EEF2FF',
    darkHex: '#1E1B4B',
    contrastNote: 'Tonal indigo container paired with --ds-secondary-foreground',
    usageGuideline: 'Active filter states, highlighted architecture callouts, and subtle focus fills.',
  },
  {
    id: 'accent',
    cssVar: '--ds-accent',
    roleName: 'Interactive Accent',
    category: 'brand-accent',
    lightHex: '#4F46E5',
    darkHex: '#818CF8',
    contrastNote: 'High-visibility interactive highlight',
    usageGuideline: 'Slider tracks, active tab underlines, and interactive link hover states.',
  },
  {
    id: 'border',
    cssVar: '--ds-border',
    roleName: 'Structural Hairline Border',
    category: 'interaction-border',
    lightHex: '#E2E8F0',
    darkHex: '#1E293B',
    contrastNote: '1px crisp architectural divider',
    usageGuideline: 'Card boundaries, grid hairlines, and section separators.',
  },
  {
    id: 'focus',
    cssVar: '--ds-focus',
    roleName: 'Focus Ring Indicator',
    category: 'interaction-border',
    lightHex: '#4F46E5',
    darkHex: '#818CF8',
    contrastNote: 'WCAG 2.4.11 Focus Appearance (2px solid + 2px offset)',
    usageGuideline: 'Mandatory keyboard focus-visible ring across all interactive primitives.',
  },
  {
    id: 'disabled',
    cssVar: '--ds-disabled-foreground',
    roleName: 'Disabled Control State',
    category: 'interaction-border',
    lightHex: '#94A3B8',
    darkHex: '#475569',
    contrastNote: 'Paired with aria-disabled="true" & cursor-not-allowed',
    usageGuideline: 'Inactive controls unavailable in current state.',
  },
  {
    id: 'success',
    cssVar: '--ds-success',
    roleName: 'Semantic Success / Nominal',
    category: 'status',
    lightHex: '#047857',
    darkHex: '#34D399',
    contrastNote: 'Always paired with Check icon + explicit label (e.g., AA Pass)',
    usageGuideline: 'Verified accessibility audits, passing checks, and completed states.',
  },
  {
    id: 'warning',
    cssVar: '--ds-warning',
    roleName: 'Semantic Warning / Caution',
    category: 'status',
    lightHex: '#B45309',
    darkHex: '#FBBF24',
    contrastNote: 'Always paired with AlertTriangle icon + explicit caution label',
    usageGuideline: 'Architectural trade-offs, performance budgets, and deprecation notices.',
  },
  {
    id: 'error',
    cssVar: '--ds-error',
    roleName: 'Semantic Error / Critical',
    category: 'status',
    lightHex: '#B91C1C',
    darkHex: '#F87171',
    contrastNote: 'Always paired with AlertOctagon icon + explicit error label',
    usageGuideline: 'Validation errors, contrast failures, and destructive action confirmations.',
  },
];

export const TYPOGRAPHY_SCALE_TOKENS: TypographyScaleToken[] = [
  {
    id: 'display',
    role: 'Display Typography',
    fontFamily: 'display',
    cssSize: 'clamp(2rem, 3.2vw, 2.75rem)',
    lineHeight: '1.12',
    letterSpacing: '-0.025em',
    fontWeight: '700 (Bold)',
    maxMeasure: '26ch',
    sampleText: 'Editorial & Technical Design Systems',
    usage: 'Primary workbench mastheads and encyclopedia volume titles (restrained height).',
  },
  {
    id: 'page-title',
    role: 'Page Title (H1)',
    fontFamily: 'display',
    cssSize: 'clamp(1.625rem, 2.4vw, 2.125rem)',
    lineHeight: '1.18',
    letterSpacing: '-0.02em',
    fontWeight: '700 (Bold)',
    maxMeasure: '34ch',
    sampleText: 'Semantic Color Role & Surface Elevation Hierarchy',
    usage: 'Concept detail headers and top-level route titles.',
  },
  {
    id: 'section-title',
    role: 'Section Title (H2)',
    fontFamily: 'display',
    cssSize: 'clamp(1.25rem, 1.8vw, 1.5rem)',
    lineHeight: '1.25',
    letterSpacing: '-0.015em',
    fontWeight: '700 (Bold)',
    maxMeasure: '45ch',
    sampleText: '01. Direct-Manipulation Parameter Laboratory',
    usage: 'Major architectural section dividers and category headers.',
  },
  {
    id: 'subheading',
    role: 'Subheading (H3)',
    fontFamily: 'display',
    cssSize: '1.0625rem (17px)',
    lineHeight: '1.35',
    letterSpacing: '-0.01em',
    fontWeight: '600 (SemiBold)',
    maxMeasure: '55ch',
    sampleText: 'WAI-ARIA 1.2 Combobox Focus State Machine',
    usage: 'Resource card titles, panel headers, and modal titles.',
  },
  {
    id: 'body-text',
    role: 'Body Text',
    fontFamily: 'sans',
    cssSize: '0.9375rem (15px)',
    lineHeight: '1.65',
    letterSpacing: '0em',
    fontWeight: '400 (Regular)',
    maxMeasure: '68ch',
    sampleText:
      'Every major design concept is understood through direct interactive manipulation before reading theoretical exposition.',
    usage: 'Primary long-form encyclopedia explanations and documentation prose.',
  },
  {
    id: 'supporting-text',
    role: 'Supporting Text',
    fontFamily: 'sans',
    cssSize: '0.8125rem (13px)',
    lineHeight: '1.55',
    letterSpacing: '0em',
    fontWeight: '400 (Regular)',
    maxMeasure: '62ch',
    sampleText:
      'Adjusts outer container radius; nested children compute r_inner = max(0, r_outer - padding/2).',
    usage: 'Card summaries, parameter descriptions, and form helper text.',
  },
  {
    id: 'label',
    role: 'UI Control Label',
    fontFamily: 'sans',
    cssSize: '0.75rem (12px)',
    lineHeight: '1.4',
    letterSpacing: '0.01em',
    fontWeight: '600 (SemiBold)',
    maxMeasure: 'Single-line (whitespace-nowrap)',
    sampleText: 'Primary Seed Hue · Reset Defaults',
    usage: 'Form field labels, button text, tab triggers, and table headers.',
  },
  {
    id: 'metadata',
    role: 'Unboxed Editorial Metadata',
    fontFamily: 'sans',
    cssSize: '0.75rem (12px)',
    lineHeight: '1.4',
    letterSpacing: '0.01em',
    fontWeight: '500 (Medium)',
    maxMeasure: 'Inline flow',
    sampleText: 'Official Design System · Published 2021 · WCAG AAA Verified · 7.2:1',
    usage: 'Zero-pill inline metadata separated by middots (·) or slashes (/).',
  },
  {
    id: 'code-typography',
    role: 'Code & Tabular Telemetry',
    fontFamily: 'mono',
    cssSize: '0.75rem (12px)',
    lineHeight: '1.6',
    letterSpacing: '0em',
    fontWeight: '500 (Medium)',
    maxMeasure: 'Scrollable pre / tabular-nums',
    sampleText: '--comp-inner-radius: max(0px, calc(var(--comp-card-radius) - 8px));',
    usage: 'Live code editors, CSS custom property readouts, and numeric metrics.',
  },
];

export const SPACING_SCALE_TOKENS: SpacingScaleToken[] = [
  { token: 'space-1', rem: '0.25rem', px: 4, structuralUse: 'Tight inline icon-to-label gap' },
  { token: 'space-2', rem: '0.5rem', px: 8, structuralUse: 'Segmented button track padding & compact stack gap' },
  { token: 'space-3', rem: '0.75rem', px: 12, structuralUse: 'Standard control padding & internal list spacing' },
  { token: 'space-4', rem: '1rem', px: 16, structuralUse: 'Minimum container padding & mobile viewport gutter' },
  { token: 'space-5', rem: '1.25rem', px: 20, structuralUse: 'Standard card interior padding (p-5)' },
  { token: 'space-6', rem: '1.5rem', px: 24, structuralUse: 'Grid column gap & desktop panel padding (p-6)' },
  { token: 'space-8', rem: '2rem', px: 32, structuralUse: 'Sub-section vertical separation' },
  { token: 'space-12', rem: '3rem', px: 48, structuralUse: 'Major architectural section rhythm' },
  { token: 'space-16', rem: '4rem', px: 64, structuralUse: 'Primary page chapter boundary' },
];

export const LAYOUT_DIMENSION_TOKENS: LayoutDimensionToken[] = [
  {
    name: 'Main Content Width',
    cssVariable: '--ds-layout-max-width',
    value: '1360px',
    purpose: 'Standard desktop encyclopedia workspace container.',
  },
  {
    name: 'Wide Showcase Width',
    cssVariable: '--ds-layout-wide-width',
    value: '1440px',
    purpose: 'Full-bleed split sandbox and multi-panel code studio.',
  },
  {
    name: 'Optimal Reading Width',
    cssVariable: '--ds-layout-reading-width',
    value: '68ch (~640px)',
    purpose: 'Long-form design theory, problem statements, and accessibility specs.',
  },
  {
    name: 'Sidebar Navigation Width',
    cssVariable: '--ds-layout-sidebar-width',
    value: '264px',
    purpose: 'Persistent vertical taxonomy tree and documentation outline on desktop.',
  },
  {
    name: 'Top Navigation Height',
    cssVariable: '--ds-layout-nav-height',
    value: '64px',
    purpose: 'Single-row Top Bar Contract header height (< 10% mobile viewport budget).',
  },
];

export const MOTION_LANGUAGE_TOKENS: MotionTokenSpec[] = [
  {
    id: 'duration-micro',
    name: 'Micro-Interaction Duration',
    cssVariable: '--ds-duration-micro',
    value: '120ms',
    category: 'duration',
    usage: 'Button press, hover border luminance, focus ring appearance, and toggle switch.',
  },
  {
    id: 'duration-fast',
    name: 'Standard UI Transition',
    cssVariable: '--ds-duration-fast',
    value: '180ms',
    category: 'duration',
    usage: 'Tab panel switch, dropdown menu reveal, and tooltip fade.',
  },
  {
    id: 'duration-modal',
    name: 'Dialog & Modal Transition',
    cssVariable: '--ds-duration-modal',
    value: '220ms',
    category: 'duration',
    usage: 'Modal backdrop opacity and centered dialog transform entry.',
  },
  {
    id: 'duration-drawer',
    name: 'Slide-Over Drawer Transition',
    cssVariable: '--ds-duration-drawer',
    value: '260ms',
    category: 'duration',
    usage: 'Off-canvas mobile navigation and parameter inspector drawer.',
  },
  {
    id: 'duration-page',
    name: 'Page & Layout Reflow Duration',
    cssVariable: '--ds-duration-page',
    value: '280ms',
    category: 'duration',
    usage: 'Route transitions and accordion height disclosure.',
  },
  {
    id: 'ease-out',
    name: 'Deceleration Settling Curve',
    cssVariable: '--ds-ease-out',
    value: 'cubic-bezier(0.16, 1, 0.3, 1)',
    category: 'easing',
    usage: 'Default settling curve for interactive feedback and incoming surfaces.',
  },
  {
    id: 'ease-standard',
    name: 'Editorial Standard Curve',
    cssVariable: '--ds-ease-standard',
    value: 'cubic-bezier(0.2, 0, 0, 1)',
    category: 'easing',
    usage: 'Balanced transition for split-pane resizers and layout shifts.',
  },
  {
    id: 'spring-snappy',
    name: 'Snappy Tactile Spring',
    cssVariable: 'type: "spring", stiffness: 380, damping: 28',
    value: 'k=380, c=28 (ζ ≈ 0.72)',
    category: 'spring',
    usage: 'Direct manipulation sliders, active tab indicators, and drawer snaps.',
  },
];
