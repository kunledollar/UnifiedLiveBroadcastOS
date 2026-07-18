'use client';

import { memo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn, ubosTypographyClasses } from '@ubos/ui';

export type HardwareButtonTone = 'cut' | 'auto' | 'take' | 'utility' | 'disabled';

const toneClasses: Record<HardwareButtonTone, string> = {
  cut: [
    'border-ubos-program-border bg-ubos-program text-white',
    'shadow-[inset_0_-3px_0_rgba(0,0,0,0.35),0_0_16px_var(--ubos-program-glow)]',
    'hover:brightness-110',
    'active:translate-y-px active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]',
  ].join(' '),
  auto: [
    'border-ubos-warning-border bg-ubos-warning text-ubos-carbon',
    'shadow-[inset_0_-3px_0_rgba(0,0,0,0.28),0_0_12px_rgba(245,158,11,0.2)]',
    'hover:brightness-105',
    'active:translate-y-px active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)]',
  ].join(' '),
  take: [
    'border-ubos-selection-border bg-ubos-selection text-white',
    'shadow-[inset_0_-3px_0_rgba(0,0,0,0.32),0_0_18px_var(--ubos-selection-glow)]',
    'hover:brightness-110',
    'active:translate-y-px active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]',
  ].join(' '),
  utility: [
    'border-ubos-border bg-ubos-midnight text-ubos-fg-secondary',
    'shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)]',
    'hover:bg-ubos-slate hover:text-ubos-fg-primary',
    'active:translate-y-px active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]',
  ].join(' '),
  disabled: 'cursor-not-allowed border-ubos-border-subtle bg-ubos-carbon text-ubos-fg-disabled shadow-none',
};

export const HardwareButton = memo(function HardwareButton({
  children,
  tone = 'utility',
  size = 'lg',
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: HardwareButtonTone;
  size?: 'md' | 'lg';
  children: ReactNode;
}) {
  const resolvedTone = disabled ? 'disabled' : tone;
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'inline-flex min-w-0 items-center justify-center rounded-ubos-md border font-black uppercase tracking-[0.14em]',
        'transition-all duration-ubos-fast ease-ubos-default',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ubos-selection',
        size === 'lg' ? 'h-11 min-w-[4.5rem] px-ubos-4 text-xs' : 'h-9 min-w-[3.5rem] px-ubos-3 text-[0.625rem]',
        ubosTypographyClasses.metadata,
        toneClasses[resolvedTone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export const HardwareButtonGroup = memo(function HardwareButtonGroup({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-ubos-1', className)}>
      {label ? (
        <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{label}</span>
      ) : null}
      <div className="flex flex-wrap items-stretch gap-ubos-2">{children}</div>
    </div>
  );
});
