'use client';

import { cn, ubosTypographyClasses } from '@ubos/ui';

export function DockPanelEmpty({ message }: { message: string }) {
  return (
    <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>{message}</p>
  );
}

export function DockPanelTags({ items }: { items: string[] }) {
  if (!items.length) return <DockPanelEmpty message="No items loaded." />;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-ubos-sm border border-ubos-border-subtle px-2 py-0.5 text-ubos-metadata text-ubos-fg-secondary"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
