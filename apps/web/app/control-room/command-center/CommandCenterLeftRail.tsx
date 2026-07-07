'use client';

/**
 * UBOS 3.15B — compact left command rail.
 *
 * Each item activates an EXISTING workspace, dock, or navigation target.
 * No routes are broken: items either drive in-page activation (nav ids,
 * dock tabs, workspace presets) or do nothing beyond highlighting when the
 * target is this page itself.
 */
import { cn } from '@ubos/ui';
import { broadcastSurfaces } from '../broadcast-command-center/broadcast-theme';
import type { NavItemId } from '../shell/types';
import { commandCenterRailItems, type CommandCenterRailItem } from './command-center-logic';

export function CommandCenterLeftRail({
  activeNav,
  onSelectItem,
  className,
}: {
  activeNav: NavItemId;
  onSelectItem: (item: CommandCenterRailItem) => void;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        'flex h-full w-full shrink-0 flex-col gap-0.5 overflow-y-auto border-r p-1 ubos-scroll',
        broadcastSurfaces.rail,
        className,
      )}
      aria-label="Command rail"
    >
      {commandCenterRailItems.map((item) => {
        const active = item.isHome || (item.nav !== undefined && activeNav === item.nav);
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            title={item.label}
            onClick={() => onSelectItem(item)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-ubos-sm px-1 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors',
              active
                ? 'bg-ubos-selection-muted text-ubos-selection-text'
                : 'text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
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
  );
}
