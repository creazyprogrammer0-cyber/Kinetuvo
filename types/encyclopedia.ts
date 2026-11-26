/**
 * Canonical Resource Types (Section 6)
 * Clearly distinguishes all 12 required resource types plus community examples.
 */
export type ResourceClassification =
  | 'official-design-system'
  | 'visual-style'
  | 'interaction-pattern'
  | 'ui-pattern'
  | 'animation-technique'
  | 'ui-component'
  | 'interactive-component'
  | 'layout-technique'
  | 'typography-system'
  | 'color-system'
  | 'implementation-pattern'
  | 'development-technology'
  | 'design-tool'
  | 'design-methodology'
  | 'community-example';

export type AudienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
export type AudienceDifficulty = AudienceLevel;

export type DemoExecutionMode =
  | 'parameterized-token-stage'
  | 'sandboxed-iframe-srcdoc'
  | 'interactive-motion-canvas';

/**
 * Distinguishes runnable code demonstrations from interactive visual specimens (Section 4).
 */
export type DemonstrationFormat = 'runnable-code-demo' | 'visual-specimen';

/**
 * Publication status supporting meaningful "Resource not yet published" states (Section 7).
 */
export type PublicationStatus = 'published' | 'draft-preview';

export type ParameterControlType = 'range' | 'select' | 'boolean';

export interface ParameterOption {
  label: string;
  value: string;
}

export interface InteractiveParameter {
  key: string;
  label: string;
  description: string;
  controlType: ParameterControlType;
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: ParameterOption[];
  cssVariable?: string;
}

export interface SourceAttribution {
  authorOrOrganization: string;
  officialUrl: string;
  licenseType: string;
  firstPublishedYear: number;
  verificationStandard:
    | 'official-specification'
    | 'w3c-standard'
    | 'historical-canon'
    | 'open-source-verified';
  attributionNote: string;
  hasMissingExternalReference?: boolean;
}

export interface AccessibilityAuditSpec {
  wcagComplianceLevel: 'AA' | 'AAA';
  minContrastRatio: number;
  ariaRoleContract: string[];
  keyboardInteractions: {
    keyCombo: string;
    expectedBehavior: string;
  }[];
  reducedMotionStrategy: string;
  responsiveBreakpointStrategy: string;
  accessibilityFeatures?: string[];
  responsiveFeatures?: string[];
}

export interface CodeImplementationTemplate {
  language: 'css' | 'tsx' | 'html' | 'json' | 'ts';
  filename: string;
  description: string;
  /** Template string supporting {{paramKey}} interpolation for real-time code updates */
  codeTemplate: string;
}

export interface DesignResource {
  id: string;
  slug: string;
  title: string;
  classification: ResourceClassification;
  /** Primary category slug */
  categorySlug: string;
  /** Multi-category membership without duplicating resource records (Section 6) */
  categorySlugs?: string[];
  subcategory?: string;
  /** Optional deep nested subcategory path e.g. ['Physics-based motion', 'Harmonic Spring Oscillators'] */
  nestedCategoryPath?: string[];
  audienceLevel: AudienceLevel;
  demonstrationFormat?: DemonstrationFormat;
  publicationStatus?: PublicationStatus;
  technologies?: string[];
  frameworks?: string[];
  tags?: string[];
  isFeatured?: boolean;
  isRecentlyAdded?: boolean;
  isCuratedPopularSample?: boolean;
  curatedSelectionReason?: string;
  summary: string;
  problemStatement: string;
  whenToUse: string[];
  whenToAvoid: string[];
  executionMode: DemoExecutionMode;
  demoArchetype:
    | 'token-surface-hierarchy'
    | 'swiss-typographic-grid'
    | 'spring-motion-physics'
    | 'accessible-combobox-pattern'
    | 'fluid-container-card'
    | 'neobrutalist-contrast-study';
  interactiveParameters: InteractiveParameter[];
  codeTemplates: CodeImplementationTemplate[];
  accessibilitySpec: AccessibilityAuditSpec;
  sourceAttribution: SourceAttribution;
  relatedResourceSlugs: string[];
  createdAtIso?: string;
  updatedAtIso: string;
  simulateBrokenMedia?: boolean;
}

/**
 * Recursive Taxonomy Node supporting unlimited nested hierarchy depth (Section 1 & 2).
 */
export interface TaxonomySubcategoryNode {
  id: string;
  slug: string;
  name: string;
  description?: string;
  depth: number;
  parentSlug?: string;
  parentId?: string;
  tags?: string[];
  children?: TaxonomySubcategoryNode[];
}

export interface TaxonomyCategory {
  id: string;
  slug: string;
  /** Legacy slug aliases so older bookmarks/links resolve seamlessly */
  legacyAliases?: string[];
  name: string;
  classification: ResourceClassification;
  shortDescription: string;
  overview?: string;
  overviewParagraph?: string;
  architecturalScope: string;
  /** Flat list of popular subcategory names for quick previews */
  subcategories: string[];
  /** Multi-level recursive subcategory tree (depth 2, 3, 4+) */
  subcategoryTree?: TaxonomySubcategoryNode[];
  tags?: string[];
  featuredResourceSlugs?: string[];
  relatedCategorySlugs?: string[];
  technologyAssociations?: string[];
  featuredVisualMotif?: string;
  parentSlug: string | null;
  orderIndex: number;
}

export interface SavedParameterPreset {
  id: string;
  resourceSlug: string;
  resourceTitle: string;
  presetName: string;
  parameterValues: Record<string, number | string | boolean>;
  createdAtIso: string;
}

export interface PersonalCollection {
  id: string;
  name: string;
  description: string;
  resourceSlugs: string[];
  savedPresets: SavedParameterPreset[];
  updatedAtIso: string;
}

export interface ArchitecturalLayerSpec {
  id: string;
  order: string;
  layerName: string;
  directoryPath: string;
  responsibility: string;
  keyEntitiesOrFiles: string[];
  scalabilityGuarantee: string;
}
