'use client';

import React, { useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Sliders,
  Code2,
  Eye,
  ImageOff,
  Link2Off,
  Clock,
} from 'lucide-react';
import { DesignResource, TaxonomyCategory } from '@/types/encyclopedia';
import {
  getCategoryBySlug,
  getClassificationDescriptor,
} from '@/lib/taxonomy/registry';
import { Button } from '@/components/ui/InteractionPrimitives';

/* ============================================================================
 * 1. ZERO-PILL RESOURCE METADATA & LABELS
 * ========================================================================== */

export interface ResourceMetadataProps {
  items: (string | number)[];
  accentFirst?: boolean;
  className?: string;
}

/**
 * Renders metadata strictly as unboxed inline typography with middot (·) separators.
 * Never wraps static metadata in rounded pill capsules.
 */
export function ResourceMetadata({
  items,
  accentFirst = true,
  className = '',
}: ResourceMetadataProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-xs text-[var(--ds-muted-foreground)] ${className}`}
    >
      {items.map((item, idx) => (
        <React.Fragment key={`${item}-${idx}`}>
          {idx > 0 && <span aria-hidden="true">·</span>}
          <span
            className={
              idx === 0 && accentFirst
                ? 'font-semibold text-[var(--ds-accent)]'
                : typeof item === 'number'
                ? 'font-mono tabular-nums'
                : ''
            }
          >
            {item}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export interface TechnicalLabelProps {
  kicker: string;
  detail?: string;
}

export function TechnicalLabel({ kicker, detail }: TechnicalLabelProps) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono text-[var(--ds-accent)]">
      <span className="font-semibold">{kicker}</span>
      {detail && (
        <>
          <span aria-hidden="true" className="text-[var(--ds-muted-foreground)]">
            /
          </span>
          <span className="text-[var(--ds-muted-foreground)]">{detail}</span>
        </>
      )}
    </div>
  );
}

/* ============================================================================
 * 2. RESOURCE CARD (WITH LIVE MINI-PREVIEW, DEMO INDICATOR & FALLBACK STATES)
 * ========================================================================== */

export interface ResourceCardProps {
  resource: DesignResource;
  isActiveInLab?: boolean;
  isBookmarked?: boolean;
  forceBrokenMedia?: boolean;
  onLaunch: (slug: string) => void;
  onToggleBookmark: (slug: string) => void;
}

const AUDIENCE_LABELS: Record<DesignResource['audienceLevel'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'all-levels': 'All Levels',
};

export function ResourceCard({
  resource,
  isActiveInLab = false,
  isBookmarked = false,
  forceBrokenMedia = false,
  onLaunch,
  onToggleBookmark,
}: ResourceCardProps) {
  const [previewHovered, setPreviewHovered] = useState(false);
  const descriptor = getClassificationDescriptor(resource.classification);
  const isDraft = resource.publicationStatus === 'draft-preview';
  const isRunnableDemo =
    (resource.demonstrationFormat || 'runnable-code-demo') ===
    'runnable-code-demo';
  const showBrokenMediaFallback =
    forceBrokenMedia || Boolean(resource.simulateBrokenMedia);
  const hasMissingExternalRef = Boolean(
    resource.sourceAttribution.hasMissingExternalReference ||
      !resource.sourceAttribution.officialUrl
  );

  const associatedCategories = (
    resource.categorySlugs && resource.categorySlugs.length > 0
      ? resource.categorySlugs
      : [resource.categorySlug]
  )
    .map((slug) => getCategoryBySlug(slug)?.name || slug)
    .slice(0, 3);

  const technologiesList = [
    ...(resource.technologies || []),
    ...(resource.frameworks || []),
  ].slice(0, 4);

  const tagsList = (resource.tags || []).slice(0, 4);

  return (
    <article
      onMouseEnter={() => setPreviewHovered(true)}
      onMouseLeave={() => setPreviewHovered(false)}
      className={`flex flex-col justify-between p-5 rounded-[12px] border transition-colors ${
        isActiveInLab
          ? 'bg-[var(--ds-secondary)]/35 border-[var(--ds-accent)]'
          : isDraft
          ? 'bg-[var(--ds-surface)] border-dashed border-[var(--ds-border-strong)]'
          : 'bg-[var(--ds-surface)] border-[var(--ds-border)] hover:border-[var(--ds-border-strong)]'
      }`}
    >
      <div className="space-y-3">
        {/* Live Mini Preview / Schematic Thumbnail Stage */}
        <div
          aria-label={`Visual preview for ${resource.title}`}
          className="h-28 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] px-3.5 py-2.5 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Top bar: Interactive Demonstration Format vs Draft State */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono z-10">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ds-foreground)]">
              {isRunnableDemo ? (
                <>
                  <Code2 className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                  <span>Runnable Code Demo</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-[var(--ds-muted-foreground)]" />
                  <span>Visual Specimen</span>
                </>
              )}
            </span>

            {isDraft ? (
              <span className="inline-flex items-center gap-1 text-[var(--ds-warning)] font-semibold">
                <Clock className="w-3 h-3" />
                <span>Not Yet Published (Draft)</span>
              </span>
            ) : (
              <span className="text-[var(--ds-subtle-foreground)] tabular-nums">
                {resource.interactiveParameters.length} Live Params
              </span>
            )}
          </div>

          {/* Center Mini Schematic Stage or Broken Media Fallback */}
          {showBrokenMediaFallback ? (
            <div className="my-auto py-1.5 px-2.5 rounded bg-[var(--ds-surface)] border border-dashed border-[var(--ds-border-strong)] flex items-center justify-between gap-2 text-[11px] text-[var(--ds-muted-foreground)]">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <ImageOff className="w-3.5 h-3.5 text-[var(--ds-warning)] shrink-0" />
                <span>Media Specimen Unavailable · Graceful Code Fallback Active</span>
              </span>
            </div>
          ) : (
            <div className="my-auto flex items-center justify-between gap-3">
              {resource.demoArchetype === 'token-surface-hierarchy' && (
                <div className="w-full flex items-center gap-2">
                  {[0, 1, 2].map((layerIdx) => (
                    <div
                      key={layerIdx}
                      style={{
                        transform: previewHovered
                          ? `translateY(-${layerIdx * 2}px)`
                          : 'none',
                      }}
                      className="flex-1 h-10 rounded-[6px] border border-[var(--ds-border-strong)] bg-[var(--ds-surface)] px-2.5 flex items-center justify-between transition-transform duration-150"
                    >
                      <span className="font-mono text-[10px] text-[var(--ds-muted-foreground)]">
                        $layer-0{layerIdx + 1}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--ds-accent)]" />
                    </div>
                  ))}
                </div>
              )}

              {resource.demoArchetype === 'spring-motion-physics' && (
                <div className="w-full flex items-center justify-between px-2">
                  <div className="text-[10px] font-mono text-[var(--ds-muted-foreground)]">
                    k={String(resource.interactiveParameters[0]?.defaultValue ?? 320)} · c=
                    {String(resource.interactiveParameters[1]?.defaultValue ?? 26)}
                  </div>
                  <div
                    style={{
                      transform: previewHovered
                        ? 'translateX(-14px) scale(1.04)'
                        : 'translateX(0px) scale(1)',
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-mono text-[10px] font-bold transition-transform duration-200"
                  >
                    {previewHovered ? 'Velocity Active' : 'Spring Equilibrium'}
                  </div>
                </div>
              )}

              {resource.demoArchetype === 'swiss-typographic-grid' && (
                <div className="w-full grid grid-cols-6 gap-1.5 items-end">
                  <div className="col-span-4 h-9 rounded-[4px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] px-2 flex items-center font-display text-xs font-bold text-[var(--ds-foreground)]">
                    Aa · Ratio 1:1.414
                  </div>
                  <div className="col-span-2 h-9 rounded-[4px] bg-[var(--ds-secondary)] border border-[var(--ds-accent)]/40 px-2 flex items-center justify-end font-mono text-[10px] text-[var(--ds-accent)] tabular-nums">
                    6-Col Grid
                  </div>
                </div>
              )}

              {resource.demoArchetype === 'accessible-combobox-pattern' && (
                <div className="w-full h-9 rounded-[6px] bg-[var(--ds-surface)] border-2 border-[var(--ds-focus)] px-2.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--ds-foreground)] truncate">
                    role=&quot;combobox&quot; · aria-expanded
                  </span>
                  <span className="text-[var(--ds-accent)] font-bold">2px Focus</span>
                </div>
              )}

              {resource.demoArchetype === 'fluid-container-card' && (
                <div className="w-full h-9 rounded-[6px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] px-2.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--ds-foreground)]">@container (min-width: 420px)</span>
                  <span className="text-[var(--ds-accent)] tabular-nums">
                    {previewHovered ? '92% Inline' : '78% Inline'}
                  </span>
                </div>
              )}

              {resource.demoArchetype === 'neobrutalist-contrast-study' && (
                <div
                  style={{
                    boxShadow: previewHovered
                      ? '2px 2px 0px 0px var(--ds-foreground)'
                      : '4px 4px 0px 0px var(--ds-foreground)',
                  }}
                  className="w-full h-9 rounded-[4px] bg-[var(--ds-secondary)] border-2 border-[var(--ds-foreground)] px-2.5 flex items-center justify-between text-[10px] font-mono font-bold text-[var(--ds-foreground)] transition-shadow"
                >
                  <span>2PX SOLID PERIMETER</span>
                  <span>14.8:1 AAA</span>
                </div>
              )}
            </div>
          )}

          {/* Bottom bar: Difficulty & Accessibility Support */}
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[var(--ds-muted-foreground)]">
            <span>Difficulty: {AUDIENCE_LABELS[resource.audienceLevel]}</span>
            <span>
              WCAG {resource.accessibilitySpec.wcagComplianceLevel} (
              {resource.accessibilitySpec.minContrastRatio}:1) · Responsive
            </span>
          </div>
        </div>

        {/* Classification & Year Metadata (Zero-Pill Unboxed Text) */}
        <ResourceMetadata
          items={[
            descriptor.label,
            resource.subcategory || 'Core Specification',
            resource.sourceAttribution.firstPublishedYear,
          ]}
        />

        {/* Title & Short Description */}
        <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)] leading-snug">
          {resource.title}
        </h3>

        <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
          {resource.summary}
        </p>

        {/* Multi-Category Membership, Technologies & Tags (Zero-Pill Inline Typography) */}
        <div className="pt-2 space-y-1.5 text-[11px] border-t border-[var(--ds-border)]">
          <div className="text-[var(--ds-muted-foreground)] leading-snug">
            <span className="font-mono font-semibold text-[var(--ds-foreground)]">
              Categories:{' '}
            </span>
            {associatedCategories.join(' · ')}
          </div>

          {technologiesList.length > 0 && (
            <div className="text-[var(--ds-muted-foreground)] leading-snug">
              <span className="font-mono font-semibold text-[var(--ds-foreground)]">
                Tech & Frameworks:{' '}
              </span>
              {technologiesList.join(' · ')}
            </div>
          )}

          {tagsList.length > 0 && (
            <div className="font-mono text-[10px] text-[var(--ds-subtle-foreground)] truncate">
              Tags: {tagsList.map((t) => `#${t}`).join(' · ')}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Provenance, Missing External Reference State & Actions */}
      <div className="pt-3.5 mt-3.5 border-t border-[var(--ds-border)] space-y-3">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[var(--ds-subtle-foreground)] truncate">
            Provenance: {resource.sourceAttribution.authorOrOrganization}
          </span>
          {hasMissingExternalRef && (
            <span
              title="External reference link is archived or pending verification"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--ds-warning)] shrink-0"
            >
              <Link2Off className="w-3 h-3" />
              <span>Local Archive Only</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant={isActiveInLab ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onLaunch(resource.slug)}
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            {isActiveInLab
              ? 'Active in Lab'
              : isDraft
              ? 'Preview Draft Spec'
              : isRunnableDemo
              ? 'Run Live Demo'
              : 'Inspect Specimen'}
          </Button>

          <Button
            variant={isBookmarked ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onToggleBookmark(resource.slug)}
            leftIcon={<Bookmark className="w-3.5 h-3.5" />}
          >
            {isBookmarked ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>
    </article>
  );
}

