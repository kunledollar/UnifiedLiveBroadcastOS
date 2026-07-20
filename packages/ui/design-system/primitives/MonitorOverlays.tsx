import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';
import { StatusBadge } from './StatusBadge.js';

/** Presentation-only HUD. It receives metadata and never accesses monitor nodes. */
export function ProgramPreviewOverlay({ mode, sceneTitle, layout, participants, outputs, recording, elapsed, readiness, transition }: { mode: 'program' | 'preview'; sceneTitle: string; layout?: string; participants?: number; outputs?: number; recording?: boolean; elapsed?: string; readiness?: string; transition?: string }) {
  return <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-ubos-2" aria-label={`${mode} monitor details`}>
    <div className="flex items-start justify-between gap-ubos-2"><StatusBadge variant={mode} dot>{mode === 'program' ? 'PROGRAM' : 'PREVIEW'}</StatusBadge>{recording ? <StatusBadge variant="recording" dot>RECORDING</StatusBadge> : null}</div>
    <div className="flex items-end justify-between gap-ubos-2 rounded-ubos-sm bg-ubos-carbon/80 p-ubos-2 backdrop-blur-sm"><div><b className={ubosTypographyClasses.panel}>{sceneTitle}</b><div className={ubosTypographyClasses.metadata}>{layout ?? 'Layout'} · {participants ?? 0} participants · {outputs ?? 0} outputs</div></div><div className={cn(ubosTypographyClasses.metadata, 'text-right')}>{elapsed ? <div>{elapsed}</div> : null}<div>{readiness ?? 'Ready'}{transition ? ` · ${transition}` : ''}</div></div></div>
  </div>;
}

export type SafeAreaVariant = 'horizontal' | 'vertical' | 'square';

export function MonitorSafeAreaGuides({
  variant = 'horizontal',
  showTitleSafe = true,
  showActionSafe = true,
  showCrosshair = true,
  showVerticalGuide = false,
  showFourThreeGuide = false,
  showPlatformCrop = false,
  className,
}: {
  variant?: SafeAreaVariant;
  showTitleSafe?: boolean;
  showActionSafe?: boolean;
  showCrosshair?: boolean;
  showVerticalGuide?: boolean;
  showFourThreeGuide?: boolean;
  showPlatformCrop?: boolean;
  className?: string;
}) {
  const isVertical = variant === 'vertical';

  return (
    <div className={cn('pointer-events-none absolute inset-0 z-10', className)} aria-hidden="true">
      {showActionSafe ? (
        <div
          className={cn(
            'absolute border border-white/10',
            isVertical ? 'inset-[4%]' : 'inset-[5%]',
          )}
        />
      ) : null}
      {showTitleSafe ? (
        <div
          className={cn(
            'absolute border border-dashed border-white/15',
            isVertical ? 'inset-[8%_12%]' : 'inset-[10%]',
          )}
        />
      ) : null}
      {showFourThreeGuide && !isVertical ? (
        <div className="absolute inset-y-[5%] left-1/2 aspect-[4/3] h-[90%] -translate-x-1/2 border border-cyan-400/20" />
      ) : null}
      {isVertical && showPlatformCrop ? (
        <div className="absolute inset-x-[6%] inset-y-[12%] border border-fuchsia-400/25" />
      ) : null}
      {showVerticalGuide ? (
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-fuchsia-400/30" />
      ) : null}
      {showCrosshair ? (
        <>
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/10" />
        </>
      ) : null}
    </div>
  );
}

export function MonitorWarningStrip({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 top-0 z-20 border-b border-ubos-warning-border bg-ubos-warning-muted px-ubos-3 py-1',
        ubosTypographyClasses.metadata,
        'text-ubos-warning-text',
        className,
      )}
    >
      {message}
    </div>
  );
}

export function MonitorEmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-ubos-2 bg-ubos-carbon px-ubos-4 text-center',
        className,
      )}
    >
      <span className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>{message}</span>
    </div>
  );
}

export function MonitorMetadataRow({
  items,
  className,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-ubos-3 gap-y-1', className)}>
      {items.map((item) => (
        <span key={item.label} className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          <span className="text-ubos-fg-disabled">{item.label}</span>{' '}
          <span className="text-ubos-fg-secondary">{item.value}</span>
        </span>
      ))}
    </div>
  );
}
