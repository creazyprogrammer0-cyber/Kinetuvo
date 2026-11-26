'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  RotateCcw,
  Copy,
  Check,
  Download,
  Share2,
  Bookmark,
  Maximize2,
  Minimize2,
  FileCode2,
  FolderTree,
  Terminal,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  Expand,
  Wand2,
  Sun,
  Moon,
  RefreshCw,
  Bug,
  Package,
  Code2,
  Eye,
} from 'lucide-react';
import {
  PlaygroundTemplateConfig,
  PlaygroundFileEntry,
  PlaygroundDevicePreset,
  PlaygroundDiagnosticMessage,
  PlaygroundExecutionEngineMode,
  PlaygroundEditorTheme,
} from '@/lib/playground/types';
import {
  auditAndCompilePlaygroundFiles,
  buildIsolatedPlaygroundSrcDoc,
  formatPlaygroundCode,
  encodeShareablePlaygroundState,
} from '@/lib/playground/security-validator';
import {
  CANONICAL_PLAYGROUND_TEMPLATES,
  savePlaygroundExperiment,
} from '@/lib/playground/templates';

const SandpackLazyBridge = dynamic(
  () => import('@/components/playground/SandpackLazyBridge'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] w-full flex-col items-center justify-center gap-3 rounded-md border border-[var(--ds-border)] bg-[var(--ds-background)] p-6 text-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[var(--ds-accent)]" />
        <p className="text-sm font-medium text-[var(--ds-foreground)]">
          Lazy-loading Sandpack In-Browser Bundler...
        </p>
        <p className="text-xs text-[var(--ds-muted-foreground)]">
          Initializing worker threads and virtual file system
        </p>
      </div>
    ),
  }
);

const VIEWPORT_PRESETS: {
  preset: PlaygroundDevicePreset;
  label: string;
  widthPx: number | '100%';
  heightPx: number;
}[] = [
  { preset: 'fluid', label: 'Fluid (100%)', widthPx: '100%', heightPx: 460 },
  { preset: 'desktop', label: 'Desktop (1280px)', widthPx: 1280, heightPx: 540 },
  { preset: 'tablet', label: 'Tablet (768px)', widthPx: 768, heightPx: 500 },
  { preset: 'mobile', label: 'Mobile (375px)', widthPx: 375, heightPx: 560 },
  { preset: 'custom', label: 'Custom Viewport', widthPx: 620, heightPx: 460 },
];

function cloneFileRecord(
  record: Record<string, PlaygroundFileEntry>
): Record<string, PlaygroundFileEntry> {
  const copy: Record<string, PlaygroundFileEntry> = {};
  for (const [k, v] of Object.entries(record)) {
    copy[k] = { ...v };
  }
  return copy;
}

export interface LivePlaygroundEngineProps {
  initialConfig: PlaygroundTemplateConfig;
  availableTemplates?: PlaygroundTemplateConfig[];
  onTemplateChange?: (template: PlaygroundTemplateConfig) => void;
  onExperimentSaved?: () => void;
  compactEmbeddedMode?: boolean;
}

