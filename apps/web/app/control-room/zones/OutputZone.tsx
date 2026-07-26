'use client';

/**
 * Program Output 2.0 (Step 102) — the visual heart / final stage of UBOS.
 *
 * Restructured from a flat vertical stack into the four canonical regions
 * Program Output 2.0 defines: Program Window (center), Preview Window
 * (left), Routing & Destination Panel (right), Output Intelligence
 * Timeline (bottom). This zone's actual geometry rect is a compact
 * bottom-right (or bottom-strip) box in every shell that mounts it — not
 * wide enough for a literal 3-column grid — so the regions stay stacked
 * vertically in their canonical order, the same "work within the approved
 * geometry" constraint Triad 2.0 (Step 100) and Inspector 2.0 (Step 101)
 * respected.
 *
 * The Program Window region is this zone's existing content (frame
 * composition + output health + routed sources) — Program Output 2.0
 * does not duplicate live Program/Preview video, which stays owned by
 * Triad/TriadCanvas; "Program Window" here means the program's live
 * status/composition, not its pixels.
 *
 * Each region is a two-layer wrapper: an outer `<section>` that carries
 * only the UIIL signal class (so a signal's outline/box-shadow renders as
 * a clean outer glow), and an inner elevation-styled card (Level 3 for
 * Program, Level 2 for Preview/Routing, per the Step 102 spec) — the same
 * "no double-chrome, no property conflicts" split Inspector 2.0 (Step 101)
 * used, since a static Tailwind background/shadow utility and a signal
 * class both setting `background-color`/`box-shadow` on the *same* element
 * would fight over source order rather than layering cleanly.
 */
import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { ubosTypographyClasses } from '@ubos/ui';
import { workspaceState } from '../workspace/workspaceState';
import { OutputPreviewPanel } from './OutputPreviewPanel';
import { OutputRoutingPanel } from './OutputRoutingPanel';
import { OutputIntelligenceTimeline } from './OutputIntelligenceTimeline';
import { outputRegionClassName } from './outputIntelligence';

// UBDS color semantics (Step 92): a nominal health metric is Preview Green
// (safe/ready), a metric that has crossed its threshold escalates to
// Warning Yellow (predicted output degradation).
function HealthRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-ubos-fg-muted">{label}</span>
      <span className={warn ? 'text-ubos-warning-text' : 'text-ubos-preview-text'}>{value}</span>
    </div>
  );
}

export function OutputZone({ state }: { state: ProductionState }) {
  const [, forceRender] = useState(0);
  const uiIntegration = workspaceState.intelligenceGraph.uiIntegration;

  // Compose a fresh output frame on render
  workspaceState.updateOutput();
  const frame  = workspaceState.outputEngine.composeFrame();
  const health = workspaceState.outputEngine.health();

  const videoKeys    = Object.keys(frame.video);
  const graphicCount = frame.graphics.length;
  const audioCount   = frame.audio.length;

  return (
    // Step 102 grew this zone from 3 sections to 4 full regions — `overflow-hidden`
    // (inherited from the original, shorter layout) would silently clip the new
    // regions instead of making them reachable, since this zone's geometry rect
    // is a short bottom box in every shell that mounts it. `overflow-y-auto`
    // matches the same fix InspectorZone.css already uses for the same reason.
    <div className="output-zone flex h-full w-full flex-col overflow-y-auto border-l border-ubos-border-subtle bg-ubos-carbon">
      <header className="flex items-center justify-between border-b border-ubos-border-subtle px-3 py-2">
        <h3 className={`${ubosTypographyClasses.title} text-ubos-program-text`}>Program</h3>
        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${health.healthy ? 'bg-ubos-preview-muted text-ubos-preview-text' : 'bg-ubos-warning-muted text-ubos-warning-text'}`}>
          {health.healthy ? 'Healthy' : 'Degraded'}
        </span>
      </header>

      {/* Program Window region — Center in the canonical layout. Level 3 elevation (Step 102). */}
      <section className={`output-region rounded-lg m-2 ${outputRegionClassName('program', uiIntegration)}`}>
        <div className="rounded-lg border border-ubos-selection-border bg-ubos-midnight shadow-ubos-elevation-3 p-3">
          <p className="mb-2 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">Frame Composition</p>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-ubos-fg-muted">Video sources</span>
              <span className="text-ubos-fg-secondary">{videoKeys.length > 0 ? videoKeys.join(', ') : 'none'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ubos-fg-muted">Graphics layers</span>
              <span className="text-ubos-fg-secondary">{graphicCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ubos-fg-muted">Audio channels</span>
              <span className="text-ubos-fg-secondary">{audioCount}</span>
            </div>
          </div>

          <p className="mb-2 mt-3 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">Output Health</p>
          <div className="space-y-1.5">
            <HealthRow label="Dropped frames" value={String(health.droppedFrames)} warn={health.droppedFrames > 0} />
            <HealthRow label="Latency" value={`${health.latency.toFixed(1)} ms`} warn={health.latency > 16} />
            <HealthRow label="Audio peak" value={health.audioPeak.toFixed(2)} warn={health.audioPeak > 0.9} />
            <HealthRow label="Audio RMS"  value={health.audioRms.toFixed(2)} />
          </div>

          {/* Routing context — destinations routed to program (Program Red = live routing) */}
          {(() => {
            const routed = workspaceState.routingEngine.getSourcesForDestination('program');
            return routed.length > 0 ? (
              <div className="mt-3">
                <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">Routed Sources</p>
                {routed.map((src) => (
                  <div key={src} className="flex items-center gap-2 text-[10px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-ubos-program" />
                    <span className="text-ubos-fg-secondary">{src} → program</span>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      </section>

      {/* Preview Window region — Left in the canonical layout. Level 2 elevation (Step 102). */}
      <section className={`output-region rounded-lg m-2 ${outputRegionClassName('preview', uiIntegration)}`}>
        <div className="rounded-lg border border-ubos-border bg-ubos-slate shadow-ubos-elevation-2 p-3">
          <p className={`${ubosTypographyClasses.sectionLabel} mb-1 text-ubos-fg-disabled`}>Preview</p>
          <OutputPreviewPanel />
        </div>
      </section>

      {/* Routing & Destination Panel region — Right in the canonical layout. Level 2 elevation (Step 102). */}
      <section className={`output-region rounded-lg m-2 ${outputRegionClassName('routing', uiIntegration)}`}>
        <div className="rounded-lg border border-ubos-border bg-ubos-slate shadow-ubos-elevation-2 p-3">
          <p className={`${ubosTypographyClasses.sectionLabel} mb-1 text-ubos-fg-disabled`}>Routing</p>
          <OutputRoutingPanel activeOutputCount={state.activeOutputCount} />
          <button
            type="button"
            onClick={() => { workspaceState.updateOutput(); forceRender((n) => n + 1); }}
            className="mt-2 w-full rounded bg-ubos-midnight py-1 text-[8px] text-ubos-fg-muted hover:bg-ubos-slate hover:text-ubos-fg-secondary"
          >
            ↻ Refresh output
          </button>
        </div>
      </section>

      {/* Output Intelligence Timeline region — Bottom in the canonical layout. */}
      <section className={`output-region rounded-lg m-2 mb-2 flex-1 ${outputRegionClassName('intelligenceTimeline', uiIntegration)}`}>
        <div className="rounded-lg border border-ubos-border-subtle bg-ubos-graphite p-3">
          <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">Intelligence Timeline</p>
          <OutputIntelligenceTimeline />
        </div>
      </section>
    </div>
  );
}
