'use client';

/**
 * UBOS 3.15C — compact left command rail.
 *
 * Each item activates an EXISTING workspace, dock, or navigation target.
 * No routes are broken: items either drive in-page activation (nav ids,
 * dock tabs, workspace presets) or do nothing beyond highlighting when the
 * target is this page itself.
 *
 * 3.15C changes (polish only):
 * - Slightly larger icon hit targets for precision pointer devices
 * - Active indicator uses left accent bar instead of background blob
 * - Focus-visible ring applied to each button
 * - Tooltip rendered via CSS .ubos-rail-item + .ubos-rail-tooltip pattern
 *   (no JS, pointer-events-none, immediately readable at 100% zoom)
 * - Divider after the "home" item to separate navigation clusters
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
        'flex h-full w-full shrink-0 flex-col overflow-y-auto border-r py-1 ubos-scroll',
        'gap-px',
        broadcastSurfaces.rail,
        className,
      )}
      aria-label="Command rail"
    >
      {commandCenterRailItems.map((item, index) => {
        const active = item.isHome || (item.nav !== undefined && activeNav === item.nav);

        // Visual divider between the "home" cluster and workspace items.
        const showDivider = index > 0 && commandCenterRailItems[index - 1]?.isHome;

        return (
          <span key={item.id}>
            {showDivider ? (
              <span
                className="my-1 block border-t border-ubos-border-subtle"
                role="separator"
                aria-hidden="true"
              />
            ) : null}

            {/* Rail item — relative so tooltip can be absolutely positioned. */}
            <span className="ubos-rail-item group relative flex">
              <button
                type="button"
                aria-pressed={active}
                aria-label={item.label}
                onClick={() => onSelectItem(item)}
                className={cn(
                  'relative flex w-full flex-col items-center gap-0.5 py-1.5',
                  'rounded-ubos-sm text-[9px] font-bold uppercase tracking-wide',
                  'transition-colors duration-[var(--ubos-duration-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
                  active
                    ? 'bg-ubos-selection-muted text-ubos-selection-text'
                    : 'text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
                )}
              >
                {/* Active indicator — left accent bar */}
                {active ? (
                  <span
                    className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-ubos-selection"
                    aria-hidden="true"
                  />
                ) : null}

                <span
                  className={cn(
                    'text-sm leading-none transition-transform duration-[var(--ubos-duration-fast)]',
                    active ? 'scale-105' : 'group-hover:scale-105',
                  )}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="ubos-truncate max-w-full px-0.5">{item.shortLabel}</span>
              </button>

              {/* Tooltip — CSS-only, no JS required */}
              <span
                className="ubos-rail-tooltip"
                role="tooltip"
                aria-hidden="true"
              >
                {item.label}
              </span>
            </span>
          </span>
        );
      })}
    </nav>
  );
}
