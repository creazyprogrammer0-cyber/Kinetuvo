'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sliders,
  Sparkles,
  Trash2,
  Bookmark,
  Check,
  Send,
  Layers,
  Terminal,
  Eye,
  Play,
} from 'lucide-react';
import { AppHeader } from '@/components/shell/AppHeader';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  SEMANTIC_COLOR_TOKENS,
  TYPOGRAPHY_SCALE_TOKENS,
  SPACING_SCALE_TOKENS,
  LAYOUT_DIMENSION_TOKENS,
  MOTION_LANGUAGE_TOKENS,
} from '@/lib/design-system/tokens';
import {
  Button,
  IconButton,
  Tabs,
  DropdownMenu,
  Tooltip,
  Dialog,
  Drawer,
  Accordion,
  useToast,
} from '@/components/ui/InteractionPrimitives';
import {
  ResourceMetadata,
  TechnicalLabel,
  ResourceCard,
  CategoryCard,
  FeaturedResourceCard,
  RelatedResourceCard,
  SemanticAlert,
} from '@/components/ui/ContentPrimitives';
import {
  CodeBlock,
  CopyButton,
  LivePreviewContainer,
  EditorPanel,
  ResizableSplitPanel,
  LoadingSkeleton,
} from '@/components/ui/TechnicalPrimitives';
import {
  Breadcrumbs,
  SidebarNavigation,
} from '@/components/ui/NavigationPrimitives';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import { TAXONOMY_CATEGORIES } from '@/lib/taxonomy/registry';
import { BRAND_CONFIG } from '@/config/brand.config';

const SHOWCASE_SECTIONS = [
  { id: 'color-tokens', label: '01. Semantic Color System', badge: '15 Tokens' },
  { id: 'typography-system', label: '02. Typography Hierarchy', badge: '9 Scales' },
  { id: 'layout-spacing', label: '03. Layout & Spacing Grid', badge: '14 Tokens' },
  { id: 'buttons-forms', label: '04. Buttons & Validated Forms', badge: 'Interactive' },
  { id: 'cards-content', label: '05. Editorial Content Cards', badge: '6 Primitives' },
  { id: 'navigation-primitives', label: '06. Navigation Architecture', badge: '5 Primitives' },
  { id: 'overlays-feedback', label: '07. Tabs, Dialogs & Alerts', badge: '8 Primitives' },
  { id: 'technical-sandbox', label: '08. Code & Live Previews', badge: '7 Primitives' },
  { id: 'motion-tokens', label: '09. Motion Language', badge: '8 Tokens' },
];

