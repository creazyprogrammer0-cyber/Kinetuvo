'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import {
  ResourceMetadata,
  TechnicalLabel,
} from '@/components/ui/ContentPrimitives';
import { Button } from '@/components/ui/InteractionPrimitives';
import { useTheme } from '@/components/providers/ThemeProvider';

export function InteractiveMiniDemosSection() {
  const { reducedMotionSim } = useTheme();
  const systemReducedMotion = useReducedMotion();
  const isReducedMotion = Boolean(systemReducedMotion || reducedMotionSim);

  // 1. Magnetic Button State
  const [magOffset, setMagOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [magStrength, setMagStrength] = useState<number>(35);
  const [magClickCount, setMagClickCount] = useState<number>(0);

  // 2. Animated Variable Typography State
  const [typeWeight, setTypeWeight] = useState<number>(700);
  const [typeTracking, setTypeTracking] = useState<number>(-0.02);
  const [typeWaveActive, setTypeWaveActive] = useState<boolean>(false);

  // 3. Hover & Slider Blueprint Reveal State
  const [revealPercent, setRevealPercent] = useState<number>(52);

  // 4. Translucent Surface Calibration State
  const [blurPx, setBlurPx] = useState<number>(10);
  const [surfaceAlpha, setSurfaceAlpha] = useState<number>(82);

  // 5. Bento Grid Interaction State
  const [activeBentoCell, setActiveBentoCell] = useState<number>(0);

  // 6. Scroll / Timeline Scrubbing Animation State
  const [timelineProgress, setTimelineProgress] = useState<number>(65);

  // 7. 3D Isometric Element Preview State
  const [rotX, setRotX] = useState<number>(52);
  const [rotZ, setRotZ] = useState<number>(-32);
  const [layerExplosion, setLayerExplosion] = useState<number>(22);

  return (
    <section
      id="interactive-showcase"
      aria-labelledby="mini-demos-heading"
      className="space-y-6 pt-8 border-t border-[var(--ds-border)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <TechnicalLabel
            kicker="06. INTERACTIVE MINI-DEMONSTRATIONS"
            detail="7 Hands-On Micro-Laboratories · Zero Static Screenshots"
          />
          <h2
            id="mini-demos-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ds-foreground)] text-balance"
          >
            Tactile Interaction, Motion & Spatial Primitives
          </h2>
          <p className="text-sm text-[var(--ds-muted-foreground)] max-w-3xl">
            Every specimen below is a live executable component. Hover, drag, click,
            or use keyboard controls to inspect the underlying physical and visual
            parameters.
          </p>
        </div>
        <div className="text-xs font-mono text-[var(--ds-subtle-foreground)]">
          {isReducedMotion
            ? 'Reduced-Motion Mode Active (Instant State)'
            : '60fps Compositor Transforms Active'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* 1. MAGNETIC BUTTON (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <ResourceMetadata
              items={['01. Micro-Interaction', 'Magnetic Cursor Attraction']}
            />
            <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
              Magnetic Field Button
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)]">
              Move your pointer across the sensor boundary or adjust magnetic pull
              gain.
            </p>
          </div>

          <div
            onPointerMove={(e) => {
              if (isReducedMotion) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const deltaX = ((e.clientX - centerX) * magStrength) / 100;
              const deltaY = ((e.clientY - centerY) * magStrength) / 100;
              setMagOffset({ x: Math.round(deltaX), y: Math.round(deltaY) });
            }}
            onPointerLeave={() => setMagOffset({ x: 0, y: 0 })}
            className="h-32 rounded-[8px] bg-[var(--ds-background)] border border-dashed border-[var(--ds-border-strong)] flex items-center justify-center relative overflow-hidden"
          >
            <motion.button
              type="button"
              animate={{ x: magOffset.x, y: magOffset.y }}
              transition={
                isReducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 320, damping: 20 }
              }
              onClick={() => setMagClickCount((c) => c + 1)}
              className="px-4 py-2.5 rounded-[8px] bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] text-xs font-semibold shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)]"
            >
              Magnetic Trigger ({magOffset.x}px, {magOffset.y}px) · {magClickCount}
            </motion.button>
          </div>

          <div className="space-y-1 pt-2 border-t border-[var(--ds-border)] text-xs">
            <div className="flex justify-between">
              <label htmlFor="mag-strength" className="font-semibold">
                Attraction Gain
              </label>
              <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                {magStrength}%
              </span>
            </div>
            <input
              id="mag-strength"
              type="range"
              min={10}
              max={65}
              value={magStrength}
              onChange={(e) => setMagStrength(Number(e.target.value))}
              className="w-full accent-[var(--ds-primary)]"
            />
          </div>
        </div>

        {/* 2. ANIMATED KINETIC TEXT (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <ResourceMetadata
              items={['02. Kinetic Typography', 'Optical Weight & Tracking']}
            />
            <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
              Animated Typography Specimen
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)]">
              Modulate optical font weight, letter tracking, and character stagger
              impulse.
            </p>
          </div>

          <div className="h-32 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] flex flex-col items-center justify-center px-3 overflow-hidden">
            <div className="flex items-center justify-center">
              {'SYSTEMS'.split('').map((char, idx) => (
                <motion.span
                  key={idx}
                  animate={{
                    y: typeWaveActive && !isReducedMotion ? [0, -8, 0] : 0,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: idx * 0.04,
                  }}
                  style={{
                    fontWeight: typeWeight,
                    letterSpacing: `${typeTracking}em`,
                  }}
                  className="font-display text-2xl sm:text-3xl text-[var(--ds-foreground)] select-none"
                >
                  {char}
                </motion.span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTypeWaveActive((p) => !p)}
              className="mt-2 text-[11px] font-mono font-semibold text-[var(--ds-accent)] hover:underline"
            >
              Trigger Stagger Impulse
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--ds-border)] text-xs">
            <div>
              <div className="flex justify-between">
                <label htmlFor="type-weight" className="font-semibold">
                  Weight
                </label>
                <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                  {typeWeight}
                </span>
              </div>
              <input
                id="type-weight"
                type="range"
                min={400}
                max={800}
                step={100}
                value={typeWeight}
                onChange={(e) => setTypeWeight(Number(e.target.value))}
                className="w-full accent-[var(--ds-primary)]"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <label htmlFor="type-tracking" className="font-semibold">
                  Tracking
                </label>
                <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                  {typeTracking}em
                </span>
              </div>
              <input
                id="type-tracking"
                type="range"
                min={-0.05}
                max={0.2}
                step={0.01}
                value={typeTracking}
                onChange={(e) => setTypeTracking(Number(e.target.value))}
                className="w-full accent-[var(--ds-primary)]"
              />
            </div>
          </div>
        </div>

        {/* 3. HOVER & SLIDER BLUEPRINT REVEAL (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <ResourceMetadata
              items={['03. Visual Comparison', 'Hover & Scrub Curtain Reveal']}
            />
            <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
              Wireframe-to-Surface Reveal
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)]">
              Hover across the stage or drag the slider to compare structural
              wireframe vs. rendered surface.
            </p>
          </div>

          <div
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (rect.width <= 0) return;
              const pct = Math.min(
                95,
                Math.max(5, Math.round(((e.clientX - rect.left) / rect.width) * 100))
              );
              setRevealPercent(pct);
            }}
            className="h-32 rounded-[8px] border border-[var(--ds-border-strong)] relative overflow-hidden cursor-ew-resize select-none"
          >
            {/* Base Layer: Wireframe Blueprint */}
            <div className="absolute inset-0 bg-slate-950 text-indigo-300 p-3.5 font-mono text-[11px] flex flex-col justify-between">
              <div className="flex justify-between border-b border-dashed border-indigo-500/40 pb-1">
                <span>WIREFRAME SPEC</span>
                <span>GRID: 12-COL</span>
              </div>
              <div className="border border-dashed border-indigo-400/50 p-2 rounded">
                [DOM Node: Interactive Card · r=8px]
              </div>
            </div>

            {/* Clipped Foreground Layer: Rendered UI */}
            <div
              style={{ width: `${revealPercent}%` }}
              className="absolute inset-y-0 left-0 bg-[var(--ds-primary)] text-white p-3.5 overflow-hidden border-r-2 border-white flex flex-col justify-between"
            >
              <div className="text-[11px] font-mono font-bold whitespace-nowrap">
                RENDERED PRODUCTION SURFACE ({revealPercent}%)
              </div>
              <div className="font-display text-sm font-bold whitespace-nowrap">
                High-Contrast Semantic Card
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-[var(--ds-border)] text-xs">
            <div className="flex justify-between">
              <label htmlFor="reveal-slider" className="font-semibold">
                Curtain Split Position
              </label>
              <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                {revealPercent}%
              </span>
            </div>
            <input
              id="reveal-slider"
              type="range"
              min={5}
              max={95}
              value={revealPercent}
              onChange={(e) => setRevealPercent(Number(e.target.value))}
              className="w-full accent-[var(--ds-primary)]"
            />
          </div>
        </div>

        {/* 4. RESTRAINED TRANSLUCENT SURFACE (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <ResourceMetadata
              items={['04. Surface Optics', 'Controlled Backdrop Scrim']}
            />
            <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
              Accessible Translucent Surface
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)]">
              Calibrate backdrop filter blur and surface opacity without sacrificing
              WCAG text legibility.
            </p>
          </div>

          <div className="h-36 rounded-[8px] border border-[var(--ds-border)] relative overflow-hidden flex items-center justify-center p-4 bg-slate-900">
            {/* Geometric Reference Pattern Behind Glass */}
            <div
              aria-hidden="true"
              className="absolute inset-0 grid grid-cols-6 gap-2 p-2 opacity-80"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded ${
                    i % 2 === 0 ? 'bg-indigo-500' : 'bg-sky-400'
                  }`}
                />
              ))}
            </div>

            <div
              style={{
                backdropFilter: `blur(${blurPx}px)`,
                WebkitBackdropFilter: `blur(${blurPx}px)`,
                backgroundColor: `rgba(15, 23, 42, ${surfaceAlpha / 100})`,
              }}
              className="relative z-10 w-full p-3.5 rounded-[8px] border border-white/25 text-white space-y-1"
            >
              <div className="text-[10px] font-mono text-indigo-300 tabular-nums">
                blur({blurPx}px) · alpha({surfaceAlpha}%)
              </div>
              <div className="font-display text-xs font-bold">
                Measured Scrim Legibility Guard
              </div>
              <div className="text-[11px] text-slate-200">
                Maintains &gt; 7.5:1 foreground contrast over busy media.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--ds-border)] text-xs">
            <div>
              <div className="flex justify-between">
                <label htmlFor="glass-blur" className="font-semibold">
                  Blur
                </label>
                <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                  {blurPx}px
                </span>
              </div>
              <input
                id="glass-blur"
                type="range"
                min={0}
                max={20}
                value={blurPx}
                onChange={(e) => setBlurPx(Number(e.target.value))}
                className="w-full accent-[var(--ds-primary)]"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <label htmlFor="glass-alpha" className="font-semibold">
                  Scrim Alpha
                </label>
                <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                  {surfaceAlpha}%
                </span>
              </div>
              <input
                id="glass-alpha"
                type="range"
                min={55}
                max={96}
                value={surfaceAlpha}
                onChange={(e) => setSurfaceAlpha(Number(e.target.value))}
                className="w-full accent-[var(--ds-primary)]"
              />
            </div>
          </div>
        </div>

        {/* 5. BENTO GRID INTERACTION (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <ResourceMetadata
              items={['05. Spatial Composition', 'Interactive Bento Matrix']}
            />
            <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
              Adaptive Bento Grid Reflow
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)]">
              Select any cell in the asymmetric grid to shift proportional weight and
              inspect cell span telemetry.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 h-36">
            {[
              { id: 0, title: 'Token Kernel', metric: 'Span 2x1' },
              { id: 1, title: 'Grid Axis', metric: 'Span 1x1' },
              { id: 2, title: 'ARIA Tree', metric: 'Span 1x1' },
              { id: 3, title: 'Spring Stage', metric: 'Span 2x1' },
            ].map((cell) => {
              const isSelected = activeBentoCell === cell.id;
              const colSpanClass =
                cell.id === 0 || cell.id === 3 ? 'col-span-2' : 'col-span-1';
              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => setActiveBentoCell(cell.id)}
                  className={`${colSpanClass} p-2.5 rounded-[8px] border text-left flex flex-col justify-between transition-all focus-visible:outline-2 focus-visible:outline-[var(--ds-focus)] ${
                    isSelected
                      ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-transparent shadow-xs'
                      : 'bg-[var(--ds-background)] text-[var(--ds-foreground)] border-[var(--ds-border)] hover:border-[var(--ds-accent)]'
                  }`}
                >
                  <div className="text-[10px] font-mono opacity-80">
                    0{cell.id + 1} · {cell.metric}
                  </div>
                  <div className="font-display text-xs font-bold truncate">
                    {cell.title}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[var(--ds-border)] flex items-center justify-between text-xs font-mono text-[var(--ds-muted-foreground)]">
            <span>ACTIVE CELL: 0{activeBentoCell + 1}</span>
            <span>CSS GRID: 3-TRACK ASYMMETRIC</span>
          </div>
        </div>

        {/* 6. SCROLL / TIMELINE CHOREOGRAPHY (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border)] flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <ResourceMetadata
              items={['06. Timeline Scrubbing', 'Scroll-Linked Progress']}
            />
            <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
              Scroll-Progress Timeline Stage
            </h3>
            <p className="text-xs text-[var(--ds-muted-foreground)]">
              Scrub the progress timeline from 0% to 100% to step through geometric
              keyframe assembly.
            </p>
          </div>

          <div className="h-36 rounded-[8px] bg-[var(--ds-background)] border border-[var(--ds-border)] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ds-muted-foreground)] tabular-nums">
              <span>PROGRESS: {timelineProgress}%</span>
              <span>
                PHASE:{' '}
                {timelineProgress < 33
                  ? '01. WIREFRAME'
                  : timelineProgress < 67
                  ? '02. LAYOUT SNAP'
                  : '03. POLISHED STATE'}
              </span>
            </div>

            {/* Scrub-Controlled Geometric Nodes */}
            <div className="relative h-14 flex items-center justify-between px-2">
              <div
                style={{ width: `${timelineProgress}%` }}
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--ds-accent)] rounded"
              />
              {[0, 50, 100].map((milestone, i) => {
                const reached = timelineProgress >= milestone;
                return (
                  <div
                    key={milestone}
                    style={{
                      transform: `scale(${reached ? 1.1 : 0.9})`,
                    }}
                    className={`relative z-10 w-8 h-8 rounded-[6px] font-mono text-xs font-bold flex items-center justify-center border transition-all ${
                      reached
                        ? 'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] border-transparent'
                        : 'bg-[var(--ds-surface)] text-[var(--ds-muted-foreground)] border-[var(--ds-border-strong)]'
                    }`}
                  >
                    S{i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-[var(--ds-border)] text-xs">
            <div className="flex justify-between">
              <label htmlFor="timeline-scrub" className="font-semibold">
                Scrub Timeline Progress
              </label>
              <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                {timelineProgress}%
              </span>
            </div>
            <input
              id="timeline-scrub"
              type="range"
              min={0}
              max={100}
              value={timelineProgress}
              onChange={(e) => setTimelineProgress(Number(e.target.value))}
              className="w-full accent-[var(--ds-primary)]"
            />
          </div>
        </div>

        {/* 7. 3D ISOMETRIC LAYER PREVIEW (12 Cols Full-Width Interactive Spatial Specimen) */}
        <div className="lg:col-span-12 p-5 sm:p-6 rounded-[12px] bg-[var(--ds-surface)] border border-[var(--ds-border-strong)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-3">
            <ResourceMetadata
              items={[
                '07. 3D Spatial Architecture',
                'Interactive Isometric DOM Layer Stack',
              ]}
            />
            <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--ds-foreground)]">
              3D Exploded Component Layer Inspector
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ds-muted-foreground)] leading-relaxed">
              Rotate the 3D spatial camera and adjust Z-axis elevation separation to
              inspect how semantic surface, hairline border, and foreground typography
              planes stack inside a component.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <label htmlFor="iso-rotx" className="font-semibold">
                    Pitch Angle (rotateX)
                  </label>
                  <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                    {rotX} deg
                  </span>
                </div>
                <input
                  id="iso-rotx"
                  type="range"
                  min={20}
                  max={70}
                  value={rotX}
                  onChange={(e) => setRotX(Number(e.target.value))}
                  className="w-full accent-[var(--ds-primary)]"
                />
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <label htmlFor="iso-rotz" className="font-semibold">
                    Yaw Angle (rotateZ)
                  </label>
                  <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                    {rotZ} deg
                  </span>
                </div>
                <input
                  id="iso-rotz"
                  type="range"
                  min={-60}
                  max={60}
                  value={rotZ}
                  onChange={(e) => setRotZ(Number(e.target.value))}
                  className="w-full accent-[var(--ds-primary)]"
                />
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <label htmlFor="iso-explode" className="font-semibold">
                    Z-Axis Layer Explosion Distance
                  </label>
                  <span className="font-mono text-[var(--ds-accent)] tabular-nums">
                    {layerExplosion} px
                  </span>
                </div>
                <input
                  id="iso-explode"
                  type="range"
                  min={0}
                  max={44}
                  value={layerExplosion}
                  onChange={(e) => setLayerExplosion(Number(e.target.value))}
                  className="w-full accent-[var(--ds-primary)]"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => {
                  setRotX(52);
                  setRotZ(-32);
                  setLayerExplosion(22);
                }}
              >
                Reset 3D Camera
              </Button>
            </div>
          </div>

          {/* 3D Perspective Viewport */}
          <div
            style={{ perspective: '900px' }}
            className="lg:col-span-7 h-72 rounded-[10px] bg-[var(--ds-background)] border border-[var(--ds-border)] flex items-center justify-center overflow-hidden relative"
          >
            <div
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
              }}
              className="relative w-56 h-36 transition-transform duration-100"
            >
              {/* Layer 1: Base Surface Canvas (Z = -layerExplosion) */}
              <div
                style={{
                  transform: `translateZ(${-layerExplosion}px)`,
                }}
                className="absolute inset-0 rounded-[10px] bg-slate-900/90 border border-slate-700 p-3 flex items-end justify-between text-[10px] font-mono text-slate-400 shadow-lg"
              >
                <span>L1: --ds-surface</span>
                <span>Z: -{layerExplosion}px</span>
              </div>

              {/* Layer 2: Structural Border & Focus Ring Plane (Z = 0px) */}
              <div
                style={{
                  transform: 'translateZ(0px)',
                }}
                className="absolute inset-0 rounded-[10px] border-2 border-indigo-500 bg-indigo-500/15 p-3 flex items-end justify-between text-[10px] font-mono text-indigo-300"
              >
                <span>L2: --ds-border & focus</span>
                <span>Z: 0px</span>
              </div>

              {/* Layer 3: Foreground Typography & Action Plane (Z = +layerExplosion) */}
              <div
                style={{
                  transform: `translateZ(${layerExplosion}px)`,
                }}
                className="absolute inset-0 rounded-[10px] border border-white/40 bg-indigo-600/90 text-white p-3.5 flex flex-col justify-between shadow-xl"
              >
                <div className="text-[10px] font-mono opacity-85 flex justify-between">
                  <span>L3: --ds-foreground</span>
                  <span>Z: +{layerExplosion}px</span>
                </div>
                <div className="font-display text-sm font-bold">
                  3D Spatial Layer Plane
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
