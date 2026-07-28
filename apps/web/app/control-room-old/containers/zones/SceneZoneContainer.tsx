'use client';
import type { Rect, ProductionState } from '@ubos/shared';

interface ZoneProps {
  rect: Rect;
  state: ProductionState;
}

export function SceneZoneContainer({ rect, state }: ZoneProps) {
  return (
    <div
      data-zone="scene"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      className="flex overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#0a1628]"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[#475569]">
        <span className="text-xs font-bold uppercase tracking-widest">Scene Zone</span>
        <span className="text-[10px]">{state.programSceneId ?? 'No scene'}</span>
      </div>
    </div>
  );
}
