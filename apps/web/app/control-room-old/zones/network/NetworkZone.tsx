'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

export function NetworkZone({ state: _ }: { state: ProductionState }) {
  const [url, setUrl] = useState('ws://localhost:8080/ubos');
  const [, forceRender] = useState(0);
  const engine = workspaceState.networkEngine;
  const health = engine.getHealth();

  const handleConnect = () => {
    workspaceState.connectNetwork(url);
    setTimeout(() => forceRender((n) => n + 1), 200);
  };

  const handleDisconnect = () => {
    workspaceState.disconnectNetwork();
    forceRender((n) => n + 1);
  };

  const handleBroadcast = () => {
    workspaceState.broadcastState();
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Network
        </h4>
        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
          health.connected
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-[#1e2530] text-[#334155]'
        }`}>
          {health.connected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Health metrics */}
      <div className="mb-3 space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Latency</span>
          <span className={health.latency > 100 ? 'text-amber-400' : 'text-emerald-400'}>
            {health.connected ? `${health.latency.toFixed(0)} ms` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Last sync</span>
          <span className="text-[#94a3b8]">
            {health.lastSync ? new Date(health.lastSync).toLocaleTimeString() : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Reconnects</span>
          <span className={health.reconnectCount > 0 ? 'text-amber-400' : 'text-[#334155]'}>
            {health.reconnectCount}
          </span>
        </div>
        {health.url && (
          <div className="flex items-center justify-between">
            <span className="text-[#334155]">Endpoint</span>
            <span className="max-w-[160px] truncate text-[#475569]">{health.url}</span>
          </div>
        )}
      </div>

      {/* URL input */}
      <div className="mb-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ws://host:port/ubos"
          className="w-full rounded border border-[#1e2530] bg-[#0a1628] px-2 py-1.5 text-[10px] text-[#94a3b8] outline-none focus:border-[#7c6af7]/50"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        {!health.connected ? (
          <button
            type="button"
            onClick={handleConnect}
            className="flex-1 rounded bg-emerald-500/15 py-1.5 text-[9px] font-bold text-emerald-400 hover:bg-emerald-500/25"
          >
            Connect
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleBroadcast}
              className="flex-1 rounded bg-[#7c6af7]/15 py-1.5 text-[9px] font-bold text-[#7c6af7] hover:bg-[#7c6af7]/25"
            >
              Broadcast
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex-1 rounded bg-red-500/10 py-1.5 text-[9px] font-medium text-red-400 hover:bg-red-500/20"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
