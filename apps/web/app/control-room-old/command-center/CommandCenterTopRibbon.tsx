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
import type { CustomWorkspace, WorkspacePresetId } from '@ubos/shared';
import {
  workspaceDefinitionList,
  getWorkspaceDefinition,
  resolveWorkspaceStatus,
} from '@ubos/shared';
import { useState } from 'react';
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
  hasUserSavedLayout = false,
  layoutState = hasUserSavedLayout ? 'saved' : 'factory',
  customWorkspaces = [],
  activeCustomWorkspaceId = null,
  onDuplicateWorkspace,
  onApplyCustomWorkspace,
  onRenameCustomWorkspace,
  onDeleteCustomWorkspace,
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
  /** True when the active preset has an explicit user-saved layout. */
  hasUserSavedLayout?: boolean;
  layoutState?: 'factory' | 'saved' | 'unsaved';
  customWorkspaces?: CustomWorkspace[];
  activeCustomWorkspaceId?: string | null;
  onDuplicateWorkspace: () => void;
  onApplyCustomWorkspace: (id: string) => void;
  onRenameCustomWorkspace: (id: string, name: string) => boolean;
  onDeleteCustomWorkspace: (id: string) => void;
  isZoneCollapsed: (zoneId: CommandCenterZoneToggleId) => boolean;
  onSelectPreset: (presetId: WorkspacePresetId) => void;
  onToggleZone: (zoneId: CommandCenterZoneToggleId) => void;
  onToggleLayoutLock: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  className?: string;
}) {
  const activeWorkspace = getWorkspaceDefinition(activePresetId);
  const statusItems = resolveWorkspaceStatus(activeWorkspace).slice(0, 3);
  const [managerOpen, setManagerOpen] = useState(false);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center gap-1.5 overflow-x-hidden border-b border-ubos-border-subtle',
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
          Operational workspace
        </span>
        <span
          title={
            layoutLocked
              ? 'Layout locked — dragging and resizing disabled; workspace switching still available'
              : activeWorkspace.description
          }
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-ubos-sm px-2 py-0.5',
            'text-[10px] font-bold uppercase tracking-[0.08em]',
            'bg-ubos-selection-muted text-ubos-selection-text ring-1 ring-ubos-selection/40',
          )}
        >
          {activeWorkspace.name}
          {layoutLocked ? (
            <span className="text-[8px] opacity-70" aria-hidden="true">
              🔒
            </span>
          ) : null}
        </span>
        <span className="hidden text-[10px] text-ubos-fg-muted lg:inline">
          {activeWorkspace.role}
        </span>
        <span
          className="hidden items-center gap-1 xl:flex"
          role="status"
          aria-label="Workspace operational status"
        >
          {statusItems.map((status) => (
            <span
              key={status.label}
              className="rounded-full bg-ubos-graphite px-1.5 py-0.5 text-[9px] text-ubos-fg-muted"
              title={`${status.label}: ${status.value}`}
            >
              <span className="font-medium text-ubos-fg-secondary">{status.label}</span>:{' '}
              {status.value}
            </span>
          ))}
        </span>
        <span className="hidden text-[9px] text-ubos-fg-muted xl:inline">
          {layoutState === 'unsaved'
            ? 'Unsaved changes'
            : layoutState === 'saved'
              ? 'Saved layout'
              : 'Factory layout'}
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
              <span aria-hidden="true">{collapsed ? zone.collapsedIcon : zone.expandedIcon}</span>
            </button>
          );
        })}

        {/* Divider */}
        <span className="h-3 border-r border-ubos-border-subtle" aria-hidden="true" />

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

        {/* Save layout — explicit per-preset save (Ctrl+S) */}
        <button
          type="button"
          onClick={onSaveLayout}
          title={
            hasUserSavedLayout
              ? 'Save current layout for this workspace (previously saved)'
              : 'Save current layout for this workspace (Ctrl+S)'
          }
          aria-label={hasUserSavedLayout ? 'Save layout (previously saved)' : 'Save layout'}
          className={cn(
            'rounded-ubos-sm px-2 py-0.5',
            'text-[10px] font-medium',
            'transition-colors duration-[var(--ubos-duration-fast)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
            hasUserSavedLayout
              ? 'text-ubos-selection-text hover:bg-ubos-graphite'
              : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
          )}
        >
          {layoutState === 'unsaved' ? 'Save changes' : hasUserSavedLayout ? 'Saved ✓' : 'Save'}
        </button>

        <select
          value={activePresetId}
          onChange={(event) => onSelectPreset(event.target.value as WorkspacePresetId)}
          aria-label="Select operational workspace"
          title="Select operational workspace"
          className="hidden rounded-ubos-sm bg-ubos-graphite px-1.5 py-0.5 text-[10px] text-ubos-fg-secondary outline-none ring-1 ring-ubos-border-subtle lg:block"
        >
          {workspaceDefinitionList.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onDuplicateWorkspace}
          title="Create a custom workspace draft from this built-in workspace"
          className="hidden rounded-ubos-sm px-2 py-0.5 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary lg:block"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => setManagerOpen(true)}
          title="Manage workspace contracts and custom drafts"
          className="rounded-ubos-sm px-2 py-0.5 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary"
        >
          Manage
        </button>

        {/* Reset layout — restores factory defaults for the current preset.
            NOT disabled when locked — lock only restricts manual drag-resize. */}
        <button
          type="button"
          onClick={onResetLayout}
          title="Reset layout to factory defaults for this workspace (Ctrl+Shift+L)"
          aria-label="Reset layout to factory defaults"
          className={cn(
            'rounded-ubos-sm px-2 py-0.5',
            'text-[10px] font-medium',
            'transition-colors duration-[var(--ubos-duration-fast)]',
            'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
          )}
        >
          Reset
        </button>
      </div>
      {managerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Workspace manager"
          className="absolute right-2 top-9 z-50 w-[min(32rem,calc(100vw-1rem))] rounded-ubos-md border border-ubos-border-default bg-ubos-carbon p-4 shadow-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-ubos-selection-text">
                Workspace Manager
              </p>
              <p className="text-xs text-ubos-fg-muted">
                Built-ins are immutable operational contracts. Custom workspaces save presentation
                metadata only and never alter live production runtime state.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setManagerOpen(false)}
              className="text-xs text-ubos-fg-muted hover:text-white"
            >
              Close
            </button>
          </div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ubos-fg-muted">
            Built-in workspaces
          </p>
          <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto">
            {workspaceDefinitionList.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => {
                  onSelectPreset(workspace.id);
                  setManagerOpen(false);
                }}
                className="rounded-ubos-sm bg-ubos-graphite/70 p-2 text-left hover:bg-ubos-selection-muted"
              >
                <span className="block text-xs font-semibold">{workspace.name}</span>
                <span className="block text-[10px] text-ubos-fg-muted">{workspace.role}</span>
              </button>
            ))}
          </div>
          <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-wide text-ubos-fg-muted">
            Custom workspaces
          </p>
          {customWorkspaces.length ? (
            <div className="space-y-1">
              {customWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center gap-1 rounded-ubos-sm bg-ubos-graphite/50 px-2 py-1 text-xs text-ubos-fg-secondary"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onApplyCustomWorkspace(workspace.id);
                      setManagerOpen(false);
                    }}
                    aria-label={`Open ${workspace.name}`}
                    className="min-w-0 flex-1 truncate text-left hover:text-white"
                  >
                    {workspace.name}
                    {workspace.id === activeCustomWorkspaceId ? ' (active)' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const name = window.prompt('Workspace name', workspace.name);
                      if (name) onRenameCustomWorkspace(workspace.id, name);
                    }}
                    aria-label={`Rename ${workspace.name}`}
                    className="text-ubos-fg-muted hover:text-white"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete ${workspace.name}?`))
                        onDeleteCustomWorkspace(workspace.id);
                    }}
                    aria-label={`Delete ${workspace.name}`}
                    className="text-red-300 hover:text-red-100"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ubos-fg-muted">
              No custom workspaces yet. Duplicate a built-in workspace to create one.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
