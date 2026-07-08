'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import { broadcastSurfaces } from './broadcast-theme';

export function BroadcastPanelShell({
  title,
  subtitle,
  accent = 'neutral',
  children,
  className,
  headerActions,
}: {
  title: string;
  subtitle?: string;
  accent?: 'program' | 'preview' | 'route' | 'telemetry' | 'neutral';
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
}) {
  const accentBorder =
    accent === 'program'
      ? 'border-red-600/35'
      : accent === 'preview'
        ? 'border-emerald-500/35'
        : accent === 'route'
          ? 'border-indigo-500/35'
          : accent === 'telemetry'
            ? 'border-cyan-500/30'
            : 'border-ubos-border-subtle';

  const accentGlow =
    accent === 'program'
      ? 'shadow-[0_0_28px_rgba(220,38,38,0.1)]'
      : accent === 'preview'
        ? 'shadow-[0_0_22px_rgba(16,185,129,0.08)]'
        : accent === 'route'
          ? 'shadow-[0_0_18px_rgba(99,102,241,0.1)]'
          : accent === 'telemetry'
            ? 'shadow-[0_0_16px_rgba(34,211,238,0.08)]'
            : '';

  return (
    <section
      className={cn(
        'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-ubos-md border',
        broadcastSurfaces.panel,
        accentBorder,
        accentGlow,
        className,
      )}
    >
      <header
        className={cn(
          'flex shrink-0 items-center justify-between border-b px-ubos-2 py-2',
          broadcastSurfaces.panelHeader,
        )}
      >
        <div className="min-w-0">
          <h3 className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-ubos-fg-primary">
            {title}
          </h3>
          {subtitle ? (
            <p className="truncate text-[10px] text-ubos-fg-muted">{subtitle}</p>
          ) : null}
        </div>
        {headerActions ? <div className="flex shrink-0 items-center gap-1">{headerActions}</div> : null}
      </header>
      <div className="ubos-scroll min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
