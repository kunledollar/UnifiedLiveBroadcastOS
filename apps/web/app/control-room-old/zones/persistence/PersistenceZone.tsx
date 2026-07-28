'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

export function PersistenceZone({ state: _ }: { state: ProductionState }) {
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<unknown>(null);
  const [, forceRender] = useState(0);

  const engine = workspaceState.persistenceEngine;

  const handleSave = () => {
    workspaceState.saveState();
    setLastSaved(new Date().toLocaleTimeString());
    setSnapshot(engine.snapshot('manual'));
    forceRender((n) => n + 1);
  };

  const handleLoad = () => {
    workspaceState.loadState();
    forceRender((n) => n + 1);
  };

  const handleRestore = () => {
    if (snapshot) {
      engine.restore(snapshot as Parameters<typeof engine.restore>[0]);
      forceRender((n) => n + 1);
    }
  };

  const history = engine.getSnapshotHistory();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      <h4 className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
        Persistence
      </h4>

      {/* Status */}
      <div className="mb-3 space-y-1 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Saved keys</span>
          <span className="text-[#94a3b8]">{engine.savedCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Snapshots</span>
          <span className="text-[#94a3b8]">{engine.snapshotCount}</span>
        </div>
        {lastSaved && (
          <div className="flex items-center justify-between">
            <span className="text-[#334155]">Last saved</span>
            <span className="text-emerald-400">{lastSaved}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded bg-[#7c6af7]/15 py-1.5 text-[9px] font-bold text-[#7c6af7] hover:bg-[#7c6af7]/25"
        >
          ↓ Save
        </button>
        <button
          type="button"
          onClick={handleLoad}
          className="flex-1 rounded bg-[#0a1628] py-1.5 text-[9px] text-[#475569] hover:bg-[#1e2530] hover:text-[#94a3b8]"
        >
          ↑ Load
        </button>
        <button
          type="button"
          onClick={handleRestore}
          disabled={!snapshot}
          className="flex-1 rounded bg-[#0a1628] py-1.5 text-[9px] text-[#475569] hover:bg-amber-500/10 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↺ Restore
        </button>
      </div>

      {/* Snapshot history */}
      {history.length > 0 && (
        <div className="flex flex-col gap-1 overflow-y-auto">
          <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">
            Snapshot History
          </p>
          {[...history].reverse().map((h, i) => (
            <div key={i} className="flex items-center gap-2 rounded bg-[#0d1117] px-2 py-1 text-[9px]">
              <span className="rounded bg-[#1e2530] px-1 py-0.5 text-[8px] uppercase text-[#475569]">{h.label}</span>
              <span className="flex-1 text-[#334155]">{new Date(h.createdAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Saved keys */}
      {engine.savedKeys.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {engine.savedKeys.map((key) => {
            const entry = engine.getEntry(key);
            return (
              <span key={key} className="rounded bg-[#0a1628] px-1.5 py-0.5 text-[8px] text-[#475569]">
                {key} v{entry?.version ?? 0}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
