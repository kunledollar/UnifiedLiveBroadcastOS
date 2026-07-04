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
        'h-[var(--ubos-switcher-height)] min-h-[var(--ubos-switcher-height)] max-h-[var(--ubos-switcher-height)] overflow-hidden',
        className,
      )}
      aria-label="Production switcher"
    >
      {children}
    </section>
  );
}
