'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Layers,
  Shield,
  GitBranch,
  Database,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Trash2,
  BookmarkCheck,
  Sun,
  Moon,
  Accessibility,
} from 'lucide-react';
import {
  ArchitecturalLayerSpec,
  DesignResource,
  PersonalCollection,
  ResourceClassification,
  TaxonomyCategory,
} from '@/types/encyclopedia';
import { getClassificationDescriptor } from '@/lib/taxonomy/registry';
import { BRAND_CONFIG } from '@/config/brand.config';
import { Button, Tabs } from '@/components/ui/InteractionPrimitives';
import {
  ResourceCard,
  TechnicalLabel,
  SemanticAlert,
} from '@/components/ui/ContentPrimitives';

interface ArchitectureBlueprintViewerProps {
  categories: TaxonomyCategory[];
  resources: DesignResource[];
  layers: ArchitecturalLayerSpec[];
  selectedResourceSlug: string;
  onSelectAndLaunchResource: (slug: string) => void;
  collection: PersonalCollection;
  onToggleBookmark: (slug: string) => void;
  onRemovePreset: (presetId: string) => void;
  isDarkTheme: boolean;
  onToggleDarkTheme: () => void;
  globalReducedMotionSim: boolean;
  onToggleReducedMotionSim: () => void;
}

const ALL_CLASSIFICATIONS: ('all' | ResourceClassification)[] = [
  'all',
  'official-design-system',
  'design-methodology',
  'visual-style',
  'interaction-pattern',
  'ui-component',
  'animation-technique',
  'development-technology',
  'community-example',
];

