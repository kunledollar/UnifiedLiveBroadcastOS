'use client';

/**
 * UBOS 3.15B — Command Center dockable panel wrapper.
 *
 * Pure layout chrome around an EXISTING Control Room panel. The wrapped
 * component is passed in as children and is never modified: this wrapper
 * only adds a header (title, status, collapse, hide, undock placeholder)
 * and collapse behavior. Children stay mounted while collapsed so panel
 * state is preserved.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@ubos/ui';

export type DockablePanelStatusTone = 'live' | 'ready' | 'warning' | 'neutral';

export type DockablePanelStatus = {
  tone: DockablePanelStatusTone;
  label?: string;
};

const statusDotClass: Record<DockablePanelStatusTone, string> = {
  live: 'bg-ubos-program',
  ready: 'bg-ubos-preview',
  warning: 'bg-amber-400',
  neutral: 'bg-ubos-fg-muted/50',
};

const statusBadgeClass: Record<DockablePanelStatusTone, string> = {
  live: 'border-ubos-program-border/50 bg-ubos-program-muted text-ubos-program-text',
  ready: 'border-ubos-preview-border/50 bg-ubos-preview-muted text-ubos-preview-text',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  neutral: 'border-ubos-border-subtle bg-ubos-midnight text-ubos-fg-muted',
};

function HeaderIconButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-ubos-sm text-ubos-fg-muted transition-colors hover:bg-ubos-midnight hover:text-ubos-fg-primary',
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
  // Undock is a placeholder in 3.15B: no separate window is created and no
  // runtime handles move anywhere — we only surface a "coming soon" state.
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
        'relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite',
        className,
      )}
      aria-label={title}
    >
      <header className="flex shrink-0 items-center gap-1.5 border-b border-ubos-border-subtle bg-ubos-midnight/80 px-2 py-1">
        {status ? (
          <span
            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass[status.tone])}
            aria-hidden="true"
          />
        ) : null}
        <h3 className="min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-ubos-fg-primary">
          {title}
        </h3>
        {status?.label ? (
          <span
            className={cn(
              'shrink-0 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wide',
              statusBadgeClass[status.tone],
            )}
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
            <span className="text-[10px] leading-none" aria-hidden="true">
              {collapsed ? '▾' : '▴'}
            </span>
          </HeaderIconButton>
        ) : null}
        <HeaderIconButton
          label={`Undock ${title} (coming soon)`}
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

      {undockNotice ? (
        <div className="pointer-events-none absolute right-1.5 top-7 z-20 rounded-ubos-sm border border-ubos-border-default bg-ubos-carbon px-2 py-1 text-[10px] font-medium text-ubos-fg-secondary shadow-ubos-raised">
          Undock coming soon
        </div>
      ) : null}

      {/* Children stay mounted while collapsed so existing panel state
          (forms, scroll positions, subscriptions) is fully preserved. */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
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
