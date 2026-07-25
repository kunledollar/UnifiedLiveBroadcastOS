'use client';
import type { Rect, ProductionState } from '@ubos/shared';

interface ZoneProps { rect: Rect; state: ProductionState; }

export function OutputZoneContainer({ rect, state }: ZoneProps) {
  return (
    <div
      data-zone="output"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      className="flex flex-col overflow-hidden border-l border-ubos-border-subtle bg-ubos-carbon p-3"
    >
      {/* Program Output = Program Red (irreversible/live). */}
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-program-text">Outputs</p>
      <p className="text-[11px] text-ubos-fg-secondary">{state.activeOutputCount} active destination{state.activeOutputCount !== 1 ? 's' : ''}</p>
    </div>
  );
}
