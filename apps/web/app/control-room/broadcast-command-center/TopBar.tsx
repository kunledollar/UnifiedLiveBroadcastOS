'use client';

import type { ReactNode } from 'react';
import type { WorkspacePresetId } from '../workspace-canvas/types';
import { workspacePresetList } from '../workspace-canvas/presets';
import { cn } from '@ubos/ui';

export function TopBar({
  statusBar,
  activePresetId,
  onSelectPreset,
  onSaveLayout,
  onResetLayout,
  toolsSlot,
  className,
}: {
  statusBar: ReactNode;
  activePresetId: WorkspacePresetId;
  onSelectPreset: (id: WorkspacePresetId) => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  toolsSlot?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex shrink-0 flex-col border-b border-ubos-border-subtle bg-[#020408]',
        className,
      )}
    >
      {statusBar}

      <div className="flex items-center gap-2 border-t border-white/4 bg-[#03060d] px-ubos-3 py-1">
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-ubos-fg-muted">
          Command Center
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {workspacePresetList.map((preset) => {
            const active = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.description}
                onClick={() => onSelectPreset(preset.id)}
                className={cn(
                  'rounded-ubos-sm px-2 py-0.5 text-[11px] font-bold transition-colors',
                  active
                    ? 'bg-ubos-selection-muted text-ubos-selection-text ring-1 ring-ubos-selection/50'
                    : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
                )}
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
            className="rounded-ubos-sm px-2 py-0.5 text-[11px] text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary"
          >
            Save Layout
          </button>
          <button
            type="button"
            onClick={onResetLayout}
            className="rounded-ubos-sm px-2 py-0.5 text-[11px] text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary"
          >
            Reset
          </button>
          {toolsSlot}
        </div>
      </div>
    </header>
  );
}
