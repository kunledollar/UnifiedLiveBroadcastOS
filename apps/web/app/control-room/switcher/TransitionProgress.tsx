'use client';

import { useEffect, useState } from 'react';
import { cn, ubosTypographyClasses } from '@ubos/ui';

export function TransitionProgress({
  active,
  durationMs,
  className,
}: {
  active: boolean;
  durationMs: number;
  className?: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active || durationMs <= 0) {
      setProgress(0);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const next = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(next);
      if (next < 100) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, durationMs]);

  if (!active) return null;

  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5', className)} role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-ubos-2">
        <span className={cn(ubosTypographyClasses.metadata, 'font-bold text-ubos-warning-text')}>
          Transitioning
        </span>
        <span className={cn(ubosTypographyClasses.metadata, 'font-mono text-ubos-fg-muted')}>
          {progress}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ubos-midnight">
        <div
          className="h-full rounded-full bg-ubos-warning transition-[width] duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
