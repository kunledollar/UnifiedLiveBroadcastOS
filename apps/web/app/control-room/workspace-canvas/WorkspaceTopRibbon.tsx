'use client';

import type { ReactNode } from 'react';
import type { WorkspacePresetId } from './types';
import { workspacePresetList } from './presets';

export function WorkspaceTopRibbon({
  activePresetId,
  onSelectPreset,
  onSaveLayout,
  onResetLayout,
  toolsSlot,
}: {
  activePresetId: WorkspacePresetId;
  onSelectPreset: (id: WorkspacePresetId) => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  toolsSlot?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-white/6 bg-[#04060c] px-3 py-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Layout</span>
      <div className="flex flex-wrap items-center gap-1">
        {workspacePresetList.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              title={preset.description}
              onClick={() => onSelectPreset(preset.id)}
              className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                active
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onSaveLayout}
          className="rounded px-2 py-1 text-xs text-slate-400 opacity-0 transition-opacity hover:bg-white/5 hover:text-slate-200 group-hover:opacity-100 focus:opacity-100"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onResetLayout}
          className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300"
        >
          Reset
        </button>
        {toolsSlot}
      </div>
    </div>
  );
}
