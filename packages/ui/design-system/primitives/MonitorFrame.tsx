import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';
import {
  MonitorEmptyState,
  MonitorMetadataRow,
  MonitorSafeAreaGuides,
  MonitorWarningStrip,
  type SafeAreaVariant,
} from './MonitorOverlays.js';

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
  fill = false,
  compact = false,
  emptyMessage,
  warning,
  showSafeAreas = false,
  safeAreaVariant = 'horizontal',
  showTitleSafe = true,
  showActionSafe = true,
  showCrosshair = true,
  showVerticalGuide = false,
  showFourThreeGuide = false,
  showPlatformCrop,
  metadata,
  liveIndicator = false,
}: {
  children?: ReactNode;
  tally?: MonitorTally;
  label?: string;
  aspectRatio?: '16/9' | '9/16' | '1/1' | 'auto';
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  fill?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  warning?: string;
  showSafeAreas?: boolean;
  safeAreaVariant?: SafeAreaVariant;
  showTitleSafe?: boolean;
  showActionSafe?: boolean;
  showCrosshair?: boolean;
  showVerticalGuide?: boolean;
  showFourThreeGuide?: boolean;
  showPlatformCrop?: boolean;
  metadata?: Array<{ label: string; value: ReactNode }>;
  liveIndicator?: boolean;
}) {
  const aspectClass =
    aspectRatio === '16/9'
      ? 'aspect-video'
      : aspectRatio === '9/16'
        ? 'aspect-[9/16]'
        : aspectRatio === '1/1'
          ? 'aspect-square'
          : '';

  const hasSignal = Boolean(children);
  const showEmpty = !hasSignal && emptyMessage;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col',
        fill && 'h-full min-h-0',
        compact && 'max-h-40',
        className,
      )}
    >
      {header ??
        (label ? (
          <MonitorHeader
            label={label}
            tally={tally}
            {...(metadata ? { metadata } : {})}
            {...(liveIndicator ? { liveIndicator } : {})}
          />
        ) : null)}
      <div
        className={cn(
          'relative overflow-hidden rounded-ubos-lg border-2 bg-black shadow-ubos-monitor',
          fill ? 'min-h-0 flex-1' : aspectClass,
          tallyBorderClasses[tally],
        )}
      >
        {warning ? <MonitorWarningStrip message={warning} /> : null}
        {showEmpty ? (
          <MonitorEmptyState message={emptyMessage} />
        ) : (
          children
        )}
        {showSafeAreas && hasSignal ? (
          <MonitorSafeAreaGuides
            variant={safeAreaVariant}
            showTitleSafe={showTitleSafe}
            showActionSafe={showActionSafe}
            showCrosshair={showCrosshair}
            showVerticalGuide={showVerticalGuide}
            showFourThreeGuide={showFourThreeGuide}
            showPlatformCrop={showPlatformCrop ?? safeAreaVariant === 'vertical'}
          />
        ) : null}
      </div>
      {footer}
    </div>
  );
}

export function MonitorHeader({
  label,
  tally,
  metadata,
  liveIndicator = false,
}: {
  label: string;
  tally: MonitorTally;
  metadata?: Array<{ label: string; value: ReactNode }>;
  liveIndicator?: boolean;
}) {
  const showBroadcastLabel = tally === 'program' || tally === 'preview';
  const broadcastLabel =
    tally === 'program' ? (liveIndicator ? 'LIVE' : 'PROGRAM') : tally === 'preview' ? 'PREVIEW' : null;

  return (
    <div className="mb-ubos-2 flex min-w-0 items-start justify-between gap-ubos-2">
      <div className="min-w-0 flex-1">
        <span className={cn(ubosTypographyClasses.panel, tallyLabelClasses[tally], 'ubos-truncate block')}>
          {label}
        </span>
        {metadata?.length ? <MonitorMetadataRow items={metadata} className="mt-0.5" /> : null}
      </div>
      {showBroadcastLabel && broadcastLabel ? (
        <span
          className={cn(
            ubosTypographyClasses.broadcastLabel,
            'shrink-0',
            tally === 'program' ? 'text-ubos-program' : 'text-ubos-preview',
            (tally === 'program' && liveIndicator) && 'animate-ubos-tally-pulse',
          )}
        >
          {broadcastLabel}
        </span>
      ) : null}
    </div>
  );
}

export function MonitorOverlay({ className }: { className?: string }) {
  return <div className={cn('pointer-events-none absolute inset-0', className)} aria-hidden="true" />;
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
        'mt-ubos-2 flex min-w-0 items-center gap-ubos-3 border-t border-ubos-border-subtle pt-ubos-2',
        ubosTypographyClasses.metadata,
        className,
      )}
    >
      {children}
    </footer>
  );
}
