import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';

type BroadcastButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'program' | 'preview';
type BroadcastButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<BroadcastButtonVariant, string> = {
  primary: 'bg-ubos-accent text-white hover:bg-ubos-accent-hover border-transparent',
  secondary:
    'bg-ubos-midnight text-ubos-fg-primary hover:bg-ubos-slate border-ubos-border',
  danger: 'bg-ubos-error text-white hover:opacity-90 border-transparent',
  ghost:
    'bg-transparent text-ubos-fg-secondary hover:bg-ubos-midnight hover:text-ubos-fg-primary border-ubos-border-subtle',
  program: 'bg-ubos-program text-white hover:opacity-90 border-ubos-program-border',
  preview: 'bg-ubos-preview text-ubos-carbon hover:opacity-90 border-ubos-preview-border',
};

const sizeClasses: Record<BroadcastButtonSize, string> = {
  sm: 'h-7 px-ubos-2 text-[0.625rem]',
  md: 'h-9 px-ubos-3 text-xs',
  lg: 'h-11 px-ubos-4 text-sm',
};

export function BroadcastButton({
  children,
  variant = 'secondary',
  size = 'md',
  active = false,
  className,
  type,
  formAction,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BroadcastButtonVariant;
  size?: BroadcastButtonSize;
  active?: boolean;
}) {
  return (
    <button
      type={formAction ? type : (type ?? 'button')}
      formAction={formAction}
      className={cn(
        'inline-flex items-center justify-center gap-ubos-2 rounded-ubos-sm border font-semibold',
        'transition-colors duration-ubos-fast ease-ubos-default',
        'disabled:pointer-events-none disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        active && 'shadow-ubos-selection-glow border-ubos-selection-border',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Toolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-ubos-2 border-b border-ubos-border-subtle bg-ubos-graphite px-ubos-3 py-ubos-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function OperationCard({
  title,
  description,
  action,
  children,
  selected = false,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  selected?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'rounded-ubos-md border bg-ubos-graphite p-ubos-3 transition-colors duration-ubos-fast',
        selected
          ? 'border-ubos-selection-border shadow-ubos-selection-glow'
          : 'border-ubos-border-subtle hover:border-ubos-border',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-ubos-2">
        <div className="min-w-0 flex-1">
          <h3 className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
            {title}
          </h3>
          {description ? (
            <p className={cn(ubosTypographyClasses.metadata, 'mt-0.5 ubos-truncate')}>
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="mt-ubos-2">{children}</div> : null}
    </article>
  );
}

export function InspectorRow({
  label,
  value,
  action,
  className,
}: {
  label: ReactNode;
  value?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-ubos-3 border-b border-ubos-border-subtle py-ubos-2 last:border-b-0',
        className,
      )}
    >
      <span className={cn(ubosTypographyClasses.caption, 'shrink-0 text-ubos-fg-muted')}>
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-ubos-2">
        {value ? (
          <span className={cn(ubosTypographyClasses.body, 'ubos-truncate text-right')}>
            {value}
          </span>
        ) : null}
        {action}
      </div>
    </div>
  );
}

export function ConsoleSection({
  title,
  children,
  action,
  collapsed = false,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <section className={cn('border-b border-ubos-border-subtle', className)}>
      <div className="flex items-center justify-between gap-ubos-2 px-ubos-3 py-ubos-2">
        <h3 className={ubosTypographyClasses.section}>{title}</h3>
        {action}
      </div>
      {!collapsed ? <div className="px-ubos-3 pb-ubos-3">{children}</div> : null}
    </section>
  );
}
