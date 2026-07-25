'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { ClusterStatus } from '../../federation-engine/federationEngine';

const statusColor: Record<ClusterStatus, string> = {
  online:   'bg-emerald-500/20 text-emerald-400',
  degraded: 'bg-amber-500/20 text-amber-400',
  offline:  'bg-[#1e2530] text-[#334155]',
};

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'sa-east-1'];

export function FederationZone({ state: _ }: { state: ProductionState }) {
  const [name,   setName]   = useState('new-cluster');
  const [region, setRegion] = useState('us-east-1');
  const [, forceRender] = useState(0);

  const engine   = workspaceState.federationEngine;
  const clusters = engine.getClusters();
  const links    = engine.getLinks();
  const health   = engine.getFederationHealth();

  const handleRegister = () => {
    workspaceState.registerCluster({
      id:         `cluster-${Date.now()}`,
      name:       name.trim() || 'new-cluster',
      region,
      containers: [],
    });
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Federation</h4>
        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
          health.status === 'stable'   ? 'bg-emerald-500/15 text-emerald-400' :
          health.status === 'degraded' ? 'bg-amber-500/15 text-amber-400'    :
          'bg-red-500/15 text-red-400'
        }`}>
          {health.status}
        </span>
      </div>

      {/* Health summary */}
      <div className="mb-3 flex gap-3 text-[9px]">
        <span className="text-[#94a3b8]">{health.onlineClusters}/{health.clusters} clusters</span>
        <span className="text-[#334155]">{health.links} link{health.links !== 1 ? 's' : ''}</span>
      </div>

      {/* Register cluster form */}
      <div className="mb-2 flex gap-1.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cluster-name"
          className="flex-1 rounded border border-[#1e2530] bg-[#0a1628] px-2 py-1.5 font-mono text-[10px] text-[#94a3b8] outline-none"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded border border-[#1e2530] bg-[#0a1628] px-1.5 py-1.5 text-[9px] text-[#475569] outline-none"
        >
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          type="button"
          onClick={handleRegister}
          className="shrink-0 rounded bg-[#7c6af7]/15 px-2 py-1.5 text-[9px] font-bold text-[#7c6af7] hover:bg-[#7c6af7]/25"
        >
          Register
        </button>
      </div>

      {/* Clusters */}
      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Clusters</p>
      <div className="mb-3 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '160px' }}>
        {clusters.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded border border-[#1e2530] bg-[#0d1117] px-2 py-1.5">
            <span className={`rounded px-1 py-0.5 text-[8px] font-bold uppercase ${statusColor[c.status]}`}>
              {c.status}
            </span>
            <span className="flex-1 truncate font-mono text-[10px] text-[#94a3b8]">{c.name}</span>
            <span className="shrink-0 text-[9px] text-[#334155]">{c.region}</span>
          </div>
        ))}
        {clusters.length === 0 && <p className="text-[10px] text-[#334155]">No clusters registered</p>}
      </div>

      {/* Links */}
      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Links</p>
      <div className="flex flex-col gap-1 overflow-y-auto">
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded bg-[#0d1117] px-2 py-1 text-[9px]">
            <span className="font-mono text-[#94a3b8]">{String(l.from)}</span>
            <span className="text-[#334155]">→</span>
            <span className="font-mono text-[#94a3b8]">{String(l.to)}</span>
            {l.latencyMs !== undefined && (
              <span className="ml-auto text-[8px] text-[#475569]">{l.latencyMs} ms</span>
            )}
          </div>
        ))}
        {links.length === 0 && <p className="text-[10px] text-[#334155]">No cluster links</p>}
      </div>
    </div>
  );
}