export function LivePlaygroundEngine({
  initialConfig,
  availableTemplates = CANONICAL_PLAYGROUND_TEMPLATES,
  onTemplateChange,
  onExperimentSaved,
  compactEmbeddedMode = false,
}: LivePlaygroundEngineProps) {
  const [activeConfig, setActiveConfig] =
    useState<PlaygroundTemplateConfig>(initialConfig);
  const [files, setFiles] = useState<Record<string, PlaygroundFileEntry>>(() =>
    cloneFileRecord(initialConfig.files)
  );
  const [activeFilePath, setActiveFilePath] = useState<string>(
    initialConfig.activeFile
  );

  // Customization settings state
  const [customValues, setCustomValues] = useState<
    Record<string, number | string | boolean>
  >(() => {
    const map: Record<string, number | string | boolean> = {};
    initialConfig.customizationSettings.forEach((s) => {
      map[s.key] = s.value;
    });
    return map;
  });

  // Sync when parent swaps initialConfig
  const [prevConfigId, setPrevConfigId] = useState<string>(initialConfig.id);
  if (prevConfigId !== initialConfig.id) {
    setPrevConfigId(initialConfig.id);
    setActiveConfig(initialConfig);
    setFiles(cloneFileRecord(initialConfig.files));
    setActiveFilePath(initialConfig.activeFile);
    const nextVals: Record<string, number | string | boolean> = {};
    initialConfig.customizationSettings.forEach((s) => {
      nextVals[s.key] = s.value;
    });
    setCustomValues(nextVals);
  }

  // Debounced files for compilation
  const [debouncedFiles, setDebouncedFiles] =
    useState<Record<string, PlaygroundFileEntry>>(files);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFiles(files);
      setIsCompiling(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [files]);

  // Editor & UI controls
  const [engineMode, setEngineMode] = useState<PlaygroundExecutionEngineMode>(
    'origin-isolated-iframe'
  );
  const [editorTheme, setEditorTheme] =
    useState<PlaygroundEditorTheme>('graphite-dark');
  const [showFileExplorer, setShowFileExplorer] = useState<boolean>(
    !compactEmbeddedMode
  );
  const [editorWidthPercent, setEditorWidthPercent] = useState<number>(48);
  const [fullscreenTarget, setFullscreenTarget] = useState<
    'none' | 'editor' | 'preview'
  >('none');
  const [mobileActiveTab, setMobileActiveTab] = useState<
    'editor' | 'preview' | 'controls'
  >('preview');
  const [bottomDockTab, setBottomDockTab] = useState<
    'parameters' | 'diagnostics' | 'qa'
  >('parameters');

  // Viewport & simulation state
  const [viewportPresetId, setViewportPresetId] =
    useState<PlaygroundDevicePreset>('fluid');
  const [customWidthPx, setCustomWidthPx] = useState<number>(620);
  const [customHeightPx, setCustomHeightPx] = useState<number>(460);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(1);
  const [simulateCompilationError, setSimulateCompilationError] =
    useState<boolean>(false);
  const [simulateRuntimeError, setSimulateRuntimeError] =
    useState<boolean>(false);

  // Runtime messages streamed from isolated iframe
  const [runtimeDiagnostics, setRuntimeDiagnostics] = useState<
    PlaygroundDiagnosticMessage[]
  >([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // Action feedback states
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Listen to postMessage events from our origin-isolated sandbox iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'DDE_PLAYGROUND_RUNTIME_ERROR') {
        const errDiag: PlaygroundDiagnosticMessage = {
          id: `rt-${Date.now()}`,
          phase: 'runtime',
          severity: 'error',
          message: String(
            data.message || 'Runtime exception in preview sandbox'
          ),
          line: typeof data.line === 'number' ? data.line : undefined,
          column: typeof data.column === 'number' ? data.column : undefined,
          timestampIso: new Date().toLocaleTimeString(),
        };
        setRuntimeDiagnostics((prev) => [errDiag, ...prev.slice(0, 14)]);
        setBottomDockTab('diagnostics');
      } else if (data.type === 'DDE_PLAYGROUND_CONSOLE') {
        setConsoleLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] ${String(data.message)}`,
          ...prev.slice(0, 29),
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fileList = useMemo(() => Object.values(files), [files]);

  const activeFile = useMemo(
    () => files[activeFilePath] || fileList[0],
    [files, activeFilePath, fileList]
  );

  // Static audit & compilation result
  const auditResult = useMemo(
    () =>
      auditAndCompilePlaygroundFiles(
        debouncedFiles,
        activeConfig.dependencies,
        simulateCompilationError,
        simulateRuntimeError
      ),
    [
      debouncedFiles,
      activeConfig.dependencies,
      simulateCompilationError,
      simulateRuntimeError,
    ]
  );

  const allDiagnostics = useMemo(
    () => [...auditResult.diagnostics, ...runtimeDiagnostics],
    [auditResult.diagnostics, runtimeDiagnostics]
  );

  const blockingDiagnostics = useMemo(
    () =>
      allDiagnostics.filter(
        (d) =>
          (d.phase === 'compilation' || d.phase === 'security-policy') &&
          d.severity === 'error'
      ),
    [allDiagnostics]
  );

  const compiledSrcDoc = useMemo(() => {
    if (!auditResult.isValid || blockingDiagnostics.length > 0) {
      return '';
    }
    return buildIsolatedPlaygroundSrcDoc({
      files: debouncedFiles,
      customizationValues: customValues,
      isDark: editorTheme === 'graphite-dark',
      reducedMotion,
      requiresLazyThreeWebGL: activeConfig.requiresLazyThreeWebGL,
      simulateRuntimeError,
    });
  }, [
    auditResult.isValid,
    blockingDiagnostics.length,
    debouncedFiles,
    customValues,
    editorTheme,
    reducedMotion,
    activeConfig.requiresLazyThreeWebGL,
    simulateRuntimeError,
  ]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setIsCompiling(true);
      setRuntimeDiagnostics([]);
      setFiles((prev) => ({
        ...prev,
        [activeFile.path]: {
          ...prev[activeFile.path],
          code: newCode,
        },
      }));
    },
    [activeFile.path]
  );

  const handleFormatActiveFile = useCallback(() => {
    const formatted = formatPlaygroundCode(
      activeFile.code,
      activeFile.language
    );
    handleCodeChange(formatted);
  }, [activeFile.code, activeFile.language, handleCodeChange]);

  const handleResetToOriginal = useCallback(() => {
    setFiles(cloneFileRecord(activeConfig.files));
    setActiveFilePath(activeConfig.activeFile);
    const defaultVals: Record<string, number | string | boolean> = {};
    activeConfig.customizationSettings.forEach((s) => {
      defaultVals[s.key] = s.defaultValue;
    });
    setCustomValues(defaultVals);
    setSimulateCompilationError(false);
    setSimulateRuntimeError(false);
    setRuntimeDiagnostics([]);
    setConsoleLogs([]);
    setPreviewKey((k) => k + 1);
  }, [activeConfig]);

  const handleSelectTemplate = useCallback(
    (template: PlaygroundTemplateConfig) => {
      setActiveConfig(template);
      setFiles(cloneFileRecord(template.files));
      setActiveFilePath(template.activeFile);
      const defaultVals: Record<string, number | string | boolean> = {};
      template.customizationSettings.forEach((s) => {
        defaultVals[s.key] = s.defaultValue;
      });
      setCustomValues(defaultVals);
      setSimulateCompilationError(false);
      setSimulateRuntimeError(false);
      setRuntimeDiagnostics([]);
      setConsoleLogs([]);
      setPreviewKey((k) => k + 1);
      onTemplateChange?.(template);
    },
    [onTemplateChange]
  );

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Fallback ignored
    }
  }, [activeFile.code]);

  const handleDownloadCode = useCallback(() => {
    const cleanFilename = activeFile.path.replace(/^\//, '') || 'specimen.txt';
    const blob = new Blob([activeFile.code], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = cleanFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [activeFile]);

  const handleShareLink = useCallback(async () => {
    const codeMap: Record<string, string> = {};
    Object.values(files).forEach((f) => {
      codeMap[f.path] = f.code;
    });
    const encoded = encodeShareablePlaygroundState({
      templateId: activeConfig.id,
      title: activeConfig.title,
      activeFile: activeFile.path,
      files: codeMap,
    });
    if (!encoded || typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/playground?share=${encodeURIComponent(encoded)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 2200);
    } catch {
      // Fallback ignored
    }
  }, [activeConfig.id, activeConfig.title, activeFile.path, files]);

  const handleSaveExperiment = useCallback(() => {
    savePlaygroundExperiment({
      name: `${activeConfig.title} (Custom Fork)`,
      templateId: activeConfig.id,
      associatedResourceSlug: activeConfig.associatedResourceSlug,
      category: activeConfig.category,
      files: cloneFileRecord(files),
      customizationValues: { ...customValues },
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    onExperimentSaved?.();
  }, [activeConfig, files, customValues, onExperimentSaved]);

  // QA Self-Test Injection Helpers (Section 10 requirements)
  const triggerQaCompilationErrorTest = useCallback(() => {
    setSimulateCompilationError(true);
    setBottomDockTab('diagnostics');
  }, []);

  const triggerQaRuntimeErrorTest = useCallback(() => {
    setSimulateRuntimeError(true);
    setBottomDockTab('diagnostics');
  }, []);

  const triggerQaSecurityViolationTest = useCallback(() => {
    const jsFile =
      fileList.find(
        (f) => f.language === 'javascript' || f.language === 'tsx'
      ) || fileList[0];
    setActiveFilePath(jsFile.path);
    handleCodeChange(
      `${jsFile.code}\n\n// QA Self-Test: Forbidden Parent Frame & Cookie Access\nconst stolen = window.parent.document.cookie;`
    );
    setBottomDockTab('diagnostics');
  }, [fileList, handleCodeChange]);

  const lineCount = useMemo(
    () => Math.max(1, activeFile.code.split('\n').length),
    [activeFile.code]
  );

  const currentViewport = useMemo(() => {
    if (viewportPresetId === 'custom') {
      return {
        preset: 'custom' as const,
        label: `Custom (${customWidthPx}×${customHeightPx}px)`,
        widthPx: customWidthPx,
        heightPx: customHeightPx,
      };
    }
    return (
      VIEWPORT_PRESETS.find((v) => v.preset === viewportPresetId) ||
      VIEWPORT_PRESETS[0]
    );
  }, [viewportPresetId, customWidthPx, customHeightPx]);

  return (
    <section
      aria-label="Interactive Code Playground and Live Preview Engine"
      className="flex flex-col overflow-hidden rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-sm"
    >
      {/* 1. Primary Control & Template Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ds-border)] bg-[var(--ds-background)] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[var(--ds-accent)]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--ds-foreground)]">
              Playground Engine
            </span>
          </div>

          <span className="text-[var(--ds-border-strong)]">/</span>

          {/* Template Switcher */}
          <label className="flex items-center gap-2 text-xs text-[var(--ds-muted-foreground)]">
            <span className="sr-only">Select Template</span>
            <select
              aria-label="Playground Template Selector"
              value={activeConfig.id}
              onChange={(e) => {
                const found = availableTemplates.find(
                  (t) => t.id === e.target.value
                );
                if (found) handleSelectTemplate(found);
              }}
              className="rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1.5 font-mono text-xs font-medium text-[var(--ds-foreground)] focus:border-[var(--ds-accent)] focus:outline-none"
            >
              {availableTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  [{tpl.category.toUpperCase()}] {tpl.title}
                </option>
              ))}
              {!availableTemplates.some((t) => t.id === activeConfig.id) && (
                <option value={activeConfig.id}>
                  [{activeConfig.category.toUpperCase()}] {activeConfig.title}
                </option>
              )}
            </select>
          </label>

          {/* Execution Engine Mode Switcher */}
          <div
            role="group"
            aria-label="Execution Runtime Engine"
            className="hidden sm:inline-flex items-center rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] p-0.5 text-xs"
          >
            <button
              type="button"
              onClick={() => setEngineMode('origin-isolated-iframe')}
              className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                engineMode === 'origin-isolated-iframe'
                  ? 'rounded-xs bg-[var(--ds-primary)] font-semibold text-[var(--ds-primary-foreground)]'
                  : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
              }`}
            >
              CSP Sandbox
            </button>
            <button
              type="button"
              onClick={() => setEngineMode('sandpack-bundler')}
              className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                engineMode === 'sandpack-bundler'
                  ? 'rounded-xs bg-[var(--ds-primary)] font-semibold text-[var(--ds-primary-foreground)]'
                  : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
              }`}
            >
              Sandpack Bundler
            </button>
          </div>
        </div>

        {/* Right Actions: Format, Copy, Download, Share, Save, Reset */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setEditorTheme((t) =>
                t === 'graphite-dark' ? 'editorial-light' : 'graphite-dark'
              )
            }
            title="Toggle Editor Theme"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ds-muted-foreground)] hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-foreground)]"
          >
            {editorTheme === 'graphite-dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">
              {editorTheme === 'graphite-dark' ? 'Light Editor' : 'Dark Editor'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleFormatActiveFile}
            title="Format Code"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ds-muted-foreground)] hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-foreground)]"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Format</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            title="Copy Active File Code"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ds-muted-foreground)] hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-foreground)]"
          >
            {copiedCode ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {copiedCode ? 'Copied' : 'Copy'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCode}
            title="Download Active File"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ds-muted-foreground)] hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-foreground)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Download</span>
          </button>

          <button
            type="button"
            onClick={handleShareLink}
            title="Copy Shareable Playground Link"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ds-muted-foreground)] hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-foreground)]"
          >
            {copiedShareUrl ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">
              {copiedShareUrl ? 'Link Copied!' : 'Share'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSaveExperiment}
            title="Save Private Experiment to Local Workspace"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ds-muted-foreground)] hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-foreground)]"
          >
            {savedNotice ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {savedNotice ? 'Saved' : 'Save Fork'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetToOriginal}
            title="Reset Code & Parameters to Original Implementation"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ds-muted-foreground)] hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Mobile Tab Switcher (Avoids narrow split screen on < lg viewports) */}
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] bg-[var(--ds-background)] px-3 py-1.5 lg:hidden">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileActiveTab('editor')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium ${
              mobileActiveTab === 'editor'
                ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)]'
                : 'text-[var(--ds-muted-foreground)]'
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Code Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab('preview')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium ${
              mobileActiveTab === 'preview'
                ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)]'
                : 'text-[var(--ds-muted-foreground)]'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab('controls')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium ${
              mobileActiveTab === 'controls'
                ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)]'
                : 'text-[var(--ds-muted-foreground)]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Controls ({allDiagnostics.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Main Execution Area: Either Sandpack Lazy Bundler OR Origin-Isolated CSP Dual Pane */}
      {engineMode === 'sandpack-bundler' ? (
        <div className="p-4">
          <SandpackLazyBridge
            templateCategory={activeConfig.category}
            files={files}
            editorTheme={editorTheme}
          />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row">
          {/* LEFT PANE: Professional Multi-File Code Editor */}
          {fullscreenTarget !== 'preview' && (
            <div
              style={{
                width: fullscreenTarget === 'editor' ? '100%' : undefined,
              }}
              className={`${
                mobileActiveTab === 'editor' ? 'flex' : 'hidden lg:flex'
              } flex-col border-b border-[var(--ds-border)] lg:border-b-0 lg:border-r ${
                fullscreenTarget === 'editor' ? 'w-full' : 'lg:w-[48%]'
              }`}
            >
              {/* Editor Tab Bar & Explorer Toggle */}
              <div className="flex items-center justify-between border-b border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setShowFileExplorer((v) => !v)}
                    title="Toggle File Explorer Sidebar"
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-mono ${
                      showFileExplorer
                        ? 'bg-[var(--ds-secondary)] text-[var(--ds-accent)]'
                        : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    <FolderTree className="h-3.5 w-3.5" />
                  </button>

                  {fileList.map((file) => {
                    const isActive = file.path === activeFile.path;
                    return (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setActiveFilePath(file.path)}
                        className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                          isActive
                            ? 'border border-[var(--ds-border-strong)] bg-[var(--ds-surface)] font-semibold text-[var(--ds-foreground)]'
                            : 'text-[var(--ds-muted-foreground)] hover:bg-[var(--ds-surface)] hover:text-[var(--ds-foreground)]'
                        }`}
                      >
                        <FileCode2 className="h-3 w-3 text-[var(--ds-accent)]" />
                        <span>{file.path.replace(/^\//, '')}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1">
                  {fullscreenTarget === 'none' && (
                    <div className="hidden xl:flex items-center gap-1 pr-2 text-[11px] font-mono text-[var(--ds-muted-foreground)]">
                      <button
                        type="button"
                        onClick={() =>
                          setEditorWidthPercent((w) =>
                            w === 48 ? 60 : w === 60 ? 38 : 48
                          )
                        }
                        className="rounded border border-[var(--ds-border)] px-1.5 py-0.5 hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-foreground)]"
                        title="Cycle Split Ratio"
                      >
                        {editorWidthPercent}% / {100 - editorWidthPercent}%
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setFullscreenTarget((t) =>
                        t === 'editor' ? 'none' : 'editor'
                      )
                    }
                    title="Toggle Fullscreen Code Editor"
                    className="rounded p-1 text-[var(--ds-muted-foreground)] hover:bg-[var(--ds-surface)] hover:text-[var(--ds-foreground)]"
                  >
                    {fullscreenTarget === 'editor' ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Editor Workspace (File Explorer + Line-Numbered Source Area) */}
              <div className="flex min-h-[460px] flex-1">
                {showFileExplorer && (
                  <aside className="w-48 shrink-0 border-r border-[var(--ds-border)] bg-[var(--ds-background)] p-3 text-xs">
                    <div className="mb-3">
                      <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-muted-foreground)]">
                        Workspace Files
                      </p>
                      <ul className="space-y-1">
                        {fileList.map((file) => (
                          <li key={file.path}>
                            <button
                              type="button"
                              onClick={() => setActiveFilePath(file.path)}
                              className={`flex w-full items-center justify-between rounded px-2 py-1 text-left font-mono text-xs ${
                                file.path === activeFile.path
                                  ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                                  : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                              }`}
                            >
                              <span className="truncate">{file.path}</span>
                              <span className="text-[10px] uppercase opacity-70">
                                {file.language}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-[var(--ds-border)] pt-3">
                      <p className="mb-1.5 flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-muted-foreground)]">
                        <Package className="h-3 w-3" />
                        <span>Dependencies</span>
                      </p>
                      {Object.keys(activeConfig.dependencies).length === 0 ? (
                        <p className="font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                          Native Browser Runtime
                        </p>
                      ) : (
                        <ul className="space-y-1 font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                          {Object.entries(activeConfig.dependencies).map(
                            ([name, version]) => (
                              <li
                                key={name}
                                className="flex items-center justify-between rounded bg-[var(--ds-surface)] px-2 py-1"
                              >
                                <span className="truncate">{name}</span>
                                <span className="text-[10px] opacity-75">
                                  {version}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </div>
                  </aside>
                )}

                {/* Code Editor Surface */}
                <div
                  className={`relative flex flex-1 font-mono text-xs ${
                    editorTheme === 'graphite-dark'
                      ? 'bg-[#0D1017] text-[#E6EDF3]'
                      : 'bg-[#F8FAFC] text-[#0F172A]'
                  }`}
                >
                  {/* Line Numbers Gutter */}
                  <div
                    aria-hidden="true"
                    className={`select-none border-r px-3 py-4 text-right font-mono text-[11px] leading-6 ${
                      editorTheme === 'graphite-dark'
                        ? 'border-[#1E2430] bg-[#090B10] text-[#566176]'
                        : 'border-slate-200 bg-slate-100 text-slate-400'
                    }`}
                  >
                    {Array.from({ length: lineCount }).map((_, idx) => (
                      <div key={idx + 1}>{idx + 1}</div>
                    ))}
                  </div>

                  {/* Editable Source Textarea */}
                  <textarea
                    aria-label={`Source code editor for ${activeFile.path}`}
                    value={activeFile.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        const updated =
                          activeFile.code.substring(0, start) +
                          '  ' +
                          activeFile.code.substring(end);
                        handleCodeChange(updated);
                      }
                    }}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    className="min-h-[460px] w-full flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-6 focus:outline-none"
                  />
                </div>
              </div>

              {/* Inline Compiler / Security Banner Inside Editor Footer */}
              <div className="flex items-center justify-between border-t border-[var(--ds-border)] bg-[var(--ds-background)] px-3 py-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span>{activeFile.path}</span>
                  <span>·</span>
                  <span>{lineCount} lines</span>
                  <span>·</span>
                  <span>{activeFile.code.length} bytes</span>
                </div>
                <div>
                  {blockingDiagnostics.length > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {blockingDiagnostics.length} Blocking Issue(s)
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      AST & CSP Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT PANE: Live Preview Renderer & Responsive Viewport Stage */}
          {fullscreenTarget !== 'editor' && (
            <div
              className={`${
                mobileActiveTab === 'preview' ? 'flex' : 'hidden lg:flex'
              } flex-1 flex-col bg-[var(--ds-background)]`}
            >
              {/* Preview Viewport & Device Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewportPresetId('fluid')}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] ${
                      viewportPresetId === 'fluid'
                        ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                        : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    <Expand className="h-3 w-3" />
                    <span>Fluid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportPresetId('desktop')}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] ${
                      viewportPresetId === 'desktop'
                        ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                        : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    <Monitor className="h-3 w-3" />
                    <span>1280px</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportPresetId('tablet')}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] ${
                      viewportPresetId === 'tablet'
                        ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                        : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    <Tablet className="h-3 w-3" />
                    <span>768px</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportPresetId('mobile')}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] ${
                      viewportPresetId === 'mobile'
                        ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                        : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    <Smartphone className="h-3 w-3" />
                    <span>375px</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportPresetId('custom')}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] ${
                      viewportPresetId === 'custom'
                        ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                        : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
                    }`}
                  >
                    <span>Custom</span>
                  </button>

                  {viewportPresetId === 'custom' && (
                    <div className="flex items-center gap-1 pl-1 font-mono text-[11px]">
                      <input
                        type="number"
                        aria-label="Custom viewport width in pixels"
                        min={280}
                        max={1920}
                        value={customWidthPx}
                        onChange={(e) =>
                          setCustomWidthPx(
                            Math.max(280, Number(e.target.value) || 320)
                          )
                        }
                        className="w-16 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-1.5 py-0.5 text-center"
                      />
                      <span>×</span>
                      <input
                        type="number"
                        aria-label="Custom viewport height in pixels"
                        min={240}
                        max={1200}
                        value={customHeightPx}
                        onChange={(e) =>
                          setCustomHeightPx(
                            Math.max(240, Number(e.target.value) || 400)
                          )
                        }
                        className="w-16 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-1.5 py-0.5 text-center"
                      />
                      <span>px</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReducedMotion((r) => !r)}
                    className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                      reducedMotion
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-[var(--ds-border)] text-[var(--ds-muted-foreground)]'
                    }`}
                    title="Simulate prefers-reduced-motion: reduce"
                  >
                    Reduced Motion: {reducedMotion ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRuntimeDiagnostics([]);
                      setPreviewKey((k) => k + 1);
                    }}
                    title="Reload Live Preview Frame"
                    className="inline-flex items-center gap-1 rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2 py-1 font-mono text-[11px] text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFullscreenTarget((t) =>
                        t === 'preview' ? 'none' : 'preview'
                      )
                    }
                    title="Toggle Fullscreen Preview"
                    className="rounded p-1 text-[var(--ds-muted-foreground)] hover:bg-[var(--ds-surface)] hover:text-[var(--ds-foreground)]"
                  >
                    {fullscreenTarget === 'preview' ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Live Preview Stage Container */}
              <div className="relative flex min-h-[460px] flex-1 items-center justify-center overflow-auto p-4">
                {isCompiling && (
                  <div className="pointer-events-none absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 font-mono text-[11px] text-[var(--ds-muted-foreground)] shadow-xs">
                    <RefreshCw className="h-3 w-3 animate-spin text-[var(--ds-accent)]" />
                    <span>Compiling changes...</span>
                  </div>
                )}

                {blockingDiagnostics.length > 0 ? (
                  /* Compilation or Security Gate Error Overlay */
                  <div
                    role="alert"
                    className="mx-auto max-w-xl rounded-md border border-rose-500/40 bg-rose-950/20 p-6 text-left"
                  >
                    <div className="mb-3 flex items-center gap-2 text-rose-500">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
                        Preview Execution Halted — {blockingDiagnostics[0].phase}
                      </h3>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-[var(--ds-muted-foreground)]">
                      The playground security & syntax compiler prevented
                      untrusted or malformed code from executing inside the
                      isolated frame.
                    </p>
                    <ul className="space-y-2 font-mono text-xs">
                      {blockingDiagnostics.map((diag) => (
                        <li
                          key={diag.id}
                          className="rounded border border-rose-500/30 bg-[var(--ds-surface)] p-3 text-rose-600 dark:text-rose-300"
                        >
                          <div className="font-semibold">
                            [{diag.phase.toUpperCase()}] {diag.file || ''}
                            {diag.line ? ` (Line ${diag.line})` : ''}
                          </div>
                          <div className="mt-1">{diag.message}</div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResetToOriginal}
                        className="inline-flex items-center gap-1.5 rounded bg-[var(--ds-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--ds-primary-foreground)]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore Working Implementation</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Sandboxed Origin-Isolated Preview Iframe */
                  <div
                    style={{
                      width:
                        typeof currentViewport.widthPx === 'number'
                          ? `${currentViewport.widthPx}px`
                          : '100%',
                      height: `${currentViewport.heightPx}px`,
                      maxWidth: '100%',
                    }}
                    className="relative overflow-hidden rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-xs transition-all"
                  >
                    <iframe
                      key={`${activeConfig.id}-${previewKey}`}
                      title={`Sandboxed live preview for ${activeConfig.title}`}
                      sandbox="allow-scripts"
                      srcDoc={compiledSrcDoc}
                      className="h-full w-full border-0"
                    />
                  </div>
                )}
              </div>

              {/* Preview Footer Status Bar */}
              <div className="flex items-center justify-between border-t border-[var(--ds-border)] bg-[var(--ds-background)] px-3 py-1.5 font-mono text-[11px] text-[var(--ds-muted-foreground)]">
                <div className="flex items-center gap-2">
                  <span>Viewport: {currentViewport.label}</span>
                  <span>·</span>
                  <span>
                    CSP: connect-src &apos;none&apos; · sandbox=&quot;allow-scripts&quot;
                  </span>
                </div>
                <div>
                  {runtimeDiagnostics.length > 0 ? (
                    <span className="font-semibold text-amber-500">
                      {runtimeDiagnostics.length} Runtime Exception(s)
                    </span>
                  ) : (
                    <span className="opacity-75">Isolated Frame Healthy</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Bottom Dock: Resource Customization Controls, Diagnostics Console & QA Self-Tests */}
      <div
        className={`${
          mobileActiveTab === 'controls' ? 'block' : 'hidden lg:block'
        } border-t border-[var(--ds-border)] bg-[var(--ds-background)]`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ds-border)] px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBottomDockTab('parameters')}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                bottomDockTab === 'parameters'
                  ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                  : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>
                Live Parameters ({activeConfig.customizationSettings.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setBottomDockTab('diagnostics')}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                bottomDockTab === 'diagnostics'
                  ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                  : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>
                Diagnostics & Console (
                {allDiagnostics.length + consoleLogs.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setBottomDockTab('qa')}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                bottomDockTab === 'qa'
                  ? 'bg-[var(--ds-secondary)] font-semibold text-[var(--ds-accent)]'
                  : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
              }`}
            >
              <Bug className="h-3.5 w-3.5" />
              <span>Sandbox Verification & QA</span>
            </button>
          </div>

          <span className="font-mono text-[11px] text-[var(--ds-muted-foreground)]">
            Template ID: {activeConfig.id}
          </span>
        </div>

        {/* Tab 1: Resource Customization Settings */}
        {bottomDockTab === 'parameters' && (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeConfig.customizationSettings.map((setting) => {
              const val = customValues[setting.key] ?? setting.value;
              return (
                <div
                  key={setting.key}
                  className="rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3"
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label
                      htmlFor={`pg-param-${setting.key}`}
                      className="font-medium text-[var(--ds-foreground)]"
                    >
                      {setting.label}
                    </label>
                    <span className="font-mono text-[11px] text-[var(--ds-accent)]">
                      {String(val)}
                      {setting.unit || ''}
                    </span>
                  </div>
                  {setting.controlType === 'range' && (
                    <input
                      id={`pg-param-${setting.key}`}
                      type="range"
                      min={setting.min}
                      max={setting.max}
                      step={setting.step}
                      value={Number(val)}
                      onChange={(e) =>
                        setCustomValues((prev) => ({
                          ...prev,
                          [setting.key]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[var(--ds-accent)]"
                    />
                  )}
                  {setting.controlType === 'select' && setting.options && (
                    <select
                      id={`pg-param-${setting.key}`}
                      value={String(val)}
                      onChange={(e) =>
                        setCustomValues((prev) => ({
                          ...prev,
                          [setting.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2 py-1 font-mono text-xs text-[var(--ds-foreground)]"
                    >
                      {setting.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {setting.controlType === 'boolean' && (
                    <button
                      id={`pg-param-${setting.key}`}
                      type="button"
                      onClick={() =>
                        setCustomValues((prev) => ({
                          ...prev,
                          [setting.key]: !val,
                        }))
                      }
                      className="rounded border border-[var(--ds-border)] bg-[var(--ds-background)] px-2.5 py-1 font-mono text-xs text-[var(--ds-foreground)]"
                    >
                      {val ? 'Enabled (true)' : 'Disabled (false)'}
                    </button>
                  )}
                  <div className="mt-1 font-mono text-[10px] text-[var(--ds-muted-foreground)]">
                    Injects CSS token:{' '}
                    {setting.targetCssVariable || `--pg-${setting.key}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Diagnostics & Console Output */}
        {bottomDockTab === 'diagnostics' && (
          <div className="p-4 font-mono text-xs">
            {allDiagnostics.length === 0 && consoleLogs.length === 0 ? (
              <div className="rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3 text-[var(--ds-muted-foreground)]">
                Zero compilation, runtime, or security errors detected. All
                files pass static AST and CSP validation.
              </div>
            ) : (
              <div className="space-y-2">
                {allDiagnostics.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-start justify-between rounded border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-300"
                  >
                    <div>
                      <span className="font-bold uppercase">[{d.phase}]</span>{' '}
                      {d.file ? `${d.file}: ` : ''}
                      {d.message}
                    </div>
                    <span className="text-[10px] opacity-75">
                      {d.timestampIso}
                    </span>
                  </div>
                ))}
                {consoleLogs.map((log, i) => (
                  <div
                    key={i}
                    className="rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-1.5 text-[var(--ds-muted-foreground)]"
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Self-Test & Sandbox Verification Suite */}
        {bottomDockTab === 'qa' && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--ds-foreground)]">
                Interactive Security & Error Resilience Verification
              </p>
              <p className="text-xs text-[var(--ds-muted-foreground)]">
                Simulate compilation syntax errors, runtime exceptions, or
                forbidden sandbox escapes to verify diagnostic isolation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={triggerQaCompilationErrorTest}
                className="rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-1.5 font-mono text-xs font-medium text-[var(--ds-foreground)] hover:border-amber-500"
              >
                Simulate Compilation Error
              </button>
              <button
                type="button"
                onClick={triggerQaRuntimeErrorTest}
                className="rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-1.5 font-mono text-xs font-medium text-[var(--ds-foreground)] hover:border-amber-500"
              >
                Simulate Runtime Exception
              </button>
              <button
                type="button"
                onClick={triggerQaSecurityViolationTest}
                className="rounded border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-1.5 font-mono text-xs font-medium text-[var(--ds-foreground)] hover:border-rose-500"
              >
                Simulate Security Escape
              </button>
              <button
                type="button"
                onClick={handleResetToOriginal}
                className="rounded bg-[var(--ds-primary)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--ds-primary-foreground)]"
              >
                Restore Clean State
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
