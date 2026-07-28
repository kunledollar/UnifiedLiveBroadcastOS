'use client';

import { cn, ubosTypographyClasses } from '@ubos/ui';

export function SwitcherHistory({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  if (!items.length) {
    return (
      <div className={cn('min-w-0', className)}>
        <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>History</span>
        <p className={cn(ubosTypographyClasses.metadata, 'mt-0.5 text-ubos-fg-muted')}>No transitions executed</p>
      </div>
    );
  }

  return (
    <div className={cn('min-w-0', className)}>
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>History</span>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={cn(
              'rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight px-1.5 py-0.5 font-mono font-bold uppercase',
              ubosTypographyClasses.metadata,
              index === 0 ? 'text-ubos-selection-text' : 'text-ubos-fg-muted',
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
