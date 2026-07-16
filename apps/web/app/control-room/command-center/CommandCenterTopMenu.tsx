'use client';

/**
 * UBOS 3.15D-3 — Professional broadcast operator menu bar.
 *
 * Menus: File · Workspace · Production · Sources · Graphics · Replay ·
 *        Guests · Broadcast · Automation · Monitoring · Tools · Window · Help
 *
 * One Owner Rule: every menu action calls Workspace Manager or navigates
 * to the single primary home of a capability. No duplicate editors are
 * rendered inline — menus are shortcuts to existing panels/workspaces only.
 *
 * Safety rules:
 * - Menu items communicate only with Workspace Manager.
 * - No new layout engine is introduced.
 * - No production runtime, media, camera, audio, recording, streaming,
 *   guest, replay, or automation code is touched here.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@ubos/ui';
import type { WorkspacePanelDefinition, WorkspacePresetId } from '@ubos/shared';
import { workspacePresetList } from '@ubos/shared';
import type { DockTabId, NavItemId, SourceDockTabId } from '../shell/types';
import type { CommandCenterZoneToggleId } from './useCommandCenterWorkspace';

type MenuItem = {
  label: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  divider?: boolean;
  /** Section header — non-interactive label for grouping */
  header?: boolean;
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
          'rounded-ubos-sm px-2 py-1',
          'text-xs font-medium',
          'transition-colors duration-[var(--ubos-duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
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
          className={cn(
            'absolute left-0 top-full z-50 mt-0.5',
            'max-h-[min(60vh,26rem)] min-w-52 overflow-y-auto',
            'rounded-ubos-md border border-ubos-border-default',
            'bg-ubos-carbon py-1',
            'shadow-[var(--ubos-shadow-raised)]',
            'ubos-scroll',
            'animate-[ubos-slide-up_120ms_var(--ubos-easing-out)_forwards]',
          )}
        >
          {menu.items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-0.5 border-t border-ubos-border-subtle"
                  role="separator"
                />
              );
            }
            if (item.header) {
              return (
                <div
                  key={`header-${index}`}
                  className="px-3 pb-0.5 pt-2 text-[9px] font-black uppercase tracking-[0.15em] text-ubos-fg-muted/60"
                  role="presentation"
                  aria-hidden="true"
                >
                  {item.label}
                </div>
              );
            }
            const content = (
              <>
                <span className="flex items-center gap-2">
                  {item.checked !== undefined ? (
                    <span
                      className={cn(
                        'w-3 text-center text-[10px]',
                        item.checked ? 'text-ubos-selection-text' : 'text-transparent',
                      )}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  ) : (
                    <span className="w-3" aria-hidden="true" />
                  )}
                  {item.label}
                </span>
                {item.shortcut ? (
                  <span className="ml-4 font-mono tabular-nums text-[10px] text-ubos-fg-muted/70">
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
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-1.5',
                    'text-left text-ubos-caption text-ubos-fg-secondary',
                    'transition-colors duration-[var(--ubos-duration-fast)]',
                    'hover:bg-ubos-midnight hover:text-ubos-fg-primary',
                    'focus-visible:outline-none focus-visible:bg-ubos-midnight',
                  )}
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
                  'flex w-full items-center justify-between px-3 py-1.5',
                  'text-left text-ubos-caption',
                  'transition-colors duration-[var(--ubos-duration-fast)]',
                  'focus-visible:outline-none focus-visible:bg-ubos-midnight',
                  item.disabled
                    ? 'cursor-not-allowed text-ubos-fg-muted/60'
                    : 'text-ubos-fg-secondary hover:bg-ubos-midnight hover:text-ubos-fg-primary',
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
  /** True when the active preset has an explicit user-saved layout. */
  hasUserSavedLayout?: boolean;
  dockPanels: WorkspacePanelDefinition[];
  isPanelVisible: (panelId: string) => boolean;
  isZoneCollapsed: (zoneId: CommandCenterZoneToggleId) => boolean;
  onSelectPreset: (presetId: WorkspacePresetId) => void;
  onTogglePanel: (panelId: string) => void;
  onToggleZone: (zoneId: CommandCenterZoneToggleId) => void;
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
  onOpenCommandPalette: () => void;
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
  hasUserSavedLayout = false,
  dockPanels,
  isPanelVisible,
  isZoneCollapsed,
  onSelectPreset,
  onTogglePanel,
  onToggleZone,
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
  onOpenCommandPalette,
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

  // ── Workspace menu: all 9 presets, current one highlighted ────────────────
  // Preset switching is always allowed; lock only prevents drag-resize.
  const workspaceItems: MenuItem[] = workspacePresetList.map((preset) => ({
    label: preset.name,
    checked: activePresetId === preset.id,
    onClick: () => onSelectPreset(preset.id),
  }));

  // ── Window > Panels section: registered dock panels ───────────────────────
  const panelItems: MenuItem[] = dockPanels
    .filter((panel) => panel.closable)
    .map((panel) => ({
      label: panel.title,
      checked: isPanelVisible(panel.id),
      disabled: layoutLocked || !panel.closable,
      onClick: () => onTogglePanel(panel.id),
    }));

  const menus: MenuDefinition[] = [
    // ── File ──────────────────────────────────────────────────────────────
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Scene Collection…', disabled: true },
        { label: 'Open Scene Collection…', disabled: true },
        { label: 'Import Media…', disabled: true },
        { label: 'Export Production State…', disabled: true },
        { divider: true, label: '' },
        { label: 'Save Layout', shortcut: 'Ctrl+S', onClick: onSaveLayout },
        ...(onSaveWorkspace ? [{ label: 'Save Workspace', onClick: onSaveWorkspace }] : []),
        ...(onRestoreWorkspace ? [{ label: 'Restore Workspace', onClick: onRestoreWorkspace }] : []),
        ...(onResetWorkspace ? [{ label: 'Reset Workspace', onClick: onResetWorkspace }] : []),
        { divider: true, label: '' },
        { label: 'Command Palette…', shortcut: 'Ctrl+K', onClick: onOpenCommandPalette },
        { divider: true, label: '' },
        { label: 'Preferences… (Unavailable — no production settings route)', disabled: true },
      ],
    },

    // ── Workspace ─────────────────────────────────────────────────────────
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        ...workspaceItems,
        { divider: true, label: '' },
        // Reset restores the factory definition of the current preset; NOT blocked by lock.
        { label: 'Reset Layout', shortcut: 'Ctrl+Shift+L', onClick: onResetLayout },
        {
          label: hasUserSavedLayout ? 'Save Layout (Saved ✓)' : 'Save Layout',
          shortcut: 'Ctrl+S',
          onClick: onSaveLayout,
        },
        { label: layoutLocked ? 'Unlock Layout' : 'Lock Layout', checked: layoutLocked, onClick: onToggleLayoutLock },
      ],
    },

    // ── Production ────────────────────────────────────────────────────────
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
        { label: 'Compositor (Unavailable — no route)', disabled: true },
      ],
    },

    // ── Sources ───────────────────────────────────────────────────────────
    {
      id: 'sources',
      label: 'Sources',
      items: [
        { label: 'Scene Browser', onClick: () => onActivateSourceTab('scenes') },
        { label: 'Source Browser', onClick: () => onActivateSourceTab('sources') },
        { label: 'Media Browser', onClick: () => onActivateSourceTab('media') },
        { label: 'Graphics Browser', onClick: () => onActivateSourceTab('graphics') },
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

    // ── Graphics ──────────────────────────────────────────────────────────
    {
      id: 'graphics',
      label: 'Graphics',
      items: [
        { label: 'Open Graphics Workspace', shortcut: 'Ctrl+3', onClick: () => onSelectPreset('graphics-operator') },
        { label: 'Graphics Workspace Tab', onClick: () => onActivateBottomTab('graphics') },
        { label: 'Graphics Browser', onClick: () => onActivateSourceTab('graphics') },
        { divider: true, label: '' },
        { label: 'Import Graphics Package…', disabled: true },
      ],
    },

    // ── Replay ────────────────────────────────────────────────────────────
    {
      id: 'replay',
      label: 'Replay',
      items: [
        { label: 'Open Replay Workspace', shortcut: 'Ctrl+4', onClick: () => onSelectPreset('replay-operator') },
        { label: 'Replay Workspace Tab', onClick: () => onActivateBottomTab('replay') },
        { divider: true, label: '' },
        { label: 'Capture Clip', disabled: true },
        { label: 'Clip Library', onClick: () => onActivateSourceTab('media') },
      ],
    },

    // ── Guests ────────────────────────────────────────────────────────────
    {
      id: 'guests',
      label: 'Guests',
      items: [
        { label: 'Guest Panel', onClick: () => onActivateOperationsPanel('guests') },
        { label: 'Invite Guest', onClick: () => onActivateSourceTab('guests') },
        { label: 'Guest Browser', onClick: () => onActivateSourceTab('guests') },
        { divider: true, label: '' },
        { label: 'WebRTC Settings…', href: '/control-room/webrtc-runtime' },
      ],
    },

    // ── Broadcast ─────────────────────────────────────────────────────────
    {
      id: 'broadcast',
      label: 'Broadcast',
      items: [
        { label: 'Open Streaming Workspace', shortcut: 'Ctrl+5', onClick: () => onSelectPreset('streaming-operator') },
        { divider: true, label: '' },
        { label: 'Streaming Panel', onClick: () => onActivateOperationsPanel('streaming') },
        { label: 'Recording Panel', onClick: () => onActivateOperationsPanel('recording') },
        { label: 'Outputs Panel', onClick: () => onActivateOperationsPanel('outputs') },
        { divider: true, label: '' },
        { label: 'Routing Matrix', onClick: () => onActivateBottomTab('routing') },
        { label: 'Broadcast I/O', href: '/control-room/broadcast-io' },
        { divider: true, label: '' },
        { label: 'Stream Settings… (Unavailable — no streaming route)', disabled: true },
        { label: 'Recording Runtime…', href: '/control-room/recording-runtime' },
      ],
    },

    // ── Automation ────────────────────────────────────────────────────────
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

    // ── Monitoring ────────────────────────────────────────────────────────
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
        { divider: true, label: '' },
        { label: 'Analytics', href: '/control-room/analytics' },
      ],
    },

    // ── Tools ─────────────────────────────────────────────────────────────
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { label: 'Command Palette…', shortcut: 'Ctrl+K', onClick: onOpenCommandPalette },
        { divider: true, label: '' },
        { label: 'Auto-Configuration Wizard', disabled: true },
        { label: 'Output Timer', disabled: true },
        { divider: true, label: '' },
        { label: 'Production Engine', href: '/control-room/engine' },
        { label: 'Compositor (Unavailable — no route)', disabled: true },
        { label: 'WebRTC Runtime', href: '/control-room/webrtc-runtime' },
        { label: 'Media Runtime', href: '/control-room/media-runtime' },
        { label: 'Audio Runtime', href: '/control-room/audio-runtime' },
        { divider: true, label: '' },
        ...(onSeedDemo ? [{ label: 'Seed Demo', onClick: onSeedDemo }] : []),
        ...(onSimulateDemo ? [{ label: 'Simulate Production', onClick: onSimulateDemo }] : []),
        ...(onResetDemo ? [{ label: 'Reset Demo State', onClick: onResetDemo }] : []),
      ],
    },

    // ── Window ────────────────────────────────────────────────────────────
    // Section 3 layout actions + Section 4 dock panel toggles.
    // All actions call Workspace Manager — no editor is rendered inline.
    {
      id: 'window',
      label: 'Window',
      items: [
        // Layout actions (former "View" menu)
        { label: 'Layout', header: true },
        // Reset is not blocked by layout lock (lock only restricts manual drag-resize).
        { label: 'Reset Layout', shortcut: 'Ctrl+Shift+L', onClick: onResetLayout },
        {
          label: hasUserSavedLayout ? 'Save Layout (Saved ✓)' : 'Save Layout',
          shortcut: 'Ctrl+S',
          onClick: onSaveLayout,
        },
        ...(onRestoreWorkspace
          ? [{ label: 'Load Layout', onClick: onRestoreWorkspace }]
          : [{ label: 'Load Layout', disabled: true }]),
        { label: layoutLocked ? 'Unlock Layout' : 'Lock Layout', checked: layoutLocked, onClick: onToggleLayoutLock },
        { divider: true, label: '' },
        { label: 'Fullscreen Program', onClick: onFullscreenProgram },
        { label: 'Fullscreen Preview', onClick: onFullscreenPreview },
        { label: 'Toggle Safe Areas', checked: safeAreasVisible, onClick: onToggleSafeAreas },
        { label: 'Show Telemetry', onClick: () => onActivateOperationsPanel('telemetry') },
        { divider: true, label: '' },
        // Dock zone toggles (Section 3 Window items)
        { label: 'Zones', header: true },
        {
          label: 'Toggle Left Dock',
          checked: !isZoneCollapsed('left-dock'),
          disabled: layoutLocked,
          onClick: () => onToggleZone('left-dock'),
        },
        {
          label: 'Toggle Right Dock',
          checked: !isZoneCollapsed('right-dock'),
          disabled: layoutLocked,
          onClick: () => onToggleZone('right-dock'),
        },
        {
          label: 'Toggle Bottom Workspace',
          checked: !isZoneCollapsed('bottom-workspace'),
          disabled: layoutLocked,
          onClick: () => onToggleZone('bottom-workspace'),
        },
        { divider: true, label: '' },
        { label: 'Toggle Inspector', onClick: () => onActivateOperationsPanel('inspector') },
        { label: 'Toggle Monitor Wall', onClick: () => onSelectPreset('monitor-wall') },
        { label: 'Toggle Pipeline Inspector', onClick: () => onActivateBottomTab('production-graph') },
        { divider: true, label: '' },
        // Registered dock panels (Section 4)
        { label: 'Panels', header: true },
        ...panelItems,
      ],
    },

    // ── Help ──────────────────────────────────────────────────────────────
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'UBOS Documentation', disabled: true },
        { label: 'Keyboard Shortcuts', onClick: onOpenCommandPalette },
        { divider: true, label: '' },
        { label: 'System Diagnostics', onClick: () => onActivateBottomTab('logs') },
        { label: 'About UBOS', disabled: true },
      ],
    },
  ];

  return (
    <nav
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-0.5 border-b border-ubos-border-subtle',
        'bg-ubos-graphite/50 px-2 py-0.5',
        className,
      )}
      aria-label="Command center application menu"
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
