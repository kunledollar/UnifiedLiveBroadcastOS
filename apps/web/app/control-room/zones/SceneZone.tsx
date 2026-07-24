'use client';
import type { ProductionState } from '@ubos/shared';

export function SceneZone({ state }: { state: ProductionState }) {
  return (
    <div className="scene-zone flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#0a1628]">
      <header className="flex items-center justify-between border-b border-[#1e3a5f] px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Scene</h3>
        <span className="text-[9px] text-[#334155]">{state.programSceneId ? '● Live' : '○ Idle'}</span>
      </header>

      {/* Scene Cards */}
      <section className="flex-1 overflow-y-auto p-2">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e3a5f]">Scene Cards</p>
        {state.programSceneId ? (
          <div className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-300">
            {state.programSceneId} <span className="ml-1 opacity-60">PROGRAM</span>
          </div>
        ) : (
          <p className="text-[10px] text-[#334155]">No scene active</p>
        )}
        {state.previewSceneId && (
          <div className="mt-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[10px] text-emerald-300">
            {state.previewSceneId} <span className="ml-1 opacity-60">PREVIEW</span>
          </div>
        )}
      </section>

      {/* Scene Timeline */}
      <section className="border-t border-[#1e3a5f] px-3 py-1.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-[#1e3a5f]">Scene Timeline</p>
        <div className="mt-1 h-1 rounded-full bg-[#1e3a5f]">
          <div className="h-full w-1/3 rounded-full bg-[#7c6af7]/50" />
        </div>
      </section>

      {/* Scene Graph */}
      <section className="border-t border-[#1e3a5f] px-3 py-1.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-[#1e3a5f]">Scene Graph</p>
        <p className="text-[10px] text-[#334155]">{state.connectedGuestCount} guest{state.connectedGuestCount !== 1 ? 's' : ''} connected</p>
      </section>
    </div>
  );
}
