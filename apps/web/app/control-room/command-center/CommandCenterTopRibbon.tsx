'use client';

/**
 * UBOS 3.15D — Command Center top ribbon.
 *
 * Shows a compact active-workspace chip (single source of truth for the
 * current preset) plus zone collapse / layout lock quick controls. The full
 * workspace preset list is in the Workspace menu (CommandCenterTopMenu) —
 * the duplicate preset-pill bar has been removed per 3.15D requirements.
 *
 * Workspace Manager owns the active preset; this ribbon only reflects and
 * triggers zone-level geometry changes.
 */
import { cn } from '@ubos/ui';
import type { WorkspacePresetId } from '@ubos/shared';
import { workspacePresetList } from '@ubos/shared';
import type { CommandCenterZoneToggleId } from './useCommandCenterWorkspace';

const zoneToggles: Array<{
  id: CommandCenterZoneToggleId;
  label: string;
  collapsedIcon: string;
  expandedIcon: string;
}> = [
  { id: 'left-dock', label: 'Left dock', collapsedIcon: '◧', expandedIcon: '◧' },
  { id: 'bottom-workspace', label: 'Bottom workspace', collapsedIcon: '◒', expandedIcon: '◒' },
  { id: 'right-dock', label: 'Right dock', collapsedIcon: '◨', expandedIcon: '◨' },
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
  const activePreset = workspacePresetList.find((p) => p.id === activePresetId);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1.5 overflow-x-hidden border-b border-ubos-border-subtle',
        'bg-ubos-carbon px-2 py-1',
        className,
      )}
      role="toolbar"
      aria-label="Active workspace and dock controls"
    >
      {/* ── Active workspace chip ────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-1"
        role="status"
        aria-label="Current workspace"
      >
        <span
          className="hidden shrink-0 text-[9px] font-black uppercase tracking-[0.2em] text-ubos-fg-muted/60 md:inline"
          aria-hidden="true"
        >
          Workspace
        </span>
        <span
          title={
            layoutLocked
              ? 'Layout locked — use Workspace menu to switch'
              : (activePreset?.description ?? activePresetId)
          }
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-ubos-sm px-2 py-0.5',
            'text-[10px] font-bold uppercase tracking-[0.08em]',
            'bg-ubos-selection-muted text-ubos-selection-text ring-1 ring-ubos-selection/40',
          )}
        >
          {activePreset?.name ?? activePresetId}
          {layoutLocked ? (
            <span className="text-[8px] opacity-70" aria-hidden="true">
              🔒
            </span>
          ) : null}
        </span>
      </div>

      {/* ── Right controls ───────────────────────────────────────── */}
      <div
        className="ml-auto flex shrink-0 items-center gap-0.5 border-l border-ubos-border-subtle pl-2"
        role="group"
        aria-label="Zone and layout controls"
      >
        {/* Zone collapse toggles */}
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
              aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${zone.label}`}
              className={cn(
                'rounded-ubos-sm px-1.5 py-0.5 text-xs',
                'transition-colors duration-[var(--ubos-duration-fast)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
                layoutLocked && 'cursor-not-allowed opacity-40',
                collapsed
                  ? 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary'
                  : 'bg-ubos-selection-muted/50 text-ubos-selection-text',
              )}
            >
              <span aria-hidden="true">
                {collapsed ? zone.collapsedIcon : zone.expandedIcon}
              </span>
            </button>
          );
        })}

        {/* Divider */}
        <span
          className="h-3 border-r border-ubos-border-subtle"
          aria-hidden="true"
        />

        {/* Layout lock */}
        <button
          type="button"
          onClick={onToggleLayoutLock}
          aria-pressed={layoutLocked}
          title={layoutLocked ? 'Unlock layout to make changes' : 'Lock layout to prevent changes'}
          className={cn(
            'rounded-ubos-sm px-2 py-0.5',
            'text-[10px] font-bold uppercase tracking-[0.08em]',
            'transition-colors duration-[var(--ubos-duration-fast)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
            layoutLocked
              ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
              : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
          )}
        >
          {layoutLocked ? 'Locked' : 'Lock'}
        </button>

        {/* Save layout */}
        <button
          type="button"
          onClick={onSaveLayout}
          title="Save current layout to browser storage"
          className={cn(
            'rounded-ubos-sm px-2 py-0.5',
            'text-[10px] font-medium',
            'transition-colors duration-[var(--ubos-duration-fast)]',
            'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
          )}
        >
          Save
        </button>

        {/* Reset layout */}
        <button
          type="button"
          onClick={onResetLayout}
          disabled={layoutLocked}
          title={layoutLocked ? 'Unlock layout to reset' : 'Reset layout to defaults'}
          className={cn(
            'rounded-ubos-sm px-2 py-0.5',
            'text-[10px] font-medium',
            'transition-colors duration-[var(--ubos-duration-fast)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
            layoutLocked
              ? 'cursor-not-allowed text-ubos-fg-muted opacity-40'
              : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
          )}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
