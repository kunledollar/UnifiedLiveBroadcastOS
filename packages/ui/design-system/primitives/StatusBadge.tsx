import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';
import { ubosStatusToken, type UbosSemanticToken, type UbosStatus } from '../tokens/colors.js';

type StatusBadgeVariant = UbosSemanticToken | UbosStatus | 'neutral' | 'rec';

const variantClasses: Record<StatusBadgeVariant, string> = {
  program: 'border-ubos-program-border bg-ubos-program-muted text-ubos-program-text',
  preview: 'border-ubos-preview-border bg-ubos-preview-muted text-ubos-preview-text',
  selection: 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text',
  automation: 'border-ubos-automation-border bg-ubos-automation-muted text-ubos-automation-text',
  graphics: 'border-ubos-graphics-border bg-ubos-graphics-muted text-ubos-graphics-text',
  replay: 'border-ubos-replay-border bg-ubos-replay-muted text-ubos-replay-text',
  warning: 'border-ubos-warning-border bg-ubos-warning-muted text-ubos-warning-text',
  recording: 'border-ubos-recording-border bg-ubos-recording-muted text-ubos-recording-text',
  offline: 'border-ubos-offline-border bg-ubos-offline-muted text-ubos-offline-text',
  success: 'border-ubos-success-border bg-ubos-success-muted text-ubos-success-text',
  error: 'border-ubos-error-border bg-ubos-error-muted text-ubos-error-text',
  neutral: 'border-ubos-border bg-ubos-midnight text-ubos-fg-secondary',
  live: 'border-ubos-program-border bg-ubos-program text-white',
  rec: 'border-ubos-recording-border bg-ubos-recording text-white animate-ubos-recording-pulse',
  ready: 'border-ubos-success-border bg-ubos-success-muted text-ubos-success-text',
  critical: 'border-ubos-error-border bg-ubos-error-muted text-ubos-error-text',
  streaming: 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text',
  idle: 'border-ubos-border bg-ubos-midnight text-ubos-fg-secondary',
  disabled: 'border-ubos-offline-border bg-ubos-offline-muted text-ubos-offline-text',
  selected: 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text',
  hover: 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text',
  focus: 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text',
  information: 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text',
  armed: 'border-ubos-preview-border bg-ubos-preview-muted text-ubos-preview-text',
  blocked: 'border-ubos-error-border bg-ubos-error-muted text-ubos-error-text',
};

export function StatusBadge({
  children,
  variant = 'neutral',
  dot = false,
  className,
}: {
  children: ReactNode;
  variant?: StatusBadgeVariant;
  dot?: boolean;
  className?: string;
}) {
  const semanticVariant = variant === 'rec' ? variant : (ubosStatusToken[variant as UbosStatus] ?? variant);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-ubos-sm border px-1.5 py-0.5',
        ubosTypographyClasses.metadata,
        variantClasses[semanticVariant],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            semanticVariant === 'program'
              ? 'bg-ubos-program'
              : semanticVariant === 'preview'
                ? 'bg-ubos-preview'
                : semanticVariant === 'rec' || semanticVariant === 'recording'
                  ? 'bg-ubos-recording'
                  : 'bg-ubos-fg-muted',
            (semanticVariant === 'program' || semanticVariant === 'rec') &&
              'animate-ubos-tally-pulse',
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

export function TelemetryBadge({
  label,
  value,
  variant = 'neutral',
  className,
}: {
  label: string;
  value: ReactNode;
  variant?: StatusBadgeVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-ubos-2 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-ubos-2 py-1',
        className,
      )}
    >
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{label}</span>
      <StatusBadge variant={variant}>{value}</StatusBadge>
    </div>
  );
}
