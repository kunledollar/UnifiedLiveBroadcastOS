import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';

export type MonitorTally = 'program' | 'preview' | 'idle' | 'offline';

const tallyBorderClasses: Record<MonitorTally, string> = {
  program: 'border-ubos-program-border shadow-ubos-program-glow',
  preview: 'border-ubos-preview-border shadow-ubos-preview-glow',
  idle: 'border-ubos-border',
  offline: 'border-ubos-offline-border opacity-70',
};

const tallyLabelClasses: Record<MonitorTally, string> = {
  program: 'text-ubos-program-text',
  preview: 'text-ubos-preview-text',
  idle: 'text-ubos-fg-muted',
  offline: 'text-ubos-offline-text',
};

export function MonitorFrame({
  children,
  tally = 'idle',
  label,
  aspectRatio = '16/9',
  className,
  header,
  footer,
}: {
  children?: ReactNode;
  tally?: MonitorTally;
  label?: string;
  aspectRatio?: '16/9' | '9/16' | '1/1' | 'auto';
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  const aspectClass =
    aspectRatio === '16/9'
      ? 'aspect-video'
      : aspectRatio === '9/16'
        ? 'aspect-[9/16]'
        : aspectRatio === '1/1'
          ? 'aspect-square'
          : '';

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {header ?? (label ? <MonitorHeader label={label} tally={tally} /> : null)}
      <div
        className={cn(
          'relative min-h-0 flex-1 overflow-hidden rounded-ubos-lg border-2 bg-black shadow-ubos-monitor',
          aspectClass,
          tallyBorderClasses[tally],
        )}
      >
        {children ?? (
          <div className="flex h-full w-full items-center justify-center bg-ubos-carbon">
            <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
              No signal
            </span>
          </div>
        )}
        <MonitorOverlay />
      </div>
      {footer}
    </div>
  );
}

export function MonitorHeader({ label, tally }: { label: string; tally: MonitorTally }) {
  const showBroadcastLabel = tally === 'program' || tally === 'preview';
  const broadcastLabel = tally === 'program' ? 'PROGRAM' : tally === 'preview' ? 'PREVIEW' : null;

  return (
    <div className="mb-ubos-2 flex items-center justify-between gap-ubos-2">
      <span className={cn(ubosTypographyClasses.panel, tallyLabelClasses[tally])}>{label}</span>
      {showBroadcastLabel && broadcastLabel ? (
        <span
          className={cn(
            ubosTypographyClasses.broadcastLabel,
            tally === 'program' ? 'text-ubos-program' : 'text-ubos-preview',
            tally === 'program' && 'animate-ubos-tally-pulse',
          )}
        >
          {broadcastLabel}
        </span>
      ) : null}
    </div>
  );
}

export function MonitorOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      aria-hidden="true"
    />
  );
}

export function MonitorFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        'mt-ubos-2 flex items-center gap-ubos-3 border-t border-ubos-border-subtle pt-ubos-2',
        ubosTypographyClasses.metadata,
        className,
      )}
    >
      {children}
    </footer>
  );
}
