'use client';

import type { ReactNode } from 'react';
import { BroadcastPanel, cn } from '@ubos/ui';
import type { NavItemId } from './types';

const navItems: Array<{ id: NavItemId; label: string; icon: string }> = [
  { id: 'scenes', label: 'Scenes', icon: '▦' },
  { id: 'sources', label: 'Sources', icon: '◫' },
  { id: 'media', label: 'Media', icon: '▣' },
  { id: 'graphics', label: 'Graphics', icon: '◈' },
  { id: 'layouts', label: 'Layouts', icon: '▤' },
  { id: 'replay', label: 'Replay', icon: '↺' },
  { id: 'outputs', label: 'Outputs', icon: '⇪' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export function LeftNavigationRail({
  activeItem,
  onSelect,
  children,
  className,
}: {
  activeItem: NavItemId;
  onSelect: (id: NavItemId) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'flex w-[var(--ubos-nav-width)] shrink-0 min-h-0 border-r border-ubos-border-subtle bg-ubos-carbon',
        className,
      )}
    >
      <nav
        className="flex w-16 shrink-0 flex-col gap-ubos-1 border-r border-ubos-border-subtle p-ubos-2"
        aria-label="Production navigation"
      >
        {navItems.map((item) => {
          const active = activeItem === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              title={item.label}
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-ubos-sm px-1 py-ubos-2 text-[0.625rem] font-medium transition-colors duration-ubos-fast',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
              )}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span className="ubos-truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <BroadcastPanel variant="inset" padding={false} className="min-h-0 min-w-0 flex-1 border-0 shadow-none">
        <div className="ubos-scroll h-full overflow-y-auto p-ubos-2">{children}</div>
      </BroadcastPanel>
    </aside>
  );
}
