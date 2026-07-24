'use client';
import type { ProductionState } from '@ubos/shared';

export function InspectorZone({ state }: { state: ProductionState }) {
  return (
    <div className="inspector-zone flex h-full w-full flex-col overflow-hidden border-l border-[#1e2530] bg-[#080c12]">
      <header className="border-b border-[#1e2530] px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Inspector</h3>
      </header>

      {/* Scene Inspector */}
      <section className="border-b border-[#1e2530] p-3">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Scene Inspector</p>
        <p className="text-[10px] text-[#334155]">
          {state.programSceneId ? `Scene: ${state.programSceneId}` : 'No selection'}
        </p>
      </section>

      {/* Graph Inspector */}
      <section className="flex-1 border-b border-[#1e2530] p-3">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Graph Inspector</p>
        <p className="text-[10px] text-[#334155]">Production graph ready</p>
        <div className="mt-2 space-y-1">
          {['Sources', 'Scenes', 'Outputs'].map((node) => (
            <div key={node} className="flex items-center gap-2 rounded bg-[#0d1117] px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-[#475569]">{node}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI Crew Inspector */}
      {state.aiCrewActive && (
        <section className="p-3">
          <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#7c6af7]/50]">AI Crew Inspector</p>
          <p className="text-[10px] text-[#475569]">
            AI monitoring · Level: {state.aiAlertLevel ?? 'normal'}
          </p>
        </section>
      )}
    </div>
  );
}
