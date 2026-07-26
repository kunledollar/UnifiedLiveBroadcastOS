'use client';

import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

export function ReplayZone({ state: _ }: { state: ProductionState }) {
  const clips   = workspaceState.replayEngine.getClips();
  const markers = workspaceState.replayEngine.getMarkers();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-ubos-carbon p-3">
      <h4 className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">
        Replay Monitor
      </h4>

      {/* Replay Clips — Replay Orange = replay clips, markers, and camera angles. */}
      <section className="mb-4">
        <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">
          Clips ({clips.length})
        </p>
        {clips.length === 0 ? (
          <p className="text-[10px] text-ubos-fg-muted">No clips — use Camera Grid to create clips</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {clips.map((clip) => (
              <div key={clip.id} className="flex items-center gap-2 rounded border border-ubos-border-subtle bg-ubos-graphite px-2 py-1.5">
                <span className="rounded bg-ubos-replay-muted px-1 py-0.5 text-[8px] font-bold text-ubos-replay-text">
                  CAM {clip.cameraId}
                </span>
                <span className="flex-1 text-[10px] text-ubos-fg-secondary">
                  {clip.start}s → {clip.end}s
                </span>
                <span className="text-[9px] text-ubos-fg-muted">{clip.frames.length} frames</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Markers */}
      <section>
        <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-ubos-fg-disabled">
          Markers ({markers.length})
        </p>
        {markers.length === 0 ? (
          <p className="text-[10px] text-ubos-fg-muted">No markers — click Mark on a camera feed</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {markers.map((marker) => (
              <div key={marker.id} className="flex items-center gap-2 rounded border border-ubos-border-subtle bg-ubos-graphite px-2 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ubos-replay" />
                <span className="text-[10px] text-ubos-fg-secondary">
                  CAM {marker.cameraId}
                </span>
                <span className="text-[9px] text-ubos-fg-muted">
                  {new Date(marker.time).toLocaleTimeString()}
                </span>
                {marker.label && (
                  <span className="ml-auto text-[9px] text-ubos-replay-text">{marker.label}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
