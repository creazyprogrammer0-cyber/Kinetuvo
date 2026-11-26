'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Check,
  Copy,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  RotateCcw,
  GripVertical,
  Code2,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/InteractionPrimitives';

/* ============================================================================
 * 1. COPY BUTTON
 * ========================================================================== */

export interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
}

export function CopyButton({
  textToCopy,
  label = 'Copy Code',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : label}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-[6px] border border-[var(--ds-border-strong)] bg-[var(--ds-surface)] text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)] ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-[var(--ds-success)]" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-[var(--ds-muted-foreground)]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

/* ============================================================================
 * 2. CODE BLOCK
 * ========================================================================== */

export interface CodeBlockProps {
  filename: string;
  language: string;
  code: string;
  description?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  filename,
  language,
  code,
  description,
  showLineNumbers = true,
}: CodeBlockProps) {
  const lines = code.split('\n');

  return (
    <div className="rounded-[10px] border border-[var(--ds-border-strong)] bg-slate-950 text-slate-100 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-100">{filename}</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-slate-400">{language}</span>
          {description && (
            <>
              <span aria-hidden="true" className="text-slate-600 hidden sm:inline">
                ·
              </span>
              <span className="text-slate-400 font-sans hidden sm:inline truncate max-w-xs">
                {description}
              </span>
            </>
          )}
        </div>
        <CopyButton
          textToCopy={code}
          className="!bg-slate-800 !border-slate-700 !text-slate-100 hover:!bg-slate-700"
        />
      </div>

      <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed tabular-nums">
        <code>
          {showLineNumbers
            ? lines.map((line, i) => (
                <div key={i} className="table-row">
                  <span
                    aria-hidden="true"
                    className="table-cell pr-4 text-right text-slate-600 select-none w-8"
                  >
                    {i + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}

/* ============================================================================
 * 3. DEVICE PREVIEW SELECTOR & LIVE PREVIEW CONTAINER
 * ========================================================================== */

export type ViewportDevicePreset = 'desktop' | 'tablet' | 'mobile';

export interface DevicePreviewSelectorProps {
  activeDevice: ViewportDevicePreset;
  onChangeDevice: (device: ViewportDevicePreset) => void;
}

export function DevicePreviewSelector({
  activeDevice,
  onChangeDevice,
}: DevicePreviewSelectorProps) {
  const presets: {
    id: ViewportDevicePreset;
    label: string;
    widthLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'desktop',
      label: 'Desktop',
      widthLabel: '100%',
      icon: <Monitor className="w-3.5 h-3.5" />,
    },
    {
      id: 'tablet',
      label: 'Tablet',
      widthLabel: '768px',
      icon: <Tablet className="w-3.5 h-3.5" />,
    },
    {
      id: 'mobile',
      label: 'Mobile',
      widthLabel: '375px',
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div
      role="group"
      aria-label="Viewport Device Preset Selector"
      className="inline-flex items-center gap-1 p-1 bg-[var(--ds-muted)] border border-[var(--ds-border)] rounded-[8px]"
    >
      {presets.map((preset) => {
        const isActive = preset.id === activeDevice;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChangeDevice(preset.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ds-focus)] ${
              isActive
                ? 'bg-[var(--ds-surface)] text-[var(--ds-foreground)] font-semibold shadow-2xs'
                : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
            }`}
          >
            {preset.icon}
            <span>{preset.label}</span>
            <span className="font-mono text-[10px] opacity-75 tabular-nums hidden sm:inline">
              ({preset.widthLabel})
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface LivePreviewContainerProps {
  title: string;
  metadata?: string;
  onReset?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function LivePreviewContainer({
  title,
  metadata,
  onReset,
  children,
  footer,
}: LivePreviewContainerProps) {
  const [device, setDevice] = useState<ViewportDevicePreset>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const widthMap: Record<ViewportDevicePreset, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-3 z-50 flex flex-col bg-[var(--ds-surface)] shadow-2xl'
          : 'relative flex flex-col bg-[var(--ds-surface)]'
      } rounded-[12px] border border-[var(--ds-border-strong)] overflow-hidden transition-all`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[var(--ds-muted)]/70 border-b border-[var(--ds-border)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display text-xs font-bold text-[var(--ds-foreground)] truncate">
            {title}
          </span>
          {metadata && (
            <span className="text-xs font-mono text-[var(--ds-muted-foreground)] hidden sm:inline">
              · {metadata}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DevicePreviewSelector
            activeDevice={device}
            onChangeDevice={setDevice}
          />
          {onReset && (
            <IconButton
              label="Reset preview state"
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={onReset}
            />
          )}
          <IconButton
            label={isFullscreen ? 'Exit fullscreen preview' : 'Expand fullscreen preview'}
            variant="outline"
            size="sm"
            isSelected={isFullscreen}
            icon={
              isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )
            }
            onClick={() => setIsFullscreen((prev) => !prev)}
          />
        </div>
      </div>

      {/* Stage Canvas */}
      <div className="flex-1 p-4 sm:p-6 bg-[var(--ds-background)] overflow-x-auto flex justify-center items-center">
        <div
          style={{
            width: widthMap[device],
            maxWidth: '100%',
          }}
          className="transition-all duration-150"
        >
          {children}
        </div>
      </div>

      {footer && (
        <div className="px-4 py-3 bg-[var(--ds-surface)] border-t border-[var(--ds-border)]">
          {footer}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 4. EDITOR PANEL
 * ========================================================================== */

export interface EditorPanelProps {
  filename: string;
  language: string;
  value: string;
  onChange: (nextValue: string) => void;
  onReset?: () => void;
  isDirty?: boolean;
}

export function EditorPanel({
  filename,
  language,
  value,
  onChange,
  onReset,
  isDirty = false,
}: EditorPanelProps) {
  const lineCount = value.split('\n').length;

  return (
    <div className="rounded-[10px] border border-[var(--ds-border-strong)] bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="font-semibold text-slate-100">{filename}</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-slate-400">{language}</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-slate-400 tabular-nums">{lineCount} lines</span>
          {isDirty && (
            <span className="text-indigo-400 font-semibold">· Modified</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="!text-indigo-300 hover:!bg-slate-800 !py-1 !px-2"
            >
              Sync to Sliders
            </Button>
          )}
          <CopyButton
            textToCopy={value}
            className="!bg-slate-800 !border-slate-700 !text-slate-100 hover:!bg-slate-700"
          />
        </div>
      </div>

      <textarea
        aria-label={`Code editor for ${filename}`}
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full flex-1 p-3.5 bg-slate-950 text-indigo-200 font-mono text-xs leading-relaxed focus:outline-2 focus:outline-offset-[-2px] focus:outline-indigo-500 resize-y"
      />
    </div>
  );
}

/* ============================================================================
 * 5. RESIZABLE SPLIT PANEL (Pointer Drag + Keyboard Accessible Separator)
 * ========================================================================== */

export interface ResizableSplitPanelProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  initialLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
}

export function ResizableSplitPanel({
  leftPane,
  rightPane,
  initialLeftPercent = 58,
  minLeftPercent = 30,
  maxLeftPercent = 75,
}: ResizableSplitPanelProps) {
  const [leftPct, setLeftPct] = useState(initialLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const clampPct = useCallback(
    (val: number) => Math.min(maxLeftPercent, Math.max(minLeftPercent, Math.round(val))),
    [minLeftPercent, maxLeftPercent]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const nextPct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(clampPct(nextPct));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="w-full rounded-[12px] border border-[var(--ds-border-strong)] bg-[var(--ds-surface)] overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row items-stretch">
        <div
          style={{ flexBasis: `${leftPct}%` }}
          className="p-4 sm:p-5 min-w-0"
        >
          {leftPane}
        </div>

        {/* Interactive Accessible Separator */}
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Resize split workspace panels (use Left and Right arrow keys)"
          aria-valuenow={leftPct}
          aria-valuemin={minLeftPercent}
          aria-valuemax={maxLeftPercent}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setLeftPct((prev) => clampPct(prev - 4));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setLeftPct((prev) => clampPct(prev + 4));
            }
          }}
          className="hidden lg:flex w-3 bg-[var(--ds-muted)] hover:bg-[var(--ds-secondary)] border-x border-[var(--ds-border)] items-center justify-center cursor-col-resize select-none transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ds-focus)]"
        >
          <GripVertical className="w-3.5 h-3.5 text-[var(--ds-muted-foreground)]" />
        </div>

        <div
          style={{ flexBasis: `${100 - leftPct}%` }}
          className="p-4 sm:p-5 min-w-0 border-t lg:border-t-0 border-[var(--ds-border)] bg-[var(--ds-background)]/40"
        >
          {rightPane}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 6. LOADING SKELETON
 * ========================================================================== */

export interface LoadingSkeletonProps {
  variant?: 'card' | 'code' | 'table-row';
}

export function LoadingSkeleton({ variant = 'card' }: LoadingSkeletonProps) {
  if (variant === 'table-row') {
    return (
      <div
        role="status"
        aria-label="Loading data row"
        className="flex items-center justify-between gap-4 py-3 px-4 border-b border-[var(--ds-border)] animate-pulse"
      >
        <div className="h-3.5 w-24 bg-[var(--ds-muted)] rounded" />
        <div className="h-3.5 w-48 bg-[var(--ds-muted)] rounded" />
        <div className="h-3.5 w-32 bg-[var(--ds-muted)] rounded" />
      </div>
    );
  }

  if (variant === 'code') {
    return (
      <div
        role="status"
        aria-label="Loading code block"
        className="p-4 rounded-[10px] border border-[var(--ds-border)] bg-slate-950 space-y-2.5 animate-pulse"
      >
        <div className="h-3 w-36 bg-slate-800 rounded" />
        <div className="h-3 w-64 bg-slate-800 rounded" />
        <div className="h-3 w-52 bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading resource card"
      className="p-5 rounded-[12px] border border-[var(--ds-border)] bg-[var(--ds-surface)] space-y-3 animate-pulse"
    >
      <div className="h-3 w-40 bg-[var(--ds-muted)] rounded" />
      <div className="h-5 w-3/4 bg-[var(--ds-muted)] rounded" />
      <div className="h-3 w-full bg-[var(--ds-muted)] rounded" />
      <div className="h-3 w-5/6 bg-[var(--ds-muted)] rounded" />
      <div className="pt-3 flex justify-between">
        <div className="h-7 w-28 bg-[var(--ds-muted)] rounded-[6px]" />
        <div className="h-7 w-16 bg-[var(--ds-muted)] rounded-[6px]" />
      </div>
    </div>
  );
}
