import { CmsResourceRecord } from '@/lib/admin/cms-types';
import {
  auditAndCompilePlaygroundFiles,
  buildIsolatedPlaygroundSrcDoc,
} from '@/lib/playground/security-validator';
import { PlaygroundDiagnosticMessage, PlaygroundFileEntry } from '@/lib/playground/types';

export interface PreviewValidationCheckItem {
  id:
    | 'identity-title-slug'
    | 'taxonomy-category'
    | 'documentation-explanation'
    | 'specimen-presence'
    | 'implementation-security-syntax'
    | 'live-preview-render'
    | 'attribution-license-source';
  number: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface PreviewValidationReport {
  canPublish: boolean;
  passedCount: number;
  totalChecks: number;
  checks: PreviewValidationCheckItem[];
  compilerDiagnostics: PlaygroundDiagnosticMessage[];
}

export function buildCmsResourcePlaygroundFiles(
  resource: CmsResourceRecord
): Record<string, PlaygroundFileEntry> {
  const isReact = resource.previewType === 'react';
  const isSvg = resource.previewType === 'svg';

  const htmlPath = isSvg ? '/specimen.svg' : '/index.html';
  const jsPath = isReact ? '/App.tsx' : '/index.js';

  return {
    [htmlPath]: {
      path: htmlPath,
      language: isSvg ? 'svg' : 'html',
      code: resource.codeHtml || '',
    },
    '/styles.css': {
      path: '/styles.css',
      language: 'css',
      code: resource.codeCss || '',
    },
    [jsPath]: {
      path: jsPath,
      language: isReact ? 'tsx' : 'javascript',
      code: resource.codeJs || '',
    },
  };
}

export function compileCmsResourcePreviewSrcDoc(
  resource: CmsResourceRecord,
  isDark: boolean,
  reducedMotion: boolean
): string {
  const files = buildCmsResourcePlaygroundFiles(resource);
  return buildIsolatedPlaygroundSrcDoc({
    files,
    customizationValues: {},
    isDark,
    reducedMotion,
    requiresLazyThreeWebGL: resource.previewType === 'three-webgl',
    simulateRuntimeError: false,
  });
}

/**
 * Section 5: 7-Point Preview & Publication Validation Workflow
 * Blocks publishing broken demos or incomplete specifications.
 */
export function evaluateCmsResourcePublishReadiness(
  resource: CmsResourceRecord,
  existingSlugs: string[] = [],
  isEditingExistingSlug = false,
  runtimeErrors: string[] = []
): PreviewValidationReport {
  const slugRegex = /^[a-z0-9-]+$/;
  const cleanTitle = (resource.title || '').trim();
  const cleanSlug = (resource.slug || '').trim();

  const isDuplicateSlug =
    !isEditingExistingSlug &&
    existingSlugs.some((s) => s.toLowerCase() === cleanSlug.toLowerCase());

  const titleAndSlugValid =
    cleanTitle.length >= 3 &&
    cleanTitle.length <= 140 &&
    cleanSlug.length >= 2 &&
    cleanSlug.length <= 120 &&
    slugRegex.test(cleanSlug) &&
    !isDuplicateSlug;

  const categoryValid = (resource.primaryCategory || '').trim().length >= 2;

  const explanationValid =
    (resource.shortDescription || '').trim().length >= 10 &&
    (resource.conceptExplanation || '').trim().length >= 20;

  const hasDemoSpecimen =
    (resource.codeHtml || '').trim().length >= 10 ||
    (resource.codeJs || '').trim().length >= 10;

  // Run static AST / balanced-delimiter / security policy audit on the preview files
  const files = buildCmsResourcePlaygroundFiles(resource);
  const auditResult = auditAndCompilePlaygroundFiles(files, {});

  const implementationValid =
    hasDemoSpecimen &&
    auditResult.isValid &&
    (resource.framework || '').trim().length >= 2;

  const previewRenderValid =
    Boolean(resource.previewVerified) &&
    runtimeErrors.length === 0 &&
    auditResult.isValid &&
    hasDemoSpecimen;

  const licenseAndSourceValid =
    (resource.license || '').trim().length >= 2 &&
    (resource.sources || '').trim().length >= 3;

  const checks: PreviewValidationCheckItem[] = [
    {
      id: 'identity-title-slug',
      number: '01',
      label: 'Valid Title & Unique Kebab-Case Slug',
      passed: titleAndSlugValid,
      detail: isDuplicateSlug
        ? `Duplicate slug conflict: "${cleanSlug}" already exists.`
        : titleAndSlugValid
          ? `Verified title (${cleanTitle.length} chars) and slug "/concept/${cleanSlug}".`
          : 'Title must be 3–140 chars and slug must match ^[a-z0-9-]+$.',
    },
    {
      id: 'taxonomy-category',
      number: '02',
      label: 'Primary Taxonomy Category Assigned',
      passed: categoryValid,
      detail: categoryValid
        ? `Assigned to primary category "${resource.primaryCategory}" (${resource.subcategories.length} subcategories).`
        : 'Assign a valid primary taxonomy category before publishing.',
    },
    {
      id: 'documentation-explanation',
      number: '03',
      label: 'Architectural Explanation & Summary Complete',
      passed: explanationValid,
      detail: explanationValid
        ? `Concept explanation (${resource.conceptExplanation.trim().length} chars) and short summary present.`
        : 'Provide a short description (>=10 chars) and concept explanation (>=20 chars).',
    },
    {
      id: 'specimen-presence',
      number: '04',
      label: 'Runnable Live Demo or Visual Specimen Present',
      passed: hasDemoSpecimen,
      detail: hasDemoSpecimen
        ? `Runnable ${resource.previewType} specimen buffer present (${resource.codeHtml.length + resource.codeCss.length + resource.codeJs.length} bytes).`
        : 'Add runnable HTML/SVG markup or JavaScript/React implementation buffers.',
    },
    {
      id: 'implementation-security-syntax',
      number: '05',
      label: 'Implementation Files & Sandbox Security Audit',
      passed: implementationValid,
      detail: !auditResult.isValid
        ? `Blocked by ${auditResult.diagnostics.length} compilation/security diagnostic(s): ${auditResult.diagnostics[0]?.message || ''}`
        : implementationValid
          ? `Zero syntax errors or forbidden sandbox tokens across all preview files (${resource.framework}).`
          : 'Specify implementation framework and resolve all syntax/security diagnostics.',
    },
    {
      id: 'live-preview-render',
      number: '06',
      label: 'Live Sandbox Preview Render Verified Without Runtime Errors',
      passed: previewRenderValid,
      detail:
        runtimeErrors.length > 0
          ? `Runtime error caught in sandbox: ${runtimeErrors[0]}`
          : previewRenderValid
            ? 'Live sandbox specimen executed and verified with zero runtime errors.'
            : 'Execute the live sandbox preview in Tab 2 (Preview) and click "Verify Live Preview Render".',
    },
    {
      id: 'attribution-license-source',
      number: '07',
      label: 'Source Citations & License Attribution Satisfied',
      passed: licenseAndSourceValid,
      detail: licenseAndSourceValid
        ? `License (${resource.license}) and specification sources documented.`
        : 'Provide both license terms and authoritative specification sources in Group 8.',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  return {
    canPublish: passedCount === checks.length,
    passedCount,
    totalChecks: checks.length,
    checks,
    compilerDiagnostics: auditResult.diagnostics,
  };
}
