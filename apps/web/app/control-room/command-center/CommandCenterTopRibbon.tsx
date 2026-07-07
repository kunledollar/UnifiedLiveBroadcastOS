'use client';

/**
 * UBOS 3.15B — Command Center top ribbon.
 *
 * Visible workspace preset selector plus dock collapse / layout lock quick
 * controls. Operates on Workspace Manager layout metadata only.
 */
import { cn } from '@ubos/ui';
import type { WorkspacePresetId } from '@ubos/shared';
import { workspacePresetList } from '@ubos/shared';
import type { CommandCenterZoneToggleId } from './useCommandCenterWorkspace';

const zoneToggles: Array<{ id: CommandCenterZoneToggleId; label: string; icon: string }> = [
  { id: 'left-dock', label: 'Left dock', icon: '◧' },
  { id: 'bottom-workspace', label: 'Bottom workspace', icon: '◒' },
  { id: 'right-dock', label: 'Right dock', icon: '◨' },
];

export function CommandCenterTopRibbon({
  activePresetId,
  layoutLocked,
  isZoneCollapsed,
  onSelectPreset,
  onToggleZone,
  onToggleLayoutLock,
  onSaveLayout,
  onResetLayout,
  className,
}: {
  activePresetId: WorkspacePresetId;
  layoutLocked: boolean;
  isZoneCollapsed: (zoneId: CommandCenterZoneToggleId) => boolean;
  onSelectPreset: (presetId: WorkspacePresetId) => void;
  onToggleZone: (zoneId: CommandCenterZoneToggleId) => void;
  onToggleLayoutLock: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1 overflow-x-auto border-b border-ubos-border-subtle bg-ubos-carbon px-2 py-1',
        className,
      )}
      role="toolbar"
      aria-label="Workspace presets and dock controls"
    >
      <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-ubos-fg-muted md:inline">
        Workspace
      </span>
      <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
        {workspacePresetList.map((preset) => {
          const active = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              title={layoutLocked ? 'Unlock layout to switch workspace' : preset.description}
              disabled={layoutLocked}
              onClick={() => onSelectPreset(preset.id)}
              aria-pressed={active}
              className={cn(
                'shrink-0 rounded-ubos-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors',
                layoutLocked && 'cursor-not-allowed opacity-50',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text ring-1 ring-ubos-selection/40'
                  : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
              )}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5 border-l border-ubos-border-subtle pl-2">
        {zoneToggles.map((zone) => {
          const collapsed = isZoneCollapsed(zone.id);
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onToggleZone(zone.id)}
              disabled={layoutLocked}
              title={`${collapsed ? 'Expand' : 'Collapse'} ${zone.label.toLowerCase()}`}
              aria-pressed={!collapsed}
              className={cn(
                'rounded-ubos-sm px-1.5 py-0.5 text-xs transition-colors',
                layoutLocked && 'cursor-not-allowed opacity-50',
                collapsed
                  ? 'text-ubos-fg-muted hover:bg-ubos-graphite'
                  : 'bg-ubos-selection-muted/60 text-ubos-selection-text',
              )}
            >
              <span aria-hidden="true">{zone.icon}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onToggleLayoutLock}
          aria-pressed={layoutLocked}
          className={cn(
            'rounded-ubos-sm px-2 py-0.5 text-[10px] font-medium transition-colors',
            layoutLocked
              ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
              : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
          )}
        >
          {layoutLocked ? 'Locked' : 'Lock'}
        </button>
        <button
          type="button"
          onClick={onSaveLayout}
          className="rounded-ubos-sm px-2 py-0.5 text-[10px] font-medium text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onResetLayout}
          disabled={layoutLocked}
          className={cn(
            'rounded-ubos-sm px-2 py-0.5 text-[10px] font-medium transition-colors',
            layoutLocked
              ? 'cursor-not-allowed text-ubos-fg-muted opacity-50'
              : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
          )}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
