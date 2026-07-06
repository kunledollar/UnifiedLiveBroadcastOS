'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import { UBOS_DOCK_PANEL_LIST } from './ubos-dock-registry';
import type { UbosDockLayoutState, UbosDockPanelId, UbosWorkspaceModeId } from './ubos-menu-types';
import { ubosWorkspaceModeList } from './ubos-workspace-modes';
import type { LayoutFocusMode } from '../workspaces/workspace-types';

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
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
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
          'rounded-ubos-sm px-2.5 py-1 text-xs font-medium transition-colors',
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
          className="absolute left-0 top-full z-50 mt-0.5 max-h-[min(60vh,24rem)] min-w-52 overflow-y-auto rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon py-1 shadow-ubos-raised ubos-scroll"
        >
          {menu.items.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="my-1 border-t border-ubos-border-subtle" />;
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
                  <span className="ml-4 font-mono text-[10px] text-ubos-fg-muted">{item.shortcut}</span>
                ) : null}
              </>
            );
            if (item.href) {
              return (
                <a
                  key={item.label}
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
                key={item.label}
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

export type UbosMenuBarProps = {
  dockLayout: UbosDockLayoutState;
  activeWorkspaceMode: UbosWorkspaceModeId;
  layoutFocus: LayoutFocusMode;
  compactChrome: boolean;
  onSelectWorkspaceMode: (mode: UbosWorkspaceModeId) => void;
  onToggleDockPanel: (panelId: UbosDockPanelId) => void;
  onResetLayout: () => void;
  onSaveLayout: () => void;
  onToggleLayoutLock: (locked: boolean) => void;
  onSelectLayoutFocus: (focus: LayoutFocusMode) => void;
  onToggleCompactChrome: () => void;
  onSaveWorkspace?: () => void;
  onRestoreWorkspace?: () => void;
  onResetWorkspace?: () => void;
  onSeedDemo?: () => void;
  onSimulateDemo?: () => void;
  onResetDemo?: () => void;
  trailingSlot?: ReactNode;
  className?: string;
};

export function UbosMenuBar({
  dockLayout,
  activeWorkspaceMode,
  layoutFocus,
  compactChrome,
  onSelectWorkspaceMode,
  onToggleDockPanel,
  onResetLayout,
  onSaveLayout,
  onToggleLayoutLock,
  onSelectLayoutFocus,
  onToggleCompactChrome,
  onSaveWorkspace,
  onRestoreWorkspace,
  onResetWorkspace,
  onSeedDemo,
  onSimulateDemo,
  onResetDemo,
  trailingSlot,
  className,
}: UbosMenuBarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpenMenuId(null), []);
  const openMenu = useCallback((id: string) => setOpenMenuId(id), []);

  const dockItems: MenuItem[] = UBOS_DOCK_PANEL_LIST.map((panel) => ({
    label: panel.label,
    checked: dockLayout.dockPanels[panel.id]?.visible ?? false,
    onClick: () => onToggleDockPanel(panel.id),
  }));

  const workspaceItems: MenuItem[] = ubosWorkspaceModeList.map((mode) => ({
    label: mode.label,
    checked: activeWorkspaceMode === mode.id,
    onClick: () => onSelectWorkspaceMode(mode.id),
  }));

  const menus: MenuDefinition[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Scene Collection…', disabled: true },
        { label: 'Open Scene Collection…', disabled: true },
        { label: 'Save Scene Collection', disabled: true },
        { divider: true, label: '' },
        { label: 'Import Media…', disabled: true },
        { label: 'Export Production State…', disabled: true },
        { divider: true, label: '' },
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
        ...workspaceItems,
        { divider: true, label: '' },
        { label: 'Full Layout', checked: layoutFocus === 'full', onClick: () => onSelectLayoutFocus('full') },
        {
          label: 'Switcher Focus',
          checked: layoutFocus === 'switcher',
          onClick: () => onSelectLayoutFocus('switcher'),
        },
        {
          label: 'Audio Focus',
          checked: layoutFocus === 'audio',
          onClick: () => onSelectLayoutFocus('audio'),
        },
        { divider: true, label: '' },
        { label: 'Compact Chrome', checked: compactChrome, onClick: onToggleCompactChrome },
        { divider: true, label: '' },
        { label: 'Reset Layout', onClick: onResetLayout },
        {
          label: 'Lock Layout',
          checked: dockLayout.layoutLocked,
          onClick: () => onToggleLayoutLock(!dockLayout.layoutLocked),
        },
        { label: 'Save Layout', onClick: onSaveLayout },
      ],
    },
    {
      id: 'docks',
      label: 'Docks',
      items: dockItems,
    },
    {
      id: 'profile',
      label: 'Profile',
      items: [
        { label: 'Manage Profiles…', disabled: true },
        { label: 'Import Profile…', disabled: true },
        { label: 'Export Profile…', disabled: true },
        { divider: true, label: '' },
        { label: 'Stream Settings…', href: '/control-room/streaming-runtime' },
        { label: 'Output Settings…', href: '/destinations' },
      ],
    },
    {
      id: 'scene-collection',
      label: 'Scene Collection',
      items: [
        { label: 'New Collection…', disabled: true },
        { label: 'Duplicate Collection', disabled: true },
        { label: 'Rename Collection…', disabled: true },
        { divider: true, label: '' },
        { label: 'Scene Browser', onClick: () => onToggleDockPanel('scenes') },
        { label: 'Source Browser', onClick: () => onToggleDockPanel('sources') },
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
        { label: 'Broadcast I/O', href: '/control-room/broadcast-io' },
        { label: 'Automation', href: '/control-room/automation' },
        { label: 'AI Director', href: '/control-room/ai-director' },
        { divider: true, label: '' },
        ...(onSeedDemo ? [{ label: 'Seed Demo', onClick: onSeedDemo }] : []),
        ...(onSimulateDemo ? [{ label: 'Simulate Production', onClick: onSimulateDemo }] : []),
        ...(onResetDemo ? [{ label: 'Reset Demo State', onClick: onResetDemo }] : []),
      ],
    },
    {
      id: 'window',
      label: 'Window',
      items: [
        { label: 'Always on Top', disabled: true },
        { divider: true, label: '' },
        { label: 'Engine Workspace', href: '/control-room/engine' },
        { label: 'Monitor Wall', href: '/control-room/monitor-wall' },
        { label: 'WebRTC Runtime', href: '/control-room/webrtc-runtime' },
        { label: 'Media Runtime', href: '/control-room/media-runtime' },
        { label: 'Audio Runtime', href: '/control-room/audio-runtime' },
        { label: 'Recording Runtime', href: '/control-room/recording-runtime' },
        { label: 'Analytics', href: '/control-room/analytics' },
        { label: 'Security', href: '/control-room/security' },
        { label: 'Cluster', href: '/control-room/cluster' },
        { label: 'Plugins', href: '/control-room/plugins' },
        { label: 'Cloud', href: '/control-room/cloud' },
        { divider: true, label: '' },
        { label: 'Developer Dashboard', href: '/developer' },
        { label: 'Enterprise Admin', href: '/admin' },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'UBOS Documentation', href: 'https://github.com', disabled: true },
        { label: 'Keyboard Shortcuts', disabled: true },
        { divider: true, label: '' },
        { label: 'System Diagnostics', onClick: () => onToggleDockPanel('logs') },
        { label: 'About UBOS', disabled: true },
      ],
    },
  ];

  return (
    <nav
      className={cn(
        'flex shrink-0 items-center gap-0.5 border-b px-2 py-1',
        'border-ubos-border-subtle bg-ubos-graphite/60',
        className,
      )}
      aria-label="UBOS application menu"
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

      <div className="ml-2 hidden items-center gap-1 border-l border-ubos-border-subtle pl-2 lg:flex">
        {ubosWorkspaceModeList.map((mode) => {
          const active = activeWorkspaceMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              title={mode.description}
              onClick={() => onSelectWorkspaceMode(mode.id)}
              className={cn(
                'rounded-ubos-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text ring-1 ring-ubos-selection/40'
                  : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
              )}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onResetLayout}
          disabled={dockLayout.layoutLocked}
          title={dockLayout.layoutLocked ? 'Unlock layout to reset' : 'Reset dock layout'}
          className={cn(
            'rounded-ubos-sm px-2 py-0.5 text-[10px] font-medium transition-colors',
            dockLayout.layoutLocked
              ? 'cursor-not-allowed text-ubos-fg-muted'
              : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
          )}
        >
          Reset Layout
        </button>
        <button
          type="button"
          onClick={() => onToggleLayoutLock(!dockLayout.layoutLocked)}
          className={cn(
            'rounded-ubos-sm px-2 py-0.5 text-[10px] font-medium transition-colors',
            dockLayout.layoutLocked
              ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
              : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
          )}
          aria-pressed={dockLayout.layoutLocked}
        >
          {dockLayout.layoutLocked ? 'Layout Locked' : 'Lock Layout'}
        </button>
        <button
          type="button"
          onClick={onSaveLayout}
          className="rounded-ubos-sm px-2 py-0.5 text-[10px] font-medium text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary"
        >
          Save Layout
        </button>
        {trailingSlot}
      </div>
    </nav>
  );
}
