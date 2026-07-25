'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

export function CloudZone({ state: _ }: { state: ProductionState }) {
  const [, forceRender] = useState(0);
  const engine = workspaceState.cloudEngine;
  const health = engine.getHealth();

  const handleUpload = () => {
    workspaceState.uploadToCloud();
    forceRender((n) => n + 1);
  };

  const handleDownload = () => {
    workspaceState.downloadFromCloud();
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Cloud
        </h4>
        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
          health.status === 'ok'      ? 'bg-emerald-500/15 text-emerald-400' :
          health.status === 'syncing' ? 'bg-amber-500/15 text-amber-400'    :
          'bg-red-500/15 text-red-400'
        }`}>
          {health.status}
        </span>
      </div>

      {/* Cloud health */}
      <div className="mb-3 space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Cloud size</span>
          <span className="text-[#94a3b8]">{formatBytes(health.cloudSize)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Keys stored</span>
          <span className="text-[#94a3b8]">{engine.keyCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Uploads</span>
          <span className="text-[#94a3b8]">{health.uploadCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#334155]">Downloads</span>
          <span className="text-[#94a3b8]">{health.downloadCount}</span>
        </div>
        {health.lastSync && (
          <div className="flex items-center justify-between">
            <span className="text-[#334155]">Last sync</span>
            <span className="text-emerald-400">{new Date(health.lastSync).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={handleUpload}
          className="flex-1 rounded bg-[#7c6af7]/15 py-1.5 text-[9px] font-bold text-[#7c6af7] hover:bg-[#7c6af7]/25"
        >
          ↑ Upload
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={engine.keyCount === 0}
          className="flex-1 rounded bg-[#0a1628] py-1.5 text-[9px] text-[#475569] hover:bg-[#1e2530] hover:text-[#94a3b8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↓ Download
        </button>
      </div>
    </div>
  );
}
