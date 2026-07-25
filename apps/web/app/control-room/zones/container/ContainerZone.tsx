'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { ContainerStatus } from '../../container-engine/containerEngine';

const statusColor: Record<ContainerStatus, string> = {
  running: 'bg-emerald-500/20 text-emerald-400',
  paused:  'bg-amber-500/20 text-amber-400',
  stopped: 'bg-[#1e2530] text-[#334155]',
  error:   'bg-red-500/20 text-red-400',
};

export function ContainerZone({ state: _ }: { state: ProductionState }) {
  const [name, setName] = useState('ubos-container');
  const [, forceRender] = useState(0);
  const engine     = workspaceState.containerEngine;
  const containers = engine.listContainers();

  const handleCreate = () => {
    workspaceState.createContainer(name.trim() || 'ubos-container');
    forceRender((n) => n + 1);
  };

  const handleStop = (id: number) => {
    workspaceState.stopContainer(id);
    forceRender((n) => n + 1);
  };

  const handleStart = (id: number) => {
    engine.startContainer(id);
    forceRender((n) => n + 1);
  };

  const handleDelete = (id: number) => {
    workspaceState.deleteContainer(id);
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Containers
        </h4>
        <span className="text-[9px] text-[#334155]">
          {engine.runningContainerCount}/{engine.containerCount} running
        </span>
      </div>

      {/* Create */}
      <div className="mb-2 flex gap-1.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Container name"
          className="flex-1 rounded border border-[#1e2530] bg-[#0a1628] px-2 py-1.5 font-mono text-[10px] text-[#94a3b8] outline-none focus:border-[#7c6af7]/50"
        />
        <button
          type="button"
          onClick={handleCreate}
          className="shrink-0 rounded bg-[#7c6af7]/15 px-2.5 py-1.5 text-[9px] font-bold text-[#7c6af7] hover:bg-[#7c6af7]/25"
        >
          Run
        </button>
      </div>

      {/* Container list */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {containers.length === 0 ? (
          <p className="text-[10px] text-[#334155]">No containers running</p>
        ) : (
          [...containers].reverse().map((c) => (
            <div key={c.id} className="rounded border border-[#1e2530] bg-[#0d1117] p-2">
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${statusColor[c.status]}`}>
                  {c.status}
                </span>
                <span className="flex-1 truncate font-mono text-[10px] text-[#94a3b8]">{c.name}</span>
              </div>
              <div className="mb-1 flex items-center justify-between text-[8px] text-[#334155]">
                <span>ID {c.id}</span>
                <span>{new Date(c.created).toLocaleTimeString()}</span>
              </div>
              <div className="flex gap-1">
                {c.status === 'running' ? (
                  <button
                    type="button"
                    onClick={() => handleStop(c.id)}
                    className="flex-1 rounded bg-[#0a1628] py-0.5 text-[8px] text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStart(c.id)}
                    className="flex-1 rounded bg-[#0a1628] py-0.5 text-[8px] text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400"
                  >
                    Start
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
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
