'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';

function PanelIcon({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded text-slate-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-slate-300 group-hover/panel-header:opacity-100"
    >
      {children}
    </button>
  );
}

export function DockablePanel({
  title,
  subtitle,
  accent,
  collapsed,
  undocked,
  onToggleCollapse,
  onToggleUndock,
  children,
  className,
  headerActions,
  compactHeader = false,
}: {
  title: string;
  subtitle?: string;
  accent?: 'program' | 'preview' | 'route' | 'neutral';
  collapsed: boolean;
  undocked?: boolean;
  onToggleCollapse: () => void;
  onToggleUndock: () => void;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  compactHeader?: boolean;
}) {
  const resolvedUndocked = undocked ?? false;
  const accentBorder =
    accent === 'program'
      ? 'border-red-600/40'
      : accent === 'preview'
        ? 'border-emerald-500/40'
        : accent === 'route'
          ? 'border-indigo-500/40'
          : 'border-white/8';

  const accentGlow =
    accent === 'program'
      ? 'shadow-[0_0_24px_rgba(220,38,38,0.12)]'
      : accent === 'preview'
        ? 'shadow-[0_0_20px_rgba(16,185,129,0.1)]'
        : accent === 'route'
          ? 'shadow-[0_0_16px_rgba(99,102,241,0.1)]'
          : '';

  return (
    <section
      className={cn(
        'group/panel flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-[#050810]',
        accentBorder,
        accentGlow,
        resolvedUndocked && 'fixed z-50 w-80 shadow-2xl',
        className,
      )}
    >
      <header
        className={cn(
          'group/panel-header flex shrink-0 items-center justify-between border-b border-white/6 bg-[#070b12]/95 px-2',
          compactHeader ? 'py-1' : 'py-1.5',
        )}
      >
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-black uppercase tracking-[0.14em] text-slate-200">{title}</h3>
          {subtitle && !collapsed ? (
            <p className="truncate text-[10px] text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {headerActions}
          <PanelIcon label={collapsed ? 'Expand panel' : 'Collapse panel'} onClick={onToggleCollapse}>
            <span className="text-[10px] leading-none">{collapsed ? '▾' : '▴'}</span>
          </PanelIcon>
          <PanelIcon label={resolvedUndocked ? 'Dock panel' : 'Undock panel'} onClick={onToggleUndock}>
            <span className="text-[10px] leading-none">{resolvedUndocked ? '⊡' : '⊞'}</span>
          </PanelIcon>
        </div>
      </header>
      {!collapsed ? (
        <div className="ubos-scroll min-h-0 flex-1 overflow-auto">{children}</div>
      ) : null}
    </section>
  );
}
