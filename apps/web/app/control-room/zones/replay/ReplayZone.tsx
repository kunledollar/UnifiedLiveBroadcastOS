'use client';

import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

export function ReplayZone({ state: _ }: { state: ProductionState }) {
  const clips   = workspaceState.replayEngine.getClips();
  const markers = workspaceState.replayEngine.getMarkers();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      <h4 className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
        Replay Monitor
      </h4>

      {/* Replay Clips */}
      <section className="mb-4">
        <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">
          Clips ({clips.length})
        </p>
        {clips.length === 0 ? (
          <p className="text-[10px] text-[#334155]">No clips — use Camera Grid to create clips</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {clips.map((clip) => (
              <div key={clip.id} className="flex items-center gap-2 rounded border border-[#1e2530] bg-[#0d1117] px-2 py-1.5">
                <span className="rounded bg-[#7c6af7]/20 px-1 py-0.5 text-[8px] font-bold text-[#7c6af7]">
                  CAM {clip.cameraId}
                </span>
                <span className="flex-1 text-[10px] text-[#94a3b8]">
                  {clip.start}s → {clip.end}s
                </span>
                <span className="text-[9px] text-[#334155]">{clip.frames.length} frames</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Markers */}
      <section>
        <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">
          Markers ({markers.length})
        </p>
        {markers.length === 0 ? (
          <p className="text-[10px] text-[#334155]">No markers — click Mark on a camera feed</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {markers.map((marker) => (
              <div key={marker.id} className="flex items-center gap-2 rounded border border-[#1e2530] bg-[#0d1117] px-2 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] text-[#94a3b8]">
                  CAM {marker.cameraId}
                </span>
                <span className="text-[9px] text-[#334155]">
                  {new Date(marker.time).toLocaleTimeString()}
                </span>
                {marker.label && (
                  <span className="ml-auto text-[9px] text-[#7c6af7]">{marker.label}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
