'use client';

/**
 * UBDS Foundation Showcase — Steps 91-93.
 *
 * Standalone, isolated demo route (no database, no Control Room chrome)
 * that renders the UBOS Design System foundation tokens so the broadcast
 * color language, the complete typography hierarchy (including HUD Text
 * and Intelligence Text, Step 93), elevation model, motion system, and
 * spacing rhythm can be visually verified. This route intentionally does
 * not modify any existing Control Room surface — application of UBDS to
 * live workspaces happens in Step 92 (color) and later steps.
 */
import { useState } from 'react';
import '../control-room/intelligence-graph/ui-intelligence.css';
import {
  ubosBroadcastHues,
  ubosColorRampStates,
  ubosElevationLevels,
  ubosIntelligenceElevationMap,
  ubosMotionCurves,
  ubdsTypographyRoles,
  ubosTypographyClasses,
  type UbosBroadcastHue,
  type UbosColorRampState,
  type UbosElevationLevel,
  type UbdsTypographyRole,
  type UbosIntelligenceElevationAction,
  type UbosMotionCurve,
} from '@ubos/ui';

const hueLabels: Record<UbosBroadcastHue, string> = {
  program: 'Program Red',
  preview: 'Preview Green',
  selection: 'Active Blue',
  automation: 'Automation Purple',
  graphics: 'Graphics Cyan',
  replay: 'Replay Orange',
  warning: 'Warning Yellow',
};

const rampSwatchClass: Record<UbosBroadcastHue, Record<UbosColorRampState, string>> = {
  program: { base: 'bg-ubos-program', hover: 'bg-ubos-program-hover', active: 'bg-ubos-program-active', elevated: 'bg-ubos-program-elevated', dimmed: 'bg-ubos-program-dimmed' },
  preview: { base: 'bg-ubos-preview', hover: 'bg-ubos-preview-hover', active: 'bg-ubos-preview-active', elevated: 'bg-ubos-preview-elevated', dimmed: 'bg-ubos-preview-dimmed' },
  selection: { base: 'bg-ubos-selection', hover: 'bg-ubos-selection-hover', active: 'bg-ubos-selection-active', elevated: 'bg-ubos-selection-elevated', dimmed: 'bg-ubos-selection-dimmed' },
  automation: { base: 'bg-ubos-automation', hover: 'bg-ubos-automation-hover', active: 'bg-ubos-automation-active', elevated: 'bg-ubos-automation-elevated', dimmed: 'bg-ubos-automation-dimmed' },
  graphics: { base: 'bg-ubos-graphics', hover: 'bg-ubos-graphics-hover', active: 'bg-ubos-graphics-active', elevated: 'bg-ubos-graphics-elevated', dimmed: 'bg-ubos-graphics-dimmed' },
  replay: { base: 'bg-ubos-replay', hover: 'bg-ubos-replay-hover', active: 'bg-ubos-replay-active', elevated: 'bg-ubos-replay-elevated', dimmed: 'bg-ubos-replay-dimmed' },
  warning: { base: 'bg-ubos-warning', hover: 'bg-ubos-warning-hover', active: 'bg-ubos-warning-active', elevated: 'bg-ubos-warning-elevated', dimmed: 'bg-ubos-warning-dimmed' },
};

// Sample copy per role. The className always comes straight from
// `ubosTypographyClasses` (the single source of truth) so this page can
// never drift from the actual tokens.
const typographySamples: Record<UbdsTypographyRole, { sample: string; wrapperClassName?: string }> = {
  title: { sample: 'Program Output 2.0' },
  sectionLabel: { sample: 'Section Label' },
  body: { sample: 'Body text uses a readable weight for long operator sessions.' },
  microText: { sample: '00:12:47 · 3 viewers · CPU 24%' },
  // HUD Text has no baked-in color (color-semantic aware) — composed here
  // with the Program Red tally color and a dark "video" backdrop so the
  // drop shadow's legibility purpose is visible.
  hud: { sample: 'PROGRAM · LIVE', wrapperClassName: 'text-ubos-program-text' },
  intelligence: { sample: 'Predicted scene transition in ~4s' },
};

