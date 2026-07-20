import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';

type BroadcastPanelVariant = 'default' | 'inset' | 'raised';

export function BroadcastPanel({
  children,
  className,
  variant = 'default',
  padding = true,
  title,
  subtitle,
  icon,
  status,
  actions,
  footer,
  loading = false,
  empty,
  warning,
  error,
}: {
  children: ReactNode;
  className?: string;
  variant?: BroadcastPanelVariant;
  padding?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  empty?: ReactNode;
  warning?: ReactNode;
  error?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-ubos-md border border-ubos-border bg-ubos-graphite',
        variant === 'inset' && 'shadow-ubos-inset bg-ubos-carbon',
        variant === 'raised' && 'shadow-ubos-raised',
        variant === 'default' && 'shadow-ubos-panel',
        padding && 'p-ubos-3',
        className,
      )}
    >
      {title ? <header className="flex items-start gap-ubos-2 border-b border-ubos-border-subtle px-ubos-3 py-ubos-2"><span className="text-ubos-fg-secondary">{icon}</span><div className="min-w-0 flex-1"><h2 className={ubosTypographyClasses.panel}>{title}</h2>{subtitle ? <p className={cn(ubosTypographyClasses.metadata, 'mt-0.5')}>{subtitle}</p> : null}</div>{status}{actions ? <div className="flex shrink-0 items-center gap-ubos-1">{actions}</div> : null}</header> : null}
      {warning ? <div role="status" className="border-b border-ubos-warning-border bg-ubos-warning-muted px-ubos-3 py-ubos-2 text-ubos-warning-text">{warning}</div> : null}
      {error ? <div role="alert" className="border-b border-ubos-error-border bg-ubos-error-muted px-ubos-3 py-ubos-2 text-ubos-error-text">{error}</div> : null}
      {loading ? <div aria-busy="true" className="p-ubos-3"><div className="h-12 animate-pulse rounded-ubos-sm bg-ubos-midnight" /></div> : empty ? <div className="p-ubos-3">{empty}</div> : children}
      {footer ? <footer className="border-t border-ubos-border-subtle px-ubos-3 py-ubos-2">{footer}</footer> : null}
    </section>
  );
}

export function BroadcastHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle pb-ubos-2',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h2 className={cn(ubosTypographyClasses.section, 'ubos-truncate')}>{title}</h2>
        {subtitle ? (
          <p className={cn(ubosTypographyClasses.metadata, 'mt-0.5 ubos-truncate')}>{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function PanelDivider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-ubos-border-subtle', className)} />;
}
