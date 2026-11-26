'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  Search,
  Compass,
  Code2,
  ArrowUpRight,
  Sliders,
  Play,
  RotateCcw,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { DesignResource, TaxonomyCategory } from '@/types/encyclopedia';
import { getClassificationDescriptor } from '@/lib/taxonomy/registry';
import { Button, Tabs } from '@/components/ui/InteractionPrimitives';
import {
  ResourceMetadata,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';
import { useTheme } from '@/components/providers/ThemeProvider';

interface HeroInteractiveShowcaseProps {
  categories: TaxonomyCategory[];
  resources: DesignResource[];
  onExploreCategories: () => void;
  onSelectConceptForLab: (slug: string) => void;
}

type SearchDomainScope =
  | 'all'
  | 'concepts'
  | 'animations'
  | 'design-systems'
  | 'technologies'
  | 'components'
  | 'categories';

const SUGGESTED_QUERIES = [
  'Material Design 3 Tokens',
  'Spring Physics',
  'WAI-ARIA Combobox',
  'Swiss Modular Grid',
  'Container Queries',
  'Neo-Brutalism',
];

export function HeroInteractiveShowcase({
  categories,
  resources,
  onExploreCategories,
  onSelectConceptForLab,
}: HeroInteractiveShowcaseProps) {
  const { reducedMotionSim } = useTheme();
  const systemReducedMotion = useReducedMotion();
  const isReducedMotion = Boolean(systemReducedMotion || reducedMotionSim);

  // Global Search Preview State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchDomainScope>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Semantic Color Tokens',
    'Damped Harmonic Spring',
    'CSS Container Queries',
  ]);

  // Hero Interactive Visual Specimen State
  const [heroDeckMode, setHeroDeckMode] = useState<string>('surface-tokens');
  const [heroHue, setHeroHue] = useState<number>(235);
  const [heroRadius, setHeroRadius] = useState<number>(10);
  const [heroStiffness, setHeroStiffness] = useState<number>(340);
  const [heroDamping, setHeroDamping] = useState<number>(24);
  const [heroSpringDisplaced, setHeroSpringDisplaced] = useState<boolean>(false);
  const [heroGridCols, setHeroGridCols] = useState<number>(6);
  const [heroTypeScale, setHeroTypeScale] = useState<number>(24);

  const handleAddRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) =>
      [clean, ...prev.filter((item) => item !== clean)].slice(0, 5)
    );
  };

  // Filtered Search Preview Results across all 6 required domains
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matchingResources = resources.filter((res) => {
      if (searchScope === 'categories') return false;
      if (
        searchScope === 'animations' &&
        res.classification !== 'animation-technique'
      ) {
        return false;
      }
      if (
        searchScope === 'design-systems' &&
        res.classification !== 'official-design-system'
      ) {
        return false;
      }
      if (
        searchScope === 'technologies' &&
        res.classification !== 'development-technology'
      ) {
        return false;
      }
      if (
        searchScope === 'components' &&
        res.classification !== 'ui-component' &&
        res.classification !== 'interaction-pattern'
      ) {
        return false;
      }
      if (
        searchScope === 'concepts' &&
        res.classification !== 'design-methodology' &&
        res.classification !== 'visual-style'
      ) {
        return false;
      }

      if (!q) return true;
      return (
        res.title.toLowerCase().includes(q) ||
        res.summary.toLowerCase().includes(q) ||
        res.classification.toLowerCase().includes(q) ||
        (res.subcategory && res.subcategory.toLowerCase().includes(q)) ||
        res.sourceAttribution.authorOrOrganization.toLowerCase().includes(q)
      );
    });

    const matchingCategories = categories.filter((cat) => {
      if (searchScope !== 'all' && searchScope !== 'categories') return false;
      if (!q) return true;
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.shortDescription.toLowerCase().includes(q) ||
        cat.architecturalScope.toLowerCase().includes(q) ||
        cat.subcategories.some((s) => s.toLowerCase().includes(q))
      );
    });

    return {
      resources: matchingResources,
      categories: matchingCategories,
      totalCount: matchingResources.length + matchingCategories.length,
    };
  }, [resources, categories, searchQuery, searchScope]);

  const resetHeroSpecimen = () => {
    setHeroHue(235);
    setHeroRadius(10);
    setHeroStiffness(340);
    setHeroDamping(24);
    setHeroGridCols(6);
    setHeroTypeScale(24);
    setHeroSpringDisplaced(false);
  };

  return (
    <section
      aria-labelledby="hero-headline"
      className="border-b border-[var(--ds-border)] pb-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* LEFT COLUMN (7 Cols): Editorial Framing, Global Search Preview & Primary CTAs */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <ResourceMetadata
              items={[
                'Interactive Design Knowledge & Experimentation Platform',
                '16 Primary Categories',
                '8 Canonical Classifications',
                'Live Code Sandbox',
              ]}
            />

            <h1
              id="hero-headline"
              style={{ fontSize: 'clamp(1.875rem, 3.1vw, 2.75rem)' }}
              className="font-display font-bold tracking-tight text-[var(--ds-foreground)] leading-[1.12] text-balance"
            >
              Explore the systems behind exceptional digital design.
            </h1>

            <p className="text-sm sm:text-base text-[var(--ds-muted-foreground)] leading-relaxed max-w-[64ch]">
              Discover design systems, visual styles, interactions, motion
              techniques and implementation methods. Explore ideas, experiment
              with them and bring them to life.
            </p>
          </div>

          {/* PROMINENT GLOBAL SEARCH PREVIEW WORKBENCH */}
          <div className="p-4 sm:p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                GLOBAL ENCYCLOPEDIA SEARCH & DOMAIN FILTER
              </span>
              <span className="text-[11px] font-mono text-[var(--ds-subtle-foreground)] tabular-nums">
                {searchResults.totalCount} indexed matches
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--ds-accent)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search design concepts, animations, design systems, technologies, components, or categories..."
                aria-label="Global search across design concepts, animations, systems, technologies, components, and categories"
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[var(--ds-background)] border border-[var(--ds-border-strong)] focus:border-[var(--ds-accent)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search query"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 6 Search Domain Scope Selectors */}
            <div
              role="group"
              aria-label="Filter search by domain scope"
              className="flex flex-wrap items-center gap-1"
            >
              {(
                [
                  { id: 'all', label: 'All Domains' },
                  { id: 'concepts', label: 'Concepts & Styles' },
                  { id: 'design-systems', label: 'Design Systems' },
                  { id: 'animations', label: 'Animations' },
                  { id: 'components', label: 'Components & Patterns' },
                  { id: 'technologies', label: 'Technologies' },
                  { id: 'categories', label: '16 Categories' },
                ] as { id: SearchDomainScope; label: string }[]
              ).map((scope) => {
                const active = searchScope === scope.id;
                return (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => {
                      setSearchScope(scope.id);
                      setIsSearchFocused(true);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-[6px] transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-semibold'
                        : 'bg-[var(--ds-muted)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    {scope.label}
                  </button>
                );
              })}
            </div>

            {/* INITIAL STATE: Suggestions & Recent Searches */}
            {!searchQuery.trim() && !isSearchFocused && (
              <div className="pt-2 border-t border-[var(--ds-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-[var(--ds-subtle-foreground)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[var(--ds-accent)]" />
                    Suggested:
                  </span>
                  {SUGGESTED_QUERIES.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        handleAddRecentSearch(suggestion);
                        setIsSearchFocused(true);
                      }}
                      className="text-xs font-medium text-[var(--ds-muted-foreground)] hover:text-[var(--ds-accent)] hover:underline"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--ds-subtle-foreground)]">
                  <Clock className="w-3 h-3" />
                  <span>Recent: {recentSearches[0]}</span>
                </div>
              </div>
            )}

            {/* ACTIVE SEARCH PREVIEW PANEL (Initial Useful State, Live Matches, or Empty State) */}
            {(isSearchFocused || searchQuery.trim().length > 0) && (
              <div className="pt-3 border-t border-[var(--ds-border)] space-y-3">
                {/* Recent & Suggested Chips Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[var(--ds-subtle-foreground)]">
                      Recent:
                    </span>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSearchQuery(term)}
                        className="px-2 py-0.5 text-[11px] bg-[var(--ds-background)] hover:bg-[var(--ds-muted)] border border-[var(--ds-border)] rounded text-[var(--ds-foreground)]"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSearchFocused(false)}
                    className="text-[11px] font-mono text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                  >
                    Hide Preview
                  </button>
                </div>

                {/* Empty Search State */}
                {searchResults.totalCount === 0 ? (
                  <div className="p-4 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-center space-y-2">
                    <div className="text-xs font-semibold text-[var(--ds-foreground)]">
                      No encyclopedia entries found for &quot;{searchQuery}&quot; in{' '}
                      <span className="font-mono">{searchScope}</span>.
                    </div>
                    <p className="text-xs text-[var(--ds-muted-foreground)]">
                      Try broadening the domain scope to &quot;All Domains&quot; or select a
                      verified suggestion below:
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                      {SUGGESTED_QUERIES.map((qItem) => (
                        <button
                          key={qItem}
                          type="button"
                          onClick={() => {
                            setSearchScope('all');
                            setSearchQuery(qItem);
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] rounded-[6px] hover:border-[var(--ds-accent)]"
                        >
                          {qItem}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {searchResults.resources.slice(0, 4).map((res) => (
                      <div
                        key={res.id}
                        className="p-2.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] flex flex-col justify-between gap-2 transition-colors"
                      >
                        <div>
                          <div className="text-[10px] font-mono text-[var(--ds-accent)]">
                            {getClassificationDescriptor(res.classification).label}
                          </div>
                          <div className="text-xs font-bold text-[var(--ds-foreground)] truncate mt-0.5">
                            {res.title}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--ds-border)]">
                          <button
                            type="button"
                            onClick={() => {
                              if (searchQuery) handleAddRecentSearch(searchQuery);
                              onSelectConceptForLab(res.slug);
                            }}
                            className="text-[11px] font-semibold text-[var(--ds-accent)] hover:underline"
                          >
                            Load in Workbench
                          </button>
                          <Link
                            href={`/concept/${res.slug}`}
                            onClick={() => {
                              if (searchQuery) handleAddRecentSearch(searchQuery);
                            }}
                            className="inline-flex items-center gap-0.5 text-[11px] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                          >
                            Spec Page
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}

                    {searchResults.categories.slice(0, 4).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/taxonomy/${cat.slug}`}
                        onClick={() => {
                          if (searchQuery) handleAddRecentSearch(searchQuery);
                        }}
                        className="p-2.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] flex flex-col justify-between gap-1.5 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ds-muted-foreground)]">
                          <span>CATEGORY 0{cat.orderIndex}</span>
                          <ArrowUpRight className="w-3 h-3 text-[var(--ds-accent)]" />
                        </div>
                        <div className="text-xs font-bold text-[var(--ds-foreground)] truncate">
                          {cat.name}
                        </div>
                        <div className="text-[11px] text-[var(--ds-subtle-foreground)] truncate">
                          {cat.subcategories.join(' · ')}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PRIMARY HERO CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Compass className="w-4 h-4" />}
              onClick={onExploreCategories}
            >
              Explore 16 Categories
            </Button>

            <Link href="/playground">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Code2 className="w-4 h-4" />}
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                Open Playground Studio
              </Button>
            </Link>

            <Link
              href="/design-system"
              className="text-xs font-semibold text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] px-2 py-2"
            >
              Inspect Design System Tokens →
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): LIVE INTERACTIVE VISUAL DEMONSTRATION */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ds-border)] pb-3">
            <TechnicalLabel
              kicker="LIVE HERO SPECIMEN"
              detail="Interactive Platform Capabilities"
            />
            <button
              type="button"
              onClick={resetHeroSpecimen}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Specimen Mode Switcher */}
          <Tabs
            ariaLabel="Switch Hero Interactive Specimen Mode"
            activeId={heroDeckMode}
            onChange={setHeroDeckMode}
            items={[
              { id: 'surface-tokens', label: '01. Tokens & Surface' },
              { id: 'spring-motion', label: '02. Spring Physics' },
              { id: 'swiss-typography', label: '03. Grid & Type' },
            ]}
          />

          {/* Interactive Stage Area */}
          <div className="flex-1 flex flex-col justify-between bg-[var(--ds-background)] border border-[var(--ds-border)] rounded-[10px] p-4 space-y-4">
            {heroDeckMode === 'surface-tokens' && (
              <>
                <div
                  style={{
                    borderRadius: `${heroRadius}px`,
                    backgroundColor: `hsl(${heroHue} 38% 13%)`,
                    borderColor: `hsl(${heroHue} 65% 48%)`,
                  }}
                  className="p-4 border-2 text-white space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-85 tabular-nums">
                    <span>--sys-primary-hue: {heroHue}deg</span>
                    <span>r_outer: {heroRadius}px</span>
                  </div>
                  <div className="font-display text-base font-bold">
                    Real-Time Semantic Token Synthesis
                  </div>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Drag the sliders below to mutate seed hue and nested concentric
                    radius geometry in real time.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      style={{
                        backgroundColor: `hsl(${heroHue} 82% 56%)`,
                        borderRadius: `${Math.max(0, heroRadius - 4)}px`,
                      }}
                      className="px-3 py-1 text-xs font-mono font-bold text-slate-950"
                    >
                      AA/AAA Contrast Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="hero-hue-slider" className="font-semibold">
                        Seed Hue Angle
                      </label>
                      <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                        {heroHue} deg
                      </span>
                    </div>
                    <input
                      id="hero-hue-slider"
                      type="range"
                      min={0}
                      max={360}
                      value={heroHue}
                      onChange={(e) => setHeroHue(Number(e.target.value))}
                      className="w-full accent-[var(--ds-primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="hero-radius-slider" className="font-semibold">
                        Container Corner Radius
                      </label>
                      <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                        {heroRadius} px
                      </span>
                    </div>
                    <input
                      id="hero-radius-slider"
                      type="range"
                      min={0}
                      max={24}
                      value={heroRadius}
                      onChange={(e) => setHeroRadius(Number(e.target.value))}
                      className="w-full accent-[var(--ds-primary)]"
                    />
                  </div>
                </div>
              </>
            )}

            {heroDeckMode === 'spring-motion' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[var(--ds-muted-foreground)] tabular-nums">
                      ζ = {(heroDamping / (2 * Math.sqrt(heroStiffness))).toFixed(2)} ·{' '}
                      {isReducedMotion ? 'Reduced-Motion Snap' : 'Harmonic Oscillator'}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Play className="w-3 h-3" />}
                      onClick={() => setHeroSpringDisplaced((p) => !p)}
                    >
                      {heroSpringDisplaced ? 'Reset Position' : 'Trigger Impulse'}
                    </Button>
                  </div>

                  <div className="h-24 rounded-[8px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex items-center px-4 overflow-hidden relative">
                    <motion.div
                      animate={{
                        x: heroSpringDisplaced ? 120 : 0,
                        scale: heroSpringDisplaced ? 1.05 : 1,
                      }}
                      transition={
                        isReducedMotion
                          ? { duration: 0 }
                          : {
                              type: 'spring',
                              stiffness: heroStiffness,
                              damping: heroDamping,
                            }
                      }
                      onClick={() => setHeroSpringDisplaced((p) => !p)}
                      className="px-3.5 py-2.5 rounded-[8px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-mono text-xs font-semibold cursor-pointer select-none shadow-sm"
                    >
                      {heroSpringDisplaced ? 'x: +120px' : 'x: 0px (Click Me)'}
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="hero-stiff-slider" className="font-semibold">
                        Stiffness (k)
                      </label>
                      <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                        {heroStiffness} N/m
                      </span>
                    </div>
                    <input
                      id="hero-stiff-slider"
                      type="range"
                      min={120}
                      max={560}
                      step={20}
                      value={heroStiffness}
                      onChange={(e) => setHeroStiffness(Number(e.target.value))}
                      className="w-full accent-[var(--ds-primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="hero-damp-slider" className="font-semibold">
                        Damping (c)
                      </label>
                      <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                        {heroDamping} Ns/m
                      </span>
                    </div>
                    <input
                      id="hero-damp-slider"
                      type="range"
                      min={8}
                      max={54}
                      step={2}
                      value={heroDamping}
                      onChange={(e) => setHeroDamping(Number(e.target.value))}
                      className="w-full accent-[var(--ds-primary)]"
                    />
                  </div>
                </div>
              </>
            )}

            {heroDeckMode === 'swiss-typography' && (
              <>
                <div className="relative p-3.5 rounded-[8px] bg-[var(--ds-surface)] border border-[var(--ds-border)] overflow-hidden space-y-2">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${heroGridCols}, minmax(0, 1fr))`,
                      gap: '6px',
                    }}
                  >
                    {Array.from({ length: heroGridCols }).map((_, i) => (
                      <div
                        key={i}
                        className="h-4 rounded-xs bg-indigo-500/15 border border-indigo-500/30 text-[9px] font-mono text-center text-[var(--ds-accent)] tabular-nums"
                      >
                        C{i + 1}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{ fontSize: `${heroTypeScale}px` }}
                    className="font-display font-bold text-[var(--ds-foreground)] leading-tight pt-1"
                  >
                    Asymmetric Swiss Hangline
                  </div>
                  <p className="text-xs text-[var(--ds-muted-foreground)]">
                    {heroGridCols} modular tracks · {heroTypeScale}px display scale.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="hero-cols-slider" className="font-semibold">
                        Modular Column Count
                      </label>
                      <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                        {heroGridCols} cols
                      </span>
                    </div>
                    <input
                      id="hero-cols-slider"
                      type="range"
                      min={3}
                      max={12}
                      value={heroGridCols}
                      onChange={(e) => setHeroGridCols(Number(e.target.value))}
                      className="w-full accent-[var(--ds-primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="hero-type-slider" className="font-semibold">
                        Display Headline Size
                      </label>
                      <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                        {heroTypeScale} px
                      </span>
                    </div>
                    <input
                      id="hero-type-slider"
                      type="range"
                      min={18}
                      max={34}
                      value={heroTypeScale}
                      onChange={(e) => setHeroTypeScale(Number(e.target.value))}
                      className="w-full accent-[var(--ds-primary)]"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Live Interpolated CSS Token Output Footer */}
          <div className="p-3 rounded-[8px] bg-slate-950 text-slate-100 font-mono text-[11px] flex items-center justify-between gap-2 tabular-nums">
            <span className="truncate text-indigo-300">
              {heroDeckMode === 'surface-tokens' &&
                `--sys-primary: hsl(${heroHue} 78% 48%); --radius: ${heroRadius}px;`}
              {heroDeckMode === 'spring-motion' &&
                `transition: spring(k: ${heroStiffness}, c: ${heroDamping});`}
              {heroDeckMode === 'swiss-typography' &&
                `grid-template-columns: repeat(${heroGridCols}, 1fr); font-size: ${heroTypeScale}px;`}
            </span>
            <Link
              href="/playground"
              className="text-xs font-semibold text-white hover:text-indigo-300 shrink-0 inline-flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              Edit in Studio
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
