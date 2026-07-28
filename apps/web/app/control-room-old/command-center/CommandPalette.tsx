'use client';

/**
 * UBOS 3.15D-3 — Professional Command Palette.
 *
 * Shortcut: Ctrl+K
 *
 * Searches across: panels, workspaces, scenes, sources, graphics, replay,
 * commands, settings. All actions delegate to Workspace Manager — no duplicate
 * editors are created inline.
 *
 * One Owner Rule: selecting a result calls the relevant Workspace Manager
 * action (activatePanel, activateWorkspace, applyPreset) rather than
 * rendering any new editor.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@ubos/ui';
import { workspacePresetList, type WorkspacePresetId } from '@ubos/shared';
import type { DockTabId, NavItemId, SourceDockTabId } from '../shell/types';
import type { CommandCenterZoneToggleId } from './useCommandCenterWorkspace';

export type CommandPaletteAction = {
  id: string;
  label: string;
  description?: string;
  category: 'workspace' | 'panel' | 'source' | 'command' | 'navigate' | 'layout';
  keywords: string[];
  run: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  activePresetId: WorkspacePresetId;
  layoutLocked: boolean;
  onSelectPreset: (presetId: WorkspacePresetId) => void;
  onActivateBottomTab: (tab: DockTabId) => void;
  onActivateSourceTab: (tab: SourceDockTabId) => void;
  onActivateOperationsPanel: (panelId: string) => void;
  onToggleZone: (zoneId: CommandCenterZoneToggleId) => void;
  onResetLayout: () => void;
  onSaveLayout: () => void;
  onToggleLayoutLock: () => void;
  onNavChange: (nav: NavItemId) => void;
  onFullscreenProgram: () => void;
  onFullscreenPreview: () => void;
};

const CATEGORY_LABELS: Record<CommandPaletteAction['category'], string> = {
  workspace: 'Workspace',
  panel: 'Panel',
  source: 'Source',
  command: 'Command',
  navigate: 'Navigate',
  layout: 'Layout',
};

const CATEGORY_COLOR: Record<CommandPaletteAction['category'], string> = {
  workspace: 'text-ubos-selection-text bg-ubos-selection-muted',
  panel: 'text-emerald-300 bg-emerald-500/10',
  source: 'text-sky-300 bg-sky-500/10',
  command: 'text-amber-300 bg-amber-500/10',
  navigate: 'text-purple-300 bg-purple-500/10',
  layout: 'text-rose-300 bg-rose-500/10',
};

function buildActions({
  activePresetId,
  layoutLocked,
  onSelectPreset,
  onActivateBottomTab,
  onActivateSourceTab,
  onActivateOperationsPanel,
  onToggleZone,
  onResetLayout,
  onSaveLayout,
  onToggleLayoutLock,
  onNavChange,
  onFullscreenProgram,
  onFullscreenPreview,
}: Omit<CommandPaletteProps, 'open' | 'onClose'>): CommandPaletteAction[] {
  const actions: CommandPaletteAction[] = [];

  // ── Workspace presets ──────────────────────────────────────────────────
  for (const preset of workspacePresetList) {
    const isActive = preset.id === activePresetId;
    actions.push({
      id: `workspace:${preset.id}`,
      label: `Open ${preset.name} Workspace`,
      description: isActive ? 'Currently active' : (preset.description ?? undefined),
      category: 'workspace',
      keywords: [preset.name, preset.id, 'workspace', 'layout', 'switch'],
      run: () => onSelectPreset(preset.id),
    });
  }

  // ── Bottom workspace tabs ──────────────────────────────────────────────
  const bottomTabs: Array<{ tab: DockTabId; label: string; keywords: string[] }> = [
    { tab: 'audio', label: 'Open Audio Workspace', keywords: ['audio', 'mixer', 'sound', 'channel'] },
    { tab: 'graphics', label: 'Open Graphics Workspace', keywords: ['graphics', 'gfx', 'lower third', 'overlay'] },
    { tab: 'replay', label: 'Open Replay Workspace', keywords: ['replay', 'clip', 'highlight', 'slow motion'] },
    { tab: 'automation', label: 'Open Automation Workspace', keywords: ['automation', 'macro', 'trigger', 'ai'] },
    { tab: 'routing', label: 'Open Routing Matrix', keywords: ['routing', 'matrix', 'io', 'signal'] },
    { tab: 'production-graph', label: 'Open Production Graph', keywords: ['production graph', 'pipeline', 'graph'] },
    { tab: 'logs', label: 'Open Logs', keywords: ['logs', 'diagnostics', 'debug', 'errors'] },
    { tab: 'system-status', label: 'Open System Status', keywords: ['system', 'status', 'health', 'monitoring'] },
    { tab: 'layers', label: 'Open Scene Layers', keywords: ['layers', 'scenes', 'composition'] },
    { tab: 'collaboration', label: 'Open Collaboration', keywords: ['collaboration', 'team', 'share'] },
  ];

  for (const { tab, label, keywords } of bottomTabs) {
    actions.push({
      id: `bottom-tab:${tab}`,
      label,
      category: 'panel',
      keywords: [...keywords, 'panel', 'workspace', 'tab'],
      run: () => onActivateBottomTab(tab),
    });
  }

  // ── Source dock tabs ───────────────────────────────────────────────────
  const sourceTabs: Array<{ tab: SourceDockTabId; label: string; keywords: string[] }> = [
    { tab: 'scenes', label: 'Open Scene Browser', keywords: ['scenes', 'scene browser', 'scene collection'] },
    { tab: 'sources', label: 'Open Source Browser', keywords: ['sources', 'source browser', 'input'] },
    { tab: 'media', label: 'Open Media Browser', keywords: ['media', 'assets', 'video', 'audio files'] },
    { tab: 'graphics', label: 'Open Graphics Browser', keywords: ['graphics', 'gfx browser', 'templates'] },
    { tab: 'guests', label: 'Open Guest Browser', keywords: ['guests', 'remote', 'caller', 'webrtc'] },
    { tab: 'diagnostics', label: 'Open Diagnostics', keywords: ['diagnostics', 'debug', 'performance'] },
  ];

  for (const { tab, label, keywords } of sourceTabs) {
    actions.push({
      id: `source-tab:${tab}`,
      label,
      category: 'source',
      keywords: [...keywords, 'browser', 'dock'],
      run: () => onActivateSourceTab(tab),
    });
  }

  // ── Right-dock operations panels ──────────────────────────────────────
  const opsPanels: Array<{ id: string; label: string; keywords: string[] }> = [
    { id: 'streaming', label: 'Open Streaming Panel', keywords: ['streaming', 'live', 'rtmp', 'stream'] },
    { id: 'recording', label: 'Open Recording Panel', keywords: ['recording', 'record', 'capture', 'output'] },
    { id: 'outputs', label: 'Open Outputs Panel', keywords: ['outputs', 'destinations', 'multicast'] },
    { id: 'guests', label: 'Open Guests Panel', keywords: ['guests', 'callers', 'remote', 'webrtc'] },
    { id: 'inspector', label: 'Open Inspector', keywords: ['inspector', 'properties', 'settings', 'source'] },
    { id: 'telemetry', label: 'Open Telemetry Panel', keywords: ['telemetry', 'metrics', 'stats', 'performance'] },
    { id: 'alerts', label: 'Open Alerts Panel', keywords: ['alerts', 'warnings', 'health', 'errors'] },
  ];

  for (const { id, label, keywords } of opsPanels) {
    actions.push({
      id: `ops-panel:${id}`,
      label,
      category: 'panel',
      keywords: [...keywords, 'panel', 'right dock'],
      run: () => onActivateOperationsPanel(id),
    });
  }

  // ── Layout commands ────────────────────────────────────────────────────
  if (!layoutLocked) {
    actions.push(
      {
        id: 'layout:reset',
        label: 'Reset Layout',
        description: 'Restore workspace to default positions',
        category: 'layout',
        keywords: ['reset', 'layout', 'restore defaults', 'clear'],
        run: onResetLayout,
      },
      {
        id: 'layout:toggle-left',
        label: 'Toggle Left Dock',
        category: 'layout',
        keywords: ['left dock', 'sources', 'toggle', 'hide show'],
        run: () => onToggleZone('left-dock'),
      },
      {
        id: 'layout:toggle-right',
        label: 'Toggle Right Dock',
        category: 'layout',
        keywords: ['right dock', 'operations', 'toggle', 'hide show'],
        run: () => onToggleZone('right-dock'),
      },
      {
        id: 'layout:toggle-bottom',
        label: 'Toggle Bottom Workspace',
        category: 'layout',
        keywords: ['bottom workspace', 'audio', 'graphics', 'replay', 'toggle'],
        run: () => onToggleZone('bottom-workspace'),
      },
    );
  }

  actions.push(
    {
      id: 'layout:save',
      label: 'Save Layout',
      category: 'layout',
      keywords: ['save', 'layout', 'persist', 'store'],
      run: onSaveLayout,
    },
    {
      id: 'layout:lock',
      label: layoutLocked ? 'Unlock Layout' : 'Lock Layout',
      description: layoutLocked ? 'Allow layout changes' : 'Prevent accidental layout changes',
      category: 'layout',
      keywords: ['lock', 'unlock', 'layout', 'protect'],
      run: onToggleLayoutLock,
    },
    {
      id: 'layout:fullscreen-program',
      label: 'Fullscreen Program',
      category: 'layout',
      keywords: ['fullscreen', 'program', 'output', 'maximize'],
      run: onFullscreenProgram,
    },
    {
      id: 'layout:fullscreen-preview',
      label: 'Fullscreen Preview',
      category: 'layout',
      keywords: ['fullscreen', 'preview', 'maximize'],
      run: onFullscreenPreview,
    },
  );

  // ── Navigation links ───────────────────────────────────────────────────
  const navItems: Array<{ nav: NavItemId; label: string; keywords: string[] }> = [
    { nav: 'dashboard', label: 'Go to Dashboard', keywords: ['dashboard', 'home', 'overview'] },
    { nav: 'scenes', label: 'Go to Scenes', keywords: ['scenes', 'scene collection'] },
    { nav: 'sources', label: 'Go to Sources', keywords: ['sources', 'inputs', 'cameras'] },
    { nav: 'graphics', label: 'Go to Graphics', keywords: ['graphics', 'gfx', 'overlay', 'lower third'] },
    { nav: 'replay', label: 'Go to Replay', keywords: ['replay', 'clips', 'highlight'] },
    { nav: 'outputs', label: 'Go to Outputs', keywords: ['outputs', 'streaming', 'recording', 'destinations'] },
    { nav: 'settings', label: 'Go to Settings', keywords: ['settings', 'preferences', 'configuration'] },
    { nav: 'monitoring', label: 'Go to Monitoring', keywords: ['monitoring', 'telemetry', 'health'] },
  ];

  for (const { nav, label, keywords } of navItems) {
    actions.push({
      id: `nav:${nav}`,
      label,
      category: 'navigate',
      keywords: [...keywords, 'go', 'navigate', 'open'],
      run: () => onNavChange(nav),
    });
  }

  return actions;
}

function score(action: CommandPaletteAction, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  const label = action.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  for (const kw of action.keywords) {
    if (kw.toLowerCase().includes(q)) return 40;
  }
  return 0;
}

export function CommandPalette({
  open,
  onClose,
  activePresetId,
  layoutLocked,
  onSelectPreset,
  onActivateBottomTab,
  onActivateSourceTab,
  onActivateOperationsPanel,
  onToggleZone,
  onResetLayout,
  onSaveLayout,
  onToggleLayoutLock,
  onNavChange,
  onFullscreenProgram,
  onFullscreenPreview,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allActions = useMemo(
    () =>
      buildActions({
        activePresetId,
        layoutLocked,
        onSelectPreset,
        onActivateBottomTab,
        onActivateSourceTab,
        onActivateOperationsPanel,
        onToggleZone,
        onResetLayout,
        onSaveLayout,
        onToggleLayoutLock,
        onNavChange,
        onFullscreenProgram,
        onFullscreenPreview,
      }),
    [
      activePresetId,
      layoutLocked,
      onSelectPreset,
      onActivateBottomTab,
      onActivateSourceTab,
      onActivateOperationsPanel,
      onToggleZone,
      onResetLayout,
      onSaveLayout,
      onToggleLayoutLock,
      onNavChange,
      onFullscreenProgram,
      onFullscreenPreview,
    ],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allActions.slice(0, 12);
    return allActions
      .map((action) => ({ action, s: score(action, query) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map(({ action }) => action);
  }, [allActions, query]);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Keep selected index in range
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const action = filtered[selectedIndex];
        if (action) {
          action.run();
          onClose();
        }
      }
    },
    [filtered, selectedIndex, onClose],
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-ubos-app/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Palette panel */}
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        className={cn(
          'fixed left-1/2 top-[15%] z-[101] -translate-x-1/2',
          'w-full max-w-xl',
          'rounded-ubos-lg border border-ubos-border-default bg-ubos-carbon',
          'shadow-[0_24px_64px_rgba(0,0,0,0.6)]',
          'overflow-hidden',
        )}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-ubos-border-subtle px-4 py-3">
          <span className="shrink-0 text-ubos-fg-muted" aria-hidden="true">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search panels, workspaces, commands…"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              'min-w-0 flex-1 bg-transparent',
              'text-sm text-ubos-fg-primary placeholder:text-ubos-fg-muted/60',
              'focus:outline-none',
            )}
            aria-label="Command palette search"
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            aria-activedescendant={
              filtered[selectedIndex] ? `cp-item-${filtered[selectedIndex]!.id}` : undefined
            }
          />
          <kbd
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5',
              'border border-ubos-border-subtle bg-ubos-midnight',
              'font-mono text-[10px] text-ubos-fg-muted',
            )}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          id="command-palette-list"
          ref={listRef}
          role="listbox"
          aria-label="Palette results"
          className="max-h-80 overflow-y-auto ubos-scroll py-1"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-ubos-caption text-ubos-fg-muted">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((action, index) => (
              <button
                key={action.id}
                id={`cp-item-${action.id}`}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                data-index={index}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  action.run();
                  onClose();
                }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5',
                  'text-left transition-colors duration-[var(--ubos-duration-fast)]',
                  index === selectedIndex
                    ? 'bg-ubos-selection-muted/60 text-ubos-fg-primary'
                    : 'text-ubos-fg-secondary hover:bg-ubos-midnight',
                )}
              >
                {/* Category badge */}
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5',
                    'font-mono text-[9px] font-bold uppercase tracking-wider',
                    CATEGORY_COLOR[action.category],
                  )}
                >
                  {CATEGORY_LABELS[action.category]}
                </span>

                {/* Label + description */}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ubos-caption font-medium">{action.label}</span>
                  {action.description ? (
                    <span className="block truncate text-[10px] text-ubos-fg-muted">{action.description}</span>
                  ) : null}
                </span>

                {/* Enter hint for selected */}
                {index === selectedIndex ? (
                  <kbd
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5',
                      'border border-ubos-border-subtle bg-ubos-midnight',
                      'font-mono text-[10px] text-ubos-fg-muted',
                    )}
                    aria-hidden="true"
                  >
                    ↵
                  </kbd>
                ) : null}
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-3 border-t border-ubos-border-subtle px-4 py-2 text-[10px] text-ubos-fg-muted">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
          <span className="ml-auto">UBOS Command Palette</span>
        </div>
      </div>
    </>
  );
}