// UIIL signals (Step 90) drive the intelligence-text (Step 93), elevation
// (Step 94), gradient (Step 95), and motion (Step 96) treatments below.
// `elevate` isn't included here since it targets the workspace shell/
// guidance panel rather than a generic content card.
const intelligenceSignalSamples: Array<{ signal: UbosIntelligenceElevationAction; className: string; sample: string; motion: string }> = [
  { signal: 'highlight', className: 'ubos-highlight', sample: 'Critical: audio dropout on Guest Mic 2', motion: 'glow + elevate' },
  { signal: 'warn', className: 'ubos-warn', sample: 'Output bitrate trending toward degradation', motion: 'shake' },
  { signal: 'pulse', className: 'ubos-pulse', sample: 'Predicted audio clipping in 2s', motion: 'pulse (elastic)' },
  { signal: 'prepare', className: 'ubos-prepare', sample: 'Predicted scene transition in ~4s', motion: 'subtle glow' },
  { signal: 'dim', className: 'ubos-dim', sample: 'Non-relevant panel for this role', motion: 'fadeOut (linear)' },
  { signal: 'suppress', className: 'ubos-suppress', sample: 'Suppressed low-priority insight', motion: 'fadeOut (linear)' },
];

const motionCurveDemos: Array<{ curve: UbosMotionCurve; label: string; description: string }> = [
  { curve: 'highlight', label: 'Highlight', description: 'Fast-in / slow-out' },
  { curve: 'warning', label: 'Warning', description: 'Slow-in / fast-out' },
  { curve: 'fade', label: 'Fade', description: 'Linear' },
  { curve: 'pulse', label: 'Pulse', description: 'Elastic' },
  { curve: 'workspaceTransition', label: 'Workspace transition', description: 'Ease-in' },
];

const elevationLabels: Record<UbosElevationLevel, string> = {
  0: 'Level 0 — Background Layer',
  1: 'Level 1 — Standard Panel',
  2: 'Level 2 — Active Panel',
  3: 'Level 3 — Highlighted Panel',
  4: 'Level 4 — Critical Panel',
};

const gradientTypeLabels: Record<UbosElevationLevel, string> = {
  0: 'flat',
  1: 'flat',
  2: 'linear',
  3: 'radial highlight',
  4: 'critical',
};

const rhythm = [
  { label: 'micro', px: 4, class: 'w-1' },
  { label: 'small', px: 8, class: 'w-2' },
  { label: 'medium', px: 12, class: 'w-3' },
  { label: 'large', px: 16, class: 'w-4' },
  { label: 'xlarge', px: 24, class: 'w-6' },
];

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] leading-snug text-ubos-fg-secondary">
      {children}
    </h2>
  );
}

