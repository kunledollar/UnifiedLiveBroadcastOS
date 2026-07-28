'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

export function SecurityZone({ state: _ }: { state: ProductionState }) {
  const [showDenied, setShowDenied] = useState(false);
  const engine   = workspaceState.securityEngine;
  const log      = showDenied ? engine.getDeniedEntries() : engine.getLog();
  const roles    = engine.getRoles();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Security Log
        </h4>
        <div className="flex items-center gap-2 text-[9px] text-[#334155]">
          <span>{engine.logCount} entries</span>
          {engine.deniedCount > 0 && (
            <span className="text-red-400">{engine.deniedCount} denied</span>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => setShowDenied(false)}
          className={`flex-1 rounded py-1 text-[9px] font-medium ${!showDenied ? 'bg-[#7c6af7]/15 text-[#7c6af7]' : 'bg-[#0a1628] text-[#334155]'}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setShowDenied(true)}
          className={`flex-1 rounded py-1 text-[9px] font-medium ${showDenied ? 'bg-red-500/15 text-red-400' : 'bg-[#0a1628] text-[#334155]'}`}
        >
          Denied
        </button>
      </div>

      {/* Log entries */}
      <div className="mb-4 flex flex-1 flex-col gap-1 overflow-y-auto">
        {[...log].reverse().map((entry) => (
          <div
            key={entry.id}
            className={`flex items-center gap-2 rounded px-2 py-1 text-[9px] ${
              entry.allowed ? 'bg-[#0d1117]' : 'border border-red-500/20 bg-red-500/5'
            }`}
          >
            <span className={`shrink-0 ${entry.allowed ? 'text-emerald-400' : 'text-red-400'}`}>
              {entry.allowed ? '✓' : '✗'}
            </span>
            <span className="truncate text-[#94a3b8]">{entry.user}</span>
            <span className="shrink-0 rounded bg-[#1e2530] px-1 text-[8px] text-[#475569]">{entry.role}</span>
            <span className="flex-1 truncate text-[#475569]">{entry.permission}</span>
            <span className="shrink-0 text-[8px] text-[#1e2530]">
              {new Date(entry.time).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {log.length === 0 && (
          <p className="text-[10px] text-[#334155]">No security events yet</p>
        )}
      </div>

      {/* Role matrix summary */}
      <div className="shrink-0 border-t border-[#1e2530] pt-2">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Role Matrix</p>
        <div className="flex flex-col gap-0.5">
          {Object.entries(roles).slice(0, 5).map(([role, perms]) => (
            <div key={role} className="flex items-center gap-1 text-[8px]">
              <span className="w-28 shrink-0 text-[#475569] capitalize">{role}</span>
              <span className="flex-1 truncate text-[#334155]">
                {perms.join(', ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
