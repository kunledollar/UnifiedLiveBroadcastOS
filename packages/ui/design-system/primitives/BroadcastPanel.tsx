import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';

type BroadcastPanelVariant = 'default' | 'inset' | 'raised';

export function BroadcastPanel({
  children,
  className,
  variant = 'default',
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  variant?: BroadcastPanelVariant;
  padding?: boolean;
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
      {children}
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