/* ============================================================================
 * 3. CATEGORY CARD
 * ========================================================================== */

export interface CategoryCardProps {
  category: TaxonomyCategory;
  resourceCount: number;
  isSelected?: boolean;
  onSelectCategory: (categorySlug: string) => void;
}

export function CategoryCard({
  category,
  resourceCount,
  isSelected = false,
  onSelectCategory,
}: CategoryCardProps) {
  const descriptor = getClassificationDescriptor(category.classification);

  return (
    <div
      className={`p-5 rounded-[12px] border flex flex-col justify-between space-y-4 transition-colors ${
        isSelected
          ? 'bg-[var(--ds-secondary)]/35 border-[var(--ds-accent)]'
          : 'bg-[var(--ds-surface)] border-[var(--ds-border)] hover:border-[var(--ds-border-strong)]'
      }`}
    >
      <div className="space-y-2">
        <ResourceMetadata
          items={[
            `Category ${String(category.orderIndex).padStart(2, '0')}`,
            descriptor.label,
            `${resourceCount} ${resourceCount === 1 ? 'Resource' : 'Resources'}`,
          ]}
        />
        <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
          {category.name}
        </h3>
        <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
          {category.shortDescription}
        </p>
      </div>

      <div className="pt-3 border-t border-[var(--ds-border)] flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-[var(--ds-subtle-foreground)] truncate">
          {category.subcategories.length} Subcategories
        </span>
        <Button
          variant={isSelected ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onSelectCategory(category.slug)}
        >
          {isSelected ? 'Filtered' : 'Explore Track'}
        </Button>
      </div>
    </div>
  );
}

