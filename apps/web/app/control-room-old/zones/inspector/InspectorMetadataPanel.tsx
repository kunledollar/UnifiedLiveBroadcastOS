'use client';

/**
 * Inspector Metadata Panel (Step 101) — the "Metadata Panel" region of
 * Inspector 2.0: confidence scores, predictive timelines, and intelligence
 * history. Reuses the exact same `UigSnapshot` shape `IntelligenceGraphZone`
 * already renders from `workspaceState.intelligenceGraph.getSnapshot()` —
 * no new engines, no new data plumbing, just a compact, Inspector-scoped
 * readout instead of the full Intelligence Graph zone's dense dump.
 */
import { workspaceState } from '../../workspace/workspaceState';

function relativeTime(timestamp: number): string {
  const deltaMs = Date.now() - timestamp;
  if (deltaMs < 1000) return 'now';
  const seconds = Math.round(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

export function InspectorMetadataPanel() {
  const graph = workspaceState.intelligenceGraph;
  const snapshot = graph.getSnapshot();

  return (
    <div className="inspector-metadata-panel rounded-lg border border-ubos-border bg-ubos-slate shadow-ubos-elevation-2 p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Metadata</h4>

      <div className="mb-3 grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="flex gap-2"><span className="text-ubos-fg-muted">Confidence</span><span className="text-ubos-fg-secondary">{(snapshot.avgConfidence * 100).toFixed(0)}%</span></div>
        <div className="flex gap-2"><span className="text-ubos-fg-muted">Stability</span><span className="text-ubos-fg-secondary">{(snapshot.stability * 100).toFixed(0)}%</span></div>
        <div className="flex gap-2"><span className="text-ubos-fg-muted">Forecasts</span><span className="text-ubos-fg-secondary">{snapshot.predictionCount}</span></div>
        <div className="flex gap-2"><span className="text-ubos-fg-muted">Fused</span><span className="text-ubos-fg-secondary">{snapshot.fusedCount}</span></div>
      </div>

      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">Predictive timeline</p>
      <div className="mb-3 flex flex-col gap-1">
        {snapshot.latestPredictions.slice(0, 3).map((prediction) => (
          <div key={prediction.id} className="rounded bg-ubos-midnight px-2 py-1">
            <div className="flex items-center justify-between text-[8px]">
              <span className="font-mono uppercase text-ubos-selection-text">{prediction.category.replace(/_/g, ' ')}</span>
              <span className="text-ubos-fg-disabled">{relativeTime(prediction.timestamp)} · {(prediction.confidence * 100).toFixed(0)}%</span>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-ubos-fg-secondary" title={prediction.message}>{prediction.message}</p>
          </div>
        ))}
        {snapshot.latestPredictions.length === 0 && (
          <p className="text-[10px] text-ubos-fg-muted">No forecasts yet</p>
        )}
      </div>

      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">Intelligence history</p>
      <div className="flex flex-col gap-0.5">
        {snapshot.latestEvents.slice(0, 4).map((event) => (
          <div key={`${event.id}-${event.timestamp}`} className="flex items-center gap-1.5 text-[9px]">
            <span className="shrink-0 rounded bg-ubos-carbon px-1 py-0.5 font-mono text-ubos-automation-text">{event.type}</span>
            <span className="truncate text-ubos-fg-muted">{event.source}</span>
            <span className="ml-auto shrink-0 text-ubos-fg-disabled">{relativeTime(event.timestamp)}</span>
          </div>
        ))}
        {snapshot.latestEvents.length === 0 && (
          <p className="text-[10px] text-ubos-fg-muted">Awaiting normalized events…</p>
        )}
      </div>
    </div>
  );
}
