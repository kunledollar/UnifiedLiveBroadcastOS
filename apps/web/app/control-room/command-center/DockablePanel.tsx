'use client';

/**
 * UBOS 3.15D — Command Center dockable panel wrapper.
 *
 * Pure layout chrome around an EXISTING Control Room panel. The wrapped
 * component is passed in as children and is never modified: this wrapper
 * only adds a header (title, status, collapse, hide, undock placeholder)
 * and collapse behavior. Children stay mounted while collapsed so panel
 * state is preserved.
 *
 * 3.15C visual changes (polish-only, no logic changes):
 * - Refined header typography: slightly tighter tracking, cleaner weight
 * - Smooth spring-curve collapse using CSS grid-template-rows
 * - Focus-visible rings on all interactive controls
 * - Status badge uses compact ubos-status-chip class
 * - Undock placeholder tooltip replaced with aria-describedby pattern
 * - Consistent border-radius via design tokens
 *
 * 3.15E patch (PR-E): header vertical padding increased from py-1 (4px) to
 * py-2 (8px) for improved touch target size and visual breathing room.
 * No layout logic, geometry, or preset changes.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@ubos/ui';

export type DockablePanelStatusTone = 'live' | 'ready' | 'warning' | 'neutral';

export type DockablePanelStatus = {
  tone: DockablePanelStatusTone;
  label?: string;
};

const statusDotClass: Record<DockablePanelStatusTone, string> = {
  live: 'bg-ubos-program animate-[ubos-status-pulse_1.5s_ease-in-out_infinite]',
  ready: 'bg-ubos-preview',
  warning: 'bg-amber-400 animate-[ubos-status-pulse_2s_ease-in-out_infinite]',
  neutral: 'bg-ubos-fg-muted/40',
};

const statusBadgeClass: Record<DockablePanelStatusTone, string> = {
  live: 'border-ubos-program-border/50 bg-ubos-program-muted text-ubos-program-text',
  ready: 'border-ubos-preview-border/50 bg-ubos-preview-muted text-ubos-preview-text',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  neutral: 'border-ubos-border-subtle bg-ubos-midnight/60 text-ubos-fg-muted',
};

function HeaderIconButton({
  label,
  describedBy,
  onClick,
  children,
  active = false,
}: {
  label: string;
  describedBy?: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-describedby={describedBy}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-ubos-sm text-ubos-fg-muted',
        'transition-colors duration-[var(--ubos-duration-fast)]',
        'hover:bg-ubos-midnight hover:text-ubos-fg-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
        active && 'bg-ubos-selection-muted text-ubos-selection-text',
      )}
    >
      {children}
    </button>
  );
}

export function DockablePanel({
  title,
  status,
  collapsed,
  collapsible = true,
  closable = false,
  onToggleCollapse,
  onHide,
  headerActions,
  children,
  bodyClassName,
  className,
}: {
  title: string;
  status?: DockablePanelStatus;
  collapsed: boolean;
  collapsible?: boolean;
  closable?: boolean;
  onToggleCollapse?: () => void;
  onHide?: () => void;
  headerActions?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  const undockId = useId();
  const [undockNotice, setUndockNotice] = useState(false);
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    },
    [],
  );

  const showUndockNotice = useCallback(() => {
    setUndockNotice(true);
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    noticeTimeout.current = setTimeout(() => setUndockNotice(false), 1800);
  }, []);

  return (
    <section
      className={cn(
        'relative flex min-h-0 min-w-0 flex-col overflow-hidden',
        'rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite',
        'shadow-[var(--ubos-elevation-panel)]',
        className,
      )}
      aria-label={title}
    >
      {/* ── Panel header ─────────────────────────────────────────────── */}
      <header
        className={cn(
          'flex shrink-0 items-center gap-1.5 px-2 py-2',
          'border-b border-ubos-border-subtle',
          'bg-gradient-to-b from-ubos-midnight/90 to-ubos-midnight/70',
        )}
      >
        {status ? (
          <span
            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass[status.tone])}
            aria-hidden="true"
          />
        ) : null}

        {/* Title — one-level hierarchy: panel titles use a distinct weight */}
        <h3
          className={cn(
            'min-w-0 flex-1 truncate',
            'text-[10px] font-black uppercase tracking-[0.12em]',
            'text-ubos-fg-primary',
          )}
        >
          {title}
        </h3>

        {status?.label ? (
          <span
            className={cn(
              'shrink-0 rounded-full border px-1.5 py-px',
              'text-[9px] font-bold uppercase tracking-[0.08em]',
              statusBadgeClass[status.tone],
            )}
            aria-label={`Status: ${status.label}`}
          >
            {status.label}
          </span>
        ) : null}

        {headerActions}

        {collapsible && onToggleCollapse ? (
          <HeaderIconButton
            label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            onClick={onToggleCollapse}
          >
            <span
              className={cn(
                'text-[10px] leading-none transition-transform duration-[var(--ubos-duration-fast)]',
                collapsed ? 'rotate-180' : 'rotate-0',
              )}
              aria-hidden="true"
            >
              ▾
            </span>
          </HeaderIconButton>
        ) : null}

        <HeaderIconButton
          label="Undock panel (coming soon)"
          {...(undockNotice ? { describedBy: undockId } : {})}
          onClick={showUndockNotice}
          active={undockNotice}
        >
          <span className="text-[10px] leading-none" aria-hidden="true">
            ⧉
          </span>
        </HeaderIconButton>

        {closable && onHide ? (
          <HeaderIconButton label={`Hide ${title}`} onClick={onHide}>
            <span className="text-[10px] leading-none" aria-hidden="true">
              ✕
            </span>
          </HeaderIconButton>
        ) : null}
      </header>

      {/* Undock notice tooltip — top-9 (36 px) clears the py-2 header (8+20+8 px). */}
      {undockNotice ? (
        <div
          id={undockId}
          role="status"
          aria-live="polite"
          className={cn(
            'pointer-events-none absolute right-1.5 top-9 z-20',
            'rounded-ubos-sm border border-ubos-border-default bg-ubos-carbon',
            'px-2 py-1 text-[10px] font-medium text-ubos-fg-secondary',
            'shadow-[var(--ubos-shadow-raised)]',
            'animate-[ubos-slide-up_180ms_var(--ubos-easing-out)_forwards]',
          )}
        >
          Undock coming soon
        </div>
      ) : null}

      {/* ── Collapsible body ─────────────────────────────────────────── */}
      {/* Children stay mounted while collapsed so existing panel state
          (forms, scroll positions, subscriptions) is fully preserved. */}
      <div
        className={cn(
          'grid',
          'transition-[grid-template-rows] duration-[var(--ubos-duration-normal)] ease-[var(--ubos-easing-out)]',
          collapsed ? 'grid-rows-[0fr]' : 'min-h-0 flex-1 grid-rows-[1fr]',
        )}
        aria-hidden={collapsed}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={cn('ubos-scroll h-full min-h-0 overflow-auto', bodyClassName)}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
