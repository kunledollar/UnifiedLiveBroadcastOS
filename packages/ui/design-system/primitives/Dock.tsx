import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';

export function Dock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        'flex h-[var(--ubos-dock-height)] shrink-0 items-stretch border-t border-ubos-border bg-ubos-graphite',
        className,
      )}
      role="tablist"
      aria-label="Production dock"
    >
      {children}
    </nav>
  );
}

export function DockTab({
  label,
  active = false,
  onClick,
  className,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'relative flex items-center px-ubos-4',
        ubosTypographyClasses.caption,
        'border-r border-ubos-border-subtle transition-colors duration-ubos-fast',
        active
          ? 'bg-ubos-midnight text-ubos-fg-primary'
          : 'text-ubos-fg-muted hover:bg-ubos-slate hover:text-ubos-fg-secondary',
        className,
      )}
    >
      {active ? (
        <span className="absolute inset-x-0 top-0 h-0.5 bg-ubos-selection" aria-hidden="true" />
      ) : null}
      {label}
    </button>
  );
}

export function AssetList({
  children,
  className,
  emptyMessage = 'No items',
  isEmpty = false,
}: {
  children: ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}) {
  if (isEmpty) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-ubos-8',
          ubosTypographyClasses.caption,
          'text-ubos-fg-muted',
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className={cn('ubos-scroll flex flex-col gap-px overflow-y-auto', className)} role="list">
      {children}
    </ul>
  );
}

export function AssetRow({
  thumbnail,
  title,
  subtitle,
  status,
  selected = false,
  onClick,
  action,
  className,
}: {
  thumbnail?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  action?: ReactNode;
  className?: string;
}) {
  const interactive = Boolean(onClick);
  const hasNestedActions = Boolean(action);

  const rowClassName = cn(
    'flex w-full items-center gap-ubos-3 rounded-ubos-sm px-ubos-2 py-ubos-2 text-left',
    'transition-colors duration-ubos-fast',
    selected
      ? 'bg-ubos-selection-muted border border-ubos-selection-border'
      : 'border border-transparent hover:bg-ubos-midnight',
    className,
  );

  const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const rowBody = (
    <>
      {thumbnail ? (
        <div className="h-9 w-16 shrink-0 overflow-hidden rounded-ubos-sm bg-ubos-carbon">
          {thumbnail}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
          {title}
        </div>
        {subtitle ? (
          <div className={cn(ubosTypographyClasses.metadata, 'ubos-truncate')}>{subtitle}</div>
        ) : null}
      </div>
      {status ? <div className="shrink-0">{status}</div> : null}
    </>
  );

  if (interactive) {
    return (
      <li className={rowClassName}>
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={handleRowKeyDown}
          className={cn(
            'flex min-w-0 items-center gap-ubos-3 outline-none focus-visible:rounded-ubos-sm focus-visible:ring-1 focus-visible:ring-ubos-selection-border',
            hasNestedActions ? 'flex-1' : 'w-full',
          )}
        >
          {rowBody}
        </div>
        {hasNestedActions ? (
          <div
            className="shrink-0"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {action}
          </div>
        ) : null}
      </li>
    );
  }

  return (
    <li className={rowClassName}>
      {rowBody}
      {action ? <div className="shrink-0">{action}</div> : null}
    </li>
  );
}
