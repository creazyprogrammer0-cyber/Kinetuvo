'use client';

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Monitor,
  Play,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Tablet,
  Terminal,
  BookOpen,
  Cpu,
  Accessibility,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DesignResource, PersonalCollection } from '@/types/encyclopedia';
import {
  getCategoryBySlug,
  getClassificationDescriptor,
} from '@/lib/taxonomy/registry';
import {
  getCompleteResourceDetailSpec,
  LivePreviewRuntimeType,
  PreviewBackgroundPreset,
  validateAndCompileVariantCode,
} from '@/lib/resources/resource-detail-specs';
import { buildSandboxedIframeSrcDoc } from '@/lib/sandbox/execution-engine';
import {
  Button,
  IconButton,
  Tabs,
  Accordion,
  useToast,
} from '@/components/ui/InteractionPrimitives';
import {
  RelatedResourceCard,
  ResourceMetadata,
  SemanticAlert,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';
import {
  CodeBlock,
  CopyButton,
  EditorPanel,
} from '@/components/ui/TechnicalPrimitives';
import { Breadcrumbs } from '@/components/ui/NavigationPrimitives';
import { LivePlaygroundEngine } from '@/components/playground/LivePlaygroundEngine';
import { buildPlaygroundConfigFromResource } from '@/lib/playground/templates';

export interface ResourceDetailTemplateProps {
  resource: DesignResource;
  allResources: DesignResource[];
  collection: PersonalCollection;
  onToggleBookmark: (slug: string) => void;
  onSavePreset: (
    slug: string,
    title: string,
    presetName: string,
    values: Record<string, number | string | boolean>
  ) => void;
  isDarkTheme: boolean;
  globalReducedMotionSim: boolean;
}

const RUNTIME_LABELS: Record<LivePreviewRuntimeType, string> = {
  'native-specimen': 'Interactive Specimen',
  'html-css': 'HTML / CSS Engine',
  javascript: 'JavaScript Runtime',
  react: 'React 19 Live Stage',
  svg: 'SVG Parametric Vector',
  canvas: 'HTML5 2D Canvas',
  'webgl-three': '3D Spatial / WebGL Stage',
};

const BACKGROUND_PRESETS: {
  id: PreviewBackgroundPreset;
  label: string;
}[] = [
  { id: 'theme-adaptive', label: 'Theme Default' },
  { id: 'light-studio', label: 'Daylight (#F8FAFC)' },
  { id: 'dark-graphite', label: 'Carbon (#090D16)' },
  { id: 'architectural-grid', label: 'Blueprint Grid' },
];

const TOC_SECTIONS = [
  { id: 'section-header', number: '01', label: 'Overview & Provenance' },
  { id: 'section-live-preview', number: '02', label: 'Live Interactive Preview' },
  { id: 'section-description', number: '03', label: 'Concept & Architecture' },
  { id: 'section-visual-examples', number: '04', label: 'Visual Examples & Comparison' },
  { id: 'section-implementation', number: '05', label: 'Implementation Variants' },
  { id: 'section-technology', number: '06', label: 'Technology & Compatibility' },
  { id: 'section-responsive', number: '07', label: 'Responsive Behavior' },
  { id: 'section-accessibility', number: '08', label: 'Accessibility & WCAG Audit' },
  { id: 'section-customization', number: '09', label: 'Real-Time Customization' },
  { id: 'section-related', number: '10', label: 'Related Resources Graph' },
  { id: 'section-documentation', number: '11', label: 'Best Practices, FAQ & License' },
];

const DIFFICULTY_LABEL: Record<DesignResource['audienceLevel'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'all-levels': 'All Levels',
};

export function ResourceDetailTemplate({
  resource,
  allResources,
  collection,
  onToggleBookmark,
  onSavePreset,
  isDarkTheme,
  globalReducedMotionSim,
}: ResourceDetailTemplateProps) {
  const { pushToast } = useToast();
  const systemReducedMotion = useReducedMotion();

  // Derive full 13-section structured specification from resource data
  const detailSpec = useMemo(
    () => getCompleteResourceDetailSpec(resource, allResources),
    [resource, allResources]
  );

  const primaryCategory = getCategoryBySlug(resource.categorySlug);
  const classificationDescriptor = getClassificationDescriptor(
    resource.classification
  );
  const isBookmarked = collection.resourceSlugs.includes(resource.slug);

  // Navigation: Previous & Next resource in catalog
  const currentIndex = useMemo(
    () => allResources.findIndex((r) => r.slug === resource.slug),
    [allResources, resource.slug]
  );
  const prevResource =
    currentIndex > 0
      ? allResources[currentIndex - 1]
      : allResources[allResources.length - 1];
  const nextResource =
    currentIndex < allResources.length - 1
      ? allResources[currentIndex + 1]
      : allResources[0];

  // Live customization parameter state (shared synchronously between Section 2 & Section 9)
  const [paramValues, setParamValues] = useState<
    Record<string, number | string | boolean>
  >(() => {
    const initial: Record<string, number | string | boolean> = {};
    resource.interactiveParameters.forEach((p) => {
      initial[p.key] = p.defaultValue;
    });
    return initial;
  });

  // Reset parameters whenever the active resource changes
  const [prevResourceSlug, setPrevResourceSlug] = useState(resource.slug);
  if (prevResourceSlug !== resource.slug) {
    setPrevResourceSlug(resource.slug);
    const nextDefaults: Record<string, number | string | boolean> = {};
    resource.interactiveParameters.forEach((p) => {
      nextDefaults[p.key] = p.defaultValue;
    });
    setParamValues(nextDefaults);
  }

  // Section 2 Live Preview state
  const [activeRuntime, setActiveRuntime] = useState<LivePreviewRuntimeType>(
    detailSpec.defaultPreviewRuntime
  );
  const [previewDeviceWidth, setPreviewDeviceWidth] = useState<
    '100%' | '1024px' | '768px' | '375px'
  >('100%');
  const [previewBgPreset, setPreviewBgPreset] =
    useState<PreviewBackgroundPreset>('theme-adaptive');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [localReducedMotionOverride, setLocalReducedMotionOverride] =
    useState(false);

  // Interactive specimen internal states
  const [springImpulseActive, setSpringImpulseActive] = useState(false);
  const [neobrutalDepressed, setNeobrutalDepressed] = useState(false);
  const [comboboxFilter, setComboboxFilter] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(true);
  const [comboboxHighlightIdx, setComboboxHighlightIdx] = useState(0);
  const [spatialRotationDeg, setSpatialRotationDeg] = useState({
    x: 10,
    y: -14,
  });

  // Section 4 Visual Examples interactive comparison mode
  const [activeVisualComparisonSide, setActiveVisualComparisonSide] = useState<
    'split' | 'before' | 'after'
  >('split');

  // Section 5 Implementation Variants & Section 13 Quality Control Compiler Gate
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    detailSpec.implementationVariants[0]?.id || ''
  );
  const [customVariantCodeMap, setCustomVariantCodeMap] = useState<
    Record<string, string>
  >({});
  const [simulateCompileFailure, setSimulateCompileFailure] = useState(false);
  const [showEmbeddedPlayground, setShowEmbeddedPlayground] = useState(false);

  const resourcePlaygroundConfig = useMemo(
    () => buildPlaygroundConfigFromResource(resource),
    [resource]
  );

  // Section 7 Responsive Behavior Live Breakpoint Switcher
  const [responsiveTabDevice, setResponsiveTabDevice] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');

  // Section 12 Active Table of Contents section tracking
  const [activeTocSectionId, setActiveTocSectionId] =
    useState<string>('section-header');

  // HTML5 2D Canvas reference for 'canvas' preview runtime
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isReducedMotionEffective = Boolean(
    systemReducedMotion ||
      globalReducedMotionSim ||
      localReducedMotionOverride ||
      paramValues.simulateReducedMotion
  );

  // Observe section scroll positions for Section 12 Table of Contents active tracking
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTocSectionId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0.05 }
    );

    TOC_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [resource.slug]);

  // Draw live interactive 2D Canvas specimen when 'canvas' runtime is active
  useEffect(() => {
    if (activeRuntime !== 'canvas' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const hue = Number(paramValues.hueAngle ?? 235);
    const stiffness = Number(paramValues.stiffness ?? 320);
    const damping = Number(paramValues.damping ?? 26);
    const cols = Number(paramValues.gridColumns ?? 6);

    // Draw structural baseline grid
    ctx.strokeStyle = isDarkTheme
      ? 'rgba(148, 163, 184, 0.16)'
      : 'rgba(15, 23, 42, 0.12)';
    ctx.lineWidth = 1;
    const colWidth = width / cols;
    for (let i = 1; i < cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * colWidth, 0);
      ctx.lineTo(i * colWidth, height);
      ctx.stroke();
    }

    // Draw damped harmonic wave or parametric response curve
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${hue}, 82%, 56%)`;
    ctx.lineWidth = 2.5;
    const freq = stiffness / 95;
    const decay = damping / 14;

    for (let x = 0; x < width; x++) {
      const t = x / width;
      const amplitude =
        isReducedMotionEffective
          ? 0
          : Math.exp(-decay * t * 3) * Math.cos(freq * t * Math.PI * 2);
      const y = height / 2 - amplitude * (height * 0.34);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw equilibrium axis
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isDarkTheme ? '#818CF8' : '#4F46E5';
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [
    activeRuntime,
    paramValues,
    isDarkTheme,
    isReducedMotionEffective,
    previewReloadKey,
  ]);

  const updateParameter = useCallback(
    (key: string, value: number | string | boolean) => {
      setParamValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetAllParameters = useCallback(() => {
    const defaults: Record<string, number | string | boolean> = {};
    resource.interactiveParameters.forEach((p) => {
      defaults[p.key] = p.defaultValue;
    });
    setParamValues(defaults);
    setLocalReducedMotionOverride(false);
    setSpringImpulseActive(false);
    setNeobrutalDepressed(false);
    setPreviewReloadKey((k) => k + 1);
    pushToast({
      tone: 'info',
      title: 'Live Demo & Parameters Reset',
      description: 'Restored canonical default specification parameters.',
    });
  }, [resource.interactiveParameters, pushToast]);

  // Active Implementation Variant Compilation & Quality Control Validation (Section 5 & Section 13)
  const activeVariant = useMemo(() => {
    return (
      detailSpec.implementationVariants.find(
        (v) => v.id === selectedVariantId
      ) || detailSpec.implementationVariants[0]
    );
  }, [detailSpec.implementationVariants, selectedVariantId]);

  const activeVariantTemplateToCompile =
    customVariantCodeMap[activeVariant.id] !== undefined
      ? customVariantCodeMap[activeVariant.id]
      : activeVariant.codeTemplate;

  const compilationAudit = useMemo(
    () =>
      validateAndCompileVariantCode(
        activeVariantTemplateToCompile,
        paramValues,
        simulateCompileFailure
      ),
    [activeVariantTemplateToCompile, paramValues, simulateCompileFailure]
  );

  // Quality Control Gate: Resource is verified ONLY if live preview is present AND code compiles without syntax errors
  const hasValidLivePreview = Boolean(
    resource.demoArchetype && resource.interactiveParameters.length > 0
  );
  const isResourceVerified =
    hasValidLivePreview &&
    compilationAudit.isValid &&
    resource.publicationStatus !== 'draft-preview';

  // Copy & Share Actions (Section 1)
  const handleCopyResourceLink = () => {
    const url =
      typeof window !== 'undefined'
        ? window.location.href
        : `/concept/${resource.slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    pushToast({
      tone: 'success',
      title: 'Resource Permalink Copied',
      description: url,
    });
  };

  const handleShareResource = async () => {
    const url =
      typeof window !== 'undefined'
        ? window.location.href
        : `/concept/${resource.slug}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.summary,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    handleCopyResourceLink();
  };

  // Compute JSON configuration export for Section 9 Customization
  const customizedJsonConfig = useMemo(() => {
    return JSON.stringify(
      {
        resourceSlug: resource.slug,
        verificationStatus: isResourceVerified
          ? 'VERIFIED_SPECIFICATION'
          : 'UNVERIFIED_OR_DRAFT',
        parameters: paramValues,
        exportedAtIso: '2026-11-24T00:00:00.000Z',
      },
      null,
      2
    );
  }, [resource.slug, isResourceVerified, paramValues]);

  // Background class for Section 2 Live Preview Canvas
  const previewStageBgStyle = useMemo((): React.CSSProperties => {
    if (previewBgPreset === 'light-studio') {
      return { backgroundColor: '#F8FAFC', color: '#0F172A' };
    }
    if (previewBgPreset === 'dark-graphite') {
      return { backgroundColor: '#090D16', color: '#F8FAFC' };
    }
    if (previewBgPreset === 'architectural-grid') {
      return {
        backgroundColor: isDarkTheme ? '#090D16' : '#F8FAFC',
        backgroundImage:
          'radial-gradient(var(--ds-border-strong) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      };
    }
    return {};
  }, [previewBgPreset, isDarkTheme]);

  // Combobox demo options
  const comboboxItems = useMemo(() => {
    const all = [
      'Material 3 Semantic Color Tokens',
      'IBM Carbon 2x Grid & Layer Tokens',
      'Apple HIG Spring Ergonomics',
      'Swiss International Modular Grid',
      'Damped Harmonic Spring Physics',
      'WAI-ARIA 1.2 Accessible Combobox',
      'CSS Container Queries (@container)',
    ];
    if (!comboboxFilter.trim()) return all;
    return all.filter((i) =>
      i.toLowerCase().includes(comboboxFilter.toLowerCase())
    );
  }, [comboboxFilter]);

  /* ==========================================================================
   * RENDER MULTI-RUNTIME LIVE PREVIEW STAGE (SECTION 2)
   * ======================================================================== */
  const renderLivePreviewRuntimeStage = () => {
    // 1. HTML5 2D Canvas Runtime
    if (activeRuntime === 'canvas') {
      return (
        <div className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="font-bold text-[var(--ds-accent)]">
              HTML5 2D CANVAS TELEMETRY & RESPONSE CURVE
            </span>
            <span className="text-[var(--ds-muted-foreground)] tabular-nums">
              {isReducedMotionEffective
                ? 'Flat Equilibrium (Reduced Motion Active)'
                : 'Real-Time Parametric Waveform'}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={640}
            height={190}
            aria-label={`Interactive 2D canvas simulation for ${resource.title}`}
            className="w-full h-44 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)]"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--ds-muted-foreground)]">
            <span>
              Modify any parameter slider below or in Section 9 to redraw the
              canvas response curve at 60fps.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewReloadKey((k) => k + 1)}
            >
              Redraw Canvas Frame
            </Button>
          </div>
        </div>
      );
    }

    // 2. SVG Parametric Vector Runtime
    if (activeRuntime === 'svg') {
      const hue = Number(paramValues.hueAngle ?? 235);
      const radius = Number(
        paramValues.containerRadius ?? paramValues.cornerRadius ?? 12
      );
      const padding = Number(
        paramValues.surfacePadding ?? paramValues.gridGap ?? 16
      );
      const innerRadius = Math.max(0, Math.round(radius - padding * 0.5));

      return (
        <div className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[var(--ds-accent)]">
              SVG PARAMETRIC VECTOR SCHEMATIC
            </span>
            <span className="tabular-nums text-[var(--ds-muted-foreground)]">
              r_outer={radius}px · pad={padding}px · r_inner={innerRadius}px
            </span>
          </div>
          <svg
            viewBox="0 0 600 180"
            role="img"
            aria-label={`Parametric SVG vector diagram for ${resource.title}`}
            className="w-full h-44 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)]"
          >
            <title>{resource.title} — Live Parametric SVG Specimen</title>
            <rect
              x="24"
              y="20"
              width="552"
              height="140"
              rx={radius}
              fill={`hsl(${hue} 45% ${isDarkTheme ? '16%' : '94%'})`}
              stroke={`hsl(${hue} 80% 52%)`}
              strokeWidth="2"
            />
            <rect
              x={24 + padding}
              y={20 + padding}
              width={552 - padding * 2}
              height={140 - padding * 2}
              rx={innerRadius}
              fill="none"
              stroke="currentColor"
              strokeDasharray="5 4"
              strokeWidth="1.5"
            />
            <text
              x="56"
              y="85"
              fill="currentColor"
              fontFamily="monospace"
              fontSize="13"
              fontWeight="bold"
            >
              {resource.title.slice(0, 46)}
            </text>
            <text
              x="56"
              y="110"
              fill={`hsl(${hue} 80% ${isDarkTheme ? '72%' : '38%'})`}
              fontFamily="monospace"
              fontSize="11"
            >
              Concentric Curvature: r_inner = max(0, {radius}px - {padding}px /
              2) = {innerRadius}px
            </text>
          </svg>
        </div>
      );
    }

    // 3. 3D Spatial / WebGL Stage Runtime
    if (activeRuntime === 'webgl-three') {
      const hue = Number(paramValues.hueAngle ?? 225);
      const radius = Number(paramValues.containerRadius ?? 16);
      const pad = Number(paramValues.surfacePadding ?? 18);

      return (
        <div className="p-5 rounded-[10px] bg-slate-950 text-slate-100 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-indigo-400 font-bold">
              3D SPATIAL DEPTH & PBR LIGHTING STAGE
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSpatialRotationDeg((p) => ({
                    x: p.x === 0 ? 12 : 0,
                    y: p.y === 0 ? -16 : 0,
                  }))
                }
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px]"
              >
                {isReducedMotionEffective || spatialRotationDeg.x === 0
                  ? 'Orthographic Lock (0deg)'
                  : `Perspective Tilt (${spatialRotationDeg.x}deg, ${spatialRotationDeg.y}deg)`}
              </button>
            </div>
          </div>

          <div
            style={{ perspective: '1100px' }}
            className="h-48 flex items-center justify-center"
          >
            <div
              style={{
                borderRadius: `${radius}px`,
                padding: `${pad}px`,
                background: `linear-gradient(135deg, hsl(${hue} 55% 22% / 0.92), hsl(${hue} 40% 10% / 0.96))`,
                borderColor: `hsl(${hue} 85% 64% / 0.55)`,
                transform: isReducedMotionEffective
                  ? 'none'
                  : `rotateX(${spatialRotationDeg.x}deg) rotateY(${spatialRotationDeg.y}deg) translateZ(18px)`,
                boxShadow: `0 24px 48px -12px hsl(${hue} 80% 10% / 0.75)`,
              }}
              className="w-full max-w-md border-2 transition-transform duration-200 space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-indigo-300">
                <span>Z-AXIS ELEVATION PLANE (+18px)</span>
                <span>SPECULAR HUE: {hue}°</span>
              </div>
              <div className="font-display text-base font-bold text-white">
                {resource.title}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isReducedMotionEffective
                  ? 'WCAG Reduced-Motion active: 3D parallax tilt flattened to orthographic plane.'
                  : 'Physically based specular rim lighting with concentric Z-layer depth.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 4. HTML/CSS Sandboxed Iframe Engine Runtime
    if (activeRuntime === 'html-css') {
      const iframeDoc = buildSandboxedIframeSrcDoc({
        cssCode: compilationAudit.compiledCode,
        htmlBody: `<div class="swiss-modular-grid neobrutal-card intrinsic-card-layout" style="width:100%;max-width:480px;padding:20px;border:2px solid currentColor;border-radius:12px;">
          <div style="font-family:monospace;font-size:11px;opacity:0.75;margin-bottom:6px;">LIVE HTML/CSS SANDBOX ENGINE · ${resource.classification.toUpperCase()}</div>
          <h3 class="swiss-display-title" style="font-size:20px;font-weight:700;margin-bottom:8px;">${resource.title}</h3>
          <p style="font-size:13px;line-height:1.5;opacity:0.9;">This live HTML/CSS preview executes the interpolated stylesheet inside an origin-isolated sandbox.</p>
        </div>`,
        isDark:
          previewBgPreset === 'dark-graphite' ||
          (previewBgPreset === 'theme-adaptive' && isDarkTheme),
        reducedMotion: isReducedMotionEffective,
      });

      return (
        <iframe
          key={`iframe-${previewReloadKey}`}
          title={`Live HTML/CSS Preview for ${resource.title}`}
          sandbox=""
          srcDoc={iframeDoc}
          className="w-full h-56 rounded-[10px] border border-[var(--ds-border-strong)] bg-[var(--ds-background)]"
        />
      );
    }

    // 5. React / JavaScript / Native Interactive Specimen Stage (Default Canonical Archetypes)
    switch (resource.demoArchetype) {
      case 'token-surface-hierarchy': {
        const hue = Number(paramValues.hueAngle ?? 235);
        const outerRadius = Number(paramValues.containerRadius ?? 12);
        const padding = Number(paramValues.surfacePadding ?? 16);
        const innerRadius = Math.max(
          0,
          Math.round(outerRadius - padding * 0.5)
        );
        const mode = String(paramValues.surfaceContrastMode ?? 'dark-slate');
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
          : `hsl(${hue} 35% 82%)`;
        const primaryText = isDarkSurface ? '#F8FAFC' : '#0F172A';
        const secondaryText = isDarkSurface
          ? `hsl(${hue} 25% 78%)`
          : `hsl(${hue} 25% 32%)`;
        const accentFill = isHighContrast
          ? `hsl(${hue} 95% 62%)`
          : `hsl(${hue} 82% 48%)`;

        return (
          <div
            style={{
              backgroundColor: containerBg,
              borderColor: containerBorder,
              borderRadius: `${outerRadius}px`,
              padding: `${padding}px`,
            }}
            className="border-2 transition-colors duration-150 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div
                  style={{ color: secondaryText }}
                  className="text-xs font-mono tabular-nums"
                >
                  --sys-surface-container · Seed Hue {hue}° · Mode: {mode}
                </div>
                <h3
                  style={{ color: primaryText }}
                  className="font-display text-lg sm:text-xl font-bold mt-0.5"
                >
                  Live Token-Driven Component Hierarchy
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateParameter('hueAngle', (hue + 40) % 360)
                }
                style={{
                  backgroundColor: accentFill,
                  color: isHighContrast ? '#020617' : '#FFFFFF',
                  borderRadius: `${innerRadius}px`,
                }}
                className="px-3 py-1.5 text-xs font-mono font-semibold tabular-nums cursor-pointer"
              >
                Rotate Seed Hue (+40°)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  token: '--sys-color-primary',
                  val: `hsl(${hue} 82% 48%)`,
                  role: 'Interactive Accent Fill',
                },
                {
                  token: '--comp-outer-radius',
                  val: `${outerRadius}px`,
                  role: 'Parent Container Curvature',
                },
                {
                  token: '--comp-inner-radius',
                  val: `${innerRadius}px`,
                  role: 'Concentric Child Radius',
                },
              ].map((item) => (
                <div
                  key={item.token}
                  style={{
                    borderRadius: `${innerRadius}px`,
                    borderColor: containerBorder,
                    backgroundColor: isDarkSurface
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(15,23,42,0.04)',
                  }}
                  className="p-3 border"
                >
                  <div
                    style={{ color: primaryText }}
                    className="text-xs font-mono font-bold truncate"
                  >
                    {item.token}
                  </div>
                  <div
                    style={{ color: secondaryText }}
                    className="text-xs font-mono tabular-nums mt-1"
                  >
                    {item.val}
                  </div>
                  <div
                    style={{ color: secondaryText }}
                    className="text-[11px] mt-1 opacity-85"
                  >
                    {item.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'swiss-typographic-grid': {
        const cols = Number(paramValues.gridColumns ?? 6);
        const gap = Number(paramValues.gridGap ?? 16);
        const headlineScale = Number(paramValues.headlineScale ?? 28);
        const showOverlay = Boolean(paramValues.showGridOverlay ?? true);
        const leftSpan = Math.max(1, Math.floor(cols / 3));
        const rightSpan = Math.max(1, cols - leftSpan);

        return (
          <div className="relative p-5 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] overflow-hidden">
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
                {Array.from({ length: cols }).map((_, i) => (
                  <div
                    key={i}
                    className="h-full bg-indigo-500/10 border-x border-indigo-500/25 flex items-start justify-center pt-1 font-mono text-[10px] text-[var(--ds-accent)] tabular-nums"
                  >
                    C{i + 1}
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
                  {cols} TRACKS · {gap}PX GUTTER
                </div>
                <div className="text-xs font-bold text-[var(--ds-foreground)] mt-1">
                  Asymmetric Hangline
                </div>
              </div>

              <div
                style={{ gridColumn: `span ${rightSpan} / span ${rightSpan}` }}
                className="border-t-2 border-[var(--ds-foreground)] pt-3 space-y-2.5"
              >
                <h4
                  style={{ fontSize: `${headlineScale}px` }}
                  className="font-display font-bold tracking-tight text-[var(--ds-foreground)] leading-none text-balance"
                >
                  Mathematical proportions govern visual hierarchy.
                </h4>
                <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                  Adjust modular column tracks, gutter rhythm, and display scale
                  to inspect real-time editorial reflow and Gestalt proximity.
                </p>
              </div>
            </div>
          </div>
        );
      }

      case 'spring-motion-physics': {
        const stiffness = Number(paramValues.stiffness ?? 320);
        const damping = Number(paramValues.damping ?? 26);
        const dampingRatio = (
          damping /
          (2 * Math.sqrt(Math.max(1, stiffness)))
        ).toFixed(2);

        return (
          <div className="p-5 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-mono text-[var(--ds-muted-foreground)] tabular-nums">
                k={stiffness} N/m · c={damping} Ns/m · ζ={dampingRatio} ·{' '}
                {isReducedMotionEffective
                  ? 'WCAG 2.3.3 Instant Snap'
                  : 'Interruptible Spring'}
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="w-3.5 h-3.5" />}
                onClick={() => setSpringImpulseActive((p) => !p)}
              >
                {springImpulseActive
                  ? 'Reverse Target (x: 0px)'
                  : 'Trigger Impulse (x: +160px)'}
              </Button>
            </div>

            <div className="relative h-28 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] flex items-center px-6 overflow-hidden">
              <div className="absolute inset-y-2 left-10 border-l border-dashed border-[var(--ds-border-strong)]" />
              <div className="absolute inset-y-2 right-14 border-l border-dashed border-[var(--ds-accent)]/60" />

              <motion.div
                animate={{
                  x: springImpulseActive ? 160 : 0,
                  scale: springImpulseActive ? 1.05 : 1,
                }}
                transition={
                  isReducedMotionEffective
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness,
                        damping,
                      }
                }
                onClick={() => setSpringImpulseActive((p) => !p)}
                className="px-4 py-3 rounded-[8px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-mono text-xs font-bold shadow-md cursor-pointer select-none tabular-nums"
              >
                {springImpulseActive
                  ? 'Equilibrium State B (+160px)'
                  : 'Equilibrium State A (0px)'}
              </motion.div>
            </div>
          </div>
        );
      }

      case 'accessible-combobox-pattern': {
        const ringWidth = Number(paramValues.focusRingWidth ?? 2);
        const ringOffset = Number(paramValues.focusRingOffset ?? 2);
        const announceLive = Boolean(paramValues.announceLiveCount ?? true);
        const activeItem =
          comboboxItems[comboboxHighlightIdx] || comboboxItems[0];

        return (
          <div className="p-5 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="detail-live-combobox"
                className="text-xs font-semibold text-[var(--ds-foreground)]"
              >
                WAI-ARIA 1.2 Combobox State Machine (Use ArrowDown / ArrowUp /
                Enter / Esc)
              </label>
              {announceLive && (
                <span
                  role="status"
                  aria-live="polite"
                  className="text-xs font-mono text-[var(--ds-accent)] tabular-nums"
                >
                  {comboboxItems.length} matching options
                </span>
              )}
            </div>

            <input
              id="detail-live-combobox"
              type="text"
              role="combobox"
              aria-expanded={comboboxOpen}
              aria-controls="detail-live-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                comboboxOpen && activeItem
                  ? `detail-opt-${comboboxHighlightIdx}`
                  : undefined
              }
              value={comboboxFilter}
              placeholder="Filter concepts or press ArrowDown..."
              onChange={(e) => {
                setComboboxFilter(e.target.value);
                setComboboxOpen(true);
                setComboboxHighlightIdx(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setComboboxOpen(true);
                  setComboboxHighlightIdx((p) =>
                    comboboxItems.length > 0 ? (p + 1) % comboboxItems.length : 0
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setComboboxOpen(true);
                  setComboboxHighlightIdx((p) =>
                    comboboxItems.length > 0
                      ? (p - 1 + comboboxItems.length) % comboboxItems.length
                      : 0
                  );
                } else if (e.key === 'Enter' && comboboxOpen && activeItem) {
                  e.preventDefault();
                  setComboboxFilter(activeItem);
                  setComboboxOpen(false);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  if (comboboxOpen) setComboboxOpen(false);
                  else setComboboxFilter('');
                }
              }}
              style={{
                outline: `${ringWidth}px solid var(--ds-focus)`,
                outlineOffset: `${ringOffset}px`,
              }}
              className="w-full px-3.5 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[6px] text-[var(--ds-foreground)]"
            />

            {comboboxOpen && (
              <ul
                id="detail-live-listbox"
                role="listbox"
                aria-label="Design Specifications"
                className="border border-[var(--ds-border)] rounded-[6px] divide-y divide-[var(--ds-border)] max-h-40 overflow-y-auto"
              >
                {comboboxItems.map((item, idx) => {
                  const isHighlighted = idx === comboboxHighlightIdx;
                  return (
                    <li
                      key={item}
                      id={`detail-opt-${idx}`}
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() => {
                        setComboboxFilter(item);
                        setComboboxHighlightIdx(idx);
                      }}
                      className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer ${
                        isHighlighted
                          ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-semibold'
                          : 'bg-[var(--ds-surface)] text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]'
                      }`}
                    >
                      <span>{item}</span>
                      {isHighlighted && (
                        <span className="font-mono text-[10px]">
                          aria-activedescendant
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      }

      case 'fluid-container-card': {
        const widthPct = Number(paramValues.containerWidthPercent ?? 78);
        const threshold = Number(paramValues.breakpointThreshold ?? 60);
        const isHorizontal = widthPct >= threshold;

        return (
          <div className="p-5 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)]">
            <div
              style={{ width: `${widthPct}%` }}
              className="mx-auto p-4 rounded-[8px] bg-[var(--ds-background)] border-2 border-dashed border-[var(--ds-accent)] transition-all duration-150"
            >
              <div
                className={`flex gap-4 ${
                  isHorizontal
                    ? 'flex-row items-center justify-between'
                    : 'flex-col items-start'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono text-[var(--ds-accent)] tabular-nums">
                    @container (inline-size: {widthPct}%) · Threshold:{' '}
                    {threshold}%
                  </div>
                  <h4 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                    Intrinsic Container-Driven Component
                  </h4>
                  <p className="text-xs text-[var(--ds-muted-foreground)]">
                    Reflows internal layout based on parent slot width rather
                    than global browser viewport.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-[6px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-mono text-xs font-semibold shrink-0">
                  {isHorizontal ? 'Horizontal Split Row' : 'Vertical Mobile Stack'}
                </span>
              </div>
            </div>
          </div>
        );
      }

      case 'neobrutalist-contrast-study': {
        const borderThickness = Number(paramValues.borderThickness ?? 2);
        const shadowOffset = Number(paramValues.shadowOffset ?? 5);
        const cornerRadius = Number(paramValues.cornerRadius ?? 4);
        const activeOffset = neobrutalDepressed ? 0 : shadowOffset;
        const translateOffset = neobrutalDepressed ? shadowOffset : 0;

        return (
          <div className="p-6 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex items-center justify-center">
            <div
              style={{
                borderWidth: `${borderThickness}px`,
                borderRadius: `${cornerRadius}px`,
                boxShadow: `${activeOffset}px ${activeOffset}px 0px 0px ${
                  isDarkTheme ? '#818CF8' : '#111827'
                }`,
                transform: isReducedMotionEffective
                  ? 'none'
                  : `translate(${translateOffset}px, ${translateOffset}px)`,
              }}
              className="w-full max-w-md p-5 bg-[var(--ds-background)] border-[var(--ds-foreground)] transition-all duration-100 space-y-2.5"
            >
              <div className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                {borderThickness}PX SOLID PERIMETER · {shadowOffset}PX ZERO-BLUR
                OFFSET
              </div>
              <h4 className="font-display text-lg font-bold text-[var(--ds-foreground)]">
                Architectural Neo-Brutalist Surface
              </h4>
              <p className="text-xs text-[var(--ds-muted-foreground)]">
                Click the mechanical latch button below to test tactile physical
                depression into the offset shadow plane.
              </p>
              <button
                type="button"
                onClick={() => setNeobrutalDepressed((p) => !p)}
                style={{
                  borderWidth: `${borderThickness}px`,
                  borderRadius: `${Math.max(0, cornerRadius - 2)}px`,
                }}
                className="px-4 py-2 text-xs font-mono font-bold bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-foreground)] cursor-pointer"
              >
                {neobrutalDepressed
                  ? 'Release Mechanical Latch (Depressed)'
                  : 'Depress Surface Plane'}
              </button>
            </div>
          </div>
        );
      }
    }
  };

  /* ==========================================================================
   * RENDER PARAMETER CONTROLS (USED IN SECTION 9 & QUICK-ACCESS DECK)
   * ======================================================================== */
  const renderCustomizationControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {resource.interactiveParameters.map((param) => {
        const currentVal = paramValues[param.key] ?? param.defaultValue;

        if (param.controlType === 'range') {
          return (
            <div
              key={param.key}
              className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`cust-${param.key}`}
                  className="font-semibold text-[var(--ds-foreground)]"
                >
                  {param.label}
                </label>
                <span className="font-mono font-bold text-[var(--ds-accent)] tabular-nums">
                  {String(currentVal)}
                  {param.unit ? ` ${param.unit}` : ''}
                </span>
              </div>
              <input
                id={`cust-${param.key}`}
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={Number(currentVal)}
                onChange={(e) =>
                  updateParameter(param.key, Number(e.target.value))
                }
                className="w-full accent-[var(--ds-primary)] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-[var(--ds-muted-foreground)]">
                <span>{param.description}</span>
                <span className="font-mono text-[10px] shrink-0 ml-2 tabular-nums">
                  Default: {String(param.defaultValue)}
                  {param.unit || ''}
                </span>
              </div>
            </div>
          );
        }

        if (param.controlType === 'select' && param.options) {
          return (
            <div
              key={param.key}
              className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2"
            >
              <label
                htmlFor={`cust-${param.key}`}
                className="block text-xs font-semibold text-[var(--ds-foreground)]"
              >
                {param.label}
              </label>
              <select
                id={`cust-${param.key}`}
                value={String(currentVal)}
                onChange={(e) => updateParameter(param.key, e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] rounded-[6px] text-[var(--ds-foreground)]"
              >
                {param.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--ds-muted-foreground)]">
                {param.description}
              </p>
            </div>
          );
        }

        if (param.controlType === 'boolean') {
          const isChecked = Boolean(currentVal);
          return (
            <div
              key={param.key}
              className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <label
                  htmlFor={`cust-${param.key}`}
                  className="text-xs font-semibold text-[var(--ds-foreground)] cursor-pointer"
                >
                  {param.label}
                </label>
                <p className="text-[11px] text-[var(--ds-muted-foreground)]">
                  {param.description}
                </p>
              </div>
              <Button
                id={`cust-${param.key}`}
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
  );

  return (
    <div className="space-y-10">
      {/* ====================================================================
       * 1. RESOURCE PAGE HEADER
       * ================================================================== */}
      <header
        id="section-header"
        className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] space-y-5"
      >
        {/* Top Row: Breadcrumb Navigation + Verification Quality Gate Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ds-border)] pb-3.5">
          <Breadcrumbs
            items={[
              { label: 'Encyclopedia', href: '/' },
              { label: 'Directory', href: '/directory' },
              {
                label: primaryCategory ? primaryCategory.name : resource.categorySlug,
                href: `/taxonomy/${primaryCategory ? primaryCategory.slug : resource.categorySlug}`,
              },
              ...(resource.subcategory
                ? [
                    {
                      label: resource.subcategory,
                      href: `/taxonomy/${primaryCategory ? primaryCategory.slug : resource.categorySlug}`,
                    },
                  ]
                : []),
              { label: resource.title, isCurrent: true },
            ]}
          />

          {/* Section 13 Quality Control Verification Status */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {isResourceVerified ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--ds-success)] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Monograph · Live Demo Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[var(--ds-warning)] font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>
                  {!compilationAudit.isValid
                    ? 'Verification Suspended (Compilation Error)'
                    : 'Draft Preview Monograph'}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Title, Short Description & Primary Actions (Save, Share, Copy Link) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3">
            <ResourceMetadata
              items={[
                classificationDescriptor.label,
                primaryCategory ? primaryCategory.name : resource.categorySlug,
                resource.subcategory || 'Core Specification',
                `Difficulty: ${DIFFICULTY_LABEL[resource.audienceLevel]}`,
                `Last Reviewed: ${detailSpec.additionalDocs.lastReviewedIso}`,
              ]}
            />

            <h1
              style={{ fontSize: 'clamp(1.75rem, 2.7vw, 2.45rem)' }}
              className="font-display font-bold tracking-tight text-[var(--ds-foreground)] text-balance leading-tight"
            >
              {resource.title}
            </h1>

            <p className="text-sm sm:text-base text-[var(--ds-muted-foreground)] leading-relaxed max-w-3xl">
              {resource.summary}
            </p>
          </div>

          {/* Save Resource, Share Action & Copy Link Buttons */}
          <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2">
            <Button
              variant={isBookmarked ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={<Bookmark className="w-3.5 h-3.5" />}
              onClick={() => onToggleBookmark(resource.slug)}
            >
              {isBookmarked ? 'Saved in Collection' : 'Save Resource'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
              onClick={handleShareResource}
            >
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyResourceLink}
            >
              Copy Link
            </Button>
          </div>
        </div>

        {/* Compact Zero-Pill Metadata Strip: Tags, Multi-Category Membership, Provenance */}
        <div className="pt-4 border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ds-muted-foreground)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold text-[var(--ds-foreground)]">
              Tags:
            </span>
            <span>
              {(resource.tags && resource.tags.length > 0
                ? resource.tags
                : [resource.classification, resource.categorySlug]
              )
                .map((t) => `#${t}`)
                .join(' · ')}
            </span>
          </div>

          <div className="font-mono text-[11px] tabular-nums">
            WCAG {resource.accessibilitySpec.wcagComplianceLevel} (
            {resource.accessibilitySpec.minContrastRatio}:1) ·{' '}
            {resource.sourceAttribution.authorOrOrganization} (
            {resource.sourceAttribution.firstPublishedYear})
          </div>
        </div>
      </header>

      {/* ====================================================================
       * MAIN 12-COLUMN DOCUMENTATION WORKSPACE (3 COLS STICKY TOC / 9 COLS CONTENT)
       * ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SECTION 12: STICKY TABLE OF CONTENTS & NAVIGATION SIDEBAR (3 Cols) */}
        <aside
          aria-label="Resource Documentation Table of Contents"
          className="hidden lg:block lg:col-span-3 p-4 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] sticky top-20 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-2.5">
            <span className="text-[11px] font-mono font-bold text-[var(--ds-accent)]">
              ON THIS PAGE (11 SECTIONS)
            </span>
          </div>

          <nav aria-label="Section anchors" className="space-y-1">
            {TOC_SECTIONS.map((sec) => {
              const isActive = activeTocSectionId === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveTocSectionId(sec.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                    isActive
                      ? 'bg-[var(--ds-secondary)] text-[var(--ds-foreground)] font-bold border border-[var(--ds-accent)]'
                      : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]'
                  }`}
                >
                  <span className="font-mono text-[10px] text-[var(--ds-accent)] tabular-nums">
                    {sec.number}
                  </span>
                  <span className="truncate">{sec.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Quick Back to Category & Sequential Prev/Next Links */}
          <div className="pt-3 border-t border-[var(--ds-border)] space-y-2 text-xs">
            <Link
              href={`/taxonomy/${primaryCategory ? primaryCategory.slug : resource.categorySlug}`}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[var(--ds-background)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] text-[var(--ds-foreground)] font-semibold"
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                <ArrowLeft className="w-3.5 h-3.5 text-[var(--ds-accent)] shrink-0" />
                <span className="truncate">
                  {primaryCategory ? primaryCategory.name : 'Category'}
                </span>
              </span>
            </Link>

            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href={`/concept/${prevResource.slug}`}
                className="px-2.5 py-1.5 rounded-[6px] bg-[var(--ds-background)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] text-[11px] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] truncate"
              >
                ← Prev Concept
              </Link>
              <Link
                href={`/concept/${nextResource.slug}`}
                className="px-2.5 py-1.5 rounded-[6px] bg-[var(--ds-background)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] text-[11px] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] text-right truncate"
              >
                Next Concept →
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN 9-COLUMN DOCUMENTATION STREAM */}
        <div className="lg:col-span-9 space-y-12">
          {/* ================================================================
           * 2. PROMINENT BUILT-IN LIVE PREVIEW
           * ============================================================== */}
          <section
            id="section-live-preview"
            aria-labelledby="heading-live-preview"
            className="space-y-4 scroll-mt-24"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <TechnicalLabel
                  kicker="02. LIVE INTERACTIVE DEMONSTRATION"
                  detail="Working Implementation · Multi-Runtime & Viewport Controls"
                />
                <h2
                  id="heading-live-preview"
                  className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
                >
                  Built-In Live Preview & Specimen Workbench
                </h2>
              </div>

              {/* Runtime Mode Switcher (HTML/CSS, JS, React, SVG, Canvas, WebGL/3D, Native Specimen) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {detailSpec.supportedPreviewRuntimes.map((rt) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setActiveRuntime(rt)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-[6px] border transition-colors ${
                      activeRuntime === rt
                        ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-primary)] font-semibold'
                        : 'bg-[var(--ds-surface)] text-[var(--ds-muted-foreground)] border-[var(--ds-border)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    {RUNTIME_LABELS[rt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Workbench Container (Supports Fullscreen, Device Width, Background, Reload, Reset) */}
            <div
              className={`${
                isFullscreenPreview
                  ? 'fixed inset-3 z-50 flex flex-col bg-[var(--ds-surface)] shadow-2xl'
                  : 'relative flex flex-col bg-[var(--ds-surface)]'
              } rounded-[12px] border border-[var(--ds-border-strong)] overflow-hidden`}
            >
              {/* Top Control Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[var(--ds-muted)]/70 border-b border-[var(--ds-border)]">
                {/* Device Width Selector */}
                <div
                  role="group"
                  aria-label="Preview Device Width Selector"
                  className="flex flex-wrap items-center gap-1"
                >
                  {[
                    {
                      width: '100%' as const,
                      label: 'Fluid (100%)',
                      icon: <Monitor className="w-3.5 h-3.5" />,
                    },
                    {
                      width: '1024px' as const,
                      label: 'Desktop (1024px)',
                      icon: <Monitor className="w-3.5 h-3.5" />,
                    },
                    {
                      width: '768px' as const,
                      label: 'Tablet (768px)',
                      icon: <Tablet className="w-3.5 h-3.5" />,
                    },
                    {
                      width: '375px' as const,
                      label: 'Mobile (375px)',
                      icon: <Smartphone className="w-3.5 h-3.5" />,
                    },
                  ].map((dev) => (
                    <button
                      key={dev.width}
                      type="button"
                      onClick={() => setPreviewDeviceWidth(dev.width)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-[6px] transition-colors ${
                        previewDeviceWidth === dev.width
                          ? 'bg-[var(--ds-surface)] text-[var(--ds-foreground)] font-semibold shadow-2xs'
                          : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                      }`}
                    >
                      {dev.icon}
                      <span className="hidden sm:inline">{dev.label}</span>
                    </button>
                  ))}
                </div>

                {/* Background Selector, Reduced Motion Toggle, Reload, Reset, Fullscreen */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Select preview stage background"
                    value={previewBgPreset}
                    onChange={(e) =>
                      setPreviewBgPreset(
                        e.target.value as PreviewBackgroundPreset
                      )
                    }
                    className="px-2 py-1 text-xs bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[6px] text-[var(--ds-foreground)]"
                  >
                    {BACKGROUND_PRESETS.map((bg) => (
                      <option key={bg.id} value={bg.id}>
                        Bg: {bg.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setLocalReducedMotionOverride((p) => !p)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-[6px] border transition-colors ${
                      isReducedMotionEffective
                        ? 'bg-[var(--ds-secondary)] border-[var(--ds-accent)] text-[var(--ds-foreground)] font-bold'
                        : 'bg-[var(--ds-surface)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)]'
                    }`}
                  >
                    {isReducedMotionEffective
                      ? 'Reduced Motion: ON'
                      : 'Reduced Motion: OFF'}
                  </button>

                  <IconButton
                    label="Reload live preview"
                    variant="outline"
                    size="sm"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewReloadKey((k) => k + 1)}
                  />

                  <IconButton
                    label="Reset demo parameters to default"
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={resetAllParameters}
                  />

                  <IconButton
                    label={
                      isFullscreenPreview
                        ? 'Exit fullscreen preview'
                        : 'Open fullscreen preview'
                    }
                    variant="outline"
                    size="sm"
                    isSelected={isFullscreenPreview}
                    icon={
                      isFullscreenPreview ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={() => setIsFullscreenPreview((p) => !p)}
                  />
                </div>
              </div>

              {/* Live Preview Stage Viewport */}
              <div
                key={`stage-${previewReloadKey}`}
                style={previewStageBgStyle}
                className="flex-1 p-5 sm:p-8 bg-[var(--ds-background)] overflow-x-auto flex items-center justify-center min-h-[260px]"
              >
                <div
                  style={{
                    width: previewDeviceWidth,
                    maxWidth: '100%',
                  }}
                  className="transition-all duration-150"
                >
                  {renderLivePreviewRuntimeStage()}
                </div>
              </div>

              {/* Inline Quick Parameter Strip inside Live Preview Footer */}
              <div className="px-4 py-3 bg-[var(--ds-surface)] border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-mono font-bold text-[var(--ds-accent)] inline-flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>LIVE TOKENS:</span>
                  </span>
                  {resource.interactiveParameters.slice(0, 3).map((p) => (
                    <span
                      key={p.key}
                      className="font-mono text-[var(--ds-muted-foreground)] tabular-nums"
                    >
                      {p.label}:{' '}
                      <strong className="text-[var(--ds-foreground)]">
                        {String(paramValues[p.key] ?? p.defaultValue)}
                        {p.unit || ''}
                      </strong>
                    </span>
                  ))}
                </div>
                <a
                  href="#section-customization"
                  className="text-xs font-semibold text-[var(--ds-accent)] hover:underline"
                >
                  Customize All {resource.interactiveParameters.length}{' '}
                  Parameters ↓
                </a>
              </div>
            </div>
          </section>

          {/* ================================================================
           * 3. DESCRIPTION (CONCEPT, PROBLEM, MECHANICS, PRINCIPLES, STRENGTHS/LIMITS)
           * ============================================================== */}
          <section
            id="section-description"
            aria-labelledby="heading-description"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-6 scroll-mt-24"
          >
            <div>
              <TechnicalLabel
                kicker="03. CONCEPTUAL & ARCHITECTURAL SPECIFICATION"
                detail="What It Is · How It Works · Design Principles · Trade-Offs"
              />
              <h2
                id="heading-description"
                className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
              >
                Concept Analysis & Engineering Mechanics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                  What the Concept Is
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                  {detailSpec.deepDescription.whatItIs}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                  What Problem It Solves
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                  {detailSpec.deepDescription.problemItSolves}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                  How It Works Under the Hood
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                  {detailSpec.deepDescription.howItWorks}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                  Why It Is Used in Production
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                  {detailSpec.deepDescription.whyItIsUsed}
                </p>
              </div>
            </div>

            {/* Core Design Principles */}
            <div className="pt-4 border-t border-[var(--ds-border)] space-y-3">
              <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                Governing Design Principles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {detailSpec.deepDescription.designPrinciples.map((dp, idx) => (
                  <div
                    key={dp.title}
                    className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-1.5"
                  >
                    <div className="font-mono text-[11px] font-bold text-[var(--ds-accent)]">
                      PRINCIPLE 0{idx + 1}
                    </div>
                    <h4 className="font-display text-xs font-bold text-[var(--ds-foreground)]">
                      {dp.title}
                    </h4>
                    <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                      {dp.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Where Commonly Applied, Strengths, and Limitations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--ds-border)]">
              <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2">
                <div className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                  WHERE COMMONLY APPLIED
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--ds-muted-foreground)]">
                  {detailSpec.deepDescription.whereCommonlyApplied.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2">
                <div className="text-xs font-mono font-bold text-[var(--ds-success)]">
                  ARCHITECTURAL STRENGTHS
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--ds-muted-foreground)]">
                  {detailSpec.deepDescription.strengths.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2">
                <div className="text-xs font-mono font-bold text-[var(--ds-warning)]">
                  KNOWN LIMITATIONS & BOUNDARIES
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--ds-muted-foreground)]">
                  {detailSpec.deepDescription.limitations.map((l) => (
                    <li key={l}>• {l}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ================================================================
           * 4. VISUAL EXAMPLES & BEFORE/AFTER COMPARISONS (VERIFIED SOURCES)
           * ============================================================== */}
          <section
            id="section-visual-examples"
            aria-labelledby="heading-visual-examples"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-6 scroll-mt-24"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <TechnicalLabel
                  kicker="04. VISUAL EXAMPLES & SPECIMEN GALLERY"
                  detail="Before & After Comparisons · Verified Attribution · Zero Fake Screenshots"
                />
                <h2
                  id="heading-visual-examples"
                  className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
                >
                  Comparative Visual Specimens & Provenance
                </h2>
              </div>

              <Tabs
                ariaLabel="Visual Example Comparison View Mode"
                activeId={activeVisualComparisonSide}
                onChange={(id) =>
                  setActiveVisualComparisonSide(
                    id as 'split' | 'before' | 'after'
                  )
                }
                items={[
                  { id: 'split', label: 'Side-by-Side Split' },
                  { id: 'before', label: 'Before (Ad-Hoc)' },
                  { id: 'after', label: 'After (Verified Spec)' },
                ]}
              />
            </div>

            <div className="space-y-5">
              {detailSpec.visualExamples.map((specimen) => (
                <div
                  key={specimen.id}
                  className="p-5 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                        {specimen.title}
                      </h3>
                      <p className="text-xs text-[var(--ds-muted-foreground)] mt-0.5">
                        {specimen.summary}
                      </p>
                    </div>
                    <a
                      href={specimen.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-[var(--ds-accent)] hover:underline"
                    >
                      <span>Verified Source: {specimen.sourceName}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div
                    className={`grid grid-cols-1 ${
                      activeVisualComparisonSide === 'split'
                        ? 'md:grid-cols-2'
                        : ''
                    } gap-4`}
                  >
                    {(activeVisualComparisonSide === 'split' ||
                      activeVisualComparisonSide === 'before') && (
                      <div className="p-4 rounded-[8px] bg-[var(--ds-surface)] border border-[var(--ds-error-border)] space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-[var(--ds-error)] font-bold">
                          <span>{specimen.beforeStateLabel}</span>
                          <span>UNVERIFIED / ANTI-PATTERN</span>
                        </div>
                        <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                          {specimen.beforeStateCodeOrNotes}
                        </p>
                      </div>
                    )}

                    {(activeVisualComparisonSide === 'split' ||
                      activeVisualComparisonSide === 'after') && (
                      <div className="p-4 rounded-[8px] bg-[var(--ds-surface)] border border-[var(--ds-success-border)] space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-[var(--ds-success)] font-bold">
                          <span>{specimen.afterStateLabel}</span>
                          <span>
                            WCAG {resource.accessibilitySpec.wcagComplianceLevel}{' '}
                            VERIFIED
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                          {specimen.afterStateCodeOrNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[var(--ds-border)] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--ds-subtle-foreground)]">
                    <span>License: {specimen.license}</span>
                    <span>
                      Authentic Live Specimen Rendering (No Fabricated Marketing
                      Mockups)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================================================================
           * 5. IMPLEMENTATION VARIANTS & QUALITY CONTROL COMPILER GATE
           * ============================================================== */}
          <section
            id="section-implementation"
            aria-labelledby="heading-implementation"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-6 scroll-mt-24"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <TechnicalLabel
                  kicker="05. PRODUCTION IMPLEMENTATION VARIANTS"
                  detail="Working Code · Dependencies · Setup · File Structure · Compiler Verification"
                />
                <h2
                  id="heading-implementation"
                  className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
                >
                  Relevant Code Implementations
                </h2>
              </div>

              {/* Section 13 Quality Control Compiler Test Button */}
              <button
                type="button"
                onClick={() => setSimulateCompileFailure((p) => !p)}
                className={`px-3 py-1.5 rounded-[6px] border font-mono text-xs transition-colors ${
                  simulateCompileFailure
                    ? 'bg-[var(--ds-error-surface)] border-[var(--ds-error-border)] text-[var(--ds-error)] font-bold'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                }`}
              >
                {simulateCompileFailure
                  ? 'Compiler Failure Simulated (Unverified)'
                  : 'Test Section 13 Compiler Error Gate'}
              </button>
            </div>

            {/* Variant Selector Tabs (Only Relevant Implementations for this Concept) */}
            <Tabs
              ariaLabel="Select Implementation Variant"
              activeId={activeVariant.id}
              onChange={setSelectedVariantId}
              items={detailSpec.implementationVariants.map((v) => ({
                id: v.id,
                label: v.technologyLabel,
              }))}
            />

            {/* Section 13 Quality Control Compilation Error Alert */}
            {!compilationAudit.isValid && (
              <SemanticAlert
                variant="error"
                title="Code Example Compilation Failed — Resource Verification Suspended"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSimulateCompileFailure(false);
                      setCustomVariantCodeMap((prev) => {
                        const next = { ...prev };
                        delete next[activeVariant.id];
                        return next;
                      });
                    }}
                  >
                    Restore Valid Code
                  </Button>
                }
              >
                {compilationAudit.errorDetails}
              </SemanticAlert>
            )}

            {/* Variant Explanation, Required Dependencies, Setup Instructions & File Structure */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-3 text-xs">
                <div>
                  <div className="font-mono font-bold text-[var(--ds-accent)]">
                    VARIANT EXPLANATION
                  </div>
                  <p className="text-[var(--ds-muted-foreground)] mt-1 leading-relaxed">
                    {activeVariant.explanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--ds-border)]">
                  <div className="font-mono font-bold text-[var(--ds-foreground)]">
                    REQUIRED DEPENDENCIES
                  </div>
                  {activeVariant.requiredDependencies.length === 0 ? (
                    <p className="text-[var(--ds-muted-foreground)] mt-1">
                      Zero external runtime packages required (Native Browser
                      Specification).
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1 font-mono text-[11px]">
                      {activeVariant.requiredDependencies.map((dep) => (
                        <li
                          key={dep.name}
                          className="flex items-center justify-between"
                        >
                          <span className="text-[var(--ds-foreground)]">
                            {dep.name} ({dep.version})
                          </span>
                          <span className="text-[var(--ds-accent)]">
                            {dep.required ? 'Required' : 'Optional'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--ds-border)]">
                  <div className="font-mono font-bold text-[var(--ds-foreground)]">
                    SETUP INSTRUCTIONS
                  </div>
                  <ol className="mt-1 space-y-1 text-[var(--ds-muted-foreground)] list-decimal list-inside">
                    {activeVariant.setupInstructions.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="pt-2 border-t border-[var(--ds-border)]">
                  <div className="font-mono font-bold text-[var(--ds-foreground)]">
                    RELEVANT FILE STRUCTURE
                  </div>
                  <ul className="mt-1 space-y-1 font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                    {activeVariant.fileStructure.map((path) => (
                      <li key={path}>├── {path}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Working Code Block + Interactive Live Editor with Reset */}
              <div className="md:col-span-7 space-y-4">
                <CodeBlock
                  filename={activeVariant.filename}
                  language={activeVariant.language}
                  description="Interpolated with live parameters"
                  code={compilationAudit.compiledCode}
                />

                <EditorPanel
                  filename={`Edit ${activeVariant.filename} (Live Compiler Gate)`}
                  language={activeVariant.language}
                  value={activeVariantTemplateToCompile}
                  isDirty={
                    customVariantCodeMap[activeVariant.id] !== undefined
                  }
                  onReset={() =>
                    setCustomVariantCodeMap((prev) => {
                      const next = { ...prev };
                      delete next[activeVariant.id];
                      return next;
                    })
                  }
                  onChange={(val) =>
                    setCustomVariantCodeMap((prev) => ({
                      ...prev,
                      [activeVariant.id]: val,
                    }))
                  }
                />
              </div>
            </div>

            {/* Integrated Multi-File Live Playground Engine & Full Studio Launcher */}
            <div className="pt-6 border-t border-[var(--ds-border)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-xs font-bold text-[var(--ds-accent)]">
                    INTERACTIVE MULTI-FILE PLAYGROUND ENGINE
                  </div>
                  <p className="text-xs text-[var(--ds-muted-foreground)] mt-0.5">
                    Launch the reusable Sandpack & CSP-Isolated Playground Engine directly inside this monograph or open in the full-screen Playground Studio.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEmbeddedPlayground((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--ds-border-strong)] bg-[var(--ds-background)] px-3 py-1.5 text-xs font-semibold text-[var(--ds-foreground)] hover:border-[var(--ds-accent)]"
                  >
                    <Code2 className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                    <span>
                      {showEmbeddedPlayground
                        ? 'Collapse Embedded Playground'
                        : 'Launch Embedded Playground Engine'}
                    </span>
                  </button>

                  <Link
                    href={`/playground?resource=${encodeURIComponent(resource.slug)}`}
                    className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--ds-primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ds-primary-foreground)] hover:opacity-95"
                  >
                    <span>Open in Full Playground Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {showEmbeddedPlayground && (
                <LivePlaygroundEngine
                  initialConfig={resourcePlaygroundConfig}
                  compactEmbeddedMode
                />
              )}
            </div>
          </section>

          {/* ================================================================
           * 6. TECHNOLOGY & COMPATIBILITY MATRIX
           * ============================================================== */}
          <section
            id="section-technology"
            aria-labelledby="heading-technology"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-6 scroll-mt-24"
          >
            <div>
              <TechnicalLabel
                kicker="06. TECHNOLOGY, DEPENDENCIES & BROWSER BASELINE"
                detail="Required vs Optional Libraries · Framework Support · Alternatives"
              />
              <h2
                id="heading-technology"
                className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
              >
                Technology Stack & Compatibility Specification
              </h2>
            </div>

            {/* Required vs Optional Dependencies Table */}
            <div className="space-y-2">
              <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                Libraries, Dependencies & Official Documentation Links
              </h3>
              <div className="overflow-x-auto border border-[var(--ds-border)] rounded-[10px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--ds-muted)] text-[var(--ds-foreground)] font-mono border-b border-[var(--ds-border)]">
                    <tr>
                      <th className="py-2.5 px-3.5">Package / Specification</th>
                      <th className="py-2.5 px-3.5">Requirement</th>
                      <th className="py-2.5 px-3.5">Installation / Baseline</th>
                      <th className="py-2.5 px-3.5">Official Docs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ds-border)]">
                    {detailSpec.technologyMatrix.requiredLibraries.map(
                      (lib) => (
                        <tr key={lib.name} className="bg-[var(--ds-surface)]">
                          <td className="py-2.5 px-3.5">
                            <div className="font-semibold text-[var(--ds-foreground)]">
                              {lib.name}{' '}
                              <span className="font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                                ({lib.version})
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--ds-muted-foreground)]">
                              {lib.purpose}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono">
                            <span
                              className={
                                lib.isRequired
                                  ? 'text-[var(--ds-accent)] font-bold'
                                  : 'text-[var(--ds-muted-foreground)]'
                              }
                            >
                              {lib.isRequired ? 'REQUIRED' : 'OPTIONAL'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] text-[var(--ds-foreground)]">
                            <code>{lib.installCommand}</code>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <a
                              href={lib.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--ds-accent)] font-semibold hover:underline"
                            >
                              <span>Docs</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Framework Compatibility & Browser Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                  Framework Compatibility
                </h3>
                <div className="space-y-2">
                  {detailSpec.technologyMatrix.frameworkCompatibility.map(
                    (fw) => (
                      <div
                        key={fw.framework}
                        className="p-3 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-[var(--ds-foreground)]">
                          <span>{fw.framework}</span>
                          <span className="font-mono text-[11px] text-[var(--ds-accent)]">
                            {fw.supportLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ds-muted-foreground)]">
                          {fw.notes}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                  Browser Baseline & Relevant Alternatives
                </h3>
                <div className="space-y-2">
                  {detailSpec.technologyMatrix.browserRequirements.map((br) => (
                    <div
                      key={br.browser}
                      className="p-2.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-[var(--ds-foreground)]">
                        {br.browser} ({br.minimumVersion})
                      </span>
                      <span className="font-mono text-[11px] text-[var(--ds-success)]">
                        {br.baselineStatus}
                      </span>
                    </div>
                  ))}
                  {detailSpec.technologyMatrix.relevantAlternatives.map(
                    (alt) => (
                      <div
                        key={alt.name}
                        className="p-3 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-xs space-y-1"
                      >
                        <div className="font-mono text-[11px] font-bold text-[var(--ds-accent)]">
                          ALTERNATIVE: {alt.name}
                        </div>
                        <p className="text-[11px] text-[var(--ds-muted-foreground)]">
                          {alt.tradeoffComparison}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================
           * 7. RESPONSIVE BEHAVIOR (DESKTOP, TABLET, MOBILE + ACTUAL PREVIEW)
           * ============================================================== */}
          <section
            id="section-responsive"
            aria-labelledby="heading-responsive"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-6 scroll-mt-24"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <TechnicalLabel
                  kicker="07. RESPONSIVE & ADAPTIVE BEHAVIOR"
                  detail="Desktop · Tablet · Mobile · Touch Ergonomics · Live Reflow Preview"
                />
                <h2
                  id="heading-responsive"
                  className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
                >
                  Multi-Viewport Adaptation & Touch Ergonomics
                </h2>
              </div>

              <Tabs
                ariaLabel="Inspect Responsive Breakpoint"
                activeId={responsiveTabDevice}
                onChange={(id) =>
                  setResponsiveTabDevice(id as 'desktop' | 'tablet' | 'mobile')
                }
                items={[
                  { id: 'desktop', label: 'Desktop (>=1024px)' },
                  { id: 'tablet', label: 'Tablet (768px)' },
                  { id: 'mobile', label: 'Mobile (375px)' },
                ]}
              />
            </div>

            {/* 3-Column Breakpoint Architecture Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-[10px] border space-y-2 text-xs ${
                  responsiveTabDevice === 'desktop'
                    ? 'bg-[var(--ds-secondary)]/40 border-[var(--ds-accent)]'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)]'
                }`}
              >
                <div className="font-mono font-bold text-[var(--ds-accent)]">
                  DESKTOP ·{' '}
                  {detailSpec.responsiveBehavior.desktopBehavior.viewportRange}
                </div>
                <p className="text-[var(--ds-foreground)] font-medium">
                  {detailSpec.responsiveBehavior.desktopBehavior.layoutChanges}
                </p>
                <p className="text-[var(--ds-muted-foreground)]">
                  {
                    detailSpec.responsiveBehavior.desktopBehavior
                      .interactionModel
                  }
                </p>
              </div>

              <div
                className={`p-4 rounded-[10px] border space-y-2 text-xs ${
                  responsiveTabDevice === 'tablet'
                    ? 'bg-[var(--ds-secondary)]/40 border-[var(--ds-accent)]'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)]'
                }`}
              >
                <div className="font-mono font-bold text-[var(--ds-accent)]">
                  TABLET ·{' '}
                  {detailSpec.responsiveBehavior.tabletBehavior.viewportRange}
                </div>
                <p className="text-[var(--ds-foreground)] font-medium">
                  {detailSpec.responsiveBehavior.tabletBehavior.layoutChanges}
                </p>
                <p className="text-[var(--ds-muted-foreground)]">
                  {
                    detailSpec.responsiveBehavior.tabletBehavior
                      .interactionModel
                  }
                </p>
              </div>

              <div
                className={`p-4 rounded-[10px] border space-y-2 text-xs ${
                  responsiveTabDevice === 'mobile'
                    ? 'bg-[var(--ds-secondary)]/40 border-[var(--ds-accent)]'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)]'
                }`}
              >
                <div className="font-mono font-bold text-[var(--ds-accent)]">
                  MOBILE ·{' '}
                  {detailSpec.responsiveBehavior.mobileBehavior.viewportRange}
                </div>
                <p className="text-[var(--ds-foreground)] font-medium">
                  {detailSpec.responsiveBehavior.mobileBehavior.layoutChanges}
                </p>
                <p className="text-[var(--ds-muted-foreground)]">
                  <strong>Touch:</strong>{' '}
                  {
                    detailSpec.responsiveBehavior.mobileBehavior
                      .touchInteraction
                  }
                </p>
                <p className="text-[var(--ds-muted-foreground)]">
                  <strong>Mobile Alternative:</strong>{' '}
                  {
                    detailSpec.responsiveBehavior.mobileBehavior
                      .mobileSpecificAlternative
                  }
                </p>
              </div>
            </div>

            {/* Live Responsive Reflow Simulator */}
            <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-[var(--ds-foreground)]">
                  ACTUAL RESPONSIVE BREAKPOINT SIMULATOR (
                  {responsiveTabDevice.toUpperCase()})
                </span>
                <span className="text-[var(--ds-accent)]">
                  {detailSpec.responsiveBehavior.breakpointStrategySummary}
                </span>
              </div>

              <div className="flex justify-center py-3 overflow-x-auto">
                <div
                  style={{
                    width:
                      responsiveTabDevice === 'desktop'
                        ? '100%'
                        : responsiveTabDevice === 'tablet'
                        ? '640px'
                        : '340px',
                    maxWidth: '100%',
                  }}
                  className="p-4 rounded-[8px] bg-[var(--ds-surface)] border-2 border-[var(--ds-accent)] transition-all duration-200 space-y-3"
                >
                  <div
                    className={`grid gap-3 ${
                      responsiveTabDevice === 'desktop'
                        ? 'grid-cols-3'
                        : responsiveTabDevice === 'tablet'
                        ? 'grid-cols-2'
                        : 'grid-cols-1'
                    }`}
                  >
                    {[1, 2, 3].map((slot) => (
                      <div
                        key={slot}
                        className="p-3 rounded-[6px] bg-[var(--ds-background)] border border-[var(--ds-border)] flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-[var(--ds-foreground)]">
                          Adaptive Module 0{slot}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--ds-accent)]">
                          min-h: 44px
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================
           * 8. ACCESSIBILITY & INCLUSIVE DESIGN AUDIT
           * ============================================================== */}
          <section
            id="section-accessibility"
            aria-labelledby="heading-accessibility"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-6 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <TechnicalLabel
                  kicker="08. ACCESSIBILITY & INCLUSIVE ENGINEERING"
                  detail={`WCAG ${resource.accessibilitySpec.wcagComplianceLevel} (${resource.accessibilitySpec.minContrastRatio}:1) · Keyboard · ARIA · Reduced Motion`}
                />
                <h2
                  id="heading-accessibility"
                  className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
                >
                  Assistive Technology & WCAG Compliance Contract
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setLocalReducedMotionOverride((p) => !p)}
                className={`px-3 py-1.5 rounded-[6px] border text-xs font-mono transition-colors ${
                  isReducedMotionEffective
                    ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-[var(--ds-primary)] font-bold'
                    : 'bg-[var(--ds-background)] border-[var(--ds-border)] text-[var(--ds-foreground)]'
                }`}
              >
                {isReducedMotionEffective
                  ? 'Reduced-Motion Mode: ACTIVE'
                  : 'Activate Reduced-Motion Mode'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Keyboard Interactions Table */}
              <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-3">
                <div className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                  KEYBOARD INTERACTION MATRIX
                </div>
                <div className="space-y-2">
                  {resource.accessibilitySpec.keyboardInteractions.map((kb) => (
                    <div
                      key={kb.keyCombo}
                      className="p-2.5 rounded-[6px] bg-[var(--ds-surface)] border border-[var(--ds-border)] text-xs space-y-1"
                    >
                      <kbd className="px-1.5 py-0.5 font-mono text-[11px] font-bold bg-[var(--ds-secondary)] text-[var(--ds-foreground)] rounded">
                        {kb.keyCombo}
                      </kbd>
                      <p className="text-[var(--ds-muted-foreground)]">
                        {kb.expectedBehavior}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic HTML & ARIA Attributes */}
              <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-3">
                <div className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                  SEMANTIC HTML & WAI-ARIA ATTRIBUTES
                </div>
                <div className="text-xs text-[var(--ds-muted-foreground)]">
                  <strong className="text-[var(--ds-foreground)]">
                    Elements:
                  </strong>{' '}
                  {detailSpec.accessibilityDeepSpec.semanticHtmlElements.join(
                    ' · '
                  )}
                </div>
                <div className="space-y-1.5">
                  {detailSpec.accessibilityDeepSpec.ariaAttributes.map(
                    (attr) => (
                      <div
                        key={attr.attribute}
                        className="p-2 rounded bg-[var(--ds-surface)] border border-[var(--ds-border)] text-xs"
                      >
                        <code className="font-mono font-bold text-[var(--ds-foreground)]">
                          {attr.attribute}
                        </code>
                        <span className="text-[var(--ds-muted-foreground)]">
                          {' '}
                          — {attr.usageContract}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Focus, Screen Reader, Contrast, Touch Target & Reduced Motion Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-xs space-y-1">
                <div className="font-mono font-bold text-[var(--ds-foreground)]">
                  Focus Management
                </div>
                <p className="text-[var(--ds-muted-foreground)]">
                  {detailSpec.accessibilityDeepSpec.focusManagementStrategy}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-xs space-y-1">
                <div className="font-mono font-bold text-[var(--ds-foreground)]">
                  Screen Reader Announcements
                </div>
                <p className="text-[var(--ds-muted-foreground)]">
                  {
                    detailSpec.accessibilityDeepSpec
                      .screenReaderConsiderations
                  }
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-xs space-y-1">
                <div className="font-mono font-bold text-[var(--ds-foreground)]">
                  Color Contrast & Dual Signaling
                </div>
                <p className="text-[var(--ds-muted-foreground)]">
                  {detailSpec.accessibilityDeepSpec.colorContrastAudit}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-xs space-y-1">
                <div className="font-mono font-bold text-[var(--ds-foreground)]">
                  Touch Target Sizes (WCAG 2.5.5)
                </div>
                <p className="text-[var(--ds-muted-foreground)]">
                  {detailSpec.accessibilityDeepSpec.touchTargetCompliance}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] text-xs space-y-1 sm:col-span-2">
                <div className="font-mono font-bold text-[var(--ds-accent)]">
                  Accessible Alternative & Reduced-Motion Mode (WCAG 2.3.3)
                </div>
                <p className="text-[var(--ds-muted-foreground)]">
                  {
                    detailSpec.accessibilityDeepSpec
                      .accessibleAlternativeForAnimation
                  }
                </p>
              </div>
            </div>
          </section>

          {/* ================================================================
           * 9. REAL-TIME CUSTOMIZATION & TOKEN CONFIG EXPORT
           * ============================================================== */}
          <section
            id="section-customization"
            aria-labelledby="heading-customization"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border-2 border-[var(--ds-accent)] space-y-6 scroll-mt-24"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <TechnicalLabel
                  kicker="09. REAL-TIME PARAMETER CUSTOMIZATION"
                  detail="Context-Specific Controls · Updates Live Preview Immediately"
                />
                <h2
                  id="heading-customization"
                  className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
                >
                  Interactive Property & Token Customizer
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={resetAllParameters}
                >
                  Reset to Default
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const summary = resource.interactiveParameters
                      .slice(0, 2)
                      .map(
                        (p) =>
                          `${p.key}: ${paramValues[p.key] ?? p.defaultValue}${
                            p.unit || ''
                          }`
                      )
                      .join(' · ');
                    onSavePreset(
                      resource.slug,
                      resource.title,
                      summary || 'Custom Preset',
                      paramValues
                    );
                  }}
                >
                  Save Preset Snapshot
                </Button>
              </div>
            </div>

            {/* Domain-Specific Parameter Controls */}
            {renderCustomizationControls()}

            {/* Copy Customized Code & JSON Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-[var(--ds-border)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--ds-foreground)]">
                    CUSTOMIZED IMPLEMENTATION CODE
                  </span>
                  <CopyButton
                    textToCopy={compilationAudit.compiledCode}
                    label="Copy Customized Code"
                  />
                </div>
                <pre className="p-3.5 rounded-[8px] bg-slate-950 text-indigo-200 font-mono text-xs overflow-x-auto max-h-44">
                  <code>{compilationAudit.compiledCode}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--ds-foreground)]">
                    CUSTOMIZED JSON TOKEN CONFIGURATION
                  </span>
                  <CopyButton
                    textToCopy={customizedJsonConfig}
                    label="Copy JSON Config"
                  />
                </div>
                <pre className="p-3.5 rounded-[8px] bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto max-h-44">
                  <code>{customizedJsonConfig}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* ================================================================
           * 10. RELATED RESOURCES KNOWLEDGE GRAPH
           * ============================================================== */}
          <section
            id="section-related"
            aria-labelledby="heading-related"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-6 scroll-mt-24"
          >
            <div>
              <TechnicalLabel
                kicker="10. SEMANTIC KNOWLEDGE GRAPH RELATIONSHIPS"
                detail="Similar Concepts · Alternatives · Prerequisites · Advanced Extensions"
              />
              <h2
                id="heading-related"
                className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
              >
                Connected Design Concepts & Technologies
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  groupLabel: 'Similar Concepts',
                  slugs: detailSpec.relatedGraph.similarConcepts,
                },
                {
                  groupLabel: 'Alternative Techniques',
                  slugs: detailSpec.relatedGraph.alternativeTechniques,
                },
                {
                  groupLabel: 'Related Motion & Choreography',
                  slugs: detailSpec.relatedGraph.relatedAnimationTypes,
                },
                {
                  groupLabel: 'Related Official Design Systems',
                  slugs: detailSpec.relatedGraph.relatedDesignSystems,
                },
                {
                  groupLabel: 'Foundational Prerequisites',
                  slugs: detailSpec.relatedGraph.prerequisites,
                },
                {
                  groupLabel: 'Advanced Follow-Up Concepts',
                  slugs: detailSpec.relatedGraph.advancedConcepts,
                },
              ].map((group) => {
                const items = group.slugs
                  .map((s) => allResources.find((r) => r.slug === s))
                  .filter((r): r is DesignResource => Boolean(r));
                if (items.length === 0) return null;

                return (
                  <div
                    key={group.groupLabel}
                    className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2.5"
                  >
                    <div className="text-xs font-mono font-bold text-[var(--ds-accent)]">
                      {group.groupLabel.toUpperCase()}
                    </div>
                    <div className="space-y-2">
                      {items.map((rel) => (
                        <RelatedResourceCard
                          key={`${group.groupLabel}-${rel.slug}`}
                          resource={rel}
                          relationshipLabel={group.groupLabel}
                          onSelect={(slug) => {
                            window.location.href = `/concept/${slug}`;
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================
           * 11. ADDITIONAL DOCUMENTATION (BEST PRACTICES, MISTAKES, FAQ, PROVENANCE)
           * ============================================================== */}
          <section
            id="section-documentation"
            aria-labelledby="heading-documentation"
            className="p-6 sm:p-8 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] space-y-6 scroll-mt-24"
          >
            <div>
              <TechnicalLabel
                kicker="11. PRODUCTION GUIDE, FAQS & PROVENANCE ATTRIBUTION"
                detail="Best Practices · Common Mistakes · Performance · License & Sources"
              />
              <h2
                id="heading-documentation"
                className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1"
              >
                Engineering Guidelines, FAQ & Source Verification
              </h2>
            </div>

            {/* Best Practices & Performance Considerations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2">
                <div className="text-xs font-mono font-bold text-[var(--ds-success)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PRODUCTION BEST PRACTICES</span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--ds-muted-foreground)]">
                  {detailSpec.additionalDocs.bestPractices.map((bp) => (
                    <li key={bp}>• {bp}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2">
                <div className="text-xs font-mono font-bold text-[var(--ds-accent)] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>PERFORMANCE & COMPOSITOR BUDGETS</span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--ds-muted-foreground)]">
                  {detailSpec.additionalDocs.performanceConsiderations.map(
                    (perf) => (
                      <li key={perf}>• {perf}</li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* Common Mistakes & Corrections */}
            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                Common Implementation Mistakes & Architectural Corrections
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailSpec.additionalDocs.commonMistakes.map((cm) => (
                  <div
                    key={cm.mistake}
                    className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] space-y-2 text-xs"
                  >
                    <div className="text-[var(--ds-warning)] font-semibold flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Mistake: {cm.mistake}</span>
                    </div>
                    <div className="text-[var(--ds-muted-foreground)] pl-5">
                      <strong className="text-[var(--ds-foreground)]">
                        Correction:
                      </strong>{' '}
                      {cm.correction}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                Frequently Asked Questions
              </h3>
              <Accordion
                defaultOpenIds={['faq-0']}
                items={detailSpec.additionalDocs.faqs.map((faq, idx) => ({
                  id: `faq-${idx}`,
                  title: faq.question,
                  metadata: 'Verified Answer',
                  content: faq.answer,
                }))}
              />
            </div>

            {/* Official Sources, License, Attribution & Last Reviewed Date */}
            <div className="p-4 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-mono font-bold text-[var(--ds-foreground)]">
                  PROVENANCE, ATTRIBUTION & LICENSE RECORD
                </div>
                <p className="text-[var(--ds-muted-foreground)]">
                  <strong>Author / Specification Body:</strong>{' '}
                  {resource.sourceAttribution.authorOrOrganization} (First
                  Published {resource.sourceAttribution.firstPublishedYear}) ·{' '}
                  <strong>License:</strong>{' '}
                  {resource.sourceAttribution.licenseType} ·{' '}
                  <strong>Last Reviewed:</strong>{' '}
                  {detailSpec.additionalDocs.lastReviewedIso}
                </p>
                <p className="text-[11px] text-[var(--ds-subtle-foreground)]">
                  {resource.sourceAttribution.attributionNote}
                </p>
              </div>

              {resource.sourceAttribution.officialUrl && (
                <a
                  href={resource.sourceAttribution.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] font-semibold whitespace-nowrap shrink-0"
                >
                  <span>Official Specification</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </section>

          {/* ================================================================
           * 12. BOTTOM SEQUENTIAL RESOURCE NAVIGATION (PREV / CATEGORY / NEXT)
           * ============================================================== */}
          <nav
            aria-label="Sequential Resource Pagination"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--ds-border)]"
          >
            <Link
              href={`/concept/${prevResource.slug}`}
              className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors flex flex-col justify-between space-y-1 group"
            >
              <span className="text-[11px] font-mono text-[var(--ds-muted-foreground)] inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3 text-[var(--ds-accent)]" />
                <span>Previous Resource</span>
              </span>
              <span className="font-display text-sm font-bold text-[var(--ds-foreground)] group-hover:text-[var(--ds-accent)] truncate">
                {prevResource.title}
              </span>
            </Link>

            <Link
              href={`/taxonomy/${primaryCategory ? primaryCategory.slug : resource.categorySlug}`}
              className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors flex flex-col items-center justify-center text-center space-y-1 group"
            >
              <span className="text-[11px] font-mono text-[var(--ds-accent)]">
                Back to Primary Category
              </span>
              <span className="font-display text-sm font-bold text-[var(--ds-foreground)] group-hover:text-[var(--ds-accent)]">
                {primaryCategory ? primaryCategory.name : resource.categorySlug}
              </span>
            </Link>

            <Link
              href={`/concept/${nextResource.slug}`}
              className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)] transition-colors flex flex-col justify-between text-right space-y-1 group"
            >
              <span className="text-[11px] font-mono text-[var(--ds-muted-foreground)] inline-flex items-center justify-end gap-1">
                <span>Next Resource</span>
                <ArrowRight className="w-3 h-3 text-[var(--ds-accent)]" />
              </span>
              <span className="font-display text-sm font-bold text-[var(--ds-foreground)] group-hover:text-[var(--ds-accent)] truncate">
                {nextResource.title}
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
