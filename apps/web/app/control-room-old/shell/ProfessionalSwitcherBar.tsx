'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';

export function ProfessionalSwitcherBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'shrink-0 border-t border-ubos-border-subtle bg-ubos-graphite',
        'min-h-[var(--ubos-switcher-height)] overflow-y-auto overflow-x-hidden',
        className,
      )}
      aria-label="Production switcher"
    >
      {children}
    </section>
  );
}
