'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { cn } from '@ubos/ui';

export function ResizableSplit({
  primary,
  secondary,
  direction = 'horizontal',
  initialRatio = 0.72,
  minPrimary = 0.45,
  maxPrimary = 0.85,
  className,
}: {
  primary: ReactNode;
  secondary: ReactNode;
  direction?: 'horizontal' | 'vertical';
  initialRatio?: number;
  minPrimary?: number;
  maxPrimary?: number;
  className?: string;
}) {
  const [ratio, setRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHorizontal = direction === 'horizontal';

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const onMove = (moveEvent: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const next = isHorizontal
          ? (moveEvent.clientX - rect.left) / rect.width
          : (moveEvent.clientY - rect.top) / rect.height;
        setRatio(Math.min(maxPrimary, Math.max(minPrimary, next)));
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [isHorizontal, maxPrimary, minPrimary],
  );

  const primaryStyle = isHorizontal
    ? { width: `${ratio * 100}%` }
    : { height: `${ratio * 100}%` };

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 overflow-hidden',
        isHorizontal ? 'flex-row' : 'flex-col',
        className,
      )}
    >
      <div className="min-h-0 min-w-0 shrink-0 overflow-hidden" style={primaryStyle}>
        {primary}
      </div>
      <div
        role="separator"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        onPointerDown={onPointerDown}
        className={cn(
          'shrink-0 bg-ubos-border-subtle transition-colors duration-ubos-fast hover:bg-ubos-selection-muted',
          isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
        )}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{secondary}</div>
    </div>
  );
}
