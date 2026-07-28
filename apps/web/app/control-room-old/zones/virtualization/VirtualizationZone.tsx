'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { VirtualEnvironmentStatus } from '../../virtualization-engine/virtualizationEngine';

const statusColor: Record<VirtualEnvironmentStatus, string> = {
  running: 'bg-emerald-500/20 text-emerald-400',
  paused:  'bg-amber-500/20 text-amber-400',
  stopped: 'bg-[#1e2530] text-[#334155]',
};

export function VirtualizationZone({ state: _ }: { state: ProductionState }) {
  const [name, setName] = useState('Virtual Room');
  const [, forceRender] = useState(0);
  const engine = workspaceState.virtualizationEngine;
  const envs   = engine.listEnvironments();

  const handleCreate = () => {
    workspaceState.createVirtualWorkspace(name.trim() || 'Virtual Room');
    forceRender((n) => n + 1);
  };

  const handleDelete = (id: number) => {
    workspaceState.deleteVirtualWorkspace(id);
    forceRender((n) => n + 1);
  };

  const handleTogglePause = (id: number, status: VirtualEnvironmentStatus) => {
    if (status === 'running') engine.pauseEnvironment(id);
    else engine.resumeEnvironment(id);
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Virtual Environments
        </h4>
        <span className="text-[9px] text-[#334155]">
          {engine.runningEnvironmentCount}/{engine.environmentCount} running
        </span>
      </div>

      {/* Create input */}
      <div className="mb-2 flex gap-1.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Environment name"
          className="flex-1 rounded border border-[#1e2530] bg-[#0a1628] px-2 py-1.5 text-[10px] text-[#94a3b8] outline-none focus:border-[#7c6af7]/50"
        />
        <button
          type="button"
          onClick={handleCreate}
          className="shrink-0 rounded bg-[#7c6af7]/15 px-2.5 py-1.5 text-[9px] font-bold text-[#7c6af7] hover:bg-[#7c6af7]/25"
        >
          + Create
        </button>
      </div>

      {/* Environment list */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {envs.length === 0 ? (
          <p className="text-[10px] text-[#334155]">No virtual environments — create one above</p>
        ) : (
          [...envs].reverse().map((env) => (
            <div key={env.id} className="rounded border border-[#1e2530] bg-[#0d1117] p-2">
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${statusColor[env.status]}`}>
                  {env.status}
                </span>
                <span className="flex-1 truncate text-[10px] font-semibold text-[#94a3b8]">{env.name}</span>
              </div>
              <div className="mb-1.5 flex items-center justify-between text-[9px] text-[#334155]">
                <span>ID {env.id}</span>
                <span>{new Date(env.created).toLocaleTimeString()}</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleTogglePause(env.id, env.status)}
                  className="flex-1 rounded bg-[#0a1628] py-0.5 text-[8px] text-[#475569] hover:bg-amber-500/10 hover:text-amber-400"
                >
                  {env.status === 'running' ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(env.id)}
                  className="flex-1 rounded bg-[#0a1628] py-0.5 text-[8px] text-red-400/50 hover:bg-red-500/10 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
