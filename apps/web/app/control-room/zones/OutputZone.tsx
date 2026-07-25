'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../workspace/workspaceState';

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

  // Compose a fresh output frame on render
  workspaceState.updateOutput();
  const frame  = workspaceState.outputEngine.composeFrame();
  const health = workspaceState.outputEngine.health();

  const videoKeys    = Object.keys(frame.video);
  const graphicCount = frame.graphics.length;
  const audioCount   = frame.audio.length;

  return (
    <div className="output-zone flex h-full w-full flex-col overflow-hidden border-l border-ubos-border-subtle bg-ubos-carbon">
      {/* Program Output = Program Red: live, irreversible. */}
      <header className="flex items-center justify-between border-b border-ubos-border-subtle px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-ubos-program-text">
          Program Output
        </h3>
        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${health.healthy ? 'bg-ubos-preview-muted text-ubos-preview-text' : 'bg-ubos-warning-muted text-ubos-warning-text'}`}>
          {health.healthy ? 'Healthy' : 'Degraded'}
        </span>
      </header>

      {/* Composition status */}
      <section className="border-b border-ubos-border-subtle p-3">
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
      </section>

      {/* Output health */}
      <section className="flex-1 p-3">
        <p className="mb-2 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">Output Health</p>
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
      </section>

      {/* Destinations — active/live destinations use Program Red. */}
      <footer className="border-t border-ubos-border-subtle px-3 py-2">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">Destinations</p>
        {state.activeOutputCount > 0 ? (
          <p className="text-[10px] text-ubos-program-text">{state.activeOutputCount} active · {health.droppedFrames} dropped</p>
        ) : (
          <p className="text-[10px] text-ubos-fg-muted">No active destinations</p>
        )}
        <button
          type="button"
          onClick={() => { workspaceState.updateOutput(); forceRender((n) => n + 1); }}
          className="mt-1.5 w-full rounded bg-ubos-midnight py-1 text-[8px] text-ubos-fg-muted hover:bg-ubos-slate hover:text-ubos-fg-secondary"
        >
          ↻ Refresh output
        </button>
      </footer>
    </div>
  );
}
