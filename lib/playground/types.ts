/**
 * Core Architecture Types for the Reusable Live Preview Engine & Interactive Code Playground.
 * Strictly separates:
 * 1. Preview Configuration
 * 2. Source Files
 * 3. Dependencies (Reviewed & Permitted Whitelist)
 * 4. Device Viewport & Custom Dimensions
 * 5. Runtime & Compilation Errors
 * 6. Customization Controls & Resource-Specific Settings
 */

export type PlaygroundTemplateCategory =
  | 'vanilla'
  | 'react'
  | 'svg'
  | 'canvas'
  | 'three-webgl';

export type PlaygroundExecutionEngineMode =
  | 'origin-isolated-iframe'
  | 'sandpack-bundler';

export type PlaygroundEditorTheme = 'graphite-dark' | 'editorial-light';

export type PlaygroundDevicePreset =
  | 'fluid'
  | 'desktop'
  | 'tablet'
  | 'mobile'
  | 'custom';

export interface PlaygroundFileEntry {
  path: string;
  language: 'html' | 'css' | 'javascript' | 'tsx' | 'svg' | 'json';
  code: string;
  readOnly?: boolean;
  hidden?: boolean;
  isEntry?: boolean;
}

export interface PlaygroundPermittedDependency {
  name: string;
  version: string;
  description: string;
  lazyLoadOnlyWhenNeeded?: boolean;
}

export interface PlaygroundDeviceViewport {
  preset: PlaygroundDevicePreset;
  widthPx: number | '100%';
  heightPx: number;
}

export interface PlaygroundDiagnosticMessage {
  id: string;
  phase: 'compilation' | 'runtime' | 'security-policy' | 'console';
  severity: 'error' | 'warning' | 'info';
  file?: string;
  line?: number;
  column?: number;
  message: string;
  timestampIso: string;
}

export interface PlaygroundCustomizationSetting {
  key: string;
  label: string;
  controlType: 'range' | 'select' | 'boolean';
  value: number | string | boolean;
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string }[];
  targetCssVariable?: string;
}

export interface PlaygroundTemplateConfig {
  id: string;
  title: string;
  subtitle: string;
  category: PlaygroundTemplateCategory;
  sandpackTemplate: 'vanilla' | 'react' | 'react-ts';
  associatedResourceSlug?: string;
  activeFile: string;
  files: Record<string, PlaygroundFileEntry>;
  dependencies: Record<string, string>;
  customizationSettings: PlaygroundCustomizationSetting[];
  requiresLazyThreeWebGL?: boolean;
}

export interface SavedPlaygroundExperiment {
  id: string;
  name: string;
  templateId: string;
  category: PlaygroundTemplateCategory;
  associatedResourceSlug?: string;
  files: Record<string, PlaygroundFileEntry>;
  customizationValues: Record<string, number | string | boolean>;
  updatedAtIso: string;
}
