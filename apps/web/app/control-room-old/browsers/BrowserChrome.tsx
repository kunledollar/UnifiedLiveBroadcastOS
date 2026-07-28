'use client';

import type { ReactNode } from 'react';
import { BroadcastButton, cn, ubosTypographyClasses } from '@ubos/ui';

export function BrowserSection({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex min-h-0 flex-col gap-ubos-2', className)}>
      {title ? (
        <div className="flex items-center justify-between gap-ubos-2">
          <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>{title}</h2>
          {action}
        </div>
      ) : action ? (
        <div className="flex justify-end">{action}</div>
      ) : null}
      {children}
    </section>
  );
}

export function BrowserToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  activeFilter,
  onFilterChange,
  sort,
  onSortChange,
  sortOptions,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{ id: string; label: string }>;
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  sort?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-ubos-2', className)}>
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className={cn(
          'w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-ubos-2 py-1.5',
          ubosTypographyClasses.caption,
          'text-ubos-fg-primary placeholder:text-ubos-fg-muted outline-none focus:border-ubos-selection-border',
        )}
        aria-label={searchPlaceholder}
      />
      {filters?.length ? (
        <div className="flex flex-wrap gap-1">
          {filters.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange?.(filter.id)}
                className={cn(
                  'rounded-ubos-sm px-2 py-0.5 text-ubos-metadata font-medium transition-colors duration-ubos-fast',
                  active
                    ? 'bg-ubos-selection-muted text-ubos-selection-text'
                    : 'bg-ubos-midnight text-ubos-fg-muted hover:text-ubos-fg-secondary',
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {sortOptions?.length ? (
        <label className={cn('flex items-center gap-ubos-2', ubosTypographyClasses.metadata)}>
          <span className="text-ubos-fg-muted">Sort</span>
          <select
            value={sort}
            onChange={(event) => onSortChange?.(event.target.value)}
            className="min-w-0 flex-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-ubos-2 py-1 text-ubos-fg-secondary outline-none focus:border-ubos-selection-border"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

export function CompactRowActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex shrink-0 items-center gap-0.5', className)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

export function RowIconButton({
  label,
  onClick,
  disabled = false,
  variant = 'ghost',
  icon,
  compact = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'ghost' | 'danger';
  icon?: string;
  compact?: boolean;
}) {
  return (
    <BroadcastButton
      type="button"
      size="sm"
      variant={variant === 'danger' ? 'danger' : 'ghost'}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      className={cn('min-w-0', compact ? 'flex-col gap-0 px-1 py-0.5 text-[8px]' : 'px-1.5')}
    >
      {icon ? (
        <>
          <span className="text-xs leading-none" aria-hidden="true">
            {icon}
          </span>
          {compact ? <span>{label}</span> : null}
        </>
      ) : (
        label
      )}
    </BroadcastButton>
  );
}

export function SceneThumbnail({
  label,
  tally,
  compact = false,
}: {
  label: string;
  tally?: 'program' | 'preview' | null;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center bg-gradient-to-br from-ubos-midnight to-ubos-carbon',
        compact && 'text-[9px]',
      )}
    >
      {tally ? (
        <span
          className={cn(
            'absolute left-1 top-1 h-2 w-2 rounded-full ring-1 ring-black/40',
            tally === 'program' ? 'bg-ubos-program' : 'bg-ubos-preview',
          )}
          aria-hidden="true"
        />
      ) : null}
      {tally ? (
        <span
          className={cn(
            'absolute right-1 top-0.5 rounded-ubos-sm px-1 py-px text-[0.5rem] font-bold uppercase tracking-wide',
            tally === 'program'
              ? 'bg-ubos-program-muted text-ubos-program-text'
              : 'bg-ubos-preview-muted text-ubos-preview-text',
          )}
        >
          {tally === 'program' ? 'PGM' : 'PVW'}
        </span>
      ) : null}
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{label}</span>
    </div>
  );
}

export function SceneRowOverflowMenu({
  onDuplicate,
  onRename,
  onDelete,
  deleteDisabled = false,
  compact = false,
}: {
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
  compact?: boolean;
}) {
  return (
    <details className="group relative" onClick={(event) => event.stopPropagation()}>
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-center rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight font-bold text-ubos-fg-muted hover:bg-ubos-slate hover:text-ubos-fg-secondary',
          compact ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-ubos-metadata',
        )}
        aria-label="Scene actions"
        onClick={(event) => event.stopPropagation()}
      >
        ⋯
      </summary>
      <div className="absolute right-0 z-20 mt-1 grid min-w-28 gap-0.5 rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-1 text-ubos-caption shadow-ubos-raised">
        <button
          type="button"
          className="rounded-ubos-sm px-2 py-1 text-left text-ubos-fg-secondary hover:bg-ubos-midnight"
          onClick={(event) => {
            event.stopPropagation();
            onDuplicate();
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="rounded-ubos-sm px-2 py-1 text-left text-ubos-fg-secondary hover:bg-ubos-midnight"
          onClick={(event) => {
            event.stopPropagation();
            onRename();
          }}
        >
          Rename
        </button>
        <button
          type="button"
          disabled={deleteDisabled}
          className="rounded-ubos-sm px-2 py-1 text-left text-ubos-error-text hover:bg-ubos-error-muted disabled:cursor-not-allowed disabled:opacity-40"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </button>
      </div>
    </details>
  );
}
