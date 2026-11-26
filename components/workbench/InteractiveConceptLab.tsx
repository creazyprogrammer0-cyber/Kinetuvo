'use client';

import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  RotateCcw,
  Bookmark,
  Check,
  Sliders,
  Code2,
  ShieldCheck,
  ExternalLink,
  Play,
  Eye,
  Sparkles,
} from 'lucide-react';
import { DesignResource, PersonalCollection } from '@/types/encyclopedia';
import { getClassificationDescriptor } from '@/lib/taxonomy/registry';
import {
  compileResourceTemplates,
  buildSandboxedIframeSrcDoc,
} from '@/lib/sandbox/execution-engine';
import { Button, Tabs } from '@/components/ui/InteractionPrimitives';
import {
  ResourceMetadata,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';
import {
  CodeBlock,
  EditorPanel,
  LivePreviewContainer,
} from '@/components/ui/TechnicalPrimitives';

interface InteractiveConceptLabProps {
  resources: DesignResource[];
  selectedSlug: string;
  onSelectResource: (slug: string) => void;
  collection: PersonalCollection;
  onToggleBookmark: (slug: string) => void;
  onSavePreset: (
    resourceSlug: string,
    resourceTitle: string,
    presetName: string,
    values: Record<string, number | string | boolean>
  ) => void;
  isDarkTheme: boolean;
  globalReducedMotionSim: boolean;
}

export function InteractiveConceptLab({
  resources,
  selectedSlug,
  onSelectResource,
  collection,
  onToggleBookmark,
  onSavePreset,
  isDarkTheme,
  globalReducedMotionSim,
}: InteractiveConceptLabProps) {
  const activeResource = useMemo(
    () => resources.find((r) => r.slug === selectedSlug) || resources[0],
    [resources, selectedSlug]
  );

  // Store parameter values keyed by resource slug so edits persist while switching concepts
  const [paramStore, setParamStore] = useState<
    Record<string, Record<string, number | string | boolean>>
  >(() => {
    const initial: Record<string, Record<string, number | string | boolean>> = {};
    for (const res of resources) {
      initial[res.slug] = {};
      for (const p of res.interactiveParameters) {
        initial[res.slug][p.key] = p.defaultValue;
      }
    }
    return initial;
  });

  const currentParams = useMemo(() => {
    const saved = paramStore[activeResource.slug];
    if (saved) return saved;
    const fallback: Record<string, number | string | boolean> = {};
    for (const p of activeResource.interactiveParameters) {
      fallback[p.key] = p.defaultValue;
    }
    return fallback;
  }, [paramStore, activeResource]);

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<string>(
    'interactive-stage'
  );

  const [customCssOverride, setCustomCssOverride] = useState<string>('');
  const [isCustomSandboxEdited, setIsCustomSandboxEdited] = useState(false);
  const [presetSavedFeedback, setPresetSavedFeedback] = useState(false);

  // Interactive demo local states
  const [springTargetExpanded, setSpringTargetExpanded] = useState(false);
  const [comboboxQuery, setComboboxQuery] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(true);
  const [comboboxActiveIndex, setComboboxActiveIndex] = useState(0);
  const [selectedComboboxItem, setSelectedComboboxItem] = useState(
    'Semantic Color Tokens'
  );
  const [neobrutalPressed, setNeobrutalPressed] = useState(false);

  const systemReducedMotion = useReducedMotion();

  const updateParameter = (key: string, value: number | string | boolean) => {
    setParamStore((prev) => ({
      ...prev,
      [activeResource.slug]: {
        ...(prev[activeResource.slug] || {}),
        [key]: value,
      },
    }));
    setIsCustomSandboxEdited(false);
  };

  const resetParametersToDefault = () => {
    const defaults: Record<string, number | string | boolean> = {};
    for (const p of activeResource.interactiveParameters) {
      defaults[p.key] = p.defaultValue;
    }
    setParamStore((prev) => ({
      ...prev,
      [activeResource.slug]: defaults,
    }));
    setIsCustomSandboxEdited(false);
  };

  const compiledTemplates = useMemo(
    () => compileResourceTemplates(activeResource.codeTemplates, currentParams),
    [activeResource.codeTemplates, currentParams]
  );

  const activeCssCode = isCustomSandboxEdited
    ? customCssOverride
    : compiledTemplates[0]?.compiledCode || '';

  const classificationInfo = getClassificationDescriptor(
    activeResource.classification
  );
  const isBookmarked = collection.resourceSlugs.includes(activeResource.slug);

  const handleSaveCurrentPreset = () => {
    const summaryLabel = activeResource.interactiveParameters
      .slice(0, 2)
      .map(
        (p) => `${p.label.split(' ')[0]}: ${currentParams[p.key]}${p.unit || ''}`
      )
      .join(' · ');
    onSavePreset(
      activeResource.slug,
      activeResource.title,
      summaryLabel || 'Custom Configuration',
      currentParams
    );
    setPresetSavedFeedback(true);
    setTimeout(() => setPresetSavedFeedback(false), 2000);
  };

  // Combobox demo items
  const comboboxOptions = useMemo(() => {
    const all = [
      'Semantic Color Tokens',
      'Swiss Modular Grid System',
      'Damped Harmonic Spring',
      'WAI-ARIA Combobox Pattern',
      'CSS Container Queries',
      'Architectural Neo-Brutalism',
    ];
    if (!comboboxQuery.trim()) return all;
    return all.filter((item) =>
      item.toLowerCase().includes(comboboxQuery.toLowerCase())
    );
  }, [comboboxQuery]);

  // Sandboxed iframe HTML preview for Code Playground tab
  const sandboxSrcDoc = useMemo(() => {
    const htmlSample = `<div class="sandbox-preview-root" style="width:100%;max-width:440px;padding:20px;border:1px solid #94a3b8;border-radius:12px;">
      <div style="font-size:12px;opacity:0.75;margin-bottom:6px;font-family:monospace;">LIVE CSP-ISOLATED SANDBOX</div>
      <h3 style="font-size:18px;margin-bottom:8px;">${activeResource.title}</h3>
      <p style="font-size:13px;line-height:1.5;opacity:0.85;">Edit the CSS stylesheet on the left to test live property rules inside an origin-isolated iframe sandbox.</p>
    </div>`;
    return buildSandboxedIframeSrcDoc({
      cssCode: activeCssCode,
      htmlBody: htmlSample,
      isDark: isDarkTheme,
      reducedMotion: Boolean(systemReducedMotion || globalReducedMotionSim),
    });
  }, [
    activeCssCode,
    activeResource.title,
    isDarkTheme,
    systemReducedMotion,
    globalReducedMotionSim,
  ]);

  // Render the specific Interactive Stage archetype
  const renderInteractiveStage = () => {
    switch (activeResource.demoArchetype) {
      case 'token-surface-hierarchy': {
        const hue = Number(currentParams.hueAngle ?? 202);
        const outerRadius = Number(currentParams.containerRadius ?? 12);
        const padding = Number(currentParams.surfacePadding ?? 16);
        const innerRadius = Math.max(0, Math.round(outerRadius - padding * 0.5));
        const mode = String(currentParams.surfaceContrastMode ?? 'dark-slate');

        const isDarkSurface = mode === 'dark-slate' || mode === 'high-contrast';
        const isHighContrast = mode === 'high-contrast';

        const containerBg = isHighContrast
          ? '#020617'
          : isDarkSurface
          ? `hsl(${hue} 35% 12%)`
          : `hsl(${hue} 45% 97%)`;
        const containerBorder = isHighContrast
          ? `hsl(${hue} 95% 68%)`
          : isDarkSurface
          ? `hsl(${hue} 35% 24%)`
          : `hsl(${hue} 35% 84%)`;
        const primaryText = isDarkSurface ? '#F8FAFC' : '#0F172A';
        const secondaryText = isDarkSurface
          ? `hsl(${hue} 25% 78%)`
          : `hsl(${hue} 25% 32%)`;
        const accentFill = isHighContrast
          ? `hsl(${hue} 95% 62%)`
          : `hsl(${hue} 84% 46%)`;
        const calculatedContrast = isHighContrast
          ? '14.6 : 1 (AAA)'
          : isDarkSurface
          ? '10.8 : 1 (AAA)'
          : '8.4 : 1 (AAA)';

        return (
          <div className="space-y-4">
            <div
              style={{
                backgroundColor: containerBg,
                borderColor: containerBorder,
                borderRadius: `${outerRadius}px`,
                padding: `${padding}px`,
              }}
              className="border-2 transition-colors duration-150"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <div
                    style={{ color: secondaryText }}
                    className="text-xs font-mono tabular-nums"
                  >
                    --sys-surface-container · Contrast {calculatedContrast}
                  </div>
                  <h4
                    style={{ color: primaryText }}
                    className="font-display text-xl font-bold mt-1"
                  >
                    Adaptive Semantic Surface Container
                  </h4>
                </div>
                <span
                  style={{
                    backgroundColor: accentFill,
                    color: isHighContrast ? '#020617' : '#FFFFFF',
                    borderRadius: `${innerRadius}px`,
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-semibold tabular-nums"
                >
                  --sys-color-primary
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    role: '--sys-on-surface',
                    value: primaryText,
                    desc: 'Primary headline & prose ink',
                  },
                  {
                    role: '--sys-outline-variant',
                    value: containerBorder,
                    desc: 'Hairline structural boundary',
                  },
                  {
                    role: '--comp-inner-radius',
                    value: `${innerRadius}px`,
                    desc: 'Concentric nested curvature',
                  },
                ].map((token) => (
                  <div
                    key={token.role}
                    style={{
                      borderRadius: `${innerRadius}px`,
                      borderColor: containerBorder,
                      backgroundColor: isDarkSurface
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(15,23,42,0.03)',
                    }}
                    className="p-3 border"
                  >
                    <div
                      style={{ color: primaryText }}
                      className="text-xs font-mono font-semibold truncate"
                    >
                      {token.role}
                    </div>
                    <div
                      style={{ color: secondaryText }}
                      className="text-xs font-mono tabular-nums mt-1"
                    >
                      {token.value}
                    </div>
                    <div
                      style={{ color: secondaryText }}
                      className="text-xs mt-1 opacity-85"
                    >
                      {token.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'swiss-typographic-grid': {
        const cols = Number(currentParams.gridColumns ?? 6);
        const gap = Number(currentParams.gridGap ?? 16);
        const headlineSize = Number(currentParams.headlineScale ?? 28);
        const showOverlay = Boolean(currentParams.showGridOverlay ?? true);
        const leftSpan = Math.max(1, Math.floor(cols / 3));
        const rightSpan = Math.max(1, cols - leftSpan);

        return (
          <div className="relative p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[10px] overflow-hidden">
            {showOverlay && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gap: `${gap}px`,
                }}
                aria-hidden="true"
                className="absolute inset-5 pointer-events-none"
              >
                {Array.from({ length: cols }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-indigo-500/10 border-x border-indigo-500/25 flex items-start justify-center pt-1 text-[10px] font-mono text-[var(--ds-accent)] tabular-nums"
                  >
                    C{idx + 1}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: `${gap}px`,
              }}
              className="relative z-10 pt-5"
            >
              <div
                style={{ gridColumn: `span ${leftSpan} / span ${leftSpan}` }}
                className="border-t-2 border-[var(--ds-foreground)] pt-3"
              >
                <div className="text-xs font-mono text-[var(--ds-muted-foreground)] tabular-nums">
                  1981 · ZÜRICH
                </div>
                <div className="text-xs font-semibold text-[var(--ds-foreground)] mt-1">
                  Raster Systeme
                </div>
              </div>

              <div
                style={{ gridColumn: `span ${rightSpan} / span ${rightSpan}` }}
                className="border-t-2 border-[var(--ds-foreground)] pt-3 space-y-3"
              >
                <h4
                  style={{ fontSize: `${headlineSize}px` }}
                  className="font-display font-bold tracking-tight text-[var(--ds-foreground)] leading-none text-balance"
                >
                  Mathematical proportions govern visual clarity.
                </h4>
                <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed max-w-xl">
                  By anchoring typographic elements to a strict horizontal hangline and
                  dividing the field into {cols} modular tracks with {gap}px gutters,
                  hierarchy emerges through spatial tension rather than decorative ornament.
                </p>
              </div>
            </div>
          </div>
        );
      }

      case 'spring-motion-physics': {
        const stiffness = Number(currentParams.stiffness ?? 320);
        const damping = Number(currentParams.damping ?? 26);
        const localReduced = Boolean(currentParams.simulateReducedMotion ?? false);
        const isReducedEffective = Boolean(
          systemReducedMotion || globalReducedMotionSim || localReduced
        );

        return (
          <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[10px] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-mono text-[var(--ds-muted-foreground)]">
                {isReducedMotionActiveText(isReducedEffective)}
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="w-3.5 h-3.5" />}
                onClick={() => setSpringTargetExpanded((prev) => !prev)}
              >
                {springTargetExpanded
                  ? 'Return to Origin (x: 0)'
                  : 'Trigger Impulse (x: +140px)'}
              </Button>
            </div>

            <div className="relative h-28 bg-[var(--ds-background)] rounded-[8px] border border-[var(--ds-border)] flex items-center px-6 overflow-hidden">
              <div className="absolute inset-y-0 left-10 border-l border-dashed border-[var(--ds-border-strong)]" />
              <div className="absolute inset-y-0 right-16 border-l border-dashed border-[var(--ds-accent)]/50" />

              <motion.div
                animate={{
                  x: springTargetExpanded ? 140 : 0,
                  scale: springTargetExpanded ? 1.04 : 1,
                }}
                transition={
                  isReducedEffective
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness,
                        damping,
                      }
                }
                className="px-4 py-3 bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] rounded-[8px] shadow-sm font-mono text-xs font-semibold tabular-nums select-none cursor-pointer"
                onClick={() => setSpringTargetExpanded((prev) => !prev)}
              >
                {springTargetExpanded ? 'Equilibrium B (+140px)' : 'Equilibrium A (0px)'}
              </motion.div>
            </div>
          </div>
        );
      }

      case 'accessible-combobox-pattern': {
        const ringWidth = Number(currentParams.focusRingWidth ?? 2);
        const ringOffset = Number(currentParams.focusRingOffset ?? 2);
        const announceLive = Boolean(currentParams.announceLiveCount ?? true);
        const activeOption =
          comboboxOptions[comboboxActiveIndex] || comboboxOptions[0];

        return (
          <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[10px] space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="demo-wai-combobox"
                className="text-xs font-semibold text-[var(--ds-foreground)]"
              >
                Interactive WAI-ARIA 1.2 Pattern Lookup (ArrowUp / ArrowDown / Enter / Esc)
              </label>
              {announceLive && (
                <span
                  role="status"
                  aria-live="polite"
                  className="text-xs font-mono text-[var(--ds-accent)] tabular-nums"
                >
                  {comboboxOptions.length} options available
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="demo-wai-combobox"
                type="text"
                role="combobox"
                aria-expanded={comboboxOpen}
                aria-controls="demo-wai-listbox"
                aria-autocomplete="list"
                aria-activedescendant={
                  comboboxOpen && activeOption
                    ? `opt-${comboboxActiveIndex}`
                    : undefined
                }
                value={comboboxQuery}
                placeholder="Type to filter or press ArrowDown..."
                onChange={(e) => {
                  setComboboxQuery(e.target.value);
                  setComboboxOpen(true);
                  setComboboxActiveIndex(0);
                }}
                onFocus={() => setComboboxOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setComboboxOpen(true);
                    setComboboxActiveIndex((prev) =>
                      comboboxOptions.length > 0
                        ? (prev + 1) % comboboxOptions.length
                        : 0
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setComboboxOpen(true);
                    setComboboxActiveIndex((prev) =>
                      comboboxOptions.length > 0
                        ? (prev - 1 + comboboxOptions.length) %
                          comboboxOptions.length
                        : 0
                    );
                  } else if (e.key === 'Enter' && comboboxOpen && activeOption) {
                    e.preventDefault();
                    setSelectedComboboxItem(activeOption);
                    setComboboxQuery(activeOption);
                    setComboboxOpen(false);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    if (comboboxOpen) {
                      setComboboxOpen(false);
                    } else {
                      setComboboxQuery('');
                    }
                  }
                }}
                style={{
                  outline: `${ringWidth}px solid var(--ds-focus)`,
                  outlineOffset: `${ringOffset}px`,
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[6px] text-[var(--ds-foreground)]"
              />
            </div>

            {comboboxOpen && (
              <ul
                id="demo-wai-listbox"
                role="listbox"
                aria-label="Design Encyclopedia Patterns"
                className="border border-[var(--ds-border)] rounded-[6px] divide-y divide-[var(--ds-border)] max-h-44 overflow-y-auto"
              >
                {comboboxOptions.length === 0 ? (
                  <li className="px-3.5 py-2.5 text-xs text-[var(--ds-muted-foreground)]">
                    No matching patterns. Press Escape to reset.
                  </li>
                ) : (
                  comboboxOptions.map((item, idx) => {
                    const isHighlighted = idx === comboboxActiveIndex;
                    const isSelected = item === selectedComboboxItem;
                    return (
                      <li
                        key={item}
                        id={`opt-${idx}`}
                        role="option"
                        aria-selected={isHighlighted}
                        onClick={() => {
                          setSelectedComboboxItem(item);
                          setComboboxQuery(item);
                          setComboboxActiveIndex(idx);
                        }}
                        className={`px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isHighlighted
                            ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-semibold'
                            : 'bg-[var(--ds-surface)] text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]'
                        }`}
                      >
                        <span>{item}</span>
                        <span className="font-mono text-[11px] opacity-80">
                          {isSelected
                            ? 'Committed'
                            : isHighlighted
                            ? 'aria-activedescendant'
                            : ''}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>
        );
      }

      case 'fluid-container-card': {
        const widthPct = Number(currentParams.containerWidthPercent ?? 78);
        const threshold = Number(currentParams.breakpointThreshold ?? 60);
        const isHorizontalMode = widthPct >= threshold;

        return (
          <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[10px]">
            <div
              style={{ width: `${widthPct}%` }}
              className="mx-auto transition-all duration-150 bg-[var(--ds-background)] border-2 border-dashed border-[var(--ds-accent)] rounded-[8px] p-4"
            >
              <div
                className={`flex gap-4 ${
                  isHorizontalMode
                    ? 'flex-row items-center justify-between'
                    : 'flex-col items-start'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono text-[var(--ds-accent)] tabular-nums">
                    @container (inline-size{' '}
                    {isHorizontalMode ? `>= ${threshold}%` : `< ${threshold}%`})
                  </div>
                  <h4 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                    Intrinsic Container-Aware Component
                  </h4>
                  <p className="text-xs text-[var(--ds-muted-foreground)]">
                    Adapts layout geometry to its parent containment slot rather than the
                    global window.
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="inline-block px-3 py-1.5 text-xs font-mono font-semibold bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] rounded-[6px]">
                    {isHorizontalMode ? '2-Column Row' : '1-Column Stack'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'neobrutalist-contrast-study': {
        const borderThickness = Number(currentParams.borderThickness ?? 2);
        const shadowOffset = Number(currentParams.shadowOffset ?? 5);
        const cornerRadius = Number(currentParams.cornerRadius ?? 4);
        const activeOffset = neobrutalPressed ? 0 : shadowOffset;
        const translateOffset = neobrutalPressed ? shadowOffset : 0;

        return (
          <div className="p-6 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[10px] flex items-center justify-center">
            <div
              style={{
                borderWidth: `${borderThickness}px`,
                borderRadius: `${cornerRadius}px`,
                boxShadow: `${activeOffset}px ${activeOffset}px 0px 0px ${
                  isDarkTheme ? '#818CF8' : '#111827'
                }`,
                transform: `translate(${translateOffset}px, ${translateOffset}px)`,
              }}
              className="w-full max-w-md p-5 bg-[var(--ds-background)] border-[var(--ds-foreground)] transition-all duration-100"
            >
              <div className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                RAW STRUCTURAL BOUNDARY · 14.8:1 CONTRAST
              </div>
              <h4 className="font-display text-lg font-bold text-[var(--ds-foreground)] mt-1">
                Zero-Blur Geometric Offset Surface
              </h4>
              <p className="text-xs text-[var(--ds-muted-foreground)] mt-2 leading-relaxed">
                Click the interactive trigger below to observe mechanical translation
                into the hard shadow plane.
              </p>
              <button
                type="button"
                onClick={() => setNeobrutalPressed((prev) => !prev)}
                style={{
                  borderWidth: `${borderThickness}px`,
                  borderRadius: `${Math.max(0, cornerRadius - 2)}px`,
                }}
                className="mt-4 px-4 py-2 text-xs font-mono font-bold bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-foreground)] transition-colors whitespace-nowrap shrink-0"
              >
                {neobrutalPressed
                  ? 'Release Mechanical Latch (Active Depressed)'
                  : 'Depress Surface Plane (Test Offset Translation)'}
              </button>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <section
      id="interactive-lab"
      aria-labelledby="lab-heading"
      className="space-y-6"
    >
      {/* Concept Selector Strip using Reusable TechnicalLabel & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--ds-border)] pb-5">
        <div className="space-y-1.5">
          <TechnicalLabel
            kicker="01. INTERACTIVE CONCEPT LABORATORY"
            detail="Explore Before Reading · Demonstrate Before Explaining"
          />
          <h2
            id="lab-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
          >
            Direct-Manipulation Design Encyclopedia Workbench
          </h2>
        </div>

        <Tabs
          ariaLabel="Select Design Concept to Experiment"
          activeId={activeResource.slug}
          onChange={(slug) => {
            onSelectResource(slug);
            setIsCustomSandboxEdited(false);
          }}
          items={resources.map((res) => ({
            id: res.slug,
            label: res.title.split('&')[0].trim(),
          }))}
        />
      </div>

      {/* Two-Zone Sandbox Layout (7 cols Stage / 5 cols Control Deck) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT ZONE: Interactive Stage & Code Playground */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] p-5 sm:p-6 space-y-5">
          <div className="space-y-3">
            <ResourceMetadata
              items={[
                classificationInfo.label,
                `Published ${activeResource.sourceAttribution.firstPublishedYear}`,
                `WCAG ${activeResource.accessibilitySpec.wcagComplianceLevel} Verified`,
                `Min Contrast ${activeResource.accessibilitySpec.minContrastRatio}:1`,
              ]}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] text-balance">
                {activeResource.title}
              </h3>

              <Tabs
                ariaLabel="Switch Concept Workspace Mode"
                activeId={activeWorkspaceTab}
                onChange={setActiveWorkspaceTab}
                items={[
                  {
                    id: 'interactive-stage',
                    label: 'Live Stage',
                    icon: <Eye className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'code-playground',
                    label: 'Code & Sandbox',
                    icon: <Code2 className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'accessibility-spec',
                    label: 'A11y & Source',
                    icon: <ShieldCheck className="w-3.5 h-3.5" />,
                  },
                ]}
              />
            </div>

            <p className="text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
              {activeResource.summary}
            </p>
          </div>

          {activeWorkspaceTab === 'interactive-stage' && (
            <div className="space-y-4">
              <LivePreviewContainer
                title={activeResource.title.split('&')[0].trim()}
                metadata={activeResource.executionMode}
                onReset={resetParametersToDefault}
              >
                {renderInteractiveStage()}
              </LivePreviewContainer>

              <CodeBlock
                filename={compiledTemplates[0]?.filename || 'specimen.css'}
                language={compiledTemplates[0]?.language || 'css'}
                description="Real-time interpolated code"
                code={compiledTemplates[0]?.compiledCode || ''}
              />
            </div>
          )}

          {activeWorkspaceTab === 'code-playground' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditorPanel
                filename={compiledTemplates[0]?.filename || 'specimen.css'}
                language={compiledTemplates[0]?.language || 'css'}
                value={activeCssCode}
                isDirty={isCustomSandboxEdited}
                onReset={() => setIsCustomSandboxEdited(false)}
                onChange={(nextVal) => {
                  setCustomCssOverride(nextVal);
                  setIsCustomSandboxEdited(true);
                }}
              />

              <div className="space-y-2 flex flex-col">
                <div className="text-xs font-mono font-semibold text-[var(--ds-muted-foreground)]">
                  Sandboxed Iframe Preview (CSP: script-src &apos;none&apos;)
                </div>
                <iframe
                  title={`Sandboxed Preview for ${activeResource.title}`}
                  sandbox=""
                  srcDoc={sandboxSrcDoc}
                  className="w-full flex-1 min-h-[240px] rounded-[10px] border border-[var(--ds-border-strong)] bg-[var(--ds-background)]"
                />
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'accessibility-spec' && (
            <div className="space-y-4 bg-[var(--ds-background)] p-4 rounded-[10px] border border-[var(--ds-border)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-mono font-semibold text-[var(--ds-muted-foreground)]">
                    KEYBOARD INTERACTION CONTRACT
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {activeResource.accessibilitySpec.keyboardInteractions.map(
                      (kb) => (
                        <li key={kb.keyCombo} className="text-xs">
                          <span className="font-mono font-semibold text-[var(--ds-foreground)]">
                            {kb.keyCombo}
                          </span>
                          <span className="text-[var(--ds-muted-foreground)]">
                            {' '}
                            — {kb.expectedBehavior}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-semibold text-[var(--ds-muted-foreground)]">
                    REDUCED MOTION & RESPONSIVE STRATEGY
                  </h4>
                  <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    <strong className="text-[var(--ds-foreground)]">
                      Reduced Motion:
                    </strong>{' '}
                    {activeResource.accessibilitySpec.reducedMotionStrategy}
                  </p>
                  <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    <strong className="text-[var(--ds-foreground)]">
                      Responsive Reflow:
                    </strong>{' '}
                    {activeResource.accessibilitySpec.responsiveBreakpointStrategy}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[var(--ds-muted-foreground)]">
                  <strong className="text-[var(--ds-foreground)]">
                    Verified Attribution:
                  </strong>{' '}
                  {activeResource.sourceAttribution.authorOrOrganization} (
                  {activeResource.sourceAttribution.licenseType})
                </div>
                <a
                  href={activeResource.sourceAttribution.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ds-accent)] hover:underline whitespace-nowrap shrink-0"
                >
                  Official Specification
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT ZONE: Real-Time Parameter Control & Concept Deck */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] p-5 sm:p-6 space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--ds-accent)]" />
                <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                  Real-Time Parameter Inspector
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetParametersToDefault}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Defaults
              </Button>
            </div>

            {/* Parameter Controls */}
            <div className="space-y-4">
              {activeResource.interactiveParameters.map((param) => {
                const rawVal = currentParams[param.key] ?? param.defaultValue;

                if (param.controlType === 'range') {
                  return (
                    <div key={param.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor={`param-${param.key}`}
                          className="font-semibold text-[var(--ds-foreground)]"
                        >
                          {param.label}
                        </label>
                        <span className="font-mono font-semibold text-[var(--ds-accent)] tabular-nums">
                          {String(rawVal)}
                          {param.unit ? ` ${param.unit}` : ''}
                        </span>
                      </div>
                      <input
                        id={`param-${param.key}`}
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={Number(rawVal)}
                        onChange={(e) =>
                          updateParameter(param.key, Number(e.target.value))
                        }
                        className="w-full accent-[var(--ds-primary)] cursor-pointer"
                      />
                      <p className="text-xs text-[var(--ds-muted-foreground)]">
                        {param.description}
                      </p>
                    </div>
                  );
                }

                if (param.controlType === 'select' && param.options) {
                  return (
                    <div key={param.key} className="space-y-1.5">
                      <label
                        htmlFor={`param-${param.key}`}
                        className="block text-xs font-semibold text-[var(--ds-foreground)]"
                      >
                        {param.label}
                      </label>
                      <select
                        id={`param-${param.key}`}
                        value={String(rawVal)}
                        onChange={(e) =>
                          updateParameter(param.key, e.target.value)
                        }
                        className="w-full px-3 py-2 text-xs font-medium bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[6px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
                      >
                        {param.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[var(--ds-muted-foreground)]">
                        {param.description}
                      </p>
                    </div>
                  );
                }

                if (param.controlType === 'boolean') {
                  const isChecked = Boolean(rawVal);
                  return (
                    <div
                      key={param.key}
                      className="flex items-start justify-between gap-3 pt-1"
                    >
                      <div className="space-y-0.5">
                        <label
                          htmlFor={`param-${param.key}`}
                          className="text-xs font-semibold text-[var(--ds-foreground)] cursor-pointer"
                        >
                          {param.label}
                        </label>
                        <p className="text-xs text-[var(--ds-muted-foreground)]">
                          {param.description}
                        </p>
                      </div>
                      <Button
                        id={`param-${param.key}`}
                        role="switch"
                        aria-checked={isChecked}
                        variant={isChecked ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => updateParameter(param.key, !isChecked)}
                      >
                        {isChecked ? 'ENABLED' : 'OFF'}
                      </Button>
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {/* Practical Engineering Guidance */}
            <div className="pt-4 border-t border-[var(--ds-border)] space-y-3">
              <div>
                <div className="text-xs font-mono font-semibold text-[var(--ds-success)]">
                  PRACTICAL APPLICATION · WHEN TO USE
                </div>
                <ul className="mt-1.5 space-y-1 text-xs text-[var(--ds-muted-foreground)]">
                  {activeResource.whenToUse.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-mono font-semibold text-[var(--ds-warning)]">
                  ARCHITECTURAL GUARDRAIL · WHEN TO AVOID
                </div>
                <ul className="mt-1.5 space-y-1 text-xs text-[var(--ds-muted-foreground)]">
                  {activeResource.whenToAvoid.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Personal Collection & Preset Persistence Actions */}
          <div className="pt-4 border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-2">
            <Button
              variant={isBookmarked ? 'secondary' : 'outline'}
              size="md"
              onClick={() => onToggleBookmark(activeResource.slug)}
              leftIcon={<Bookmark className="w-3.5 h-3.5" />}
            >
              {isBookmarked ? 'Saved in Collection' : 'Save to Collection'}
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleSaveCurrentPreset}
              leftIcon={
                presetSavedFeedback ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )
              }
            >
              {presetSavedFeedback
                ? 'Preset Snapshot Saved'
                : 'Snapshot Parameter Preset'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function isReducedMotionActiveText(isReduced: boolean): string {
  return isReduced
    ? 'WCAG 2.3.3 REDUCED-MOTION ACTIVE: Spatial translation bypassed (0ms instant state).'
    : 'COMPOSITOR MOTION ACTIVE: Damped harmonic spring equation running on transform.';
}
