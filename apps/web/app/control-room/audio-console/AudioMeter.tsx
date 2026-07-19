'use client';

import { memo, useEffect, useState } from 'react';
import { useRenderForensics, recordForensicsStateWrite, ubosForensicsFlag } from '../render-forensics';
import { cn } from '@ubos/ui';
import { meterSegmentColor } from './audio-console-utils';
import { clampMeterLevel } from './audio-stabilization-utils';

const SEGMENTS = 12;
const meterVisualUpdateMs = 100;


function AudioMeterComponent({
  level,
  muted,
  className,
}: {
  level: number | null;
  muted: boolean;
  className?: string;
}) {
  useRenderForensics('AudioMeter');
  const [displayLevel, setDisplayLevel] = useState(0);
  const [peakHold, setPeakHold] = useState(0);

  useEffect(() => {
    if (level === null) {
      setDisplayLevel(0);
      return;
    }

    if (ubosForensicsFlag('audio-meter-disabled')) return;
    const target = clampMeterLevel(level);
    let frame = 0;
    let lastUpdate = 0;
    const animate = (time = 0) => {
      if (time - lastUpdate < meterVisualUpdateMs) {
        frame = requestAnimationFrame(animate);
        return;
      }
      lastUpdate = time;
      setDisplayLevel((current) => {
        recordForensicsStateWrite('AudioMeter.setDisplayLevel', current, target);
        const next = Math.round(current + (target - current) * 0.5);
        if (current === target || Math.abs(next - target) < 1) return target;
        frame = requestAnimationFrame(animate);
        return next;
      });
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [level]);

  useEffect(() => {
    if (level === null || muted || ubosForensicsFlag('audio-meter-disabled')) return;
    setPeakHold((current) => {
      const next = Math.max(current, displayLevel);
      recordForensicsStateWrite('AudioMeter.setPeakHold', current, next);
      return next === current ? current : next;
    });
    const timeout = window.setTimeout(() => {
      setPeakHold((current) => {
        const next = Math.max(displayLevel, Math.round(current * 0.92));
        return next === current ? current : next;
      });
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

export const AudioMeter = memo(AudioMeterComponent, (previous, next) =>
  clampMeterLevel(previous.level) === clampMeterLevel(next.level) &&
  previous.muted === next.muted &&
  previous.className === next.className,
);

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
