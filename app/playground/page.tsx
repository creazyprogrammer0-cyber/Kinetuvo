'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Trash2,
  FolderOpen,
  BookOpen,
  ShieldCheck,
  Terminal,
  Box,
} from 'lucide-react';
import { AppHeader } from '@/components/shell/AppHeader';
import { AppFooter } from '@/components/shell/AppFooter';
import { LivePlaygroundEngine } from '@/components/playground/LivePlaygroundEngine';
import {
  CANONICAL_PLAYGROUND_TEMPLATES,
  buildPlaygroundConfigFromResource,
  loadSavedPlaygroundExperiments,
  deleteSavedPlaygroundExperiment,
} from '@/lib/playground/templates';
import { decodeShareablePlaygroundState } from '@/lib/playground/security-validator';
import {
  PlaygroundFileEntry,
  PlaygroundTemplateConfig,
  SavedPlaygroundExperiment,
} from '@/lib/playground/types';
import { FOUNDATION_RESOURCES } from '@/lib/resources/seed-foundation';
import {
  ResourceMetadata,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';

function resolveClientPlaygroundConfig(): PlaygroundTemplateConfig | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const shareToken = params.get('share');
  if (shareToken) {
    const decoded = decodeShareablePlaygroundState(shareToken);
    if (decoded && Object.keys(decoded.files).length > 0) {
      const baseTemplate =
        CANONICAL_PLAYGROUND_TEMPLATES.find(
          (t) => t.id === decoded.templateId
        ) || CANONICAL_PLAYGROUND_TEMPLATES[0];

      const mergedFiles: Record<string, PlaygroundFileEntry> = {};
      for (const [path, origEntry] of Object.entries(baseTemplate.files)) {
        mergedFiles[path] = {
          ...origEntry,
          code:
            typeof decoded.files[path] === 'string'
              ? decoded.files[path]
              : origEntry.code,
        };
      }

      return {
        ...baseTemplate,
        id: `shared-${decoded.templateId}`,
        title: `${decoded.title || baseTemplate.title} (Shared Link)`,
        activeFile: decoded.activeFile || baseTemplate.activeFile,
        files: mergedFiles,
      };
    }
  }

  const resourceSlug = params.get('resource');
  if (resourceSlug) {
    const resource = FOUNDATION_RESOURCES.find((r) => r.slug === resourceSlug);
    if (resource) {
      return buildPlaygroundConfigFromResource(resource);
    }
  }

  const templateId = params.get('template');
  if (templateId) {
    const found = CANONICAL_PLAYGROUND_TEMPLATES.find(
      (t) => t.id === templateId
    );
    if (found) return found;
  }

  return null;
}