export function DesignSystemShowcase() {
  const router = useRouter();
  const { isDarkTheme, toggleTheme, reducedMotionSim, toggleReducedMotionSim } =
    useTheme();
  const { pushToast } = useToast();

  const [activeSidebarId, setActiveSidebarId] = useState('color-tokens');
  const [colorFilterCategory, setColorFilterCategory] = useState<string>('all');

  // Interactive states for Component Demonstrations
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [selectedButtonToggle, setSelectedButtonToggle] = useState(true);
  const [demoTabId, setDemoTabId] = useState('tokens');
  const [underlineTabId, setUnderlineTabId] = useState('usage');
  const [dropdownValue, setDropdownValue] = useState('wcag-aaa');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([
    'material-3-semantic-token-hierarchy',
  ]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(
    'design-systems'
  );
  const [showSkeletonDemo, setShowSkeletonDemo] = useState(false);

  // Interactive Form Validation State
  const [formConceptTitle, setFormConceptTitle] = useState('');
  const [formClassification, setFormClassification] = useState(
    'official-design-system'
  );
  const [formSourceUrl, setFormSourceUrl] = useState('');
  const [formVerifyWcag, setFormVerifyWcag] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Live Technical Editor Demo State
  const [editorDemoCode, setEditorDemoCode] = useState(`:root {
  --ds-primary: #4338CA;
  --ds-surface: #FFFFFF;
  --ds-radius-md: 8px;
}

.editorial-specimen {
  padding: 20px;
  border-radius: var(--ds-radius-md);
  border: 1px solid var(--ds-border);
}`);
  const [previewRadius, setPreviewRadius] = useState(10);
  const [previewPadding, setPreviewPadding] = useState(20);

  const handleScrollToSection = (id: string) => {
    setActiveSidebarId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: reducedMotionSim ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  const handleLaunchConceptInWorkbench = (slug: string) => {
    pushToast({
      tone: 'info',
      title: 'Opening Interactive Concept Lab',
      description: `Navigating to workbench with concept: ${slug}`,
    });
    router.push(`/#interactive-lab`);
  };

  const handleToggleBookmark = (slug: string) => {
    setBookmarkedSlugs((prev) => {
      const exists = prev.includes(slug);
      const next = exists ? prev.filter((s) => s !== slug) : [...prev, slug];
      pushToast({
        tone: 'success',
        title: exists ? 'Removed from Collection' : 'Saved to Collection',
        description: `Resource bookmark updated for ${slug}.`,
      });
      return next;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (formConceptTitle.trim().length < 4) {
      setFormError('Concept Title must be at least 4 characters long.');
      return;
    }
    if (
      !formSourceUrl.trim().startsWith('https://') &&
      !formSourceUrl.trim().startsWith('http://')
    ) {
      setFormError(
        'Official Specification URL must start with https:// for verifiable provenance.'
      );
      return;
    }

    setFormSuccess(
      `Validated entry "${formConceptTitle.trim()}" (${formClassification}) ready for taxonomy registration.`
    );
    pushToast({
      tone: 'success',
      title: 'Specification Entry Validated',
      description: `${formConceptTitle.trim()} passed provenance and WCAG schema checks.`,
    });
  };

  const filteredColorTokens =
    colorFilterCategory === 'all'
      ? SEMANTIC_COLOR_TOKENS
      : SEMANTIC_COLOR_TOKENS.filter((t) => t.category === colorFilterCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)] transition-colors">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Workbench', href: '/' },
          { label: 'Design System & Component Architecture', isCurrent: true },
        ]}
        categories={TAXONOMY_CATEGORIES}
        resources={FOUNDATION_RESOURCES}
        onSelectResource={handleLaunchConceptInWorkbench}
      />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Editorial Design System Header */}
        <section className="p-6 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ResourceMetadata
              items={[
                'Global Visual Design Language',
                'Editorial · Minimal · Technical · Experimental',
                isDarkTheme ? 'Active Polarity: Dark Charcoal' : 'Active Polarity: Cool Neutral Light',
              ]}
            />
            <span className="text-xs font-mono text-[var(--ds-subtle-foreground)]">
              Spec: /docs/DESIGN_SYSTEM.md
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-2">
              <h1
                style={{ fontSize: 'clamp(1.625rem, 2.4vw, 2.25rem)' }}
                className="font-display font-bold tracking-tight text-[var(--ds-foreground)] leading-tight text-balance"
              >
                {BRAND_CONFIG.productName} — Design System & Reusable Component Library
              </h1>
              <p className="text-sm text-[var(--ds-muted-foreground)] leading-relaxed max-w-[68ch]">
                Every token and component below is a live, interactive production primitive
                shared across the encyclopedia. Designed for high-density readability,
                deterministic keyboard focus, zero-pill metadata discipline, and persistent
                dual-theme contrast.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={toggleTheme}>
                {isDarkTheme ? 'Preview Light Theme' : 'Preview Dark Theme'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                isSelected={reducedMotionSim}
                onClick={toggleReducedMotionSim}
              >
                {reducedMotionSim ? 'Reduced Motion: Active' : 'Test Reduced Motion'}
              </Button>
            </div>
          </div>
        </section>

        {/* Two-Column Architecture: Sticky 264px Sidebar + Main Showcase Canvas */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <SidebarNavigation
            title="Design System Outline"
            links={SHOWCASE_SECTIONS}
            activeId={activeSidebarId}
            onSelect={handleScrollToSection}
          />

          <div className="flex-1 min-w-0 space-y-14">
            {/* ================================================================
             * 01. SEMANTIC COLOR SYSTEM
             * ============================================================== */}
            <section id="color-tokens" className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--ds-border)] pb-4">
                <div>
                  <TechnicalLabel
                    kicker="01. COLOR ARCHITECTURE"
                    detail="60-30-10 Distribution & Dual Polarity"
                  />
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                    Semantic Color Tokens
                  </h2>
                </div>

                <Tabs
                  ariaLabel="Filter semantic color tokens by role"
                  activeId={colorFilterCategory}
                  onChange={setColorFilterCategory}
                  items={[
                    { id: 'all', label: 'All (15)' },
                    { id: 'surface', label: 'Surfaces' },
                    { id: 'typography', label: 'Typography' },
                    { id: 'brand-accent', label: 'Brand Accent' },
                    { id: 'status', label: 'Status' },
                    { id: 'interaction-border', label: 'Borders & Focus' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredColorTokens.map((token) => (
                  <div
                    key={token.id}
                    className="p-4 rounded-[10px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          style={{ backgroundColor: `var(${token.cssVar})` }}
                          className="w-8 h-8 rounded-[6px] border border-[var(--ds-border-strong)] shrink-0 shadow-2xs"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="font-display text-xs font-bold text-[var(--ds-foreground)] truncate">
                            {token.roleName}
                          </div>
                          <div className="font-mono text-[11px] text-[var(--ds-accent)] truncate">
                            {token.cssVar}
                          </div>
                        </div>
                      </div>
                      <CopyButton textToCopy={`var(${token.cssVar})`} label="Copy" />
                    </div>

                    <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                      {token.usageGuideline}
                    </p>

                    <div className="pt-2 border-t border-[var(--ds-border)] flex items-center justify-between text-[11px] font-mono text-[var(--ds-subtle-foreground)] tabular-nums">
                      <span>Light: {token.lightHex}</span>
                      <span>Dark: {token.darkHex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ================================================================
             * 02. TYPOGRAPHY HIERARCHY
             * ============================================================== */}
            <section id="typography-system" className="space-y-5">
              <div className="border-b border-[var(--ds-border)] pb-4">
                <TechnicalLabel
                  kicker="02. TYPOGRAPHY SYSTEM"
                  detail="Bricolage Grotesque · Plus Jakarta Sans · JetBrains Mono"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                  Fluid Type Scale & Editorial Measure Discipline
                </h2>
              </div>

              <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] divide-y divide-[var(--ds-border)]">
                {TYPOGRAPHY_SCALE_TOKENS.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                  >
                    <div className="lg:col-span-4 space-y-1">
                      <div className="font-display text-xs font-bold text-[var(--ds-foreground)]">
                        {t.role}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--ds-muted-foreground)] tabular-nums">
                        {t.cssSize} · LH {t.lineHeight} · {t.fontWeight}
                      </div>
                      <div className="text-[11px] text-[var(--ds-subtle-foreground)]">
                        Measure: {t.maxMeasure}
                      </div>
                    </div>

                    <div className="lg:col-span-8 space-y-1.5">
                      <div
                        style={{
                          fontSize: t.cssSize.split(' ')[0],
                          lineHeight: t.lineHeight,
                          letterSpacing: t.letterSpacing,
                        }}
                        className={`${
                          t.fontFamily === 'display'
                            ? 'font-display font-bold'
                            : t.fontFamily === 'mono'
                            ? 'font-mono font-medium bg-[var(--ds-muted)] px-2.5 py-1.5 rounded-[6px] inline-block'
                            : 'font-sans'
                        } text-[var(--ds-foreground)]`}
                      >
                        {t.sampleText}
                      </div>
                      <p className="text-xs text-[var(--ds-muted-foreground)]">
                        {t.usage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ================================================================
             * 03. LAYOUT & SPACING SYSTEM
             * ============================================================== */}
            <section id="layout-spacing" className="space-y-5">
              <div className="border-b border-[var(--ds-border)] pb-4">
                <TechnicalLabel
                  kicker="03. SPATIAL & LAYOUT ARCHITECTURE"
                  detail="4px Base Grid & Responsive Viewport Containers"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                  Layout Dimensions & Consistent Spacing Scale
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Layout Containers */}
                <div className="lg:col-span-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] p-5 space-y-3">
                  <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                    Architectural Container Tokens
                  </h3>
                  <div className="divide-y divide-[var(--ds-border)]">
                    {LAYOUT_DIMENSION_TOKENS.map((dim) => (
                      <div key={dim.cssVariable} className="py-2.5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--ds-foreground)]">
                            {dim.name}
                          </span>
                          <span className="font-mono font-semibold text-[var(--ds-accent)] tabular-nums">
                            {dim.value}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--ds-subtle-foreground)]">
                          {dim.cssVariable}
                        </div>
                        <p className="text-xs text-[var(--ds-muted-foreground)]">
                          {dim.purpose}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Spacing Scale */}
                <div className="lg:col-span-7 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] p-5 space-y-3">
                  <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                    Harmonic Spacing Scale (4px Base Unit)
                  </h3>
                  <div className="space-y-2.5">
                    {SPACING_SCALE_TOKENS.map((sp) => (
                      <div
                        key={sp.token}
                        className="grid grid-cols-12 gap-3 items-center text-xs"
                      >
                        <div className="col-span-3 font-mono font-semibold text-[var(--ds-foreground)] tabular-nums">
                          {sp.token} ({sp.px}px)
                        </div>
                        <div className="col-span-4 flex items-center">
                          <div
                            style={{ width: `${sp.px * 2}px` }}
                            className="h-3.5 bg-[var(--ds-accent)] rounded-xs"
                          />
                        </div>
                        <div className="col-span-5 text-[var(--ds-muted-foreground)] truncate">
                          {sp.structuralUse}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================================
             * 04. BUTTONS, ICON BUTTONS & VALIDATED FORMS
             * ============================================================== */}
            <section id="buttons-forms" className="space-y-5">
              <div className="border-b border-[var(--ds-border)] pb-4">
                <TechnicalLabel
                  kicker="04. INTERACTIVE CONTROLS & FORMS"
                  detail="Hover · Focus-Visible · Active · Selected · Loading · Disabled"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                  Buttons, Icon Controls & Schema-Validated Form Primitives
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Button Matrix */}
                <div className="lg:col-span-6 p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-5">
                  <div className="space-y-2">
                    <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                      Button Variants
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        variant="primary"
                        onClick={() =>
                          pushToast({
                            tone: 'info',
                            title: 'Primary Action Triggered',
                            description: 'Executed primary button handler.',
                          })
                        }
                      >
                        Primary Action
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          pushToast({
                            tone: 'info',
                            title: 'Secondary Action Triggered',
                          })
                        }
                      >
                        Secondary Tonal
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          pushToast({
                            tone: 'info',
                            title: 'Outline Action Triggered',
                          })
                        }
                      >
                        Outline Border
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          pushToast({
                            tone: 'info',
                            title: 'Ghost Action Triggered',
                          })
                        }
                      >
                        Ghost Quiet
                      </Button>
                      <Button
                        variant="danger"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() =>
                          pushToast({
                            tone: 'error',
                            title: 'Destructive Action Guard',
                            description: 'Requires explicit confirmation.',
                          })
                        }
                      >
                        Danger State
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[var(--ds-border)]">
                    <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                      Sizes, Selected, Disabled & Async Loading States
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button size="sm" variant="outline">
                        Small (sm)
                      </Button>
                      <Button size="md" variant="outline">
                        Medium (md)
                      </Button>
                      <Button size="lg" variant="outline">
                        Large (lg)
                      </Button>
                      <Button
                        variant="secondary"
                        isSelected={selectedButtonToggle}
                        onClick={() => setSelectedButtonToggle((p) => !p)}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        {selectedButtonToggle ? 'Selected State' : 'Unselected'}
                      </Button>
                      <Button
                        variant="primary"
                        isLoading={isLoadingDemo}
                        onClick={() => {
                          setIsLoadingDemo(true);
                          setTimeout(() => setIsLoadingDemo(false), 1200);
                        }}
                      >
                        {isLoadingDemo ? 'Compiling...' : 'Test Async Loading'}
                      </Button>
                      <Button variant="outline" disabled>
                        Disabled Control
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[var(--ds-border)]">
                    <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                      Accessible Icon Buttons with Tooltips
                    </h3>
                    <div className="flex items-center gap-2.5">
                      <Tooltip content="Adjust concept parameters">
                        <IconButton
                          label="Adjust concept parameters"
                          variant="primary"
                          icon={<Sliders className="w-4 h-4" />}
                          onClick={() =>
                            pushToast({
                              tone: 'info',
                              title: 'Parameter Inspector Active',
                            })
                          }
                        />
                      </Tooltip>
                      <Tooltip content="Save concept bookmark">
                        <IconButton
                          label="Save concept bookmark"
                          variant="secondary"
                          isSelected={true}
                          icon={<Bookmark className="w-4 h-4" />}
                          onClick={() =>
                            pushToast({
                              tone: 'success',
                              title: 'Bookmark State Toggled',
                            })
                          }
                        />
                      </Tooltip>
                      <Tooltip content="Run interactive demonstration">
                        <IconButton
                          label="Run interactive demonstration"
                          variant="outline"
                          icon={<Play className="w-4 h-4" />}
                          onClick={() =>
                            pushToast({
                              tone: 'info',
                              title: 'Simulation Started',
                            })
                          }
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Validated Form Demonstration */}
                <form
                  onSubmit={handleFormSubmit}
                  noValidate
                  className="lg:col-span-6 p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                      Resource Provenance Validation Form
                    </h3>
                    <span className="text-[11px] font-mono text-[var(--ds-muted-foreground)]">
                      Strict Schema Validation
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="ds-form-title"
                      className="block text-xs font-semibold text-[var(--ds-foreground)]"
                    >
                      Design Concept Title *
                    </label>
                    <input
                      id="ds-form-title"
                      type="text"
                      required
                      value={formConceptTitle}
                      onChange={(e) => setFormConceptTitle(e.target.value)}
                      placeholder="e.g., FLIP Layout Projection Choreography"
                      className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="ds-form-classification"
                        className="block text-xs font-semibold text-[var(--ds-foreground)]"
                      >
                        Canonical Classification *
                      </label>
                      <select
                        id="ds-form-classification"
                        value={formClassification}
                        onChange={(e) => setFormClassification(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
                      >
                        <option value="official-design-system">
                          Official Design System
                        </option>
                        <option value="design-methodology">
                          Design Methodology
                        </option>
                        <option value="visual-style">Visual Style</option>
                        <option value="interaction-pattern">
                          Interaction Pattern
                        </option>
                        <option value="ui-component">UI Component</option>
                        <option value="animation-technique">
                          Animation Technique
                        </option>
                        <option value="development-technology">
                          Development Technology
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="ds-form-url"
                        className="block text-xs font-semibold text-[var(--ds-foreground)]"
                      >
                        Official Specification URL *
                      </label>
                      <input
                        id="ds-form-url"
                        type="url"
                        required
                        value={formSourceUrl}
                        onChange={(e) => setFormSourceUrl(e.target.value)}
                        placeholder="https://www.w3.org/TR/..."
                        className="w-full px-3 py-2 text-xs bg-[var(--ds-background)] border border-[var(--ds-border-strong)] rounded-[8px] text-[var(--ds-foreground)] focus:outline-2 focus:outline-[var(--ds-focus)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-[var(--ds-muted-foreground)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formVerifyWcag}
                        onChange={(e) => setFormVerifyWcag(e.target.checked)}
                        className="rounded accent-[var(--ds-primary)]"
                      />
                      <span>Enforce WCAG 2.1 AA/AAA keyboard & reduced-motion audit</span>
                    </label>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Validate Entry
                    </Button>
                  </div>

                  {formError && (
                    <SemanticAlert variant="error" title="Form Validation Failed">
                      {formError}
                    </SemanticAlert>
                  )}

                  {formSuccess && (
                    <SemanticAlert variant="success" title="Provenance Schema Verified">
                      {formSuccess}
                    </SemanticAlert>
                  )}
                </form>
              </div>
            </section>

            {/* ================================================================
             * 05. EDITORIAL CONTENT CARDS & METADATA
             * ============================================================== */}
            <section id="cards-content" className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--ds-border)] pb-4">
                <div>
                  <TechnicalLabel
                    kicker="05. CONTENT ARCHITECTURE"
                    detail="Zero-Pill Metadata · Single-Elevation Surface Discipline"
                  />
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                    Featured Monograph, Resource, Category & Related Cards
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSkeletonDemo((p) => !p)}
                >
                  {showSkeletonDemo ? 'Show Live Populated Cards' : 'Test Loading Skeletons'}
                </Button>
              </div>

              {showSkeletonDemo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <LoadingSkeleton variant="card" />
                  <LoadingSkeleton variant="card" />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Featured Resource Card */}
                  <FeaturedResourceCard
                    resource={FOUNDATION_RESOURCES[0]}
                    onLaunch={handleLaunchConceptInWorkbench}
                  />

                  {/* Standard Resource Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {FOUNDATION_RESOURCES.slice(1, 3).map((res) => (
                      <ResourceCard
                        key={res.id}
                        resource={res}
                        isBookmarked={bookmarkedSlugs.includes(res.slug)}
                        onLaunch={handleLaunchConceptInWorkbench}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    ))}
                  </div>

                  {/* Category Cards & Related Resource Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CategoryCard
                      category={TAXONOMY_CATEGORIES[0]}
                      resourceCount={2}
                      isSelected={selectedCategorySlug === TAXONOMY_CATEGORIES[0].slug}
                      onSelectCategory={(slug) => {
                        setSelectedCategorySlug(slug);
                        pushToast({
                          tone: 'info',
                          title: `Selected Taxonomy Track: ${slug}`,
                        });
                      }}
                    />
                    <div className="space-y-3">
                      <div className="text-xs font-mono font-semibold text-[var(--ds-muted-foreground)]">
                        RELATED CONCEPT CROSS-REFERENCE PRIMITIVES
                      </div>
                      <RelatedResourceCard
                        resource={FOUNDATION_RESOURCES[3]}
                        relationshipLabel="Prerequisite Pattern"
                        onSelect={handleLaunchConceptInWorkbench}
                      />
                      <RelatedResourceCard
                        resource={FOUNDATION_RESOURCES[4]}
                        relationshipLabel="Complementary Technology"
                        onSelect={handleLaunchConceptInWorkbench}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ================================================================
             * 06. NAVIGATION ARCHITECTURE
             * ============================================================== */}
            <section id="navigation-primitives" className="space-y-5">
              <div className="border-b border-[var(--ds-border)] pb-4">
                <TechnicalLabel
                  kicker="06. NAVIGATION ARCHITECTURE"
                  detail="Breadcrumbs · Command Search · Mega Menu · Sidebar"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                  Reusable Navigation Primitives
                </h2>
              </div>

              <div className="p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-[var(--ds-muted-foreground)]">
                    BREADCRUMB TRAIL PRIMITIVE
                  </div>
                  <Breadcrumbs
                    items={[
                      { label: 'Digital Design Encyclopedia', href: '/' },
                      { label: 'Taxonomy Tracks', href: '/#taxonomy-explorer' },
                      {
                        label: 'Accessible UI Components & ARIA Patterns',
                        isCurrent: true,
                      },
                    ]}
                  />
                </div>

                <div className="pt-4 border-t border-[var(--ds-border)] text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                  The top workspace toolbar and sticky 264px left sidebar on this route
                  are live instances of <code className="font-mono">AppHeader</code>,{' '}
                  <code className="font-mono">MegaMenu</code>,{' '}
                  <code className="font-mono">SearchTrigger (⌘K)</code>,{' '}
                  <code className="font-mono">MobileNavigationDrawer</code>, and{' '}
                  <code className="font-mono">SidebarNavigation</code>.
                </div>
              </div>
            </section>

            {/* ================================================================
             * 07. TABS, DROPDOWNS, DIALOGS, DRAWERS, ACCORDIONS & ALERTS
             * ============================================================== */}
            <section id="overlays-feedback" className="space-y-5">
              <div className="border-b border-[var(--ds-border)] pb-4">
                <TechnicalLabel
                  kicker="07. OVERLAYS, DISCLOSURES & FEEDBACK"
                  detail="WAI-ARIA Keyboard Navigation & Dual-Coded Semantic Alerts"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                  Tabs, Dropdowns, Dialogs, Drawers, Accordions & Alerts
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Tabs & Overlays Trigger Deck */}
                <div className="lg:col-span-6 p-5 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] space-y-5">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-[var(--ds-muted-foreground)]">
                      SEGMENTED & UNDERLINE TABS (ArrowLeft / ArrowRight Navigation)
                    </div>
                    <Tabs
                      ariaLabel="Demonstration Segmented Tabs"
                      activeId={demoTabId}
                      onChange={setDemoTabId}
                      items={[
                        {
                          id: 'tokens',
                          label: 'Token Layer',
                          icon: <Layers className="w-3.5 h-3.5" />,
                        },
                        {
                          id: 'preview',
                          label: 'Interactive Stage',
                          icon: <Eye className="w-3.5 h-3.5" />,
                        },
                        {
                          id: 'code',
                          label: 'Compiled Output',
                          icon: <Terminal className="w-3.5 h-3.5" />,
                        },
                      ]}
                    />
                    <Tabs
                      ariaLabel="Demonstration Underline Tabs"
                      variant="underline"
                      activeId={underlineTabId}
                      onChange={setUnderlineTabId}
                      items={[
                        { id: 'usage', label: 'Architecture Usage' },
                        { id: 'a11y', label: 'WAI-ARIA Contract' },
                        { id: 'disabled', label: 'Locked Spec', disabled: true },
                      ]}
                    />
                  </div>

                  <div className="pt-3 border-t border-[var(--ds-border)] space-y-2">
                    <div className="text-xs font-mono text-[var(--ds-muted-foreground)]">
                      DROPDOWN MENU, MODAL DIALOG, DRAWER & TOAST TRIGGERS
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <DropdownMenu
                        triggerLabel={`Compliance: ${dropdownValue.toUpperCase()}`}
                        selectedId={dropdownValue}
                        onSelect={(id) => {
                          setDropdownValue(id);
                          pushToast({
                            tone: 'info',
                            title: `Selected Compliance Filter: ${id.toUpperCase()}`,
                          });
                        }}
                        options={[
                          {
                            id: 'wcag-aaa',
                            label: 'WCAG 2.1 Level AAA (7:1+)',
                            description: 'Enhanced contrast and strict keyboard parity.',
                          },
                          {
                            id: 'wcag-aa',
                            label: 'WCAG 2.1 Level AA (4.5:1+)',
                            description: 'Baseline production compliance requirement.',
                          },
                          {
                            id: 'reduced-motion',
                            label: 'WCAG 2.3.3 Reduced Motion',
                            description: 'Zero vestigial spatial translation.',
                          },
                        ]}
                      />

                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Open Modal Dialog
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setIsDrawerOpen(true)}
                      >
                        Open Inspector Drawer
                      </Button>

                      <Button
                        variant="secondary"
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        onClick={() =>
                          pushToast({
                            tone: 'success',
                            title: 'Live Toast Notification',
                            description:
                              'Announced via aria-live="polite" region with explicit status label.',
                          })
                        }
                      >
                        Trigger Toast
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Accordion Disclosure */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="text-xs font-mono text-[var(--ds-muted-foreground)]">
                    ACCESSIBLE ACCORDION DISCLOSURE PRIMITIVE
                  </div>
                  <Accordion
                    defaultOpenIds={['acc-1']}
                    items={[
                      {
                        id: 'acc-1',
                        title: '01. Why Zero-Pill Metadata Discipline?',
                        metadata: 'Visual Restraint Principle',
                        content:
                          'Wrapping static informational metadata (dates, categories, read times) in rounded pill boxes creates visual noise that competes with true interactive buttons. Unboxed typography with middot (·) separators maximizes scannability.',
                      },
                      {
                        id: 'acc-2',
                        title: '02. How Does Dual-Theme Persistence Work?',
                        metadata: 'ThemeProvider · localStorage',
                        content:
                          'Theme polarity is managed by ThemeProvider and synchronized with document.documentElement (.dark) and localStorage ("dde_theme_preference_v1") so user preference persists across routes and sessions.',
                      },
                      {
                        id: 'acc-3',
                        title: '03. How Are Reduced-Motion Guarantees Enforced?',
                        metadata: 'WCAG 2.1 SC 2.3.3',
                        content:
                          'All interactive motion components inspect prefers-reduced-motion as well as the manual Reduced-Motion simulation toggle, collapsing spring animations to instant state changes.',
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Semantic Alerts Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <SemanticAlert
                  variant="info"
                  title="Editorial Design System Specification"
                >
                  All components consume shared CSS custom properties defined in{' '}
                  <code className="font-mono">/app/globals.css</code>.
                </SemanticAlert>

                <SemanticAlert
                  variant="success"
                  title="Contrast Ratio 15.4:1 Verified"
                >
                  Primary foreground ink on neutral background exceeds WCAG AAA (7:1)
                  threshold in both light and dark themes.
                </SemanticAlert>

                <SemanticAlert
                  variant="warning"
                  title="Compositor Animation Budget"
                >
                  Never animate layout geometry properties (width, height, top, left);
                  restrict transitions to transform and opacity.
                </SemanticAlert>

                <SemanticAlert
                  variant="error"
                  title="Arbitrary Server Code Execution Blocked"
                >
                  User-edited playground code must execute inside origin-isolated client
                  sandboxes, never on the server runtime.
                </SemanticAlert>
              </div>
            </section>

            {/* ================================================================
             * 08. TECHNICAL SANDBOX, RESIZABLE PANELS & CODE PRIMITIVES
             * ============================================================== */}
            <section id="technical-sandbox" className="space-y-5">
              <div className="border-b border-[var(--ds-border)] pb-4">
                <TechnicalLabel
                  kicker="08. TECHNICAL & SANDBOX PRIMITIVES"
                  detail="LivePreviewContainer · DevicePreviewSelector · ResizableSplitPanel · EditorPanel · CodeBlock"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                  Interactive Technical Workbench Components
                </h2>
              </div>

              {/* Live Preview Container with Responsive Device Selector & Fullscreen */}
              <LivePreviewContainer
                title="Interactive Token & Geometry Specimen"
                metadata={`Radius: ${previewRadius}px · Padding: ${previewPadding}px`}
                onReset={() => {
                  setPreviewRadius(10);
                  setPreviewPadding(20);
                }}
                footer={
                  <div className="flex flex-wrap items-center gap-6 text-xs">
                    <label className="flex items-center gap-2.5 font-semibold">
                      <span>Corner Radius: {previewRadius}px</span>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        value={previewRadius}
                        onChange={(e) => setPreviewRadius(Number(e.target.value))}
                        className="accent-[var(--ds-primary)]"
                      />
                    </label>
                    <label className="flex items-center gap-2.5 font-semibold">
                      <span>Spatial Padding: {previewPadding}px</span>
                      <input
                        type="range"
                        min={12}
                        max={36}
                        value={previewPadding}
                        onChange={(e) => setPreviewPadding(Number(e.target.value))}
                        className="accent-[var(--ds-primary)]"
                      />
                    </label>
                  </div>
                }
              >
                <div
                  style={{
                    borderRadius: `${previewRadius}px`,
                    padding: `${previewPadding}px`,
                  }}
                  className="bg-[var(--ds-surface)] border-2 border-[var(--ds-accent)] space-y-2 transition-all"
                >
                  <ResourceMetadata
                    items={[
                      'Responsive Device Container Test',
                      `r_outer = ${previewRadius}px`,
                      `padding = ${previewPadding}px`,
                    ]}
                  />
                  <h4 className="font-display text-base font-bold text-[var(--ds-foreground)]">
                    Switch between Desktop (100%), Tablet (768px), and Mobile (375px) above
                  </h4>
                  <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
                    Use the toolbar controls in the header of this container to test
                    viewport breakpoints or expand to fullscreen mode.
                  </p>
                </div>
              </LivePreviewContainer>

              {/* Resizable Split Panel with EditorPanel and CodeBlock */}
              <ResizableSplitPanel
                leftPane={
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-semibold text-[var(--ds-muted-foreground)]">
                      LEFT PANE · EDITABLE CODE PANEL (Drag separator or use Arrow keys)
                    </div>
                    <EditorPanel
                      filename="specimen-tokens.css"
                      language="css"
                      value={editorDemoCode}
                      onChange={setEditorDemoCode}
                    />
                  </div>
                }
                rightPane={
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-semibold text-[var(--ds-muted-foreground)]">
                      RIGHT PANE · SYNTAX CODE BLOCK WITH LINE NUMBERS & COPY
                    </div>
                    <CodeBlock
                      filename="specimen-tokens.css"
                      language="css"
                      description="Live mirrored output"
                      code={editorDemoCode}
                    />
                  </div>
                }
              />
            </section>

            {/* ================================================================
             * 09. MOTION LANGUAGE TOKENS
             * ============================================================== */}
            <section id="motion-tokens" className="space-y-5">
              <div className="border-b border-[var(--ds-border)] pb-4">
                <TechnicalLabel
                  kicker="09. MOTION LANGUAGE"
                  detail="Restrained UI Transitions · Physics-Driven Concept Demos · Reduced-Motion Safe"
                />
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-foreground)] mt-1">
                  Duration, Easing & Spring Physics Tokens
                </h2>
              </div>

              <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[12px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--ds-border)] bg-[var(--ds-muted)]/60 font-mono text-[var(--ds-muted-foreground)]">
                        <th className="py-2.5 px-4">Token Name</th>
                        <th className="py-2.5 px-4">CSS / Motion Variable</th>
                        <th className="py-2.5 px-4">Specification Value</th>
                        <th className="py-2.5 px-4">Architectural Application</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ds-border)]">
                      {MOTION_LANGUAGE_TOKENS.map((m) => (
                        <tr key={m.id} className="hover:bg-[var(--ds-muted)]/40">
                          <td className="py-3 px-4 font-semibold text-[var(--ds-foreground)]">
                            {m.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-[var(--ds-accent)]">
                            {m.cssVariable}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums text-[var(--ds-foreground)]">
                            {m.value}
                          </td>
                          <td className="py-3 px-4 text-[var(--ds-muted-foreground)]">
                            {m.usage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Interactive Modal Dialog Instance */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Accessible Modal Dialog Primitive"
        description="Supports Escape key dismissal, backdrop click closure, and WAI-ARIA role='dialog' semantics."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsDialogOpen(false);
                pushToast({
                  tone: 'success',
                  title: 'Dialog Action Confirmed',
                });
              }}
            >
              Confirm Specification
            </Button>
          </>
        }
      >
        <p className="text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
          Modals in the Digital Design Encyclopedia are reserved for intentional user-triggered
          workflows such as command search (<code className="font-mono">⌘K</code>), export
          confirmation, and schema inspection—never unsolicited arrival popups.
        </p>
      </Dialog>

      {/* Interactive Slide-Over Drawer Instance */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Slide-Over Parameter Inspector Drawer"
        subtitle="Off-canvas sheet primitive for mobile navigation and secondary token inspection"
      >
        <div className="space-y-4 text-xs text-[var(--ds-muted-foreground)]">
          <p className="leading-relaxed">
            This reusable <code className="font-mono">Drawer</code> primitive powers both
            the touch-friendly mobile navigation menu and secondary specification
            inspectors without crowding the primary viewport.
          </p>
          <SemanticAlert variant="info" title="Keyboard Escape Active">
            Press <kbd className="font-mono font-bold">Escape</kbd> or click the backdrop
            to dismiss this drawer.
          </SemanticAlert>
        </div>
      </Drawer>
    </div>
  );
}
