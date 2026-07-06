'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { NavItemId, SourceDockTabId } from '../shell/types';
import { commandRailItems } from './command-rail-constants';
import { SourceDiagnosticDock } from './SourceDiagnosticDock';

export function LeftCommandRail({
  activeNav,
  onNavChange,
  sourceDockContent,
  activeSourceDockTab,
  onSourceDockTabChange,
  collapsed,
  onToggleCollapse,
  className,
}: {
  activeNav: NavItemId;
  onNavChange: (id: NavItemId) => void;
  sourceDockContent: ReactNode;
  activeSourceDockTab: SourceDockTabId;
  onSourceDockTabChange: (tab: SourceDockTabId) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}) {
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
        {commandRailItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              title={item.label}
              onClick={() => onNavChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-ubos-sm px-1 py-1.5 text-[8px] font-bold uppercase tracking-wide transition-colors',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
              )}
            >
              <span className="text-sm leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span className="ubos-truncate max-w-full">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      <SourceDiagnosticDock
        activeTab={activeSourceDockTab}
        onTabChange={onSourceDockTabChange}
        {...(collapsed !== undefined ? { collapsed } : {})}
        {...(onToggleCollapse ? { onToggleCollapse } : {})}
        className="min-h-0 min-w-0 flex-1"
      >
        {sourceDockContent}
      </SourceDiagnosticDock>
    </aside>
  );
}
