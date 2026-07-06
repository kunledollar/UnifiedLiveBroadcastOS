'use client';

import { useCallback, type PointerEvent } from 'react';
import { cn } from '@ubos/ui';

export type ZoneResizeHandleProps = {
  orientation: 'vertical' | 'horizontal';
  disabled?: boolean;
  /** Positive delta grows the leading panel (left / top relative). */
  onResizeDelta: (delta: number) => void;
  className?: string;
  label?: string;
};

export function ZoneResizeHandle({
  orientation,
  disabled = false,
  onResizeDelta,
  className,
  label,
}: ZoneResizeHandleProps) {
  const isVertical = orientation === 'vertical';

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      let lastX = startX;
      let lastY = startY;

      const onMove = (moveEvent: globalThis.PointerEvent) => {
        const delta = isVertical ? moveEvent.clientX - lastX : moveEvent.clientY - lastY;
        lastX = moveEvent.clientX;
        lastY = moveEvent.clientY;
        if (delta !== 0) onResizeDelta(delta);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [disabled, isVertical, onResizeDelta],
  );

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      aria-label={label ?? (isVertical ? 'Resize column' : 'Resize row')}
      aria-disabled={disabled}
      onPointerDown={onPointerDown}
      className={cn(
        'group relative shrink-0 touch-none select-none',
        disabled ? 'cursor-default opacity-40' : 'cursor-col-resize',
        isVertical ? 'w-1.5' : 'h-1.5 cursor-row-resize',
        className,
      )}
    >
      <div
        className={cn(
          'absolute transition-colors duration-ubos-fast',
          disabled
            ? 'bg-ubos-border-subtle'
            : 'bg-ubos-border-subtle group-hover:bg-ubos-selection-muted group-active:bg-ubos-selection',
          isVertical
            ? 'inset-y-0 left-1/2 w-0.5 -translate-x-1/2'
            : 'inset-x-0 top-1/2 h-0.5 -translate-y-1/2',
        )}
      />
    </div>
  );
}
