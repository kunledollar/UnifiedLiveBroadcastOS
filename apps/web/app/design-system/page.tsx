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
  ubdsTypographyRoles,
  ubosTypographyClasses,
  type UbosBroadcastHue,
  type UbosColorRampState,
  type UbosElevationLevel,
  type UbdsTypographyRole,
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

// UIIL signals (Step 90) drive the intelligence-text treatments described
// in Step 93: highlight/warn are bold, prepare is italic, pulse glows.
const intelligenceSignalSamples: Array<{ signal: string; className: string; sample: string }> = [
  { signal: 'highlight', className: 'ubos-highlight', sample: 'Critical: audio dropout on Guest Mic 2' },
  { signal: 'warn', className: 'ubos-warn', sample: 'Output bitrate trending toward degradation' },
  { signal: 'pulse', className: 'ubos-pulse', sample: 'Predicted audio clipping in 2s' },
  { signal: 'prepare', className: 'ubos-prepare', sample: 'Predicted scene transition in ~4s' },
  { signal: 'dim', className: 'ubos-dim', sample: 'Non-relevant panel for this role' },
  { signal: 'suppress', className: 'ubos-suppress', sample: 'Suppressed low-priority insight' },
];

const elevationSwatchClass: Record<UbosElevationLevel, string> = {
  0: 'bg-ubos-carbon border-transparent',
  1: 'bg-ubos-graphite border-ubos-border-subtle shadow-ubos-elevation-1',
  2: 'bg-ubos-slate border-ubos-border shadow-ubos-elevation-2',
  3: 'bg-ubos-midnight border-ubos-selection-border shadow-ubos-elevation-3',
  4: 'bg-ubos-midnight border-ubos-error-border shadow-ubos-elevation-4',
};

const elevationLabels: Record<UbosElevationLevel, string> = {
  0: 'Level 0 — Background',
  1: 'Level 1 — Standard Panel',
  2: 'Level 2 — Active Panel',
  3: 'Level 3 — Highlighted Panel',
  4: 'Level 4 — Critical Panel',
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

  return (
    <main className="min-h-screen bg-ubos-carbon p-8 text-ubos-fg-primary">
      <header className="mb-8">
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ubos-fg-secondary">
          UBOS Design System · Steps 91–93
        </p>
        <h1 className="text-[1.375rem] font-semibold leading-tight tracking-tight text-ubos-fg-primary">
          UBDS Foundation Showcase
        </h1>
        <p className="mt-1 max-w-2xl text-[0.8125rem] text-ubos-fg-secondary">
          Broadcast color language, the complete typography hierarchy, elevation model, motion
          system, and spacing rhythm. This route is a read-only showcase — Control Room surfaces
          are only updated by the color (Step 92) and typography (Step 93) application work
          itself, not by this page.
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
        <SectionHeading>Typography + Intelligence Integration</SectionHeading>
        <p className="mb-3 max-w-2xl text-[0.75rem] text-ubos-fg-secondary">
          Intelligence Text combined with each UIIL signal class (Step 90) — the same
          classes applied to live Control Room zone wrappers in Step 92/93.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {intelligenceSignalSamples.map(({ signal, className, sample }) => (
            <div key={signal} className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-3">
              <span className="mb-2 block text-[0.5625rem] uppercase tracking-wide text-ubos-fg-disabled">{signal}</span>
              <div className={`rounded-ubos-sm p-2 ${className}`}>
                <p className={ubosTypographyClasses.intelligence}>{sample}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionHeading>Elevation System (Levels 0-4)</SectionHeading>
        <div className="grid gap-3 md:grid-cols-5">
          {ubosElevationLevels.map((level) => (
            <div
              key={level}
              className={`flex h-24 flex-col items-center justify-center rounded-ubos-md border p-2 text-center ${elevationSwatchClass[level]}`}
            >
              <span className="text-[0.625rem] font-medium text-ubos-fg-secondary">{elevationLabels[level]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionHeading>Motion System</SectionHeading>
        <div className="grid gap-3 md:grid-cols-5">
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
