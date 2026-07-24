'use client';
import type { ProductionState } from '@ubos/shared';

export function TriadZone({ state }: { state: ProductionState }) {
  return (
    <div className="triad-zone flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#080c12]">
      <header className="flex items-center justify-between border-b border-[#1e3a5f] px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Triad</h3>
        {state.isLive && (
          <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-400">Live</span>
        )}
      </header>

      <div className="flex min-h-0 flex-1 gap-1 p-1">
        {/* Preview */}
        <div className="flex flex-1 flex-col overflow-hidden rounded border border-emerald-500/30 bg-black">
          <div className="bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-emerald-400">Preview</div>
          <div className="flex flex-1 items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[#334155]">
            {state.previewSceneId ?? 'PREVIEW'}
          </div>
        </div>

        {/* Program */}
        <div className="flex flex-1 flex-col overflow-hidden rounded border border-red-500/40 bg-black">
          <div className="bg-red-500/15 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-red-400">Program</div>
          <div className="flex flex-1 items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[#475569]">
            {state.programSceneId ?? 'PROGRAM'}
          </div>
        </div>
      </div>

      {/* Scene info strip */}
      <footer className="border-t border-[#1e3a5f] px-3 py-1 text-[9px] text-[#334155]">
        Scene · {state.activeOutputCount} output{state.activeOutputCount !== 1 ? 's' : ''}
      </footer>
    </div>
  );
}