/* ============================================================================
 * 4. FEATURED RESOURCE CARD
 * ========================================================================== */

export interface FeaturedResourceCardProps {
  resource: DesignResource;
  onLaunch: (slug: string) => void;
}

export function FeaturedResourceCard({
  resource,
  onLaunch,
}: FeaturedResourceCardProps) {
  const descriptor = getClassificationDescriptor(resource.classification);

  return (
    <div className="p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div className="lg:col-span-8 space-y-3">
        <ResourceMetadata
          items={[
            'Featured Interactive Monograph',
            descriptor.label,
            `WCAG ${resource.accessibilitySpec.wcagComplianceLevel} (${resource.accessibilitySpec.minContrastRatio}:1)`,
          ]}
        />
        <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] text-balance">
          {resource.title}
        </h3>
        <p className="text-sm text-[var(--ds-muted-foreground)] leading-relaxed max-w-2xl">
          {resource.summary}
        </p>
        <div className="pt-1 flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--ds-subtle-foreground)]">
          <Sliders className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
          <span>Parameters:</span>
          {resource.interactiveParameters.map((p, i) => (
            <React.Fragment key={p.key}>
              {i > 0 && <span aria-hidden="true">·</span>}
              <span>
                {p.label} ({String(p.defaultValue)}
                {p.unit || ''})
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-3 border-t lg:border-t-0 lg:border-l border-[var(--ds-border)] pt-4 lg:pt-0 lg:pl-6">
        <div className="text-xs text-[var(--ds-muted-foreground)] lg:text-right">
          <div className="font-semibold text-[var(--ds-foreground)]">
            {resource.sourceAttribution.authorOrOrganization}
          </div>
          <div className="font-mono text-[11px] mt-0.5">
            {resource.sourceAttribution.licenseType}
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => onLaunch(resource.slug)}
          rightIcon={<ArrowUpRight className="w-4 h-4" />}
        >
          Experiment in Concept Lab
        </Button>
      </div>
    </div>
  );
}

/* ============================================================================
 * 5. RELATED RESOURCE CARD
 * ========================================================================== */

export interface RelatedResourceCardProps {
  resource: DesignResource;
  relationshipLabel?: string;
  onSelect: (slug: string) => void;
}

export function RelatedResourceCard({
  resource,
  relationshipLabel = 'Related Concept',
  onSelect,
}: RelatedResourceCardProps) {
  const descriptor = getClassificationDescriptor(resource.classification);

  return (
    <button
      type="button"
      onClick={() => onSelect(resource.slug)}
      className="w-full text-left p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors flex items-center justify-between gap-4 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)]"
    >
      <div className="min-w-0 space-y-1">
        <ResourceMetadata items={[relationshipLabel, descriptor.label]} />
        <div className="font-display text-sm font-bold text-[var(--ds-foreground)] group-hover:text-[var(--ds-accent)] transition-colors truncate">
          {resource.title}
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-[var(--ds-muted-foreground)] group-hover:text-[var(--ds-accent)] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}

/* ============================================================================
 * 6. ACCESSIBLE SEMANTIC ALERT (Zero Thick Left Accent Border)
 * ========================================================================== */

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface SemanticAlertProps {
  variant: AlertVariant;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SemanticAlert({
  variant,
  title,
  children,
  action,
}: SemanticAlertProps) {
  const variantMap: Record<
    AlertVariant,
    {
      icon: React.ReactNode;
      statusCode: string;
      containerClass: string;
      titleClass: string;
    }
  > = {
    info: {
      icon: <Info className="w-4 h-4 text-[var(--ds-accent)] shrink-0 mt-0.5" />,
      statusCode: 'SPECIFICATION NOTE',
      containerClass:
        'bg-[var(--ds-secondary)]/50 border-[var(--ds-border-strong)]',
      titleClass: 'text-[var(--ds-foreground)]',
    },
    success: {
      icon: (
        <CheckCircle2 className="w-4 h-4 text-[var(--ds-success)] shrink-0 mt-0.5" />
      ),
      statusCode: 'WCAG AUDIT VERIFIED',
      containerClass:
        'bg-[var(--ds-success-surface)] border-[var(--ds-success-border)]',
      titleClass: 'text-[var(--ds-foreground)]',
    },
    warning: {
      icon: (
        <AlertTriangle className="w-4 h-4 text-[var(--ds-warning)] shrink-0 mt-0.5" />
      ),
      statusCode: 'ARCHITECTURAL CAUTION',
      containerClass:
        'bg-[var(--ds-warning-surface)] border-[var(--ds-warning-border)]',
      titleClass: 'text-[var(--ds-foreground)]',
    },
    error: {
      icon: (
        <AlertOctagon className="w-4 h-4 text-[var(--ds-error)] shrink-0 mt-0.5" />
      ),
      statusCode: 'CONTRAST / SCHEMA VIOLATION',
      containerClass:
        'bg-[var(--ds-error-surface)] border-[var(--ds-error-border)]',
      titleClass: 'text-[var(--ds-foreground)]',
    },
  };

  const cfg = variantMap[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`p-4 rounded-[10px] border ${cfg.containerClass} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
    >
      <div className="flex items-start gap-3">
        {cfg.icon}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-[var(--ds-muted-foreground)]">
              {cfg.statusCode}
            </span>
            <span aria-hidden="true" className="text-xs text-[var(--ds-muted-foreground)]">
              ·
            </span>
            <h4 className={`font-display text-xs font-bold ${cfg.titleClass}`}>
              {title}
            </h4>
          </div>
          <div className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
            {children}
          </div>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
