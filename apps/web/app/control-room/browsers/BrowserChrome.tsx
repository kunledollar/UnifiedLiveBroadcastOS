'use client';

import type { ReactNode } from 'react';
import { BroadcastButton, cn, ubosTypographyClasses } from '@ubos/ui';

export function BrowserSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex min-h-0 flex-col gap-ubos-2', className)}>
      <div className="flex items-center justify-between gap-ubos-2">
        <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>{title}</h2>
        {action}
      </div>
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
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'ghost' | 'danger';
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
      className="min-w-0 px-1.5"
    >
      {label}
    </BroadcastButton>
  );
}

export function SceneThumbnail({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ubos-midnight to-ubos-carbon">
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{label}</span>
    </div>
  );
}
