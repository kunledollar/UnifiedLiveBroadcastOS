'use client';

/**
 * UBOS 3.15B — Command Center menu bar.
 *
 * Professional application menu. Items connect to EXISTING actions where the
 * Control Room already exposes them (workspace presets, dock toggles, layout
 * persistence, transitions, demo tooling, sub-routes); everything else is a
 * clearly disabled placeholder. No production state is fabricated here.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@ubos/ui';
import type { WorkspacePanelDefinition, WorkspacePresetId } from '@ubos/shared';
import { workspacePresetList } from '@ubos/shared';
import type { DockTabId, NavItemId, SourceDockTabId } from '../shell/types';

type MenuItem = {
  label: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  divider?: boolean;
};

type MenuDefinition = {
  id: string;
  label: string;
  items: MenuItem[];
};

function MenuDropdown({
  menu,
  open,
  onOpen,
  onClose,
}: {
  menu: MenuDefinition;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        className={cn(
          'rounded-ubos-sm px-2 py-1 text-xs font-medium transition-colors',
          open
            ? 'bg-ubos-selection-muted text-ubos-selection-text'
            : 'text-ubos-fg-secondary hover:bg-ubos-midnight hover:text-ubos-fg-primary',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {menu.label}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-0.5 max-h-[min(60vh,26rem)] min-w-52 overflow-y-auto rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon py-1 shadow-ubos-raised ubos-scroll"
        >
          {menu.items.map((item, index) => {
            if (item.divider) {
              return (
                <div key={`divider-${index}`} className="my-1 border-t border-ubos-border-subtle" />
              );
            }
            const content = (
              <>
                <span className="flex items-center gap-2">
                  {item.checked !== undefined ? (
                    <span className="w-3 text-center text-ubos-selection-text" aria-hidden="true">
                      {item.checked ? '✓' : ''}
                    </span>
                  ) : (
                    <span className="w-3" aria-hidden="true" />
                  )}
                  {item.label}
                </span>
                {item.shortcut ? (
                  <span className="ml-4 font-mono text-[10px] text-ubos-fg-muted">
                    {item.shortcut}
                  </span>
                ) : null}
              </>
            );
            if (item.href && !item.disabled) {
              return (
                <a
                  key={`${item.label}-${index}`}
                  href={item.href}
                  role="menuitem"
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-ubos-caption text-ubos-fg-secondary hover:bg-ubos-midnight"
                  onClick={onClose}
                >
                  {content}
                </a>
              );
            }
            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  onClose();
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-1.5 text-left text-ubos-caption transition-colors',
                  item.disabled
                    ? 'cursor-not-allowed text-ubos-fg-muted'
                    : 'text-ubos-fg-secondary hover:bg-ubos-midnight',
                )}
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export type CommandCenterTopMenuProps = {
  activePresetId: WorkspacePresetId;
  layoutLocked: boolean;
  safeAreasVisible: boolean;
  dockPanels: WorkspacePanelDefinition[];
  isPanelVisible: (panelId: string) => boolean;
  onSelectPreset: (presetId: WorkspacePresetId) => void;
  onTogglePanel: (panelId: string) => void;
  onResetLayout: () => void;
  onToggleLayoutLock: () => void;
  onSaveLayout: () => void;
  onFullscreenProgram: () => void;
  onFullscreenPreview: () => void;
  onToggleSafeAreas: () => void;
  onActivateBottomTab: (tab: DockTabId) => void;
  onActivateSourceTab: (tab: SourceDockTabId) => void;
  onActivateOperationsPanel: (panelId: string) => void;
  onNavChange: (nav: NavItemId) => void;
  onCut?: (() => void) | undefined;
  onTake?: (() => void) | undefined;
  onAuto?: (() => void) | undefined;
  onSaveWorkspace?: (() => void) | undefined;
  onRestoreWorkspace?: (() => void) | undefined;
  onResetWorkspace?: (() => void) | undefined;
  onSeedDemo?: (() => void) | undefined;
  onSimulateDemo?: (() => void) | undefined;
  onResetDemo?: (() => void) | undefined;
  className?: string;
};

export function CommandCenterTopMenu({
  activePresetId,
  layoutLocked,
  safeAreasVisible,
  dockPanels,
  isPanelVisible,
  onSelectPreset,
  onTogglePanel,
  onResetLayout,
  onToggleLayoutLock,
  onSaveLayout,
  onFullscreenProgram,
  onFullscreenPreview,
  onToggleSafeAreas,
  onActivateBottomTab,
  onActivateSourceTab,
  onActivateOperationsPanel,
  onNavChange,
  onCut,
  onTake,
  onAuto,
  onSaveWorkspace,
  onRestoreWorkspace,
  onResetWorkspace,
  onSeedDemo,
  onSimulateDemo,
  onResetDemo,
  className,
}: CommandCenterTopMenuProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpenMenuId(null), []);
  const openMenu = useCallback((id: string) => setOpenMenuId(id), []);

  const workspaceItems: MenuItem[] = workspacePresetList.map((preset) => ({
    label: preset.name,
    checked: activePresetId === preset.id,
    disabled: layoutLocked,
    onClick: () => onSelectPreset(preset.id),
  }));

  const dockItems: MenuItem[] = dockPanels.map((panel) => ({
    label: panel.title,
    checked: isPanelVisible(panel.id),
    disabled: layoutLocked || !panel.closable,
    onClick: () => onTogglePanel(panel.id),
  }));

  const menus: MenuDefinition[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Scene Collection…', disabled: true },
        { label: 'Open Scene Collection…', disabled: true },
        { label: 'Import Media…', disabled: true },
        { label: 'Export Production State…', disabled: true },
        { divider: true, label: '' },
        { label: 'Save Layout', onClick: onSaveLayout },
        ...(onSaveWorkspace ? [{ label: 'Save Workspace', onClick: onSaveWorkspace }] : []),
        ...(onRestoreWorkspace ? [{ label: 'Restore Workspace', onClick: onRestoreWorkspace }] : []),
        ...(onResetWorkspace ? [{ label: 'Reset Workspace', onClick: onResetWorkspace }] : []),
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', disabled: true },
        { label: 'Redo', shortcut: 'Ctrl+Y', disabled: true },
        { divider: true, label: '' },
        { label: 'Cut', shortcut: 'Ctrl+X', disabled: true },
        { label: 'Copy', shortcut: 'Ctrl+C', disabled: true },
        { label: 'Paste', shortcut: 'Ctrl+V', disabled: true },
        { divider: true, label: '' },
        { label: 'Preferences…', href: '/control-room/settings' },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Reset Layout', onClick: onResetLayout, disabled: layoutLocked },
        { label: 'Lock Layout', checked: layoutLocked, onClick: onToggleLayoutLock },
        { label: 'Save Layout', onClick: onSaveLayout },
        { divider: true, label: '' },
        { label: 'Fullscreen Program', onClick: onFullscreenProgram },
        { label: 'Fullscreen Preview', onClick: onFullscreenPreview },
        { divider: true, label: '' },
        { label: 'Toggle Safe Areas', checked: safeAreasVisible, onClick: onToggleSafeAreas },
      ],
    },
    {
      id: 'workspace',
      label: 'Workspace',
      items: workspaceItems,
    },
    {
      id: 'docks',
      label: 'Docks',
      items: dockItems,
    },
    {
      id: 'production',
      label: 'Production',
      items: [
        { label: 'Cut', shortcut: 'F1', ...(onCut ? { onClick: onCut } : { disabled: true }) },
        { label: 'Take', shortcut: 'F2', ...(onTake ? { onClick: onTake } : { disabled: true }) },
        { label: 'Auto', shortcut: 'F3', ...(onAuto ? { onClick: onAuto } : { disabled: true }) },
        { divider: true, label: '' },
        { label: 'Production Graph', onClick: () => onActivateBottomTab('production-graph') },
        { label: 'Scene Layers', onClick: () => onActivateBottomTab('layers') },
        { divider: true, label: '' },
        { label: 'Production Engine', href: '/control-room/engine' },
        { label: 'Compositor', href: '/control-room/compositor' },
      ],
    },
    {
      id: 'sources',
      label: 'Sources',
      items: [
        { label: 'Scene Browser', onClick: () => onActivateSourceTab('scenes') },
        { label: 'Source Browser', onClick: () => onActivateSourceTab('sources') },
        { label: 'Media Browser', onClick: () => onActivateSourceTab('media') },
        { label: 'Graphics Browser', onClick: () => onActivateSourceTab('graphics') },
        { label: 'Guests Browser', onClick: () => onActivateSourceTab('guests') },
        { divider: true, label: '' },
        {
          label: 'Add Source…',
          onClick: () => {
            onNavChange('sources');
            onActivateSourceTab('sources');
          },
        },
      ],
    },
    {
      id: 'broadcast',
      label: 'Broadcast',
      items: [
        { label: 'Streaming Panel', onClick: () => onActivateOperationsPanel('streaming') },
        { label: 'Recording Panel', onClick: () => onActivateOperationsPanel('recording') },
        { label: 'Outputs Panel', onClick: () => onActivateOperationsPanel('outputs') },
        { divider: true, label: '' },
        { label: 'Routing Matrix', onClick: () => onActivateBottomTab('routing') },
        { label: 'Broadcast I/O', href: '/control-room/broadcast-io' },
        { divider: true, label: '' },
        { label: 'Stream Settings…', href: '/control-room/streaming-runtime' },
        { label: 'Recording Runtime…', href: '/control-room/recording-runtime' },
      ],
    },
    {
      id: 'graphics',
      label: 'Graphics',
      items: [
        { label: 'Graphics Workspace', onClick: () => onActivateBottomTab('graphics') },
        { label: 'Graphics Browser', onClick: () => onActivateSourceTab('graphics') },
        { divider: true, label: '' },
        { label: 'Import Graphics Package…', disabled: true },
      ],
    },
    {
      id: 'replay',
      label: 'Replay',
      items: [
        { label: 'Replay Workspace', onClick: () => onActivateBottomTab('replay') },
        { divider: true, label: '' },
        { label: 'Capture Clip', disabled: true },
        { label: 'Clip Library', onClick: () => onActivateSourceTab('media') },
      ],
    },
    {
      id: 'automation',
      label: 'Automation',
      items: [
        { label: 'Automation Workspace', onClick: () => onActivateBottomTab('automation') },
        { divider: true, label: '' },
        { label: 'Automation Console', href: '/control-room/automation' },
        { label: 'AI Director', href: '/control-room/ai-director' },
      ],
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      items: [
        { label: 'Monitor Wall Workspace', onClick: () => onSelectPreset('monitor-wall') },
        { label: 'Monitor Wall Window', href: '/control-room/monitor-wall' },
        { divider: true, label: '' },
        { label: 'Telemetry Panel', onClick: () => onActivateOperationsPanel('telemetry') },
        { label: 'Alerts Panel', onClick: () => onActivateOperationsPanel('alerts') },
        { label: 'System Status', onClick: () => onActivateBottomTab('system-status') },
        { label: 'Logs', onClick: () => onActivateBottomTab('logs') },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { label: 'Auto-Configuration Wizard', disabled: true },
        { label: 'Output Timer', disabled: true },
        { divider: true, label: '' },
        { label: 'Production Engine', href: '/control-room/engine' },
        { label: 'Compositor', href: '/control-room/compositor' },
        { label: 'WebRTC Runtime', href: '/control-room/webrtc-runtime' },
        { label: 'Media Runtime', href: '/control-room/media-runtime' },
        { label: 'Audio Runtime', href: '/control-room/audio-runtime' },
        { divider: true, label: '' },
        ...(onSeedDemo ? [{ label: 'Seed Demo', onClick: onSeedDemo }] : []),
        ...(onSimulateDemo ? [{ label: 'Simulate Production', onClick: onSimulateDemo }] : []),
        ...(onResetDemo ? [{ label: 'Reset Demo State', onClick: onResetDemo }] : []),
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'UBOS Documentation', disabled: true },
        { label: 'Keyboard Shortcuts', disabled: true },
        { divider: true, label: '' },
        { label: 'System Diagnostics', onClick: () => onActivateBottomTab('logs') },
        { label: 'About UBOS', disabled: true },
      ],
    },
  ];

  return (
    <nav
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-0.5 border-b border-ubos-border-subtle bg-ubos-graphite/60 px-2 py-0.5',
        className,
      )}
      aria-label="Command center menu"
    >
      {menus.map((menu) => (
        <MenuDropdown
          key={menu.id}
          menu={menu}
          open={openMenuId === menu.id}
          onOpen={() => openMenu(menu.id)}
          onClose={closeMenu}
        />
      ))}
    </nav>
  );
}