export function ArchitectureBlueprintViewer({
  categories,
  resources,
  layers,
  selectedResourceSlug,
  onSelectAndLaunchResource,
  collection,
  onToggleBookmark,
  onRemovePreset,
  isDarkTheme,
  onToggleDarkTheme,
  globalReducedMotionSim,
  onToggleReducedMotionSim,
}: ArchitectureBlueprintViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<
    'all' | ResourceClassification
  >('all');
  const [selectedArchitectureTab, setSelectedArchitectureTab] = useState<string>(
    'entities-routing'
  );

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesClass =
        selectedClassification === 'all' ||
        res.classification === selectedClassification;
      if (!matchesClass) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        res.title.toLowerCase().includes(q) ||
        res.summary.toLowerCase().includes(q) ||
        res.sourceAttribution.authorOrOrganization.toLowerCase().includes(q) ||
        res.classification.toLowerCase().includes(q)
      );
    });
  }, [resources, selectedClassification, searchQuery]);

  return (
    <div className="space-y-16">
      {/* SECTION 02: EXTENSIBLE 8-CLASSIFICATION TAXONOMY & VERIFIED RESOURCE MATRIX */}
      <section
        id="taxonomy-explorer"
        aria-labelledby="taxonomy-heading"
        className="space-y-6 pt-6 border-t border-[var(--ds-border)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="02. EXTENSIBLE TAXONOMY"
              detail="Provenance Verification & 8 Canonical Classifications"
            />
            <h2
              id="taxonomy-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
            >
              Canonical 8-Classification Design Knowledge Graph
            </h2>
            <p className="text-sm text-[var(--ds-muted-foreground)] max-w-3xl">
              Strictly distinguishes official design systems, structural methodologies,
              visual styles, UI/UX patterns, accessible primitives, motion techniques,
              platform technologies, and attributed community examples.
            </p>
          </div>

          {/* Live Search Input */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-[var(--ds-subtle-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter concepts, specs, or authors..."
              aria-label="Filter encyclopedia resources by keyword"
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
            />
          </div>
        </div>

        {/* Reusable Tabs Component for Classification Filtering */}
        <Tabs
          ariaLabel="Filter by Canonical Classification"
          activeId={selectedClassification}
          onChange={(id) =>
            setSelectedClassification(id as 'all' | ResourceClassification)
          }
          items={ALL_CLASSIFICATIONS.map((key) => ({
            id: key,
            label:
              key === 'all'
                ? `All Classifications (${resources.length})`
                : getClassificationDescriptor(key).label,
          }))}
        />

        {/* Active Classification Verification Rule Banner */}
        {selectedClassification !== 'all' && (
          <SemanticAlert
            variant="info"
            title={getClassificationDescriptor(selectedClassification).label}
          >
            <span>
              {
                getClassificationDescriptor(selectedClassification)
                  .canonicalDefinition
              }{' '}
              <strong>Provenance Rule:</strong>{' '}
              {
                getClassificationDescriptor(selectedClassification)
                  .verificationRequirement
              }
            </span>
          </SemanticAlert>
        )}

        {/* Filtered Resource Directory Grid using Shared ResourceCard Primitive */}
        {filteredResources.length === 0 ? (
          <div className="p-8 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] text-center space-y-3">
            <p className="text-sm font-semibold text-[var(--ds-foreground)]">
              No encyclopedia entries match the active filter criteria.
            </p>
            <p className="text-xs text-[var(--ds-muted-foreground)] max-w-md mx-auto">
              The taxonomy engine supports all 8 classifications dynamically. Reset the
              classification filter or search query to inspect the verified seed concepts.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedClassification('all');
                setSearchQuery('');
              }}
            >
              Reset Taxonomy Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                isActiveInLab={res.slug === selectedResourceSlug}
                isBookmarked={collection.resourceSlugs.includes(res.slug)}
                onLaunch={onSelectAndLaunchResource}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}

        {/* Extensible Category Graph Table */}
        <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--ds-border)] flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
              Registered Domain Taxonomy Nodes ({categories.length} Primary Tracks)
            </h3>
            <span className="text-xs font-mono text-[var(--ds-muted-foreground)] tabular-nums">
              Schema: /lib/taxonomy/registry.ts
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--ds-border)] text-xs font-mono text-[var(--ds-muted-foreground)] bg-[var(--ds-muted)]/60">
                  <th className="py-2.5 px-4">Order</th>
                  <th className="py-2.5 px-4">Category Slug</th>
                  <th className="py-2.5 px-4">Taxonomy Track</th>
                  <th className="py-2.5 px-4">Canonical Classification</th>
                  <th className="py-2.5 px-4">Architectural Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ds-border)] text-xs">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-[var(--ds-muted)]/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono tabular-nums text-[var(--ds-subtle-foreground)]">
                      0{cat.orderIndex}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--ds-accent)]">
                      /taxonomy/{cat.slug}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[var(--ds-foreground)]">
                      {cat.name}
                    </td>
                    <td className="py-3 px-4 text-[var(--ds-muted-foreground)]">
                      {getClassificationDescriptor(cat.classification).label}
                    </td>
                    <td className="py-3 px-4 text-[var(--ds-subtle-foreground)]">
                      {cat.architecturalScope}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 03: GLOBAL DESIGN SYSTEM & ACCESSIBILITY WORKBENCH CONTROLS */}
      <section
        id="design-system-tokens"
        aria-labelledby="tokens-heading"
        className="space-y-6 pt-6 border-t border-[var(--ds-border)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="03. DESIGN SYSTEM ARCHITECTURE"
              detail="Editorial-Technical Visual Identity & Reusable Component Library"
            />
            <h2
              id="tokens-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
            >
              60-30-10 Semantic Tokens, Typography & Component Showcase
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={onToggleDarkTheme}
              leftIcon={
                isDarkTheme ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                )
              }
            >
              {isDarkTheme
                ? 'Switch to Light Canvas (#F6F8FA)'
                : 'Switch to Dark Charcoal (#0B0F17)'}
            </Button>

            <Button
              variant={globalReducedMotionSim ? 'secondary' : 'outline'}
              size="md"
              isSelected={globalReducedMotionSim}
              onClick={onToggleReducedMotionSim}
              leftIcon={<Accessibility className="w-3.5 h-3.5" />}
            >
              {globalReducedMotionSim
                ? 'Reduced-Motion Simulation: ON'
                : 'Simulate prefers-reduced-motion'}
            </Button>

            <Link href="/design-system">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                Open Full Component Showcase (/design-system)
              </Button>
            </Link>
          </div>
        </div>

        {/* 3-Column Design System Architecture Specification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-3">
            <div className="text-xs font-mono text-[var(--ds-accent)]">
              TYPOGRAPHIC HIERARCHY (2+1 RULE)
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
              Bricolage Grotesque · Plus Jakarta Sans · JetBrains Mono
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
              9 fluid typographic scales from Display and Page Title to 68ch Body Prose,
              Unboxed Metadata, and Tabular Monospace Telemetry.
            </p>
          </div>

          <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-3">
            <div className="text-xs font-mono text-[var(--ds-accent)]">
              PERSISTENT SEMANTIC COLOR SYSTEM
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
              Cool Neutral Light & Deep Charcoal Dark
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
              15 semantic tokens with restrained blue-violet accent (
              <code className="font-mono">#4338CA</code> /{' '}
              <code className="font-mono">#6366F1</code>) and session-persisted theme
              state via <code className="font-mono">ThemeProvider</code>.
            </p>
          </div>

          <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-3">
            <div className="text-xs font-mono text-[var(--ds-accent)]">
              25+ REUSABLE PRODUCTION PRIMITIVES
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
              Navigation · Content · Interaction · Technical
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
              Shared components under <code className="font-mono">/components/ui/*</code>{' '}
              power both the encyclopedia workbench and the live{' '}
              <Link
                href="/design-system"
                className="text-[var(--ds-accent)] font-semibold hover:underline"
              >
                /design-system
              </Link>{' '}
              route.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 04: TECHNICAL ARCHITECTURE, ROUTING, SANDBOX & SECURITY SPECIFICATION */}
      <section
        id="architecture-blueprint"
        aria-labelledby="architecture-heading"
        className="space-y-6 pt-6 border-t border-[var(--ds-border)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="04. SYSTEM ARCHITECTURE"
              detail="Layered Separation of Concerns & Security Guardrails"
            />
            <h2
              id="architecture-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
            >
              Modular Layered Architecture & Security Guardrails
            </h2>
          </div>

          <Tabs
            ariaLabel="Inspect System Architecture Views"
            activeId={selectedArchitectureTab}
            onChange={setSelectedArchitectureTab}
            items={[
              { id: 'entities-routing', label: 'Layers & App Routing' },
              { id: 'sandbox-security', label: 'Live-Demo & Security Strategy' },
              { id: 'environment-audit', label: 'Validated Runtime Audit' },
            ]}
          />
        </div>

        {selectedArchitectureTab === 'entities-routing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 5 Modular Layers */}
            <div className="lg:col-span-7 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] divide-y divide-[var(--ds-border)]">
              {layers.map((layer) => (
                <div key={layer.id} className="p-4 sm:p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                      {layer.order}. {layer.layerName}
                    </h3>
                    <span className="text-xs font-mono text-[var(--ds-accent)]">
                      {layer.directoryPath}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    {layer.responsibility}
                  </p>
                  <div className="text-xs font-mono text-[var(--ds-subtle-foreground)]">
                    Entities: {layer.keyEntitiesOrFiles.join(' · ')}
                  </div>
                </div>
              ))}
            </div>

            {/* App Router Strategy & Personal Collection Inspector */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[var(--ds-accent)]" />
                  <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                    Next.js 15 App Router Strategy
                  </h3>
                </div>
                <ul className="space-y-2.5 text-xs font-mono">
                  <li className="p-2.5 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)]">
                    <div className="font-semibold text-[var(--ds-foreground)]">
                      GET / (Active)
                    </div>
                    <div className="text-[var(--ds-muted-foreground)] font-sans mt-0.5">
                      Interactive Concept Lab, Taxonomy Graph & Architecture Workbench
                    </div>
                  </li>
                  <li className="p-2.5 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)]">
                    <div className="font-semibold text-[var(--ds-accent)]">
                      GET /design-system (Active)
                    </div>
                    <div className="text-[var(--ds-muted-foreground)] font-sans mt-0.5">
                      Interactive Design System & Reusable Component Showcase Route
                    </div>
                  </li>
                  <li className="p-2.5 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)]">
                    <div className="font-semibold text-[var(--ds-foreground)]">
                      GET /taxonomy/[categorySlug] & /concept/[slug] (Phase 2)
                    </div>
                    <div className="text-[var(--ds-muted-foreground)] font-sans mt-0.5">
                      SSR SEO-indexed category matrix and dedicated concept pages
                    </div>
                  </li>
                  <li className="p-2.5 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)]">
                    <div className="font-semibold text-[var(--ds-foreground)]">
                      GET /collections (Phase 3 Firebase Auth + Firestore)
                    </div>
                    <div className="text-[var(--ds-muted-foreground)] font-sans mt-0.5">
                      Cloud-synced personal collections & custom token preset library
                    </div>
                  </li>
                </ul>
              </div>

              {/* Personal Collection & Saved Parameter Presets Live Persistence Panel */}
              <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-[var(--ds-accent)]" />
                    <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                      Personal Collection Storage Adapter
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[var(--ds-muted-foreground)] tabular-nums">
                    {collection.resourceSlugs.length} Bookmarks ·{' '}
                    {collection.savedPresets.length} Presets
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-[var(--ds-subtle-foreground)]">
                    SAVED BOOKMARKS
                  </div>
                  {collection.resourceSlugs.length === 0 ? (
                    <p className="text-xs text-[var(--ds-muted-foreground)]">
                      No concepts bookmarked yet. Click &quot;Save&quot; on any resource card.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {collection.resourceSlugs.map((slug) => {
                        const item = resources.find((r) => r.slug === slug);
                        if (!item) return null;
                        return (
                          <Button
                            key={slug}
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectAndLaunchResource(slug)}
                          >
                            {item.title.split('&')[0].trim()}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {collection.savedPresets.length > 0 && (
                  <div className="pt-2 border-t border-[var(--ds-border)] space-y-2">
                    <div className="text-xs font-mono text-[var(--ds-subtle-foreground)]">
                      SAVED PARAMETER PRESET SNAPSHOTS
                    </div>
                    <ul className="space-y-1.5">
                      {collection.savedPresets.map((preset) => (
                        <li
                          key={preset.id}
                          className="flex items-center justify-between gap-2 text-xs p-2 bg-[var(--ds-background)] rounded-[6px] border border-[var(--ds-border)]"
                        >
                          <div className="truncate">
                            <span className="font-semibold text-[var(--ds-foreground)]">
                              {preset.resourceTitle.split('&')[0].trim()}
                            </span>
                            <span className="text-[var(--ds-muted-foreground)] font-mono">
                              {' '}
                              · {preset.presetName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemovePreset(preset.id)}
                            aria-label="Delete saved preset"
                            className="text-[var(--ds-subtle-foreground)] hover:text-[var(--ds-error)] p-1 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedArchitectureTab === 'sandbox-security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--ds-accent)]" />
                <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                  3-Tier Live-Demo Execution Strategy
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                <li>
                  <strong>Tier 1 (Native Parameterized Stage):</strong> Binds range sliders
                  and switches directly to scoped CSS Custom Properties and React state with
                  &lt; 2ms frame latency.
                </li>
                <li>
                  <strong>Tier 2 (CSP-Locked Iframe Sandbox):</strong> Compiles editable
                  code templates into an origin-isolated{' '}
                  <code className="font-mono">iframe srcdoc</code> with{' '}
                  <code className="font-mono">sandbox=&quot;&quot;</code> and strict Content
                  Security Policy headers.
                </li>
                <li>
                  <strong>Tier 3 (Lazy-Loaded Sandpack Studio — Phase 2):</strong>{' '}
                  On-demand multi-file bundler loaded only when requested to protect initial
                  Core Web Vitals.
                </li>
              </ul>
            </div>

            <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--ds-success)]" />
                <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                  Security & Performance Constraints
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                <li>
                  <strong>Zero Server-Side Code Execution:</strong> User-modified playground
                  code never touches Node.js <code className="font-mono">eval</code> or child
                  processes; all preview rendering is client-isolated.
                </li>
                <li>
                  <strong>Strict Secret Isolation:</strong> Server-only secrets (
                  <code className="font-mono">GEMINI_API_KEY</code>) are restricted to Next.js
                  route handlers and never exposed via{' '}
                  <code className="font-mono">NEXT_PUBLIC_</code>.
                </li>
                <li>
                  <strong>Compositor-Only Animation Budget:</strong> Motion demos animate
                  only <code className="font-mono">transform</code> and{' '}
                  <code className="font-mono">opacity</code>, respecting{' '}
                  <code className="font-mono">prefers-reduced-motion: reduce</code>.
                </li>
              </ul>
            </div>
          </div>
        )}

        {selectedArchitectureTab === 'environment-audit' && (
          <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[var(--ds-accent)]" />
              <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                Validated Google AI Studio Build Environment Matrix
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)]">
                <div className="font-mono text-[var(--ds-subtle-foreground)]">
                  FRAMEWORK & ROUTER
                </div>
                <div className="font-bold text-[var(--ds-foreground)] mt-1">
                  Next.js 15.4.9 (App Router)
                </div>
                <div className="text-[var(--ds-muted-foreground)] mt-1">
                  React 19.2.1 Server + Client Components verified.
                </div>
              </div>
              <div className="p-3.5 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)]">
                <div className="font-mono text-[var(--ds-subtle-foreground)]">
                  STYLING & TOKENS
                </div>
                <div className="font-bold text-[var(--ds-foreground)] mt-1">
                  Tailwind CSS 4.1.11
                </div>
                <div className="text-[var(--ds-muted-foreground)] mt-1">
                  PostCSS + @custom-variant dark + 15 Semantic Tokens.
                </div>
              </div>
              <div className="p-3.5 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)]">
                <div className="font-mono text-[var(--ds-subtle-foreground)]">
                  MOTION & ICONS
                </div>
                <div className="font-bold text-[var(--ds-foreground)] mt-1">
                  motion 12.23 + lucide-react
                </div>
                <div className="text-[var(--ds-muted-foreground)] mt-1">
                  Spring physics & functional affordance icons pre-installed.
                </div>
              </div>
              <div className="p-3.5 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)]">
                <div className="font-mono text-[var(--ds-subtle-foreground)]">
                  DESIGN SYSTEM DOCS
                </div>
                <div className="font-bold text-[var(--ds-foreground)] mt-1">
                  /docs/DESIGN_SYSTEM.md
                </div>
                <div className="text-[var(--ds-muted-foreground)] mt-1">
                  Live visual showcase at /design-system.
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 05: PHASED IMPLEMENTATION PLAN */}
      <section
        id="phased-roadmap"
        aria-labelledby="roadmap-heading"
        className="space-y-6 pt-6 border-t border-[var(--ds-border)]"
      >
        <div className="space-y-1.5">
          <TechnicalLabel
            kicker="05. CONTROLLED ENGINEERING ROADMAP"
            detail="Incremental Delivery Without Monolithic Rewrites"
          />
          <h2
            id="roadmap-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
          >
            Phased Implementation Plan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              phase: 'Phase 0',
              title: 'Foundation, Taxonomy & Live Concept Lab',
              status: 'Completed',
              isComplete: true,
              deliverables: [
                'Validated Next.js 15 + TypeScript strict foundation',
                'Configurable branding (/config/brand.config.ts)',
                '8-Classification Taxonomy & Primary Entities',
                'Interactive 2-Zone Concept Lab & CSP Sandbox',
              ],
            },
            {
              phase: 'Phase 1 (Current)',
              title: 'Global Visual Design System & Component Library',
              status: 'Completed',
              isComplete: true,
              deliverables: [
                'Editorial-technical visual language & 15 semantic color tokens',
                'Persistent Light/Dark ThemeProvider across sessions',
                '25+ reusable primitives (Navigation, Content, Interaction, Technical)',
                'Interactive Component Showcase route (/design-system)',
              ],
            },
            {
              phase: 'Phase 2 (Next)',
              title: 'Dynamic App Router Pages & Deep Comparison',
              status: 'Ready for Execution',
              isComplete: false,
              deliverables: [
                'Dedicated /taxonomy/[slug] and /concept/[slug] routes',
                'Multi-concept side-by-side parameter comparison view',
                'Expanded verified library across all 8 classifications',
                'Interactive SVG / Canvas motion timeline visualizer',
              ],
            },
            {
              phase: 'Phase 3',
              title: 'Firebase Persistence & Curation Console',
              status: 'Planned',
              isComplete: false,
              deliverables: [
                'Firebase Authentication & Firestore collection sync',
                'Security rules (firestore.rules) with RBAC validation',
                'Shareable parameter preset permalinks',
                'Admin taxonomy & attribution verification console',
              ],
            },
          ].map((item) => (
            <div
              key={item.phase}
              className={`p-5 rounded-[12px] border flex flex-col justify-between space-y-4 ${
                item.isComplete
                  ? 'bg-[var(--ds-secondary)]/30 border-[var(--ds-accent)]'
                  : 'bg-[var(--ds-surface)] border-[var(--ds-border)]'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--ds-foreground)]">
                    {item.phase}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      item.isComplete
                        ? 'text-[var(--ds-success)]'
                        : 'text-[var(--ds-muted-foreground)]'
                    }`}
                  >
                    {item.isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {item.status}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                  {item.title}
                </h3>

                <ul className="space-y-1.5 text-xs text-[var(--ds-muted-foreground)]">
                  {item.deliverables.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
