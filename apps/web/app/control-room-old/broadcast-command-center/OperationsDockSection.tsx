'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';

export function OperationsDockSection({
  title,
  badge,
  collapsed,
  onToggle,
  children,
  sectionId,
}: {
  title: string;
  badge?: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
  sectionId: string;
}) {
  return (
    <section
      id={`ops-section-${sectionId}`}
      className="overflow-hidden rounded-ubos-sm border border-white/6 bg-[#060a12]"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={`ops-section-body-${sectionId}`}
        className="flex w-full items-center justify-between gap-1 px-2 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-ubos-fg-primary">
          {title}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {badge ? (
            <span className="rounded bg-cyan-500/10 px-1 py-px font-mono text-[9px] font-bold text-cyan-300">
              {badge}
            </span>
          ) : null}
          <span className="text-[10px] text-ubos-fg-muted" aria-hidden="true">
            {collapsed ? '▸' : '▾'}
          </span>
        </span>
      </button>
      {!collapsed ? (
        <div
          id={`ops-section-body-${sectionId}`}
          className={cn('border-t border-white/6 p-1.5', 'max-h-72 overflow-y-auto ubos-scroll')}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
