'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ubos/ui';
import { meterSegmentColor } from './audio-console-utils';

const SEGMENTS = 12;

export function AudioMeter({
  level,
  muted,
  className,
}: {
  level: number | null;
  muted: boolean;
  className?: string;
}) {
  const [displayLevel, setDisplayLevel] = useState(0);
  const [peakHold, setPeakHold] = useState(0);

  useEffect(() => {
    if (level === null) {
      setDisplayLevel(0);
      return;
    }

    const target = Math.max(0, Math.min(100, level));
    let frame = 0;
    const animate = () => {
      setDisplayLevel((current) => {
        const next = current + (target - current) * 0.35;
        if (Math.abs(next - target) < 0.5) return target;
        frame = requestAnimationFrame(animate);
        return next;
      });
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [level]);

  useEffect(() => {
    if (level === null || muted) return;
    setPeakHold((current) => Math.max(current, displayLevel));
    const timeout = window.setTimeout(() => {
      setPeakHold((current) => Math.max(displayLevel, current * 0.92));
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [displayLevel, level, muted]);

  const activeSegments =
    level === null ? 0 : Math.round((displayLevel / 100) * SEGMENTS);
  const peakSegment =
    level === null ? 0 : Math.round((peakHold / 100) * SEGMENTS);

  return (
    <div
      className={cn('flex h-16 flex-col-reverse gap-px', className)}
      role="meter"
      aria-valuenow={level ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Channel level"
    >
      {Array.from({ length: SEGMENTS }, (_, index) => {
        const segmentIndex = index + 1;
        const active = segmentIndex <= activeSegments;
        const isPeak = segmentIndex === peakSegment && peakSegment > activeSegments;
        const percent = (segmentIndex / SEGMENTS) * 100;
        return (
          <div
            key={segmentIndex}
            className={cn(
              'h-1 w-3 rounded-sm transition-colors duration-150',
              active || isPeak
                ? meterSegmentColor(percent, muted)
                : 'bg-ubos-midnight',
              isPeak && 'opacity-80',
            )}
          />
        );
      })}
    </div>
  );
}

export function PeakIndicator({ level, muted }: { level: number | null; muted: boolean }) {
  if (level === null) {
    return <span className="font-mono text-[0.625rem] text-ubos-fg-muted">—</span>;
  }
  if (muted) {
    return <span className="font-mono text-[0.625rem] text-ubos-fg-muted">MUTE</span>;
  }
  const peakDb = level > 0 ? `-${Math.max(3, Math.round(100 - level) / 2)}` : '—∞';
  return <span className="font-mono text-[0.625rem] text-ubos-fg-secondary">{peakDb} dB</span>;
}

export function GainIndicator({ gain }: { gain: number | null }) {
  if (gain === null) {
    return <span className="font-mono text-[0.625rem] text-ubos-fg-muted">—</span>;
  }
  return <span className="font-mono text-[0.625rem] text-ubos-fg-secondary">{gain.toFixed(1)}</span>;
}
