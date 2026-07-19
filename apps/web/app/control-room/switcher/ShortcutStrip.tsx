'use client';

import { memo } from 'react';
import { cn, ubosTypographyClasses } from '@ubos/ui';
import { switcherShortcuts } from './switcher-config';

export const ShortcutStrip = memo(function ShortcutStrip({ className }: { className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Shortcuts</span>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {switcherShortcuts.map((shortcut) => (
          <span
            key={shortcut.key}
            className="inline-flex items-center gap-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-1.5 py-0.5"
          >
            <kbd className={cn(ubosTypographyClasses.metadata, 'font-mono font-bold text-ubos-fg-secondary')}>
              {shortcut.key}
            </kbd>
            <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
              {shortcut.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
});
