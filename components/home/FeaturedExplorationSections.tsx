'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Code2,
  Play,
  Sparkles,
  Clock,
  Bookmark,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import {
  DesignResource,
  PersonalCollection,
  TaxonomyCategory,
} from '@/types/encyclopedia';
import {
  getCategoryResourceCount,
  getClassificationDescriptor,
} from '@/lib/taxonomy/registry';
import {
  Button,
  Tabs,
  Accordion,
  DropdownMenu,
  useToast,
} from '@/components/ui/InteractionPrimitives';
import {
  ResourceMetadata,
  TechnicalLabel,
  ResourceCard,
  SemanticAlert,
} from '@/components/ui/ContentPrimitives';
import { useTheme } from '@/components/providers/ThemeProvider';

interface FeaturedExplorationSectionsProps {
  categories: TaxonomyCategory[];
  resources: DesignResource[];
  collection: PersonalCollection;
  onSelectConceptForLab: (slug: string) => void;
  onToggleBookmark: (slug: string) => void;
}

export function FeaturedExplorationSections({
  categories,
  resources,
  collection,
  onSelectConceptForLab,
  onToggleBookmark,
}: FeaturedExplorationSectionsProps) {
  const { reducedMotionSim } = useTheme();
  const systemReducedMotion = useReducedMotion();
  const isReducedMotion = Boolean(systemReducedMotion || reducedMotionSim);
  const { pushToast } = useToast();

  // C. Motion of the Week Interactive State
  const [motwExpanded, setMotwExpanded] = useState(false);
  const [motwStiffness, setMotwStiffness] = useState(340);
  const [motwDamping, setMotwDamping] = useState(22);

  // D. Interactive Components Section State
  const [demoTab, setDemoTab] = useState('aria-combobox');
  const [demoDropdown, setDemoDropdown] = useState('token-tier-2');

  // E. Visual Design Styles Comparator State
  const [activeVisualStyle, setActiveVisualStyle] = useState<
    'swiss-editorial' | 'neobrutalist' | 'industrial-minimal'
  >('swiss-editorial');

  const featuredDesignSystems = resources.filter(
    (r) => r.classification === 'official-design-system'
  );
  const recentlyAddedList = resources.filter((r) => r.isRecentlyAdded);
  const curatedPopularSamples = resources.filter(
    (r) => r.isCuratedPopularSample
  );

  return (
    <div className="space-y-16">
      {/* ====================================================================
       * A. EXPLORE BY CATEGORY (ALL 16 PRIMARY DESIGN CATEGORIES)
       * ================================================================== */}
      <section
        id="explore-categories"
        aria-labelledby="categories-heading"
        className="space-y-6 pt-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--ds-border)] pb-4">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="5A. EXPLORE BY CATEGORY"
              detail="16 Primary Design Categories · Unlimited Subcategory Depth · 12 Resource Types"
            />
            <h2
              id="categories-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
            >
              16 Core Domains of Digital Design & Engineering
            </h2>
            <p className="text-sm text-[var(--ds-muted-foreground)] max-w-3xl">
              Navigate directly into any primary category to explore multi-level
              subcategories, interactive parameter sandboxes, and production code
              specifications—or filter the complete catalog in the Resource Directory.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-[var(--ds-subtle-foreground)] tabular-nums">
              16 Categories · {resources.length} Monographs
            </span>
            <Link href="/directory">
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                Open Full Resource Directory
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const desc = getClassificationDescriptor(cat.classification);
            const count = getCategoryResourceCount(cat, resources);
            return (
              <Link
                key={cat.id}
                href={`/taxonomy/${cat.slug}`}
                className="group p-4 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] flex flex-col justify-between space-y-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[var(--ds-accent)] tabular-nums">
                      {String(cat.orderIndex).padStart(2, '0')} · {desc.label.split(' ')[0]} · {count}{' '}
                      {count === 1 ? 'Item' : 'Items'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ds-muted-foreground)] group-hover:text-[var(--ds-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <h3 className="font-display text-base font-bold text-[var(--ds-foreground)] group-hover:text-[var(--ds-accent)] transition-colors leading-snug">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    {cat.shortDescription}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[var(--ds-border)]">
                  <div className="text-[11px] text-[var(--ds-subtle-foreground)] truncate">
                    {cat.subcategories.slice(0, 4).join(' · ')}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
       * B. FEATURED DESIGN SYSTEMS
       * ================================================================== */}
      <section
        id="featured-design-systems"
        aria-labelledby="featured-systems-heading"
        className="space-y-6 pt-8 border-t border-[var(--ds-border)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="5B. FEATURED DESIGN SYSTEMS"
              detail="Verified Official Specifications & Token Architectures"
            />
            <h2
              id="featured-systems-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
            >
              Editorially Curated Design Systems
            </h2>
            <p className="text-sm text-[var(--ds-muted-foreground)] max-w-3xl">
              Traceable, accurately attributed analyses of industry-defining design
              systems—distinguishing token tiers, spatial grids, and interaction
              physics.
            </p>
          </div>
          <Link href="/taxonomy/design-systems">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Explore Design Systems Category
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {featuredDesignSystems.map((sys) => (
            <ResourceCard
              key={sys.id}
              resource={sys}
              isBookmarked={collection.resourceSlugs.includes(sys.slug)}
              onLaunch={onSelectConceptForLab}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      </section>

      {/* ====================================================================
       * C. MOTION OF THE WEEK
       * ================================================================== */}
      <section
        id="motion-of-the-week"
        aria-labelledby="motw-heading"
        className="space-y-6 pt-8 border-t border-[var(--ds-border)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="5C. MOTION OF THE WEEK"
              detail="Featured Interactive Choreography Study"
            />
            <h2
              id="motw-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
            >
              Damped Harmonic Spring Oscillators & Interruptible Velocity
            </h2>
          </div>
          <Link href="/concept/damped-harmonic-spring-choreography">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              Open Full Motion Monograph
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-4">
            <ResourceMetadata
              items={[
                'Hooke’s Law Oscillator',
                `k = ${motwStiffness} N/m`,
                `c = ${motwDamping} Ns/m`,
                `ζ = ${(motwDamping / (2 * Math.sqrt(motwStiffness))).toFixed(2)}`,
              ]}
            />
            <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
              Unlike fixed-duration bezier timers, spring physics preserve kinetic
              momentum when retargeted mid-flight. Adjust stiffness and damping
              below, then trigger the layout projection stage.
            </p>

            <div className="space-y-3 pt-1">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <label htmlFor="motw-k" className="font-semibold">
                    Spring Stiffness (k)
                  </label>
                  <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                    {motwStiffness} N/m
                  </span>
                </div>
                <input
                  id="motw-k"
                  type="range"
                  min={120}
                  max={580}
                  step={20}
                  value={motwStiffness}
                  onChange={(e) => setMotwStiffness(Number(e.target.value))}
                  className="w-full accent-[var(--ds-primary)]"
                />
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <label htmlFor="motw-c" className="font-semibold">
                    Damping Coefficient (c)
                  </label>
                  <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                    {motwDamping} Ns/m
                  </span>
                </div>
                <input
                  id="motw-c"
                  type="range"
                  min={8}
                  max={56}
                  step={2}
                  value={motwDamping}
                  onChange={(e) => setMotwDamping(Number(e.target.value))}
                  className="w-full accent-[var(--ds-primary)]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Play className="w-3.5 h-3.5" />}
                onClick={() => setMotwExpanded((p) => !p)}
              >
                {motwExpanded ? 'Reverse Mid-Flight' : 'Trigger Spring Projection'}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() =>
                  onSelectConceptForLab('damped-harmonic-spring-choreography')
                }
              >
                Load in Concept Lab
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 h-52 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-y-4 left-8 border-l border-dashed border-[var(--ds-border-strong)]" />
            <div className="absolute inset-y-4 right-8 border-l border-dashed border-[var(--ds-accent)]/50" />

            <motion.div
              animate={{
                x: motwExpanded ? 180 : 0,
                scale: motwExpanded ? 1.06 : 1,
              }}
              transition={
                isReducedMotion
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: motwStiffness,
                      damping: motwDamping,
                    }
              }
              onClick={() => setMotwExpanded((p) => !p)}
              className="w-56 p-4 rounded-[10px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] shadow-lg cursor-pointer select-none space-y-1.5"
            >
              <div className="text-[10px] font-mono opacity-85">
                {isReducedMotion ? 'WCAG 2.3.3 SNAP' : 'ACTIVE OSCILLATOR'}
              </div>
              <div className="font-display text-sm font-bold">
                {motwExpanded ? 'Projected State B (+180px)' : 'Origin State A (0px)'}
              </div>
              <div className="text-[11px] opacity-90">
                Click card anytime to test mid-flight velocity interruption.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * D. INTERACTIVE COMPONENTS & E. VISUAL DESIGN STYLES (2-COLUMN SPLIT)
       * ================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-[var(--ds-border)]">
        {/* 5D. INTERACTIVE COMPONENTS (6 Cols) */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="5D. INTERACTIVE COMPONENTS"
              detail="WAI-ARIA 1.2 Primitives · Live Manipulation"
            />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)]">
              Test Accessible UI Primitives Live
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)]">
              Interact directly with keyboard-navigable tabs, dropdowns, disclosures,
              and live region toast alerts.
            </p>
          </div>

          <div className="p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Tabs
                  ariaLabel="Interactive Component Sampler"
                  activeId={demoTab}
                  onChange={setDemoTab}
                  items={[
                    { id: 'aria-combobox', label: 'ARIA Tabs' },
                    { id: 'focus-trap', label: 'Focus Ring' },
                    { id: 'roving-index', label: 'Roving Index' },
                  ]}
                />

                <DropdownMenu
                  triggerLabel={`Token Tier: ${demoDropdown}`}
                  selectedId={demoDropdown}
                  onSelect={(id) => {
                    setDemoDropdown(id);
                    pushToast({
                      tone: 'info',
                      title: `Switched Token Tier to ${id}`,
                    });
                  }}
                  options={[
                    {
                      id: 'token-tier-1',
                      label: 'Tier 1: Reference Seed Palette',
                    },
                    {
                      id: 'token-tier-2',
                      label: 'Tier 2: Semantic System Roles',
                    },
                    {
                      id: 'token-tier-3',
                      label: 'Tier 3: Component Scoped Tokens',
                    },
                  ]}
                />
              </div>

              <Accordion
                defaultOpenIds={['comp-acc-1']}
                items={[
                  {
                    id: 'comp-acc-1',
                    title: 'Deterministic Keyboard State Machine',
                    metadata: 'WAI-ARIA APG',
                    content:
                      'Every interactive component enforces visible 2px focus outlines, Escape key dismissal, and Arrow key navigation without trapping screen reader focus.',
                  },
                  {
                    id: 'comp-acc-2',
                    title: 'Touch-Friendly Mobile Ergonomics',
                    metadata: '>= 44px Hit Targets',
                    content:
                      'Interactive controls scale padding and hit regions on coarse pointers so mobile navigation never feels like a cramped desktop view.',
                  },
                ]}
              />
            </div>

            <div className="pt-3 border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={() =>
                  pushToast({
                    tone: 'success',
                    title: 'Accessible Toast Dispatched',
                    description: 'Broadcast via aria-live="polite" notification queue.',
                  })
                }
              >
                Test Live Toast Alert
              </Button>
              <Link
                href="/design-system"
                className="text-xs font-semibold text-[var(--ds-accent)] hover:underline inline-flex items-center gap-1"
              >
                Explore All 25+ Primitives
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5E. VISUAL DESIGN STYLES (6 Cols) */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <TechnicalLabel
              kicker="5E. VISUAL DESIGN STYLES"
              detail="Live Aesthetic & Surface Physics Comparator"
            />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)]">
              Compare Visual Aesthetics in Real Time
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)]">
              Switch aesthetic presets below to observe how identical semantic content
              transforms across visual movements.
            </p>
          </div>

          <div className="p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-4 flex-1 flex flex-col justify-between">
            <Tabs
              ariaLabel="Select Visual Style Specimen"
              activeId={activeVisualStyle}
              onChange={(id) =>
                setActiveVisualStyle(
                  id as 'swiss-editorial' | 'neobrutalist' | 'industrial-minimal'
                )
              }
              items={[
                { id: 'swiss-editorial', label: '01. Swiss International' },
                { id: 'neobrutalist', label: '02. Neo-Brutalism' },
                { id: 'industrial-minimal', label: '03. Tactile Industrial' },
              ]}
            />

            {/* Dynamic Live Style Specimen Stage */}
            <div className="p-5 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] flex items-center justify-center">
              {activeVisualStyle === 'swiss-editorial' && (
                <div className="w-full p-5 bg-[var(--ds-surface)] border-t-4 border-x border-b border-[var(--ds-foreground)] space-y-3">
                  <div className="grid grid-cols-3 gap-4 border-b border-[var(--ds-border)] pb-2 text-[11px] font-mono text-[var(--ds-muted-foreground)]">
                    <span>ZÜRICH 1981</span>
                    <span>GRID: 6-TRACK</span>
                    <span className="text-right">14.2:1 AAA</span>
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-tight text-[var(--ds-foreground)] leading-none">
                    Objective Asymmetric Hangline
                  </h3>
                  <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    Mathematical grid proportions, zero decorative drop-shadows, and
                    stark typographic scale hierarchy.
                  </p>
                </div>
              )}

              {activeVisualStyle === 'neobrutalist' && (
                <div
                  style={{
                    boxShadow: '6px 6px 0px 0px var(--ds-foreground)',
                  }}
                  className="w-full p-5 bg-[var(--ds-secondary)] border-2 border-[var(--ds-foreground)] rounded-[4px] space-y-3"
                >
                  <div className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                    EXPOSED 2PX INK PERIMETER · 0PX BLUR OFFSET
                  </div>
                  <h3 className="font-display text-xl font-bold text-[var(--ds-foreground)]">
                    Architectural Neo-Brutalist Plane
                  </h3>
                  <p className="text-xs text-[var(--ds-foreground)]/85 leading-relaxed">
                    Unblurred geometric offset shadows and honest structural box
                    boundaries inspired by mid-century Brutalism.
                  </p>
                </div>
              )}

              {activeVisualStyle === 'industrial-minimal' && (
                <div className="w-full p-5 bg-slate-950 text-slate-100 border border-slate-800 rounded-[10px] space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400 tabular-nums">
                    <span>SPECIMEN: TACTILE INSTRUMENT</span>
                    <span>PITCH: 4.00mm</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Precision Hardware Minimalism
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    High-density tabular telemetry, recessed matte graphite wells, and
                    restrained monochromatic accents.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[var(--ds-border)] flex items-center justify-between text-xs">
              <span className="font-mono text-[var(--ds-muted-foreground)]">
                Style Classification: Visual Style & Aesthetic
              </span>
              <Link
                href="/taxonomy/visual-aesthetics"
                className="font-semibold text-[var(--ds-accent)] hover:underline inline-flex items-center gap-1"
              >
                Explore Visual Styles Track
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * F. EXPLORE THE PLAYGROUND (DIRECT EXPERIMENTATION CALLOUT)
       * ================================================================== */}
      <section
        id="explore-playground"
        aria-labelledby="playground-promo-heading"
        className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border-2 border-[var(--ds-accent)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
      >
        <div className="lg:col-span-8 space-y-2.5">
          <TechnicalLabel
            kicker="5F. INTERACTIVE CODE & DESIGN PLAYGROUND"
            detail="Live Parameter Sliders · Editable CSS/TSX · CSP-Isolated Iframe Preview"
          />
          <h2
            id="playground-promo-heading"
            className="font-display text-2xl sm:text-3xl font-bold text-[var(--ds-foreground)] text-balance"
          >
            Experiment with Design Concepts & Code in Real Time
          </h2>
          <p className="text-sm text-[var(--ds-muted-foreground)] leading-relaxed max-w-2xl">
            Every concept in the encyclopedia can be opened in our dedicated
            Playground Studio—allowing you to manipulate visual tokens, edit live
            stylesheets, test responsive breakpoints, and snapshot custom presets.
          </p>
        </div>

        <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
          <Link href="/playground">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Code2 className="w-4 h-4" />}
              rightIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              Open Full Playground Studio
            </Button>
          </Link>
        </div>
      </section>

      {/* ====================================================================
       * G. RECENTLY ADDED & H. CURATED POPULAR RESOURCES (NO FAKE NUMBERS)
       * ================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-[var(--ds-border)]">
        {/* 5G. RECENTLY ADDED (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
            <div>
              <TechnicalLabel
                kicker="5G. RECENTLY PUBLISHED"
                detail="Latest Verified Monographs"
              />
              <h2 className="font-display text-xl font-bold text-[var(--ds-foreground)] mt-1">
                Recently Added Concepts
              </h2>
            </div>
            <Clock className="w-4 h-4 text-[var(--ds-accent)]" />
          </div>

          <div className="divide-y divide-[var(--ds-border)] border border-[var(--ds-border)] rounded-[12px] bg-[var(--ds-surface)] overflow-hidden">
            {recentlyAddedList.map((item) => {
              const desc = getClassificationDescriptor(item.classification);
              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--ds-muted)]/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <ResourceMetadata
                      items={[
                        desc.label,
                        item.subcategory || 'Core Spec',
                        `WCAG ${item.accessibilitySpec.wcagComplianceLevel}`,
                      ]}
                    />
                    <Link
                      href={`/concept/${item.slug}`}
                      className="font-display text-sm font-bold text-[var(--ds-foreground)] hover:text-[var(--ds-accent)] block truncate"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-[var(--ds-muted-foreground)] line-clamp-1">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectConceptForLab(item.slug)}
                      leftIcon={<Sliders className="w-3 h-3" />}
                    >
                      Lab
                    </Button>
                    <Link href={`/concept/${item.slug}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                      >
                        Read
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5H. POPULAR / FOUNDATIONAL CURATED RESOURCES (NO FABRICATED METRICS) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
            <div>
              <TechnicalLabel
                kicker="5H. ESSENTIAL REFERENCE BENCHMARKS"
                detail="Curated Sample Content · Zero Fabricated Vanity Metrics"
              />
              <h2 className="font-display text-xl font-bold text-[var(--ds-foreground)] mt-1">
                Foundational Reference Benchmarks
              </h2>
            </div>
            <Bookmark className="w-4 h-4 text-[var(--ds-accent)]" />
          </div>

          <SemanticAlert
            variant="info"
            title="Editorial Curation Transparency Notice"
          >
            Shown below are editorially curated foundational sample entries with
            verified technical telemetry (contrast ratios and parameter counts)
            rather than fabricated user view counters.
          </SemanticAlert>

          <div className="divide-y divide-[var(--ds-border)] border border-[var(--ds-border)] rounded-[12px] bg-[var(--ds-surface)] overflow-hidden">
            {curatedPopularSamples.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--ds-muted)]/40 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-[11px] font-mono text-[var(--ds-accent)]">
                    {item.curatedSelectionReason}
                  </div>
                  <Link
                    href={`/concept/${item.slug}`}
                    className="font-display text-sm font-bold text-[var(--ds-foreground)] hover:text-[var(--ds-accent)] block truncate"
                  >
                    {item.title}
                  </Link>
                  <div className="text-xs text-[var(--ds-muted-foreground)] font-mono tabular-nums">
                    Contrast {item.accessibilitySpec.minContrastRatio}:1 ·{' '}
                    {item.interactiveParameters.length} Interactive Parameters ·{' '}
                    {item.sourceAttribution.firstPublishedYear}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.sourceAttribution.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Official source for ${item.title}`}
                    className="p-1.5 text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Link href={`/concept/${item.slug}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    >
                      Inspect
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