export default function PlaygroundPage() {
  const [activeTemplate, setActiveTemplate] =
    useState<PlaygroundTemplateConfig>(CANONICAL_PLAYGROUND_TEMPLATES[0]);
  const [savedExperiments, setSavedExperiments] = useState<
    SavedPlaygroundExperiment[]
  >([]);
  const [selectedResourceSlug, setSelectedResourceSlug] = useState<string>('');

  // Hydrate URL query parameters and localStorage experiments after mount
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const fromUrl = resolveClientPlaygroundConfig();
      if (fromUrl) {
        setActiveTemplate(fromUrl);
        if (fromUrl.associatedResourceSlug) {
          setSelectedResourceSlug(fromUrl.associatedResourceSlug);
        }
      }
      setSavedExperiments(loadSavedPlaygroundExperiments());
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const refreshSavedExperiments = useCallback(() => {
    setSavedExperiments(loadSavedPlaygroundExperiments());
  }, []);

  const handleLoadResourceIntoPlayground = useCallback((slug: string) => {
    setSelectedResourceSlug(slug);
    const resource = FOUNDATION_RESOURCES.find((r) => r.slug === slug);
    if (resource) {
      const config = buildPlaygroundConfigFromResource(resource);
      setActiveTemplate(config);
    }
  }, []);

  const handleLoadSavedExperiment = useCallback(
    (exp: SavedPlaygroundExperiment) => {
      const baseTemplate =
        CANONICAL_PLAYGROUND_TEMPLATES.find((t) => t.id === exp.templateId) ||
        CANONICAL_PLAYGROUND_TEMPLATES[0];
      const copiedFiles: Record<string, PlaygroundFileEntry> = {};
      for (const [k, v] of Object.entries(exp.files)) {
        copiedFiles[k] = { ...v };
      }
      const firstPath = Object.keys(copiedFiles)[0] || baseTemplate.activeFile;
      setActiveTemplate({
        ...baseTemplate,
        id: exp.id,
        title: exp.name,
        category: exp.category,
        associatedResourceSlug: exp.associatedResourceSlug,
        files: copiedFiles,
        activeFile: firstPath,
      });
    },
    []
  );

  const handleDeleteExperiment = useCallback((id: string) => {
    setSavedExperiments(deleteSavedPlaygroundExperiment(id));
  }, []);

  const allPlaygroundTemplates = useMemo(() => {
    const resourceConfigs = FOUNDATION_RESOURCES.slice(0, 12).map((res) =>
      buildPlaygroundConfigFromResource(res)
    );
    return [...CANONICAL_PLAYGROUND_TEMPLATES, ...resourceConfigs];
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ds-background)] text-[var(--ds-foreground)]">
      <AppHeader
        breadcrumbs={[
          { label: 'Encyclopedia Home', href: '/' },
          {
            label: 'Live Preview Engine & Interactive Code Playground',
            isCurrent: true,
          },
        ]}
        onSelectResource={handleLoadResourceIntoPlayground}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* 1. Studio Header & Architecture Banner */}
        <section className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <ResourceMetadata
                items={[
                  'Interactive Code Playground',
                  '5 Multi-File Runtime Templates',
                  'Origin-Isolated CSP Sandbox + Lazy Sandpack Bundler',
                ]}
              />
              <h1
                style={{ fontSize: 'clamp(1.625rem, 2.5vw, 2.25rem)' }}
                className="font-display font-bold tracking-tight text-[var(--ds-foreground)]"
              >
                Live Preview Engine & Interactive Code Playground
              </h1>
              <p className="text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
                Start from any of the 5 canonical runtime templates (Vanilla
                Web, React 19, SVG Vector & Filters, HTML5 2D Canvas, or
                Lazy-Loaded Three.js WebGL), or load any encyclopedia resource
                directly into the multi-file workbench. All untrusted code
                executes inside a strict CSP sandbox with zero server execution.
              </p>
            </div>

            {/* Quick Resource Loader Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="load-encyclopedia-resource"
                  className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted-foreground)]"
                >
                  Open Encyclopedia Resource in Playground
                </label>
                <select
                  id="load-encyclopedia-resource"
                  value={selectedResourceSlug}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleLoadResourceIntoPlayground(e.target.value);
                    }
                  }}
                  className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-3 py-2 font-mono text-xs text-[var(--ds-foreground)] focus:border-[var(--ds-accent)] focus:outline-none"
                >
                  <option value="">Select any resource specimen...</option>
                  {FOUNDATION_RESOURCES.map((res) => (
                    <option key={res.slug} value={res.slug}>
                      {res.title} ({res.categorySlug})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 5 Canonical Template Switcher Cards */}
          <div className="mt-6 pt-6 border-t border-[var(--ds-border)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted-foreground)]">
                Supported Playground Runtime Templates (A–E)
              </span>
              <span className="font-mono text-xs text-[var(--ds-muted-foreground)]">
                Active: {activeTemplate.title}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {CANONICAL_PLAYGROUND_TEMPLATES.map((tpl) => {
                const isSelected = activeTemplate.id === tpl.id;
                const fileCount = Object.keys(tpl.files).length;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedResourceSlug('');
                      setActiveTemplate(tpl);
                    }}
                    className={`group flex flex-col justify-between rounded-md border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-[var(--ds-accent)] bg-[var(--ds-secondary)]/40 shadow-xs'
                        : 'border-[var(--ds-border)] bg-[var(--ds-background)] hover:border-[var(--ds-border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold uppercase text-[var(--ds-accent)]">
                          {tpl.category}
                        </span>
                        <span className="text-[var(--ds-muted-foreground)]">
                          {fileCount} files
                        </span>
                      </div>
                      <h2 className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                        {tpl.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--ds-muted-foreground)]">
                        {tpl.subtitle}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--ds-border)] flex items-center justify-between font-mono text-[10px] text-[var(--ds-muted-foreground)]">
                      <span>Entry: {tpl.activeFile}</span>
                      {tpl.requiresLazyThreeWebGL && <span>Lazy WebGL</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2. Reusable Live Preview Engine & Interactive Code Playground */}
        <LivePlaygroundEngine
          initialConfig={activeTemplate}
          availableTemplates={allPlaygroundTemplates}
          onTemplateChange={(tpl) => setActiveTemplate(tpl)}
          onExperimentSaved={refreshSavedExperiments}
        />

        {/* 3. Saved Private Experiments & Forks Workspace */}
        <section className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <TechnicalLabel
                kicker="PRIVATE WORKSPACE FORKS"
                detail="Browser-Persisted Experiments · Instant Reload"
              />
              <h2 className="font-display text-lg font-bold text-[var(--ds-foreground)] mt-1">
                Saved Playground Experiments ({savedExperiments.length})
              </h2>
            </div>
            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-3 py-1.5 text-xs font-medium text-[var(--ds-foreground)] hover:border-[var(--ds-border-strong)]"
            >
              <BookOpen className="h-3.5 w-3.5 text-[var(--ds-accent)]" />
              <span>Browse All Encyclopedia Specimens</span>
            </Link>
          </div>

          {savedExperiments.length === 0 ? (
            <div className="rounded border border-dashed border-[var(--ds-border)] bg-[var(--ds-background)] p-6 text-center text-xs text-[var(--ds-muted-foreground)]">
              No private forks saved yet. Modify code or parameters above and
              click{' '}
              <span className="font-mono font-semibold text-[var(--ds-foreground)]">
                Save Fork
              </span>{' '}
              in the Playground toolbar to store a private experiment snapshot.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedExperiments.map((exp) => {
                const expFilePaths = Object.keys(exp.files);
                return (
                  <div
                    key={exp.id}
                    className="flex flex-col justify-between rounded border border-[var(--ds-border)] bg-[var(--ds-background)] p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                        <span className="uppercase text-[var(--ds-accent)]">
                          {exp.category}
                        </span>
                        <span>Saved {exp.updatedAtIso.split('T')[0]}</span>
                      </div>
                      <h3 className="mt-1 font-display text-sm font-bold text-[var(--ds-foreground)]">
                        {exp.name}
                      </h3>
                      <p className="mt-1 font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                        {expFilePaths.length} files · {expFilePaths.join(', ')}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--ds-border)]">
                      <button
                        type="button"
                        onClick={() => handleLoadSavedExperiment(exp)}
                        className="inline-flex items-center gap-1.5 rounded bg-[var(--ds-primary)] px-3 py-1 text-xs font-semibold text-[var(--ds-primary-foreground)]"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>Load Experiment</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExperiment(exp.id)}
                        title="Delete Saved Experiment"
                        className="rounded p-1.5 text-[var(--ds-muted-foreground)] hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Safety & Architecture Specification Matrix */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--ds-foreground)]">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Untrusted Code Isolation</span>
            </div>
            <p className="mt-1.5 text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
              Every preview runs inside a sandboxed iframe with{' '}
              <code className="font-mono">connect-src &apos;none&apos;</code>{' '}
              and blocked access to parent cookies, localStorage,
              sessionStorage, and process.env.
            </p>
          </div>

          <div className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--ds-foreground)]">
              <Terminal className="h-4 w-4 text-[var(--ds-accent)]" />
              <span>Static AST & Runtime Diagnostics</span>
            </div>
            <p className="mt-1.5 text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
              Syntax errors, unbalanced delimiters, unpermitted dependencies,
              and runtime exceptions are intercepted and reported with line
              diagnostics.
            </p>
          </div>

          <div className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--ds-foreground)]">
              <Box className="h-4 w-4 text-[var(--ds-accent)]" />
              <span>On-Demand Lazy Runtimes</span>
            </div>
            <p className="mt-1.5 text-xs text-[var(--ds-muted-foreground)] leading-relaxed">
              Heavy dependencies such as Sandpack and Three.js r128 WebGL are
              loaded exclusively when activated, keeping initial page rendering
              fast.
            </p>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