export default function DesignSystemShowcasePage() {
  const [shakeKey, setShakeKey] = useState(0);
  const [elevateKey, setElevateKey] = useState(0);
  const [signalsActive, setSignalsActive] = useState(false);
  const [curvesPlaying, setCurvesPlaying] = useState(false);

  return (
    <main className="min-h-screen bg-ubos-carbon p-8 text-ubos-fg-primary">
      <header className="mb-8">
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ubos-fg-secondary">
          UBOS Design System · Steps 91–96
        </p>
        <h1 className="text-[1.375rem] font-semibold leading-tight tracking-tight text-ubos-fg-primary">
          UBDS Foundation Showcase
        </h1>
        <p className="mt-1 max-w-2xl text-[0.8125rem] text-ubos-fg-secondary">
          Broadcast color language, the complete typography hierarchy, the elevation model
          (shadow/gradient/border per level), the gradient system, the complete motion system
          (six primitives + timing curves), and spacing rhythm. This route is a read-only
          showcase — Control Room surfaces are only updated by the color (Step 92), typography
          (Step 93), elevation (Step 94), depth/gradient (Step 95), and motion (Step 96)
          application work itself, not by this page.
        </p>
      </header>

      <section className="mb-10">
        <SectionHeading>Broadcast Color Language</SectionHeading>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ubosBroadcastHues.map((hue) => (
            <div key={hue} className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-3 shadow-ubos-panel">
              <p className="mb-2 text-xs font-semibold text-ubos-fg-primary">{hueLabels[hue]}</p>
              <div className="flex gap-1.5">
                {ubosColorRampStates.map((state) => (
                  <div key={state} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`h-10 w-full rounded-ubos-sm border border-ubos-border-subtle ${rampSwatchClass[hue][state]}`} />
                    <span className="text-[0.5625rem] uppercase tracking-wide text-ubos-fg-muted">{state}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionHeading>Typography Hierarchy</SectionHeading>
        <div className="space-y-3 rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4 shadow-ubos-panel">
          {ubdsTypographyRoles.map((role) => {
            const { sample, wrapperClassName } = typographySamples[role];
            return (
              <div key={role} className="border-b border-ubos-border-subtle pb-3 last:border-b-0 last:pb-0">
                <span className="mb-1 block text-[0.5625rem] uppercase tracking-wide text-ubos-fg-disabled">{role}</span>
                {role === 'hud' ? (
                  <div className="rounded-ubos-sm bg-[radial-gradient(circle_at_30%_30%,#1e293b,#020617)] p-3">
                    <p className={`${ubosTypographyClasses.hud} ${wrapperClassName ?? ''}`}>{sample}</p>
                  </div>
                ) : (
                  <p className={`${ubosTypographyClasses[role]} ${wrapperClassName ?? ''}`}>{sample}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionHeading>Typography + Elevation + Depth + Motion + Intelligence Integration</SectionHeading>
          <button
            type="button"
            onClick={() => setSignalsActive((current) => !current)}
            className="rounded-ubos-sm border border-ubos-selection-border bg-ubos-selection-muted px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-wide text-ubos-selection-text hover:bg-ubos-selection-dimmed"
          >
            {signalsActive ? 'Clear signals' : 'Trigger intelligence signals'}
          </button>
        </div>
        <p className="mb-3 max-w-2xl text-[0.75rem] text-ubos-fg-secondary">
          Each UIIL signal class (Step 90) combines a color treatment (Step 92), a text
          treatment (Step 93), an elevation level (Step 94), a gradient shape (Step 95), and a
          motion treatment (Step 96) — the same classes applied to live Control Room zone
          wrappers. Toggling the button applies/removes the classes on already-mounted cards so
          the entrance motion (elevate rise, shake, glow-in, linear fade) actually plays, the same
          way it would when a WIE signal newly appears or clears on a live panel.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {intelligenceSignalSamples.map(({ signal, className, sample, motion }) => (
            <div key={signal} className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.5625rem] uppercase tracking-wide text-ubos-fg-disabled">{signal}</span>
                <span className="text-[0.5625rem] uppercase tracking-wide text-ubos-fg-disabled">
                  Level {ubosIntelligenceElevationMap[signal]} · {motion}
                </span>
              </div>
              <div className={`rounded-ubos-sm p-2 ${signalsActive ? className : ''}`}>
                <p className={ubosTypographyClasses.intelligence}>{sample}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionHeading>Elevation System (Levels 0-4)</SectionHeading>
        <p className="mb-3 max-w-2xl text-[0.75rem] text-ubos-fg-secondary">
          Rendered with the plain CSS <code>.ubos-elevation-N</code> classes (rather than{' '}
          <code>ubosElevationClasses</code>) so the Step 95 gradient shape per level is visible,
          not just the shadow/border.
        </p>
        <div className="grid gap-3 md:grid-cols-5">
          {ubosElevationLevels.map((level) => (
            <div
              key={level}
              className={`ubos-elevation-${level} flex h-24 flex-col items-center justify-center rounded-ubos-md p-2 text-center`}
            >
              <span className="text-[0.625rem] font-medium text-ubos-fg-secondary">{elevationLabels[level]}</span>
              <span className="mt-1 text-[0.5625rem] uppercase tracking-wide text-ubos-fg-disabled">
                {gradientTypeLabels[level]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionHeading>Gradient System</SectionHeading>
        <p className="mb-3 max-w-2xl text-[0.75rem] text-ubos-fg-secondary">
          Three canonical gradient shapes (Step 95) — directional lighting that gives elevation
          its cinematic read, always subtle, never neon.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-3">
            <p className="mb-2 text-xs font-semibold text-ubos-fg-primary">Linear Depth Gradient</p>
            <div className="ubos-gradient-linear h-16 rounded-ubos-sm bg-ubos-slate" />
            <p className="mt-2 text-[0.625rem] text-ubos-fg-muted">Elevation, active panels, workspace shells</p>
          </div>
          <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-3">
            <p className="mb-2 text-xs font-semibold text-ubos-fg-primary">Radial Highlight Gradient</p>
            <div className="ubos-gradient-radial-highlight h-16 rounded-ubos-sm bg-ubos-midnight" />
            <p className="mt-2 text-[0.625rem] text-ubos-fg-muted">Intelligence highlights, predicted transitions</p>
          </div>
          <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-3">
            <p className="mb-2 text-xs font-semibold text-ubos-fg-primary">Critical Gradient</p>
            <div className="ubos-gradient-critical h-16 rounded-ubos-sm bg-ubos-carbon" />
            <p className="mt-2 text-[0.625rem] text-ubos-fg-muted">Warnings, degraded output, routing failures</p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <SectionHeading>Motion System</SectionHeading>
        <p className="mb-3 max-w-2xl text-[0.75rem] text-ubos-fg-secondary">
          Six canonical primitives (Step 96 adds <code>elevate</code> to the five from Step 91).
        </p>
        <div className="grid gap-3 md:grid-cols-6">
          <div className="flex flex-col items-center gap-2 rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4">
            <span className="h-4 w-4 animate-ubos-tally-pulse rounded-full bg-ubos-program" />
            <span className="text-[0.625rem] uppercase tracking-wide text-ubos-fg-muted">pulse</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4">
            <span className="h-8 w-8 rounded-ubos-sm bg-ubos-selection shadow-ubos-selection-glow transition-shadow duration-ubos-slow" />
            <span className="text-[0.625rem] uppercase tracking-wide text-ubos-fg-muted">glow</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4">
            <span className="h-4 w-8 animate-ubos-slide-up rounded-ubos-sm bg-ubos-graphics" />
            <span className="text-[0.625rem] uppercase tracking-wide text-ubos-fg-muted">slide</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4">
            <span className="h-4 w-8 animate-ubos-fade-in rounded-ubos-sm bg-ubos-replay" />
            <span className="text-[0.625rem] uppercase tracking-wide text-ubos-fg-muted">fade</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4">
            <button
              type="button"
              key={shakeKey}
              onClick={() => setShakeKey((current) => current + 1)}
              className="ubos-shake h-8 w-8 rounded-ubos-sm border border-ubos-warning-border bg-ubos-warning-muted"
              aria-label="Replay shake animation"
            />
            <span className="text-[0.625rem] uppercase tracking-wide text-ubos-fg-muted">shake (click)</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4">
            <button
              type="button"
              key={elevateKey}
              onClick={() => setElevateKey((current) => current + 1)}
              className="ubos-elevate-in h-8 w-8 rounded-ubos-sm border border-ubos-selection-border bg-ubos-selection-muted"
              aria-label="Replay elevate animation"
            />
            <span className="text-[0.625rem] uppercase tracking-wide text-ubos-fg-muted">elevate (click)</span>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionHeading>Motion Timing Curves</SectionHeading>
          <button
            type="button"
            onClick={() => setCurvesPlaying((current) => !current)}
            className="rounded-ubos-sm border border-ubos-selection-border bg-ubos-selection-muted px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-wide text-ubos-selection-text hover:bg-ubos-selection-dimmed"
          >
            {curvesPlaying ? 'Reset' : 'Play'}
          </button>
        </div>
        <p className="mb-3 max-w-2xl text-[0.75rem] text-ubos-fg-secondary">
          Cinematic curves, not web-app defaults (Step 96) — the same shape means something
          different depending on which state it serves.
        </p>
        <div className="space-y-3">
          {motionCurveDemos.map(({ curve, label, description }) => (
            <div key={curve} className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className={ubosTypographyClasses.body}>{label}</span>
                <span className="text-[0.625rem] uppercase tracking-wide text-ubos-fg-muted">{description}</span>
              </div>
              <div className="relative h-3 rounded-full bg-ubos-midnight">
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-ubos-selection"
                  style={{
                    left: curvesPlaying ? 'calc(100% - 0.75rem)' : '0%',
                    transition: `left 900ms ${ubosMotionCurves[curve]}`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading>Spacing Rhythm</SectionHeading>
        <div className="flex items-end gap-4 rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4">
          {rhythm.map((step) => (
            <div key={step.label} className="flex flex-col items-center gap-2">
              <div className={`${step.class} h-10 rounded-ubos-sm bg-ubos-selection`} />
              <span className="text-[0.625rem] uppercase tracking-wide text-ubos-fg-muted">
                {step.label} · {step.px}px
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
