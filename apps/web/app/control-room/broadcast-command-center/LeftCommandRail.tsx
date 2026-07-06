'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { NavItemId } from '../shell/types';
import { BroadcastPanelShell } from './BroadcastPanelShell';

const commandItems: Array<{ id: NavItemId; label: string; icon: string }> = [
  { id: 'scenes', label: 'Scenes', icon: '▦' },
  { id: 'sources', label: 'Sources', icon: '◫' },
  { id: 'media', label: 'Media', icon: '▣' },
  { id: 'graphics', label: 'GFX', icon: '◈' },
  { id: 'layouts', label: 'Layouts', icon: '▤' },
  { id: 'replay', label: 'Replay', icon: '↺' },
  { id: 'outputs', label: 'Outputs', icon: '⇪' },
  { id: 'devices', label: 'Devices', icon: '⎈' },
  { id: 'settings', label: 'Setup', icon: '⚙' },
];

export function LeftCommandRail({
  activeNav,
  onNavChange,
  sourceDockContent,
  diagnosticsSlot,
  collapsed,
  onToggleCollapse,
  className,
}: {
  activeNav: NavItemId;
  onNavChange: (id: NavItemId) => void;
  sourceDockContent: ReactNode;
  diagnosticsSlot?: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}) {
  const activeLabel = commandItems.find((item) => item.id === activeNav)?.label ?? 'Sources';

  return (
    <aside
      className={cn(
        'flex min-h-0 shrink-0 overflow-hidden border-r border-ubos-border-subtle bg-ubos-carbon',
        className,
      )}
    >
      <nav
        className="flex w-14 shrink-0 flex-col gap-0.5 border-r border-ubos-border-subtle bg-[#020408] p-1"
        aria-label="Command navigation"
      >
        {commandItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              title={item.label}
              onClick={() => onNavChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-ubos-sm px-1 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
              )}
            >
              <span className="text-sm leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span className="ubos-truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 p-1">
        <BroadcastPanelShell
          title="Source Dock"
          subtitle={activeLabel}
          accent="neutral"
          className="min-h-0 flex-[3_1_0]"
          headerActions={
            onToggleCollapse ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="rounded px-1 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite"
                aria-label={collapsed ? 'Expand source dock' : 'Collapse source dock'}
              >
                {collapsed ? '▾' : '▴'}
              </button>
            ) : null
          }
        >
          {!collapsed ? <div className="p-1.5">{sourceDockContent}</div> : null}
        </BroadcastPanelShell>

        {diagnosticsSlot ? (
          <BroadcastPanelShell
            title="Diagnostics"
            subtitle="Source health"
            accent="telemetry"
            className="min-h-0 flex-[1_1_0] max-h-36"
          >
            <div className="p-1.5">{diagnosticsSlot}</div>
          </BroadcastPanelShell>
        ) : null}
      </div>
    </aside>
  );
}
