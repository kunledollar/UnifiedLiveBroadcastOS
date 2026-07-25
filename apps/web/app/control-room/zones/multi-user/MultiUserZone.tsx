'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { ActivityType } from '../../multi-user-engine/multiUserEngine';

const activityIcon: Record<ActivityType, string> = {
  join:      '→',
  leave:     '←',
  workspace: '⇄',
  action:    '·',
  scene:     '▦',
  graphics:  '◈',
  routing:   '⇪',
  audio:     '♫',
};

export function MultiUserZone({ state: _ }: { state: ProductionState }) {
  const [, forceRender] = useState(0);
  const engine   = workspaceState.multiUserEngine;
  const users    = engine.getUsers();
  const activity = engine.getActivity();

  const handleRemove = (id: string) => {
    workspaceState.removeOperator(id);
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Operators
        </h4>
        <span className="text-[9px] text-[#334155]">{engine.userCount} active</span>
      </div>

      {/* Operator list */}
      <div className="mb-4 flex flex-col gap-1.5">
        {users.length === 0 ? (
          <p className="text-[10px] text-[#334155]">No operators connected</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center gap-2 rounded border border-[#1e2530] bg-[#0d1117] px-2 py-1.5">
              {/* Avatar */}
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-black"
                style={{ backgroundColor: u.color ?? '#7c6af7' }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-[#94a3b8]">{u.name}</p>
                <p className="text-[8px] text-[#334155]">{u.role} · {u.workspace}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(u.id)}
                className="shrink-0 text-[8px] text-red-400/40 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Activity feed */}
      <div className="flex-1 overflow-y-auto">
        <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">
          Activity Feed
        </p>
        {[...activity].reverse().map((a) => (
          <div key={a.id} className="flex items-start gap-1.5 py-0.5 text-[9px]">
            <span className="mt-0.5 shrink-0 text-[#334155]">{activityIcon[a.type] ?? '·'}</span>
            <span className="flex-1 text-[#475569]">{a.message}</span>
            <span className="shrink-0 text-[8px] text-[#1e2530]">
              {new Date(a.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {activity.length === 0 && (
          <p className="text-[10px] text-[#334155]">No activity yet</p>
        )}
      </div>
    </div>
  );
}
